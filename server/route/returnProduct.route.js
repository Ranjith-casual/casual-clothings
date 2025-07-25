import { Router } from 'express';
import auth from '../middleware/auth.js';
import {admin} from '../middleware/Admin.js';
import {
    getEligibleReturnItems,
    createReturnRequest,
    getUserReturnRequests,
    getReturnRequestDetails,
    updateReturnRequest,
    cancelReturnRequest,
    getAllReturnRequests,
    processReturnRequest,
    confirmProductReceived,
    processRefund,
    updateRefundStatus,
    getReturnDashboardStats
} from '../controllers/returnProduct.controller.js';

const returnProductRouter = Router();

// Customer routes (protected with auth middleware)
returnProductRouter.get('/eligible-items', auth, getEligibleReturnItems);
returnProductRouter.post('/create', auth, createReturnRequest);
returnProductRouter.get('/user/my-returns', auth, getUserReturnRequests);
returnProductRouter.get('/:returnId', auth, getReturnRequestDetails);
returnProductRouter.put('/update', auth, updateReturnRequest);
returnProductRouter.put('/cancel', auth, cancelReturnRequest);

// Admin routes (protected with admin middleware)
returnProductRouter.post('/admin/all', auth, admin, getAllReturnRequests);
returnProductRouter.put('/admin/process/:returnId', auth, admin, processReturnRequest);
returnProductRouter.put('/admin/confirm-received', auth, admin, confirmProductReceived);
returnProductRouter.put('/admin/process-refund/:returnId', auth, admin, processRefund);
returnProductRouter.put('/admin/update-refund-status/:returnId', auth, admin, updateRefundStatus);
returnProductRouter.get('/admin/dashboard/stats', auth, admin, getReturnDashboardStats);

export default returnProductRouter;
