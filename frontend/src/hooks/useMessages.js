import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api';
import { useSocket } from '../context/SocketContext';
import { idsEqual, normalizeId } from '../utils/id';

/**
 * Manages message history, real-time updates, typing indicators,
 * and read receipts for a single conversation.
 */
export function useMessages(convoId, currentUserId) {
  const { socket }          = useSocket();
  const [messages, setMessages]   = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const typingTimerRef            = useRef(null);
  const isTypingRef               = useRef(false);
  const usernameRef                 = useRef(null);

  useEffect(() => {
    if (!convoId) return;
    setIsLoading(true);
    setMessages([]);

    API.get(`/api/conversations/${convoId}/messages`)
      .then(r => setMessages(r.data))
      .catch(err => console.error('[useMessages] fetch error:', err))
      .finally(() => setIsLoading(false));
  }, [convoId]);

  useEffect(() => {
    if (!socket || !convoId || !currentUserId) return;
    socket.emit('join_conversation', normalizeId(convoId));
    socket.emit('mark_read', { conversationId: normalizeId(convoId), userId: normalizeId(currentUserId) });
  }, [socket, convoId, currentUserId]);

  useEffect(() => {
    if (!socket || !convoId) return;
    const normalizedConvoId = normalizeId(convoId);
    const normalizedUserId = normalizeId(currentUserId);

    const onReceiveMessage = (msg) => {
      const msgConvoId = normalizeId(
        typeof msg.conversation === 'object' ? msg.conversation._id : msg.conversation
      );
      if (msgConvoId !== normalizedConvoId) return;
      setMessages(prev => [...prev, msg]);
      socket.emit('mark_read', { conversationId: normalizedConvoId, userId: normalizedUserId });
    };

    const onTyping = ({ conversationId, username, isTyping }) => {
      if (normalizeId(conversationId) !== normalizedConvoId) return;
      setTypingUser(isTyping ? username : null);
    };

    const onMarkedRead = ({ conversationId, userId: readerId }) => {
      if (normalizeId(conversationId) !== normalizedConvoId) return;
      const reader = normalizeId(readerId);
      setMessages(prev =>
        prev.map(m => {
          const readBy = m.readBy || [];
          return readBy.some(id => idsEqual(id, reader))
            ? m
            : { ...m, readBy: [...readBy, readerId] };
        })
      );
    };

    socket.on('receive_message',     onReceiveMessage);
    socket.on('typing_update',       onTyping);
    socket.on('messages_marked_read', onMarkedRead);

    return () => {
      socket.off('receive_message',      onReceiveMessage);
      socket.off('typing_update',        onTyping);
      socket.off('messages_marked_read', onMarkedRead);
    };
  }, [socket, convoId, currentUserId]);

  const stopTyping = useCallback((username) => {
    if (!socket || !isTypingRef.current) return;
    isTypingRef.current = false;
    socket.emit('typing_stop', {
      conversationId: normalizeId(convoId),
      username: username || usernameRef.current,
    });
  }, [socket, convoId]);

  const sendMessage = useCallback((text) => {
    if (!socket || !text.trim()) return;
    socket.emit('send_message', {
      conversationId: normalizeId(convoId),
      senderId:       normalizeId(currentUserId),
      text:           text.trim(),
    });
    stopTyping();
  }, [socket, convoId, currentUserId, stopTyping]);

  const startTyping = useCallback((username) => {
    if (!socket) return;
    usernameRef.current = username;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing_start', { conversationId: normalizeId(convoId), username });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => stopTyping(username), 2500);
  }, [socket, convoId, stopTyping]);

  return { messages, typingUser, isLoading, sendMessage, startTyping, stopTyping };
}
