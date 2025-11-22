const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'TechG API Server is running!' });
});

// Socket.io for real-time chat
const typingUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });

  socket.on('message_edited', (data) => {
    socket.to(data.room).emit('message_updated', data);
  });

  socket.on('message_deleted', (data) => {
    socket.to(data.room).emit('message_removed', data);
  });

  socket.on('reaction_added', (data) => {
    socket.to(data.room).emit('reaction_updated', data);
  });

  // Typing indicators
  socket.on('typing_start', (data) => {
    const { room, user } = data;
    if (!typingUsers.has(room)) {
      typingUsers.set(room, new Set());
    }
    typingUsers.get(room).add(user);
    socket.to(room).emit('user_typing', {
      users: Array.from(typingUsers.get(room)),
      room
    });
  });

  socket.on('typing_stop', (data) => {
    const { room, user } = data;
    if (typingUsers.has(room)) {
      typingUsers.get(room).delete(user);
      socket.to(room).emit('user_typing', {
        users: Array.from(typingUsers.get(room)),
        room
      });
    }
  });

  socket.on('disconnect', () => {
    // Remove user from all typing lists
    for (const [room, users] of typingUsers.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(room).emit('user_typing', {
          users: Array.from(users),
          room
        });
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
