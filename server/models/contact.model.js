import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  sentToUser: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  displayToUser: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const contactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'replied', 'resolved'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  adminReplies: [replySchema],
  adminComments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;