import { Router } from 'express';
import { sendRefundEmail } from '../controllers/email.controller.js';
import auth from '../middleware/auth.js';

const emailRouter = Router();

emailRouter.post('/send-refund', auth, sendRefundEmail);

export default emailRouter;
