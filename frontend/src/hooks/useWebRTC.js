import { useRef, useCallback, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const MEDIA_CONSTRAINTS = {
  video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: { echoCancellation: true, noiseSuppression: true },
};

/** Attach stream to a video element and ensure playback (required on iOS). */
function attachStream(videoEl, stream) {
  if (!videoEl || !stream) return;
  videoEl.srcObject = stream;
  const playPromise = videoEl.play?.();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      // iOS may block until user interacts; ignore benign autoplay errors
    });
  }
}

/**
 * Encapsulates all WebRTC peer connection logic.
 */
export function useWebRTC({ session, onCallConnected, onCallEnded }) {
  const { socket }         = useSocket();
  const peerRef            = useRef(null);
  const localStreamRef     = useRef(null);
  const remoteStreamRef    = useRef(null);
  const iceCandidateQueue  = useRef([]);
  const ownsLocalStream    = useRef(true);

  const localVideoElRef  = useRef(null);
  const remoteVideoElRef = useRef(null);

  const localVideoRef = useCallback((node) => {
    localVideoElRef.current = node;
    if (node && localStreamRef.current) {
      attachStream(node, localStreamRef.current);
    }
  }, []);

  const remoteVideoRef = useCallback((node) => {
    remoteVideoElRef.current = node;
    if (node && remoteStreamRef.current) {
      attachStream(node, remoteStreamRef.current);
    }
  }, []);

  const [micMuted,   setMicMuted]   = useState(false);
  const [cameraOff,  setCameraOff]  = useState(false);
  const [callStatus, setCallStatus] = useState('Initializing...');

  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  const drainIceQueue = useCallback(async () => {
    const pc = peerRef.current;
    if (!pc?.remoteDescription?.type) return;
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift();
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (e) { console.warn('[WebRTC] ice queue drain error', e); }
    }
  }, []);

  const cleanupRef = useRef(() => {});

  const cleanup = useCallback(() => {
    if (ownsLocalStream.current) {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    }
    peerRef.current?.close();
    peerRef.current         = null;
    localStreamRef.current  = null;
    remoteStreamRef.current = null;
    onCallEnded?.();
  }, [onCallEnded]);

  cleanupRef.current = cleanup;

  const setupPeer = useCallback((stream, remoteId) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerRef.current = pc;

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = (evt) => {
      if (evt.streams[0]) {
        remoteStreamRef.current = evt.streams[0];
        attachStream(remoteVideoElRef.current, evt.streams[0]);
      }
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        socket.emit('send_ice_candidate', { toId: remoteId, candidate: evt.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('Active Call');
        onCallConnected?.();
      }
      if (['failed', 'closed'].includes(pc.connectionState)) {
        cleanupRef.current();
      }
    };

    return pc;
  }, [socket, onCallConnected]);

  const startLocalStream = useCallback(async () => {
    if (session.localStream) {
      localStreamRef.current = session.localStream;
      ownsLocalStream.current = false;
      attachStream(localVideoElRef.current, session.localStream);
      return session.localStream;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
      localStreamRef.current = stream;
      ownsLocalStream.current = true;
      attachStream(localVideoElRef.current, stream);
      return stream;
    } catch (err) {
      setCallStatus('Camera/Mic permission denied');
      throw err;
    }
  }, [session.localStream]);

  const initiateCall = useCallback(async () => {
    try {
      setCallStatus('Calling...');
      const stream = await startLocalStream();
      const pc = setupPeer(stream, session.targetId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        userToCall: session.targetId,
        signalData: offer,
        fromId:     session.callerId,
        fromName:   session.callerName,
      });
    } catch (err) {
      console.error('[WebRTC] initiateCall error:', err);
    }
  }, [session, socket, setupPeer, startLocalStream]);

  const acceptCall = useCallback(async () => {
    try {
      setCallStatus('Connecting...');
      const stream = await startLocalStream();
      const pc = setupPeer(stream, session.callerId);

      await pc.setRemoteDescription(new RTCSessionDescription(session.signal));
      await drainIceQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', { toId: session.callerId, signalData: answer });
      setCallStatus('Active Call');
      onCallConnected?.();
    } catch (err) {
      console.error('[WebRTC] acceptCall error:', err);
      setCallStatus('Connection failed');
    }
  }, [session, socket, setupPeer, startLocalStream, drainIceQueue, onCallConnected]);

  const handleCallAccepted = useCallback(async (signal) => {
    try {
      const pc = peerRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      await drainIceQueue();
      setCallStatus('Active Call');
      onCallConnected?.();
    } catch (err) {
      console.error('[WebRTC] handleCallAccepted error:', err);
    }
  }, [drainIceQueue, onCallConnected]);

  const addRemoteIceCandidate = useCallback(async (candidate) => {
    const pc = peerRef.current;
    if (pc?.remoteDescription?.type) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (e) { console.warn('[WebRTC] addIceCandidate error', e); }
    } else {
      iceCandidateQueue.current.push(candidate);
    }
  }, []);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicMuted(!track.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  }, []);

  const hangup = useCallback((partnerId) => {
    socket?.emit('hangup_call', { toId: partnerId });
    cleanupRef.current();
  }, [socket]);

  const decline = useCallback(() => {
    socket?.emit('decline_call', { toId: session.callerId });
    cleanupRef.current();
  }, [socket, session]);

  return {
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
  };
}
