import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api';
import { useSocket } from '../context/SocketContext';
import { idsEqual, normalizeId } from '../utils/id';

/**
 * Manages the full conversation list for a logged-in user.
 */
export function useConversations(dbUser, clerkUser) {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [usersList,     setUsersList]     = useState([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [unreadCounts,  setUnreadCounts]  = useState({});
  const activeConvoIdRef = useRef(null);

  useEffect(() => {
    if (!dbUser) return;
    setIsLoading(true);

    Promise.all([
      API.get('/api/users'),
      API.get(`/api/conversations/user/${normalizeId(dbUser._id)}`),
    ])
      .then(([usersRes, convosRes]) => {
        setUsersList(
          usersRes.data.filter(u => u.clerkId !== clerkUser?.id)
        );
        setConversations(convosRes.data);
      })
      .catch(err => console.error('[useConversations] load error:', err))
      .finally(() => setIsLoading(false));
  }, [dbUser, clerkUser]);

  useEffect(() => {
    if (!socket) return;

    const onPresence = ({ userId, isOnline }) => {
      setUsersList(prev =>
        prev.map(u => idsEqual(u._id, userId) ? { ...u, isOnline } : u)
      );
      setConversations(prev =>
        prev.map(c => ({
          ...c,
          participants: c.participants.map(p =>
            idsEqual(p._id, userId) ? { ...p, isOnline } : p
          ),
        }))
      );
    };

    socket.on('presence_update', onPresence);
    return () => socket.off('presence_update', onPresence);
  }, [socket]);

  useEffect(() => {
    if (!socket || !dbUser) return;

    const onNewMessage = (msg) => {
      const msgConvoId = normalizeId(
        typeof msg.conversation === 'object' ? msg.conversation._id : msg.conversation
      );

      setConversations(prev => {
        const idx = prev.findIndex(c => idsEqual(c._id, msgConvoId));
        if (idx === -1) return prev;

        const updated = {
          ...prev[idx],
          lastMessage: msg,
          updatedAt: msg.createdAt || new Date().toISOString(),
        };

        const rest = [...prev];
        rest.splice(idx, 1);
        return [updated, ...rest];
      });

      const senderId = normalizeId(typeof msg.sender === 'object' ? msg.sender._id : msg.sender);
      const activeId = normalizeId(activeConvoIdRef.current);

      if (senderId !== normalizeId(dbUser._id) && msgConvoId !== activeId) {
        setUnreadCounts(prev => ({
          ...prev,
          [msgConvoId]: (prev[msgConvoId] || 0) + 1,
        }));

        if (Notification.permission === 'granted') {
          const senderName = typeof msg.sender === 'object' ? msg.sender.username : 'Someone';
          new Notification(senderName, {
            body: msg.text || 'Sent a message',
            icon: typeof msg.sender === 'object' ? msg.sender.imageUrl : undefined,
            tag: msgConvoId,
          });
        }
      }
    };

    socket.on('receive_message', onNewMessage);
    return () => socket.off('receive_message', onNewMessage);
  }, [socket, dbUser]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markConvoRead = useCallback((convoId) => {
    activeConvoIdRef.current = normalizeId(convoId);
    setUnreadCounts(prev => {
      const key = normalizeId(convoId);
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearActiveConvo = useCallback(() => {
    activeConvoIdRef.current = null;
  }, []);

  const startChat = useCallback(async (recipient) => {
    if (!dbUser) return null;
    try {
      const res = await API.post('/api/conversations', {
        senderId:    normalizeId(dbUser._id),
        recipientId: normalizeId(recipient._id),
      });
      const convo = res.data;
      setConversations(prev =>
        prev.some(c => idsEqual(c._id, convo._id)) ? prev : [convo, ...prev]
      );
      return convo;
    } catch (err) {
      console.error('[useConversations] startChat error:', err);
      return null;
    }
  }, [dbUser]);

  const createGroup = useCallback(async (name, participantIds) => {
    try {
      const res = await API.post('/api/conversations/group', { name, participantIds });
      const convo = res.data;
      setConversations(prev => [convo, ...prev]);
      return convo;
    } catch (err) {
      console.error('[useConversations] createGroup error:', err);
      return null;
    }
  }, []);

  const upsertConversation = useCallback((convo) => {
    setConversations(prev =>
      prev.some(c => idsEqual(c._id, convo._id))
        ? prev.map(c => idsEqual(c._id, convo._id) ? convo : c)
        : [convo, ...prev]
    );
  }, []);

  return {
    conversations,
    usersList,
    isLoading,
    unreadCounts,
    startChat,
    createGroup,
    upsertConversation,
    markConvoRead,
    clearActiveConvo,
  };
}
