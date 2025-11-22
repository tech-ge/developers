const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Chat');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.mimetype.startsWith('video/')) {
    if (file.size > 10 * 1024 * 1024) {
      cb(new Error('Video size must be less than 10MB'), false);
    } else {
      cb(null, true);
    }
  } else if (file.mimetype.startsWith('audio/')) {
    if (file.size > 2 * 1024 * 1024) {
      cb(new Error('Audio size must be less than 2MB'), false);
    } else {
      cb(null, true);
    }
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Get all messages for a room
router.get('/messages/:room', auth, async (req, res) => {
  try {
    const { room } = req.params;
    const messages = await Message.find({ 
      room,
      isDeleted: false 
    })
      .populate('sender', 'name email')
      .populate('reactions.user', 'name')
      .populate('reports.user', 'name email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send text message
router.post('/messages', [
  auth,
  body('content').trim().notEmpty().withMessage('Message content is required'),
  body('room').notEmpty().withMessage('Room is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, room } = req.body;

    const message = new Message({
      room,
      sender: req.user.userId,
      content,
      messageType: 'text'
    });

    await message.save();
    await message.populate('sender', 'name email');

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload file message
router.post('/messages/upload', [
  auth,
  upload.single('file')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { room } = req.body;
    let messageType = 'file';

    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      messageType = 'audio';
    }

    const message = new Message({
      room: room || 'general',
      sender: req.user.userId,
      content: req.file.originalname,
      messageType,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

    await message.save();
    await message.populate('sender', 'name email');

    res.status(201).json(message);
  } catch (error) {
    console.error('Upload message error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Edit message
router.put('/messages/:id', [
  auth,
  body('content').trim().notEmpty().withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    message.content = req.body.content;
    message.isEdited = true;
    await message.save();

    await message.populate('sender', 'name email');
    await message.populate('reactions.user', 'name');

    res.json(message);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message (soft delete)
router.delete('/messages/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    console.log('User ID:', req.user.userId);
    console.log('Sender ID:', message.sender.toString());
    console.log('User Role:', req.user.role);

    // Check if user is the sender or admin
    const isSender = message.sender.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    console.log('Is sender:', isSender);
    console.log('Is admin:', isAdmin);

    if (!isSender && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reaction to message
router.post('/messages/:id/reactions', [
  auth,
  body('emoji').notEmpty().withMessage('Emoji is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const { emoji } = req.body;

    // Remove existing reaction from same user
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== req.user.userId
    );

    // Add new reaction
    message.reactions.push({
      user: req.user.userId,
      emoji
    });

    await message.save();
    await message.populate('reactions.user', 'name');

    res.json(message.reactions);
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove reaction from message
router.delete('/messages/:id/reactions', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Remove user's reaction
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== req.user.userId
    );

    await message.save();

    res.json(message.reactions);
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report message
router.post('/messages/:id/report', [
  auth,
  body('reason').trim().notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const { reason } = req.body;

    // Check if user already reported this message
    const existingReport = message.reports.find(
      report => report.user.toString() === req.user.userId
    );

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this message' });
    }

    message.reports.push({
      user: req.user.userId,
      reason
    });

    await message.save();
    await message.populate('reports.user', 'name email');

    res.json({ message: 'Message reported successfully' });
  } catch (error) {
    console.error('Report message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reported messages (Admin only)
router.get('/reported-messages', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reportedMessages = await Message.find({
      'reports.0': { $exists: true } // Messages with at least one report
    })
      .populate('sender', 'name email')
      .populate('reports.user', 'name email')
      .sort({ 'reports.reportedAt': -1 });

    res.json(reportedMessages);
  } catch (error) {
    console.error('Get reported messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve uploaded files
router.use('/uploads', express.static('uploads'));

module.exports = router;
