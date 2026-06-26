import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import API from '../api';
import { SocketProvider } from '../context/SocketContext';
import { CallProvider, useCall } from '../context/CallContext';
import { useSocket } from '../context/SocketContext';
import { useConversations } from '../hooks/useConversations';
import Sidebar from '../components/sidebar/Sidebar';
import ChatPanel from '../components/chat/ChatPanel';
import EmptyState from '../components/chat/EmptyState';
import VideoCallModal from '../components/call/VideoCallModal';

/**
 * Inner dashboard — consumes contexts so it must be inside providers.
 */
function DashboardInner({ dbUser }) {
  const { user }                    = useUser();
  const { socket, isConnected }     = useSocket();
  const { callActive, callSession, receiveCall, endCall } = useCall();

  const {
    conversations,
    usersList,
    isLoading,
    unreadCounts,
    startChat,
    createGroup,
    markConvoRead,
  } = useConversations(dbUser, user);

  const [activeConvo, setActiveConvo] = useState(null);

  // Clear unread when a conversation is opened
  const handleSelectConvo = (convo) => {
    setActiveConvo(convo);
    if (convo?._id) markConvoRead(convo._id);
  };

  // ── Listen for incoming calls globally ────────────────────────
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

  const handleVideoCall = (otherUser) => {
    // Trigger outgoing call via CallContext
    import('../context/CallContext').then(({ useCall: _ }) => {});
    // Direct emit — initiate via context-aware modal
    const session = {
      isIncoming:  false,
      callerId:    dbUser._id,
      callerName:  dbUser.username,
      targetId:    otherUser._id,
      targetName:  otherUser.username,
    };
    // We can't call hook here — use the context instead
    // So we expose a manual setter
  };

  // On mobile, going "back" clears active convo to show sidebar
  const handleBack = () => setActiveConvo(null);

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-void">
      {/* Sidebar: full-width on mobile, fixed 300px on md+ */}
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

      {/* Chat area: full-width on mobile (hidden when no convo), flex-1 on md+ */}
      <main className={`
        flex-1 flex overflow-hidden
        ${activeConvo ? 'flex' : 'hidden sm:flex'}
      `}>
        {activeConvo ? (
          <ChatPanel
            convo={activeConvo}
            currentUser={dbUser}
            onBack={handleBack}
            onVideoCall={(otherUser) => {
              // Inject into CallContext imperatively via custom event
              window.dispatchEvent(new CustomEvent('nexus:initcall', {
                detail: { caller: dbUser, target: otherUser }
              }));
            }}
          />
        ) : (
          <EmptyState />
        )}
      </main>

      {/* ── Video call modal ───────────────────────────────────── */}
      {callActive && callSession && (
        <VideoCallModal
          session={callSession}
          onClose={endCall}
        />
      )}
    </div>
  );
}

/**
 * Dashboard — syncs user to DB, then wraps with SocketProvider + CallProvider.
 */
export default function Dashboard() {
  const { user }        = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    if (!user) return;
    API.post('/api/users/sync', {
      clerkId:  user.id,
      username: user.username || user.firstName || 'Anonymous',
      email:    user.primaryEmailAddress?.emailAddress,
      imageUrl: user.imageUrl,
    })
      .then(r => setDbUser(r.data))
      .catch(err => console.error('[Dashboard] sync error:', err))
      .finally(() => setIsSyncing(false));
  }, [user]);

  if (isSyncing || !dbUser) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent-grad flex items-center justify-center shadow-glow animate-pulse">
            <span className="text-xl">⚡</span>
          </div>
          <p className="text-sm text-text-muted font-medium">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider userId={dbUser._id}>
      <CallProviderWithListener dbUser={dbUser} />
    </SocketProvider>
  );
}

/**
 * Wrapper that can listen to window events to trigger calls via CallContext.
 */
function CallProviderWithListener({ dbUser }) {
  return (
    <CallProvider>
      <CallEventBridge dbUser={dbUser} />
    </CallProvider>
  );
}

function CallEventBridge({ dbUser }) {
  const { initiateCall } = useCall();

  useEffect(() => {
    const handler = (e) => {
      const { caller, target } = e.detail;
      initiateCall(caller, target);
    };
    window.addEventListener('nexus:initcall', handler);
    return () => window.removeEventListener('nexus:initcall', handler);
  }, [initiateCall]);

  return <DashboardInner dbUser={dbUser} />;
}
