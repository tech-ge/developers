const express = require('express');
const Blog = require('../models/Blog');
const { auth } = require('../middleware/auth');

const router = express.Router();

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

// Check if user liked a blog
router.get('/:id/like-status', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const isLiked = blog.likes.includes(req.user.userId);
    
    res.json({ isLiked, likesCount: blog.likes.length });
  } catch (error) {
    console.error('Like status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
