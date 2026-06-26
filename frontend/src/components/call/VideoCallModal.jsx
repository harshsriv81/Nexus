import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useSocket } from '../../context/SocketContext';
import RingingPanel from './RingingPanel';
import VideoGrid from './VideoGrid';
import CallControls from './CallControls';
import CallTimer from './CallTimer';

export default function VideoCallModal({ session, onClose }) {
  const { socket } = useSocket();
  const [callConnected, setCallConnected] = useState(false);
  const startedRef = useRef(false);

  const {
    localVideoRef,
    remoteVideoRef,
    micMuted,
    cameraOff,
    callStatus,
    setCallStatus,
    initiateCall,
    acceptCall,
    handleCallAccepted,
    addRemoteIceCandidate,
    toggleMic,
    toggleCamera,
    hangup,
    decline,
    cleanup,
  } = useWebRTC({
    session,
    onCallConnected: () => setCallConnected(true),
    onCallEnded:     () => { setCallConnected(false); onClose(); },
  });

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!session.isIncoming) {
      initiateCall();
    } else {
      setCallStatus('Incoming video call...');
    }
  }, [session.isIncoming, initiateCall, setCallStatus]);

  useEffect(() => {
    if (!socket) return;

    const onAccepted = (signal) => handleCallAccepted(signal);
    const onDeclined = () => {
      setCallStatus('Call Declined');
      setTimeout(onClose, 1500);
    };
    const onEnded = () => cleanup();
    const onIce = ({ candidate }) => addRemoteIceCandidate(candidate);

    socket.on('call_accepted', onAccepted);
    socket.on('call_declined', onDeclined);
    socket.on('call_ended', onEnded);
    socket.on('receive_ice_candidate', onIce);

    return () => {
      socket.off('call_accepted', onAccepted);
      socket.off('call_declined', onDeclined);
      socket.off('call_ended', onEnded);
      socket.off('receive_ice_candidate', onIce);
    };
  }, [socket, handleCallAccepted, addRemoteIceCandidate, cleanup, onClose, setCallStatus]);

  const partnerId = session.isIncoming ? session.callerId : session.targetId;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center p-0 md:p-4
                    bg-void/90 backdrop-blur-heavy animate-fade-in pt-safe pb-safe">
      <div className="w-full h-full md:h-auto md:max-w-3xl bg-surface border-0 md:border border-border-mid md:rounded-3xl
                      shadow-float overflow-hidden flex flex-col animate-scale-in min-h-0">

        <div className="flex items-center justify-between px-5 py-3 border-b border-border-faint header-blur flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald" />
          </div>
          <span className="text-xs font-semibold text-text-muted tracking-wide">
            {callConnected ? 'Live Call' : 'Connecting...'}
          </span>
          {callConnected ? <CallTimer /> : <div className="w-16" />}
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {callConnected ? (
            <>
              <VideoGrid
                localVideoRef={localVideoRef}
                remoteVideoRef={remoteVideoRef}
                session={session}
                cameraOff={cameraOff}
              />
              <CallControls
                isConnected={callConnected}
                micMuted={micMuted}
                cameraOff={cameraOff}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onHangup={() => hangup(partnerId)}
              />
            </>
          ) : (
            <RingingPanel
              session={session}
              callStatus={callStatus}
              onAccept={acceptCall}
              onDecline={decline}
              onCancel={() => hangup(partnerId)}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
