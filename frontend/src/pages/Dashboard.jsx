import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import API from '../api';
import { getBackendConfigError } from '../config/backend';
import { SocketProvider } from '../context/SocketContext';
import { CallProvider, useCall } from '../context/CallContext';
import { useSocket } from '../context/SocketContext';
import { useConversations } from '../hooks/useConversations';
import Sidebar from '../components/sidebar/Sidebar';
import ChatPanel from '../components/chat/ChatPanel';
import EmptyState from '../components/chat/EmptyState';
import VideoCallModal from '../components/call/VideoCallModal';
import DeploymentBanner from '../components/ui/DeploymentBanner';

const MEDIA_CONSTRAINTS = {
  video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: { echoCancellation: true, noiseSuppression: true },
};

/**
 * Inner dashboard — consumes contexts so it must be inside providers.
 */
function DashboardInner({ dbUser, configError }) {
  const { user }                    = useUser();
  const { socket, isConnected, connectError } = useSocket();
  const { callActive, callSession, receiveCall, endCall } = useCall();

  const {
    conversations,
    usersList,
    isLoading,
    unreadCounts,
    startChat,
    createGroup,
    markConvoRead,
    clearActiveConvo,
  } = useConversations(dbUser, user);

  const [activeConvo, setActiveConvo] = useState(null);

  const handleSelectConvo = (convo) => {
    setActiveConvo(convo);
    if (convo?._id) markConvoRead(convo._id);
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('call_incoming', receiveCall);
    return () => socket.off('call_incoming', receiveCall);
  }, [socket, receiveCall]);

  const handleStartChat = async (recipient) => {
    const convo = await startChat(recipient);
    if (convo) handleSelectConvo(convo);
  };

  const handleCreateGroup = async (name, participantIds) => {
    const convo = await createGroup(name, participantIds);
    if (convo) handleSelectConvo(convo);
    return convo;
  };

  const handleBack = () => {
    setActiveConvo(null);
    clearActiveConvo();
  };

  const handleVideoCall = async (otherUser) => {
    if (!otherUser) return;
    let localStream = null;
    try {
      // Must request media during the tap/click handler — iOS blocks otherwise
      localStream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
    } catch (err) {
      console.error('[Dashboard] camera/mic permission denied:', err);
      return;
    }
    window.dispatchEvent(new CustomEvent('nexus:initcall', {
      detail: { caller: dbUser, target: otherUser, localStream },
    }));
  };

  return (
    <div className="flex flex-col h-dvh w-full max-w-[100vw] overflow-hidden bg-void">
      <DeploymentBanner
        configError={configError}
        socketError={connectError}
        isConnected={isConnected}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
      <Sidebar
        dbUser={dbUser}
        isConnected={isConnected}
        conversations={conversations}
        usersList={usersList}
        activeConvoId={activeConvo?._id}
        isLoading={isLoading}
        unreadCounts={unreadCounts}
        onSelectConvo={handleSelectConvo}
        onStartChat={handleStartChat}
        onCreateGroup={handleCreateGroup}
        mobileHidden={!!activeConvo}
      />

      <main className={`
        flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden
        ${activeConvo ? 'flex w-full' : 'hidden sm:flex'}
      `}>
        {activeConvo ? (
          <ChatPanel
            convo={activeConvo}
            currentUser={dbUser}
            onBack={handleBack}
            onVideoCall={handleVideoCall}
          />
        ) : (
          <EmptyState />
        )}
      </main>

      {callActive && callSession && (
        <VideoCallModal
          session={callSession}
          onClose={endCall}
        />
      )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user }        = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const configError = getBackendConfigError();

  useEffect(() => {
    if (!user || configError) {
      setIsSyncing(false);
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    API.post('/api/users/sync', {
      clerkId:  user.id,
      username: user.username || user.firstName || 'Anonymous',
      email:    user.primaryEmailAddress?.emailAddress,
      imageUrl: user.imageUrl,
    })
      .then(r => setDbUser(r.data))
      .catch(err => {
        console.error('[Dashboard] sync error:', err);
        setSyncError(
          err.response
            ? `API error ${err.response.status}: check VITE_API_URL and Render logs.`
            : 'Cannot reach backend. Set VITE_API_URL to your Render URL on Vercel and redeploy.'
        );
      })
      .finally(() => setIsSyncing(false));
  }, [user, configError]);

  if (configError) {
    return (
      <div className="flex flex-col h-dvh w-full bg-void">
        <DeploymentBanner configError={configError} socketError={null} isConnected={false} />
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent-grad flex items-center justify-center shadow-glow animate-pulse">
            <span className="text-xl">⚡</span>
          </div>
          <p className="text-sm text-text-muted font-medium">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  if (syncError || !dbUser) {
    return (
      <div className="flex flex-col h-dvh w-full bg-void">
        <DeploymentBanner
          configError={syncError}
          socketError={null}
          isConnected={false}
        />
      </div>
    );
  }

  return (
    <SocketProvider userId={dbUser._id}>
      <CallProviderWithListener dbUser={dbUser} configError={null} />
    </SocketProvider>
  );
}

function CallProviderWithListener({ dbUser, configError }) {
  return (
    <CallProvider>
      <CallEventBridge dbUser={dbUser} configError={configError} />
    </CallProvider>
  );
}

function CallEventBridge({ dbUser, configError }) {
  const { initiateCall } = useCall();

  useEffect(() => {
    const handler = (e) => {
      const { caller, target, localStream } = e.detail;
      initiateCall(caller, target, localStream);
    };
    window.addEventListener('nexus:initcall', handler);
    return () => window.removeEventListener('nexus:initcall', handler);
  }, [initiateCall]);

  return <DashboardInner dbUser={dbUser} configError={configError} />;
}
