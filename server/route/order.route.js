import { Router } from 'express';
import Auth from '../middleware/auth.js';
import { validateStockAvailability } from '../middleware/stockValidation.js';
import { 
    cashOnDeliveryOrderController,
    getOrderController,
    getAllOrdersController,
    cancelOrderController,
    updateOrderStatusController
} from '../controllers/order.controller.js';
import { 
    requestOrderCancellation,
    getCancellationRequests,
    processCancellationRequest,
    getCancellationPolicy,
    updateCancellationPolicy
} from '../controllers/orderCancellation.controller.js';
import { admin } from '../middleware/Admin.js';

const orderRouter = Router();

// Apply stock validation middleware before order creation
orderRouter.post('/cash-on-delivery', Auth, validateStockAvailability, cashOnDeliveryOrderController);
orderRouter.get('/get', Auth, getOrderController);
orderRouter.get('/all-orders', Auth, getAllOrdersController);
orderRouter.post('/cancel-order', Auth, cancelOrderController);
orderRouter.put('/update-order-status', Auth, updateOrderStatusController);

// Order Cancellation Management Routes
orderRouter.post('/request-cancellation', Auth, requestOrderCancellation);
orderRouter.get('/cancellation-requests', Auth, admin, getCancellationRequests);
orderRouter.post('/process-cancellation', Auth, admin, processCancellationRequest);
orderRouter.get('/cancellation-policy', getCancellationPolicy);
orderRouter.put('/update-cancellation-policy', Auth, admin, updateCancellationPolicy);

export default orderRouter;