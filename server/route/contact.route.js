import express from 'express';
import { 
  submitContactMessage, 
  getAllContactMessages, 
  updateMessageStatus, 
  deleteMessage 
} from '../controllers/contact.controller.js';

const router = express.Router();

// Public route for submitting contact forms
router.post('/send', submitContactMessage);

// NOTE: These routes would normally be protected with authentication
// But we're making them public for now
router.get('/all', getAllContactMessages);
router.put('/:id/status', updateMessageStatus);
router.delete('/:id', deleteMessage);

export default router;