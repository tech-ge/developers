const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  caption: {
    type: String,
    trim: true,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 200
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaType: {
    type: String,
    enum: ['none', 'image', 'video'],
    default: 'none'
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  mediaFileName: {
    type: String,
    default: ''
  },
  mediaSize: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Create excerpt from content
blogSchema.pre('save', function(next) {
  if (this.content && !this.excerpt) {
    this.excerpt = this.content.substring(0, 197) + '...';
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
