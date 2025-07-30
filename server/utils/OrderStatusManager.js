/**
 * Centralized Order Status Management
 * This service handles all order status transitions and validations
 */
import Logger from './logger.js';

export class OrderStatusManager {
  // Define valid order statuses and their properties
  static ORDER_STATUS = {
    PENDING: 'PENDING', // Initial state after order creation
    PROCESSING: 'PROCESSING', // Payment verified, preparing to ship
    SHIPPED: 'SHIPPED', // Order has been shipped
    DELIVERED: 'DELIVERED', // Order has been delivered
    CANCELLED: 'CANCELLED', // Order has been cancelled
    REFUNDED: 'REFUNDED', // Order has been refunded
    RETURNED: 'RETURNED', // Order has been returned
    PARTIAL_REFUND: 'PARTIAL_REFUND', // Partial refund issued
    PARTIAL_RETURN: 'PARTIAL_RETURN', // Partial return processed
    ON_HOLD: 'ON_HOLD', // Order is on hold
    FAILED: 'FAILED' // Order payment failed or other failure
  };

  // Valid status transitions (from -> to[])
  static VALID_TRANSITIONS = {
    [this.ORDER_STATUS.PENDING]: [
      this.ORDER_STATUS.PROCESSING,
      this.ORDER_STATUS.CANCELLED,
      this.ORDER_STATUS.FAILED,
      this.ORDER_STATUS.ON_HOLD
    ],
    [this.ORDER_STATUS.PROCESSING]: [
      this.ORDER_STATUS.SHIPPED,
      this.ORDER_STATUS.CANCELLED,
      this.ORDER_STATUS.ON_HOLD
    ],
    [this.ORDER_STATUS.SHIPPED]: [
      this.ORDER_STATUS.DELIVERED,
      this.ORDER_STATUS.RETURNED,
      this.ORDER_STATUS.PARTIAL_RETURN
    ],
    [this.ORDER_STATUS.DELIVERED]: [
      this.ORDER_STATUS.RETURNED,
      this.ORDER_STATUS.PARTIAL_RETURN
    ],
    [this.ORDER_STATUS.ON_HOLD]: [
      this.ORDER_STATUS.PROCESSING,
      this.ORDER_STATUS.CANCELLED,
      this.ORDER_STATUS.FAILED
    ],
    [this.ORDER_STATUS.CANCELLED]: [
      this.ORDER_STATUS.REFUNDED
    ],
    [this.ORDER_STATUS.PARTIAL_RETURN]: [
      this.ORDER_STATUS.PARTIAL_REFUND
    ],
    [this.ORDER_STATUS.RETURNED]: [
      this.ORDER_STATUS.REFUNDED
    ]
  };

  /**
   * Check if a status transition is valid
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {boolean} - Whether transition is valid
   */
  static isValidTransition(fromStatus, toStatus) {
    // Allow setting to the same status
    if (fromStatus === toStatus) return true;

    // Check if the transition is valid based on our rules
    return this.VALID_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
  }

  /**
   * Validate and perform status transition
   * @param {object} order - Order object to update
   * @param {string} newStatus - Target status
   * @param {object} [options] - Additional options
   * @param {string} [options.reason] - Reason for the status change
   * @param {string} [options.updatedBy] - User ID who updated the status
   * @returns {object} - Result object with success flag and updated order
   */
  static changeStatus(order, newStatus, options = {}) {
    try {
      const currentStatus = order.status;
      
      // Validate the status values
      if (!Object.values(this.ORDER_STATUS).includes(newStatus)) {
        Logger.error('OrderStatusManager', `Invalid target status: ${newStatus}`);
        return {
          success: false,
          error: 'Invalid target status',
          order
        };
      }

      // Check if transition is allowed
      if (!this.isValidTransition(currentStatus, newStatus)) {
        Logger.error(
          'OrderStatusManager', 
          `Invalid status transition from ${currentStatus} to ${newStatus}`
        );
        return {
          success: false,
          error: `Cannot change status from ${currentStatus} to ${newStatus}`,
          order
        };
      }

      // Create status history entry
      const statusHistoryEntry = {
        status: newStatus,
        timestamp: new Date(),
        reason: options.reason || '',
        updatedBy: options.updatedBy || 'SYSTEM'
      };

      // If status history doesn't exist, initialize it
      if (!order.statusHistory) {
        order.statusHistory = [];
      }

      // Update order with new status and add to history
      order.status = newStatus;
      order.statusHistory.push(statusHistoryEntry);
      order.lastStatusUpdate = new Date();

      // Handle specific status transitions with side effects
      switch (newStatus) {
        case this.ORDER_STATUS.SHIPPED:
          order.shippedDate = new Date();
          break;
        case this.ORDER_STATUS.DELIVERED:
          order.deliveredDate = new Date();
          // Calculate actual delivery time
          if (order.shippedDate) {
            const deliveryTimeHours = 
              (order.deliveredDate - order.shippedDate) / (1000 * 60 * 60);
            order.actualDeliveryTimeHours = deliveryTimeHours;
          }
          break;
        case this.ORDER_STATUS.REFUNDED:
          order.refundDate = new Date();
          break;
      }

      return {
        success: true,
        order,
        previousStatus: currentStatus,
        statusHistory: order.statusHistory
      };
    } catch (error) {
      Logger.error('OrderStatusManager', 'Error changing order status', error);
      return {
        success: false,
        error: 'Error processing status change',
        order
      };
    }
  }

  /**
   * Get available status transitions for current status
   * @param {string} currentStatus - Current order status
   * @returns {string[]} - Array of available status transitions
   */
  static getAvailableTransitions(currentStatus) {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Get status display information
   * @param {string} status - Order status
   * @returns {object} - Status display information
   */
  static getStatusDisplayInfo(status) {
    const statusInfo = {
      [this.ORDER_STATUS.PENDING]: {
        label: 'Pending',
        color: 'yellow',
        icon: 'clock',
        description: 'Order placed, awaiting payment confirmation'
      },
      [this.ORDER_STATUS.PROCESSING]: {
        label: 'Processing',
        color: 'blue',
        icon: 'package',
        description: 'Payment confirmed, preparing your order'
      },
      [this.ORDER_STATUS.SHIPPED]: {
        label: 'Shipped',
        color: 'purple',
        icon: 'truck',
        description: 'Your order is on the way'
      },
      [this.ORDER_STATUS.DELIVERED]: {
        label: 'Delivered',
        color: 'green',
        icon: 'check-circle',
        description: 'Order has been delivered'
      },
      [this.ORDER_STATUS.CANCELLED]: {
        label: 'Cancelled',
        color: 'red',
        icon: 'x-circle',
        description: 'Order has been cancelled'
      },
      [this.ORDER_STATUS.REFUNDED]: {
        label: 'Refunded',
        color: 'green',
        icon: 'credit-card',
        description: 'Payment has been refunded'
      },
      [this.ORDER_STATUS.RETURNED]: {
        label: 'Returned',
        color: 'orange',
        icon: 'rotate-ccw',
        description: 'Order has been returned'
      },
      [this.ORDER_STATUS.PARTIAL_REFUND]: {
        label: 'Partial Refund',
        color: 'teal',
        icon: 'credit-card',
        description: 'Partial refund has been processed'
      },
      [this.ORDER_STATUS.PARTIAL_RETURN]: {
        label: 'Partial Return',
        color: 'amber',
        icon: 'rotate-ccw',
        description: 'Some items have been returned'
      },
      [this.ORDER_STATUS.ON_HOLD]: {
        label: 'On Hold',
        color: 'gray',
        icon: 'pause',
        description: 'Order processing temporarily paused'
      },
      [this.ORDER_STATUS.FAILED]: {
        label: 'Failed',
        color: 'red',
        icon: 'alert-triangle',
        description: 'Order processing failed'
      }
    };

    return statusInfo[status] || {
      label: status,
      color: 'gray',
      icon: 'help-circle',
      description: 'Status information unavailable'
    };
  }
}

export default OrderStatusManager;
