import express from 'express';
import { 
    requestOrderCancellation, 
    getUserCancellationRequests,
    getCancellationRequests, 
    processCancellationRequest,
    getCancellationPolicy,
    updateCancellationPolicy,
    completeRefund,
    getAllRefunds
} from '../controllers/orderCancellation.controller.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js';

const orderCancellationRoute = express.Router();

// User routes
orderCancellationRoute.post('/request', auth, requestOrderCancellation);
orderCancellationRoute.get('/user-requests', auth, getUserCancellationRequests);
orderCancellationRoute.get('/policy', getCancellationPolicy); // Public policy access

// Admin routes
orderCancellationRoute.get('/admin/all', auth, admin, getCancellationRequests);
orderCancellationRoute.put('/admin/process', auth, admin, processCancellationRequest);
orderCancellationRoute.get('/admin/policy', auth, admin, getCancellationPolicy);
orderCancellationRoute.put('/admin/policy', auth, admin, updateCancellationPolicy);

// Refund Management
orderCancellationRoute.put('/admin/refund/complete', auth, admin, completeRefund);
orderCancellationRoute.get('/admin/refunds', auth, admin, getAllRefunds);

export default orderCancellationRoute;