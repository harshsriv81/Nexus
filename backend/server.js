import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User, Conversation, Message } from './models.js';
import { initSocket } from './socket.js';
import { createOriginChecker, corsCallback } from './cors.js';

dotenv.config();

const app = express();
const isOriginAllowed = createOriginChecker();

app.use(cors({
  origin: corsCallback(isOriginAllowed),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

const server = http.createServer(app);

// Initialize socket server with the http server instance
initSocket(server);

// ------------------ DB CONNECTION ------------------
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime-chat')
  .then(() => console.log('Successfully connected to MongoDB database'))
  .catch(err => console.error('MongoDB database connection error:', err));

// ------------------ API ROUTES ------------------

app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'nexus-backend' });
});

// Simple test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chat backend server is up and running!' });
});

// Sync User profiles from Clerk auth with our own Database
app.post('/api/users/sync', async (req, res) => {
  const { clerkId, username, email, imageUrl } = req.body;
  
  if (!clerkId || !email) {
    return res.status(400).json({ error: 'Missing required sync parameters' });
  }

  try {
    let user = await User.findOne({ clerkId });
    if (user) {
      user.username = username || user.username;
      user.email = email;
      user.imageUrl = imageUrl || user.imageUrl;
      await user.save();
    } else {
      user = new User({ clerkId, username: username || email.split('@')[0], email, imageUrl });
      await user.save();
    }
    res.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user profile' });
  }
});

// List all registered users (to start chats)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'clerkId username email imageUrl isOnline lastSeen');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registered users list' });
  }
});

// Get or Create a 1-to-1 conversation
app.post('/api/conversations', async (req, res) => {
  const { senderId, recipientId } = req.body;

  if (!senderId || !recipientId) {
    return res.status(400).json({ error: 'Sender and recipient IDs are required' });
  }

  try {
    // Look for a non-group conversation containing both users
    let convo = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [senderId, recipientId] }
    }).populate('participants', 'username email imageUrl isOnline lastSeen');

    if (!convo) {
      convo = new Conversation({
        participants: [senderId, recipientId],
        isGroup: false
      });
      await convo.save();
      convo = await Conversation.findById(convo._id).populate('participants', 'username email imageUrl isOnline lastSeen');
    }

    res.json(convo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to find/create conversation workspace' });
  }
});

// Create group conversation
app.post('/api/conversations/group', async (req, res) => {
  const { name, participantIds } = req.body;

  if (!name || !participantIds || participantIds.length < 2) {
    return res.status(400).json({ error: 'Group name and at least 2 participants required' });
  }

  try {
    let convo = new Conversation({
      name,
      isGroup: true,
      participants: participantIds
    });
    await convo.save();
    convo = await Conversation.findById(convo._id).populate('participants', 'username email imageUrl isOnline lastSeen');
    res.json(convo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group conversation' });
  }
});

// Fetch active conversation list for a user
app.get('/api/conversations/user/:userId', async (req, res) => {
  try {
    const convos = await Conversation.find({
      participants: req.params.userId
    })
    .populate('participants', 'username email imageUrl isOnline lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(convos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load conversations list' });
  }
});

// Fetch messages for a specific conversation workspace (50 messages chunk)
app.get('/api/conversations/:convoId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ conversation: req.params.convoId })
      .populate('sender', 'username email imageUrl')
      .sort({ createdAt: 1 })
      .limit(50); // Simulating pagination/simple loader
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Express API is active on port ${PORT}`);
});
