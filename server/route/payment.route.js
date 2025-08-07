import express from 'express';
import { 
    getAllPayments, 
    getPaymentStats, 
    getPaymentStatsWithDelivery,
    downloadInvoice, 
    initiateRefund, 
    handleRefundCompletion,
    handleDeliveryCompletion,
    getPaymentSettings, 
    updatePaymentSettings,
    getPaymentStatus,
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook,
    initiateRazorpayRefund
} from '../controllers/payment.controller.js';
import auth from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js';

const paymentRouter = express.Router();

// Get all payments with filters (Admin only)
paymentRouter.post('/all', auth, admin, getAllPayments);

// Get payment statistics (Admin only)
paymentRouter.get('/stats', auth, admin, getPaymentStats);

// Get payment statistics with delivery insights (Admin only)
paymentRouter.get('/stats/delivery', auth, admin, getPaymentStatsWithDelivery);

// Download invoice (Admin only)
paymentRouter.post('/invoice/download', auth, admin, downloadInvoice);

// Download user's own invoice (User route)
paymentRouter.post('/invoice/download-user', auth, downloadInvoice);

// Initiate refund (Admin only)
paymentRouter.post('/refund/initiate', auth, admin, initiateRefund);

// Complete refund and send email with invoice (Admin only)
paymentRouter.post('/refund/complete', auth, admin, handleRefundCompletion);

// Complete delivery and send email with invoice (Admin only)
paymentRouter.post('/delivery/complete', auth, admin, handleDeliveryCompletion);

// Public endpoint to check payment method availability (no auth required)
paymentRouter.get('/status', getPaymentStatus);

// Get payment gateway settings (Admin only)
paymentRouter.get('/settings', auth, admin, getPaymentSettings);

// Update payment gateway settings (Admin only)
paymentRouter.post('/settings/update', auth, admin, updatePaymentSettings);

// Razorpay payment routes
paymentRouter.post('/razorpay/create-order', auth, createRazorpayOrder);
paymentRouter.post('/razorpay/verify', auth, verifyRazorpayPayment);
paymentRouter.post('/razorpay/webhook', handleRazorpayWebhook); // No auth needed for webhooks
paymentRouter.post('/razorpay/refund', auth, admin, initiateRazorpayRefund);

export default paymentRouter;
