import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useSocket } from '../../context/SocketContext';
import RingingPanel from './RingingPanel';
import VideoGrid from './VideoGrid';
import CallControls from './CallControls';
import CallTimer from './CallTimer';

/**
 * Full-screen call modal portal.
 * Delegates all WebRTC work to useWebRTC hook.
 */
export default function VideoCallModal({ session, onClose }) {
  const { socket } = useSocket();
  const [callConnected, setCallConnected] = useState(false);

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

  // ── Bootstrap: start local stream (and offer if outgoing) ─────
  useEffect(() => {
    if (!session.isIncoming) {
      initiateCall();
    } else {
      setCallStatus('Incoming video call...');
      // Still grab local stream so it's ready for accept
      import('../../hooks/useWebRTC'); // pre-warm (noop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Global socket call signal listeners ───────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_declined', () => { setCallStatus('Call Declined'); setTimeout(onClose, 1500); });
    socket.on('call_ended',    () => { cleanup(); });
    socket.on('receive_ice_candidate', ({ candidate }) => addRemoteIceCandidate(candidate));

    return () => {
      socket.off('call_accepted');
      socket.off('call_declined');
      socket.off('call_ended');
      socket.off('receive_ice_candidate');
    };
  }, [socket]);

  const partnerId = session.isIncoming ? session.callerId : session.targetId;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4
                    bg-void/90 backdrop-blur-heavy animate-fade-in">
      <div className="w-full h-full md:h-auto md:max-w-3xl bg-surface border-0 md:border border-border-mid md:rounded-3xl
                      shadow-float overflow-hidden flex flex-col animate-scale-in">

        {/* Modal top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-faint header-blur">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald" />
          </div>
          <span className="text-xs font-semibold text-text-muted tracking-wide">
            {callConnected ? 'Live Call' : 'Connecting...'}
          </span>
          {callConnected && <CallTimer />}
          {!callConnected && <div className="w-16" />}
        </div>

        {/* Content */}
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
    </div>,
    document.body
  );
}
