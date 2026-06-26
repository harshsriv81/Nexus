import { Server } from 'socket.io';
import { User, Message, Conversation } from './models.js';
import { createOriginChecker, corsCallback } from './cors.js';

// Map of userId to socketId to route private messages & calls
const userSocketMap = new Map();

export function initSocket(server) {
  const isOriginAllowed = createOriginChecker();

  const io = new Server(server, {
    cors: {
      origin: corsCallback(isOriginAllowed),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // 1. User registers their active session
    socket.on('register_user', async (userId) => {
      if (!userId) return;
      socket.userId = userId;
      userSocketMap.set(userId, socket.id);

      // Update online status in Database
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit('presence_update', { userId, isOnline: true });

        // Auto-join all conversation rooms so sidebar gets real-time updates
        const convos = await Conversation.find({ participants: userId }, '_id');
        convos.forEach(c => socket.join(c._id.toString()));
      } catch (err) {
        console.error('Presence register error:', err);
      }
    });

    // 2. Joining a chat room conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    // 3. User sends a message
    socket.on('send_message', async ({ conversationId, senderId, text, fileUrl, fileType }) => {
      try {
        const message = new Message({
          conversation: conversationId,
          sender: senderId,
          text,
          fileUrl,
          fileType,
          readBy: [senderId]
        });
        await message.save();

        // Update lastMessage on conversation
        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username email imageUrl');

        // Broadcast to everyone in the room
        io.to(conversationId).emit('receive_message', populatedMessage);
      } catch (err) {
        console.error('Message save/send error:', err);
      }
    });

    // 4. Typing indicators
    socket.on('typing_start', ({ conversationId, username }) => {
      socket.to(conversationId).emit('typing_update', { conversationId, username, isTyping: true });
    });

    socket.on('typing_stop', ({ conversationId, username }) => {
      socket.to(conversationId).emit('typing_update', { conversationId, username, isTyping: false });
    });

    // 5. Read receipts
    socket.on('mark_read', async ({ conversationId, userId }) => {
      try {
        await Message.updateMany(
          { conversation: conversationId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
        socket.to(conversationId).emit('messages_marked_read', { conversationId, userId });
      } catch (err) {
        console.error('Mark read error:', err);
      }
    });

    // 6. WebRTC calling flow/signals
    // John calls Sarah
    socket.on('call_user', ({ userToCall, signalData, fromId, fromName }) => {
      const recipientSocketId = userSocketMap.get(userToCall);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call_incoming', {
          signal: signalData,
          fromId,
          fromName
        });
      }
    });

    // Sarah accepts John's call
    socket.on('answer_call', ({ toId, signalData }) => {
      const callerSocketId = userSocketMap.get(toId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_accepted', signalData);
      }
    });

    // Sarah declines John's call or call is canceled
    socket.on('decline_call', ({ toId }) => {
      const targetSocketId = userSocketMap.get(toId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call_declined');
      }
    });

    // Hangup the active stream connection
    socket.on('hangup_call', ({ toId }) => {
      const targetSocketId = userSocketMap.get(toId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call_ended');
      }
    });

    // Relay WebRTC ICE candidate
    socket.on('send_ice_candidate', ({ toId, candidate }) => {
      const targetSocketId = userSocketMap.get(toId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('receive_ice_candidate', { candidate });
      }
    });


    // Handle user disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
        try {
          await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
          io.emit('presence_update', { userId: socket.userId, isOnline: false });
        } catch (err) {
          console.error('Presence disconnect error:', err);
        }
      }
    });
  });
}
