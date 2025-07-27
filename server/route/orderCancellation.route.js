import express from 'express';
import { 
    requestOrderCancellation, 
    getUserCancellationRequests,
    getCancellationRequests, 
    processCancellationRequest,
    getCancellationPolicy,
    updateCancellationPolicy,
    completeRefund,
    getAllRefunds,
    getUserRefunds,
    getRefundInvoice,
    getCancellationByOrderId,
    getRefundStatsWithDelivery,
    getComprehensiveOrderDetails,
    requestPartialItemCancellation,
    processPartialItemCancellation,
    getPartialCancellationDetails
} from '../controllers/orderCancellation.controller.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js';

const orderCancellationRoute = express.Router();

// User routes
orderCancellationRoute.post('/request', auth, requestOrderCancellation);
orderCancellationRoute.get('/user-requests', auth, getUserCancellationRequests);
orderCancellationRoute.get('/user-refunds', auth, getUserRefunds);
orderCancellationRoute.get('/invoice/:refundId', auth, getRefundInvoice);
orderCancellationRoute.get('/policy', getCancellationPolicy); // Public policy access

// Partial item cancellation routes
orderCancellationRoute.post('/request-partial', auth, requestPartialItemCancellation);
orderCancellationRoute.get('/partial/:cancellationId', auth, getPartialCancellationDetails);

// Admin routes
orderCancellationRoute.get('/admin/all', auth, admin, getCancellationRequests);
orderCancellationRoute.put('/admin/process', auth, admin, processCancellationRequest);
orderCancellationRoute.put('/admin/process-partial/:cancellationId', auth, admin, processPartialItemCancellation);
orderCancellationRoute.get('/admin/policy', auth, admin, getCancellationPolicy);
orderCancellationRoute.put('/admin/policy', auth, admin, updateCancellationPolicy);
orderCancellationRoute.get('/order/:orderId', auth, admin, getCancellationByOrderId); // Get cancellation by order ID

// Get comprehensive order details with all related information
orderCancellationRoute.get('/comprehensive/:orderId', auth, getComprehensiveOrderDetails);

// Refund Management
orderCancellationRoute.put('/admin/refund/complete', auth, admin, completeRefund);
orderCancellationRoute.get('/admin/refunds', auth, admin, getAllRefunds);
orderCancellationRoute.get('/admin/refund-stats', auth, admin, getRefundStatsWithDelivery);

export default orderCancellationRoute;