import express from 'express';
import { 
    getAllPayments, 
    getPaymentStats, 
    downloadInvoice, 
    initiateRefund, 
    getPaymentSettings, 
    updatePaymentSettings 
} from '../controllers/payment.controller.js';
import auth from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js';

const paymentRouter = express.Router();

// Get all payments with filters (Admin only)
paymentRouter.post('/all', auth, admin, getAllPayments);

// Get payment statistics (Admin only)
paymentRouter.get('/stats', auth, admin, getPaymentStats);

// Download invoice
paymentRouter.post('/invoice/download', auth, admin, downloadInvoice);

// Initiate refund (Admin only)
paymentRouter.post('/refund/initiate', auth, admin, initiateRefund);

// Get payment gateway settings (Admin only)
paymentRouter.get('/settings', auth, admin, getPaymentSettings);

// Update payment gateway settings (Admin only)
paymentRouter.post('/settings/update', auth, admin, updatePaymentSettings);

export default paymentRouter;
