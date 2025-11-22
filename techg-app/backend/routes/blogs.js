const express = require('express');
const { body, validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const { auth, bloggerAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for blog media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/blogs/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
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
  } else {
    cb(new Error('Only images and videos are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Get all published blogs
router.get('/', auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single blog
router.get('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email role');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json(blog);
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create blog with optional media - ALLOW USERS TO POST
router.post('/', [
  auth, // Changed from bloggerAuth to auth - allow all authenticated users
  upload.single('media'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, caption, content, tags } = req.body;

    let mediaType = 'none';
    let mediaUrl = '';
    let mediaFileName = '';
    let mediaSize = 0;

    if (req.file) {
      if (req.file.mimetype.startsWith('image/')) {
        mediaType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        mediaType = 'video';
      }
      mediaUrl = `/uploads/blogs/${req.file.filename}`;
      mediaFileName = req.file.originalname;
      mediaSize = req.file.size;
    }

    const blog = new Blog({
      title,
      caption: caption || '',
      content,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      author: req.user.userId,
      mediaType,
      mediaUrl,
      mediaFileName,
      mediaSize
    });

    await blog.save();
    await blog.populate('author', 'name email role');

    res.status(201).json(blog);
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update blog - ALLOW USERS TO EDIT THEIR OWN BLOGS
router.put('/:id', [
  auth, // Changed from bloggerAuth to auth
  upload.single('media'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user is author or admin
    const isAuthor = blog.author.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, caption, content, tags } = req.body;

    blog.title = title;
    blog.caption = caption || '';
    blog.content = content;
    blog.tags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Handle media update
    if (req.file) {
      if (req.file.mimetype.startsWith('image/')) {
        blog.mediaType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        blog.mediaType = 'video';
      }
      blog.mediaUrl = `/uploads/blogs/${req.file.filename}`;
      blog.mediaFileName = req.file.originalname;
      blog.mediaSize = req.file.size;
    }

    await blog.save();
    await blog.populate('author', 'name email role');

    res.json(blog);
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Like/Unlike blog
router.post('/:id/like', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const userId = req.user.userId;
    const likeIndex = blog.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // Unlike
      blog.likes.splice(likeIndex, 1);
    } else {
      // Like
      blog.likes.push(userId);
    }

    await blog.save();
    await blog.populate('author', 'name email role');

    res.json({ 
      likes: blog.likes.length, 
      isLiked: likeIndex === -1,
      blog 
    });
  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete blog - ALLOW USERS TO DELETE THEIR OWN BLOGS
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user is author or admin
    const isAuthor = blog.author.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
