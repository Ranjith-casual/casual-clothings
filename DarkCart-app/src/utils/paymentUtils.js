// Utility functions for payment method validation and display

/**
 * Check if a payment method is considered an online payment
 * @param {string} paymentMethod - The payment method from order data
 * @returns {boolean} - True if it's an online payment method
 */
export const isOnlinePaymentMethod = (paymentMethod) => {
    const onlinePaymentMethods = [
        'ONLINE',
        'Online Payment', 
        'Razorpay',
        'UPI',
        'Card',
        'Net Banking'
    ];
    
    return onlinePaymentMethods.includes(paymentMethod);
};

/**
 * Check if an order can be cancelled based on payment method and status
 * @param {Object} order - The order object
 * @returns {Object} - { canCancel: boolean, reason: string }
 */
export const canOrderBeCancelled = (order) => {
    if (!order) {
        return { canCancel: false, reason: 'Order not found' };
    }

    // Check order status
    const nonCancellableStatuses = [
        'DELIVERED', 
        'CANCELLED', 
        'CANCEL REQUESTED', 
        'REFUND PROCESSING', 
        'REFUNDED'
    ];
    
    if (nonCancellableStatuses.includes(order.orderStatus)) {
        return { 
            canCancel: false, 
            reason: `Order cannot be cancelled. Current status: ${order.orderStatus}` 
        };
    }

    // Check payment method and status
    if (!isOnlinePaymentMethod(order.paymentMethod)) {
        return { 
            canCancel: false, 
            reason: 'Only online payments can be cancelled through this method' 
        };
    }

    const allowedPaymentStatuses = ['PAID', 'PARTIAL_REFUND_PROCESSING', 'REFUND_SUCCESSFUL'];
    if (!allowedPaymentStatuses.includes(order.paymentStatus)) {
        return { 
            canCancel: false, 
            reason: `Order must be paid to be cancelled. Current payment status: ${order.paymentStatus}` 
        };
    }

    return { canCancel: true, reason: '' };
};

/**
 * Get standardized payment status display text
 * @param {Object} order - The order object
 * @returns {string} - Formatted payment status
 */
export const getPaymentStatusDisplay = (order) => {
    if (!order) return 'N/A';
    
    const { paymentStatus, paymentMethod, orderStatus } = order;
    
    // Priority order for status determination
    if (paymentStatus === 'REFUND_SUCCESSFUL') return '✓ Refund Processed';
    if (paymentStatus === 'REFUND_PROCESSING') return '⏱ Refund Processing';
    if (paymentStatus === 'REFUND_FAILED') return '✗ Refund Failed';
    if (paymentStatus === 'PAID') return '✓ Paid';
    
    // For online payments that are successfully placed
    if (isOnlinePaymentMethod(paymentMethod) && orderStatus !== 'CANCELLED') {
        return '✓ Paid';
    }
    
    // For delivered orders (COD)
    if (orderStatus === 'DELIVERED') return '✓ Paid';
    
    // For processing orders (likely paid)
    if (['PROCESSING', 'OUT FOR DELIVERY'].includes(orderStatus)) {
        return '✓ Paid';
    }
    
    if (paymentStatus === 'PENDING') return '⏱ Payment Pending';
    if (paymentStatus === 'FAILED') return '✗ Payment Failed';
    
    return paymentStatus || 'Pending';
};

/**
 * Get CSS class for payment status color
 * @param {Object} order - The order object
 * @returns {string} - CSS class name
 */
export const getPaymentStatusColor = (order) => {
    if (!order) return 'text-gray-600';
    
    const { paymentStatus, paymentMethod } = order;
    
    // Green for successful payments and refunds
    if (['PAID', 'REFUND_SUCCESSFUL'].includes(paymentStatus)) return 'text-green-600';
    if (isOnlinePaymentMethod(paymentMethod)) return 'text-green-600';
    
    // Yellow for processing
    if (['PENDING', 'REFUND_PROCESSING'].includes(paymentStatus)) return 'text-yellow-600';
    
    // Red for failures
    if (['FAILED', 'REFUND_FAILED'].includes(paymentStatus)) return 'text-red-600';
    
    return 'text-gray-600';
};

/**
 * Validate payment method format for backend
 * @param {string} paymentMethod - Payment method to validate
 * @returns {string} - Standardized payment method
 */
export const standardizePaymentMethod = (paymentMethod) => {
    if (!paymentMethod) return 'Cash on Delivery';
    
    const methodMap = {
        'ONLINE': 'Online Payment',
        'Online Payment': 'Online Payment',
        'Razorpay': 'Razorpay',
        'UPI': 'Razorpay',
        'Card': 'Razorpay',
        'Net Banking': 'Razorpay',
        'Cash on Delivery': 'Cash on Delivery',
        'COD': 'Cash on Delivery'
    };
    
    return methodMap[paymentMethod] || paymentMethod;
};

export default {
    isOnlinePaymentMethod,
    canOrderBeCancelled,
    getPaymentStatusDisplay,
    getPaymentStatusColor,
    standardizePaymentMethod
};
