import { Router } from 'express';
import { 
    createCustomTshirtRequest, 
    getAllCustomTshirtRequests, 
    updateCustomTshirtRequestStatus, 
    getCustomTshirtRequest, 
    deleteCustomTshirtRequest,
    getCustomTshirtDashboardStats,
    exportCustomTshirtRequests,
    bulkUpdateCustomTshirtRequests,
    getUserCustomTshirtRequests
} from '../controllers/customTshirtRequest.controller.js';
import auth from '../middleware/auth.js';
import optionalAuth from '../middleware/optionalAuth.js';
import { admin } from "../middleware/Admin.js";

const customTshirtRequestRouter = Router();

// User routes - require authentication
customTshirtRequestRouter.post('/create', auth, createCustomTshirtRequest);
customTshirtRequestRouter.get('/:requestId', getCustomTshirtRequest);

// User routes
customTshirtRequestRouter.get('/user/my-requests', auth, getUserCustomTshirtRequests);

// Admin routes
customTshirtRequestRouter.post('/admin/all', auth, admin, getAllCustomTshirtRequests);
customTshirtRequestRouter.put('/admin/update-status', auth, admin, updateCustomTshirtRequestStatus);
customTshirtRequestRouter.delete('/admin/:requestId', auth, admin, deleteCustomTshirtRequest);
customTshirtRequestRouter.get('/admin/dashboard/stats', auth, admin, getCustomTshirtDashboardStats);
customTshirtRequestRouter.get('/admin/export', auth, admin, exportCustomTshirtRequests);
customTshirtRequestRouter.put('/admin/bulk-update', auth, admin, bulkUpdateCustomTshirtRequests);

export default customTshirtRequestRouter;
