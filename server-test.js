require('dotenv').config({ path: '.env.local' });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const socketIo = require('socket.io');

// Import routes will be done after DB connection

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// MongoDB Memory Server for testing without local MongoDB
let mongoServer;
let mongoUri;

async function startServer() {
  try {
    // Start MongoDB Memory Server with Windows-specific configuration
    console.log('Starting MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'quizknow-app6mongoDB',
        port: 27017,
      },
      binary: {
        version: '6.0.5',
        downloadDir: './.mongodb-binaries',
        platform: 'win32',
        arch: 'x64',
        skipMD5: true,
      },
    });

    mongoUri = mongoServer.getUri();
    console.log('MongoDB Memory Server URI:', mongoUri);
    
    // Connect with increased timeout for Windows
    console.log('Connecting to MongoDB Memory Server...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB Memory Server');

    // Import routes after DB connection
    const authRoutes = require('./routes/auth');
    const userRoutes = require('./routes/users');
    const quizRoutes = require('./routes/quizzes');
    const submissionRoutes = require('./routes/submissions');
    const connectionRoutes = require('./routes/connections');
    const contentRoutes = require('./routes/content');
    const messageRoutes = require('./routes/messages');

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/quizzes', quizRoutes);
    app.use('/api/submissions', submissionRoutes);
    app.use('/api/connections', connectionRoutes);
    app.use('/api/content', contentRoutes);
    app.use('/api/messages', messageRoutes);

    // Start Express server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Using MongoDB Memory Server for development');
      console.log('Available endpoints:');
      console.log('  POST   /api/auth/register');
      console.log('  POST   /api/auth/login');
      console.log('  GET    /api/users');
      console.log('  GET    /api/quizzes');
      console.log('  POST   /api/quizzes');
      console.log('  GET    /api/submissions');
      console.log('  POST   /api/submissions');
      console.log('  GET    /api/connections');
      console.log('  POST   /api/connections');
      console.log('  GET    /api/content');
      console.log('  POST   /api/content');
    });

  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on('join-user-room', (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined user room ${userId}`);
  });

  socket.on('leave-user-room', (userId) => {
    socket.leave(userId);
    console.log(`User ${socket.id} left user room ${userId}`);
  });

  socket.on('quiz-submitted', (data) => {
    socket.to(data.quizId).emit('new-submission', data);
  });

  socket.on('send-message', (data) => {
    // Emit to receiver's room
    socket.to(data.receiverId).emit('new-message', data.message);
  });

  socket.on('typing-start', (data) => {
    socket.to(data.receiverId).emit('user-typing', { userId: data.senderId });
  });

  socket.on('typing-stop', (data) => {
    socket.to(data.receiverId).emit('user-stopped-typing', { userId: data.senderId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  process.exit(0);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'QuizKnow App 4 API is running!',
    database: 'MongoDB Memory Server',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      quizzes: '/api/quizzes',
      submissions: '/api/submissions',
      connections: '/api/connections',
      content: '/api/content'
    }
  });
});

// Start the server
startServer().catch(console.error);

module.exports = { app, server, mongoose };
