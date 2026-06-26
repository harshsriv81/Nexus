import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { resolveSocketUrl } from '../config/backend';

const SocketContext = createContext(null);

export function SocketProvider({ userId, children }) {
  const [socket, setSocket]           = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const url = resolveSocketUrl();
    if (!url) {
      setConnectError('Socket URL not configured (set VITE_SOCKET_URL on Vercel).');
      return;
    }

    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      withCredentials: true,
      path: '/socket.io/',
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
    setConnectError(null);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectError(null);
      newSocket.emit('register_user', userId);
    });

    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] connect_error:', err.message);
      setConnectError(err.message);
    });

    newSocket.on('reconnect', () => {
      setIsConnected(true);
      setConnectError(null);
      newSocket.emit('register_user', userId);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectError }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
