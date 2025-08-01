import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle, FaCheck, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import { PricingService } from '../utils/PricingService';

const PartialCancellationModal = ({ isOpen, onClose, order, onCancellationSuccess }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [additionalReason, setAdditionalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalRefundAmount, setTotalRefundAmount] = useState(0);
  const [refundPercentage, setRefundPercentage] = useState(75); // Add state for refund percentage

  const cancellationReasons = [
    'Changed mind',
    'Found better price',
    'Wrong item ordered',
    'Delivery delay',
    'Product defect expected',
    'Financial constraints',
    'Duplicate order',
    'Other'
  ];

  // Calculate size-based price for an item with discount applied
  const calculateItemPrice = (item) => {
    let basePrice = 0;
    let originalPrice = 0;
    let discountPercentage = 0;
    
    if (item.itemType === 'product') {
      // Get the original price first
      originalPrice = item.productId?.price || item.productDetails?.price || 0;
      
      // Check for explicit final price (already discounted)
      if (item.productDetails?.finalPrice) {
        basePrice = item.productDetails.finalPrice;
        // Calculate discount from original vs final price
        if (originalPrice > basePrice) {
          discountPercentage = ((originalPrice - basePrice) / originalPrice) * 100;
        }
      } else if (item.sizeAdjustedPrice) {
        // Use size-adjusted price as base
        basePrice = item.sizeAdjustedPrice;
        originalPrice = basePrice; // For size-adjusted, show as no additional discount
      } else if (item.productId?.sizePricing && item.size) {
        // Calculate size-adjusted price from populated product data
        const sizeMultiplier = item.productId.sizePricing[item.size] || 1;
        const basePriceBeforeSize = originalPrice;
        
        // Apply size multiplier first
        originalPrice = basePriceBeforeSize * sizeMultiplier;
        basePrice = originalPrice;
        
        // Then apply discount if available
        discountPercentage = item.productId?.discount || item.discount || 0;
        if (discountPercentage > 0) {
          basePrice = originalPrice * (1 - discountPercentage / 100);
        }
      } else {
        // Regular price with discount
        discountPercentage = item.productId?.discount || item.discount || 0;
        if (discountPercentage > 0) {
          basePrice = originalPrice * (1 - discountPercentage / 100);
        } else {
          basePrice = originalPrice;
        }
      }
    } else if (item.itemType === 'bundle') {
      // For bundles
      basePrice = item.bundleId?.bundlePrice || item.bundleDetails?.bundlePrice || 0;
      originalPrice = item.bundleId?.originalPrice || item.bundleDetails?.originalPrice || basePrice;
      
      // Calculate discount percentage for display
      if (originalPrice > basePrice && originalPrice > 0) {
        discountPercentage = ((originalPrice - basePrice) / originalPrice) * 100;
      }
    }
    
    return {
      unitPrice: basePrice,
      originalPrice: originalPrice,
      discount: discountPercentage,
      totalPrice: basePrice * item.quantity
    };
  };

  // Calculate total refund amount when selected items change
  useEffect(() => {
    const total = selectedItems.reduce((sum, itemId) => {
      const item = order.items.find(item => item._id === itemId);
      return sum + (item ? calculateItemPrice(item).totalPrice : 0);
    }, 0);
    setTotalRefundAmount(total);
  }, [selectedItems, order.items]);

  // Calculate refund percentage when order changes
  useEffect(() => {
    const calculateRefundPercentage = async () => {
      let percentage = 75; // Default fallback
      
      try {
        // Import and use RefundPolicyService for proper calculation
        const { RefundPolicyService } = await import('../utils/RefundPolicyService');
        
        const cancellationContext = {
          requestDate: new Date(),
          orderDate: new Date(order.orderDate || order.createdAt),
          deliveryInfo: {
            actualDeliveryDate: order.actualDeliveryDate,
            estimatedDeliveryDate: order.estimatedDeliveryDate
          },
          orderStatus: order.orderStatus
        };
        
        const calculation = RefundPolicyService.calculateRefundAmount(
          order, 
          cancellationContext
        );
        
        if (calculation?.refundPercentage) {
          percentage = Math.round(calculation.refundPercentage);
          console.log('✅ Using RefundPolicyService calculation for display:', percentage);
        }
      } catch (error) {
        console.error('Error calculating refund percentage, using fallback:', error);
        // Fallback to improved time-based calculation
        const orderDate = order?.orderDate || order?.createdAt;
        if (orderDate) {
          const hoursSinceOrder = (new Date() - new Date(orderDate)) / (1000 * 60 * 60);
          const daysSinceOrder = Math.floor(hoursSinceOrder / 24);
          
          if (hoursSinceOrder <= 24) {
            percentage = 90; // Early cancellation
          } else if (daysSinceOrder <= 7) {
            percentage = 75; // Standard cancellation
          } else {
            percentage = 50; // Late cancellation
          }
          
          // Apply penalties for delivered orders
          if (order.orderStatus === 'DELIVERED') {
            percentage -= 25; // Delivered penalty
          }
          
          // Ensure minimum refund
          percentage = Math.max(25, percentage);
        }
      }
      
      setRefundPercentage(percentage);
    };
    
    if (order && isOpen) {
      calculateRefundPercentage();
    }
  }, [order, isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]);
      setReason('');
      setAdditionalReason('');
      setTotalRefundAmount(0);
      
      // Debug: Log order structure to understand data format
      console.log('Order items structure:', order.items);
      if (order.items && order.items.length > 0) {
        console.log('First item structure:', order.items[0]);
        console.log('First item productId:', order.items[0].productId);
        console.log('First item productDetails:', order.items[0].productDetails);
      }
    }
  }, [isOpen]);

  const handleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to cancel');
      return;
    }

    if (!reason) {
      toast.error('Please select a cancellation reason');
      return;
    }

    if (reason === 'Other' && !additionalReason.trim()) {
      toast.error('Please provide additional reason details');
      return;
    }

    // Validate order ID format
    if (!order._id) {
      toast.error('Invalid order ID');
      return;
    }

    // Validate selected items exist in order
    const invalidItems = selectedItems.filter(itemId => 
      !order.items.find(item => item._id === itemId)
    );
    
    if (invalidItems.length > 0) {
      toast.error('Some selected items are not valid');
      console.error('Invalid item IDs:', invalidItems);
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        orderId: order._id,
        itemsToCancel: selectedItems.map(itemId => {
          const item = order.items.find(item => item._id === itemId);
          const priceData = calculateItemPrice(item);
          
          return {
            itemId,
            itemPrice: priceData.unitPrice, // Unit price after discount
            originalPrice: priceData.originalPrice, // Original price before discount
            totalPrice: priceData.totalPrice, // Total price for this item (unitPrice * quantity)
            quantity: item.quantity,
            discount: priceData.discount,
            itemType: item.itemType,
            productName: item.itemType === 'product' 
              ? item.productDetails?.name 
              : item.bundleDetails?.title,
            size: item.size || null,
            refundAmount: PricingService.calculateRefundAmount(
              { totalAmt: priceData.totalPrice }, 
              { 
                requestDate: new Date(),
                deliveryInfo: {
                  wasPastDeliveryDate: order.estimatedDeliveryDate && new Date() > new Date(order.estimatedDeliveryDate),
                  actualDeliveryDate: order.actualDeliveryDate
                }
              }
            ).refundAmount
          };
        }),
        reason,
        additionalReason: reason === 'Other' ? additionalReason : '',
        // Calculate total refund amount using pricing service
        totalRefundAmount: PricingService.calculateRefundAmount(
          { totalAmt: totalRefundAmount }, 
          {
            requestDate: new Date(),
            deliveryInfo: {
              wasPastDeliveryDate: order.estimatedDeliveryDate && new Date() > new Date(order.estimatedDeliveryDate),
              actualDeliveryDate: order.actualDeliveryDate
            }
          }
        ).refundAmount,
        totalItemValue: totalRefundAmount // Total value of cancelled items before refund percentage
      };

      console.log('=== PARTIAL CANCELLATION REQUEST ===');
      console.log('Order ID:', order._id);
      console.log('Selected Items:', selectedItems);
      console.log('Total Item Value:', totalRefundAmount);
      
      // Use the refund percentage from state (already calculated in useEffect)
      console.log(`Total Refund Amount (${refundPercentage}%):`, (totalRefundAmount * refundPercentage / 100));
      console.log('Request Data:', requestData);
      console.log('API Config:', SummaryApi.requestPartialItemCancellation);

      const response = await Axios({
        ...SummaryApi.requestPartialItemCancellation,
        data: requestData
      });

      console.log('Response:', response.data);

      if (response.data.success) {
        toast.success('Partial cancellation request submitted successfully');
        onCancellationSuccess();
        onClose();
      } else {
        console.error('Backend returned success=false:', response.data);
        toast.error(response.data.message || 'Failed to submit cancellation request');
      }
    } catch (error) {
      console.error('Error submitting partial cancellation:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request data sent:', requestData);
      
      // Show the specific error message from backend
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to submit cancellation request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItemCard = (item, index) => {
    const isSelected = selectedItems.includes(item._id);
    const priceData = calculateItemPrice(item);
    const { unitPrice, originalPrice, discount, totalPrice } = priceData;

    return (
      <div
        key={item._id || index}
        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-red-500 bg-red-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleItemSelection(item._id)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleItemSelection(item._id)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
          </div>

          <div className="flex-grow">
            <div className="flex items-start gap-3">
              {/* Item Image */}
              <div className="flex-shrink-0">
                {item.itemType === 'product' ? (
                  <img
                    src={item.productDetails?.image?.[0] || '/placeholder-image.jpg'}
                    alt={item.productDetails?.name || 'Product'}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                ) : (
                  <img
                    src={item.bundleDetails?.image || '/placeholder-image.jpg'}
                    alt={item.bundleDetails?.title || 'Bundle'}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                )}
              </div>

              {/* Item Details */}
              <div className="flex-grow">
                <h4 className="font-medium text-gray-900">
                  {item.itemType === 'product'
                    ? item.productDetails?.name
                    : item.bundleDetails?.title}
                </h4>

                <div className="text-sm text-gray-600 mt-1">
                  {item.itemType === 'product' && item.size && (
                    <span className="inline-block mr-3">Size: {item.size}</span>
                  )}
                  <span>Qty: {item.quantity}</span>
                </div>

                {/* Price Display with Discount */}
                <div className="text-sm text-gray-700 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Unit Price:</span>
                    {discount > 0 && originalPrice > unitPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through text-gray-500">₹{originalPrice.toFixed(2)}</span>
                        <span className="text-green-600 font-semibold">₹{unitPrice.toFixed(2)}</span>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          {discount.toFixed(0)}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold">₹{unitPrice.toFixed(2)}</span>
                    )}
                  </div>
                  {unitPrice === 0 && (
                    <span className="text-red-500 text-xs mt-1">(Price unavailable)</span>
                  )}
                  {/* Debug info for development */}
                  {process.env.NODE_ENV === 'development' && unitPrice === 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Debug: productId={item.productId?._id}, 
                      productPrice={item.productId?.price}, 
                      detailsPrice={item.productDetails?.price},
                      finalPrice={item.productDetails?.finalPrice},
                      sizeAdjusted={item.sizeAdjustedPrice}
                    </div>
                  )}
                </div>
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  <span>Total: ₹{totalPrice.toFixed(2)}</span>
                  {discount > 0 && originalPrice > unitPrice && (
                    <span className="text-sm text-green-600 ml-2">
                      (Save ₹{((originalPrice - unitPrice) * item.quantity).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-scroll">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Cancel Specific Items
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="px-6 py-4 flex-grow overflow-y-auto">
            {/* Order Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                Order #{order.orderId}
              </h3>
              <p className="text-sm text-gray-600">
                Select the items you want to cancel from this order
              </p>
            </div>

            {/* Items Selection */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Select Items to Cancel:</h4>
              <div className="space-y-3">
                {order.items && order.items
                  .filter(item => {
                    // Only show items that can be cancelled
                    // You can add more conditions here based on item status
                    return item && item._id; // Basic validation
                  })
                  .map((item, index) => 
                    renderItemCard(item, index)
                  )}
              </div>
              {order.items && order.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No items available for cancellation
                </div>
              )}
            </div>

            {/* Selected Items Summary */}
            {selectedItems.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Cancellation Summary
                </h4>
                <p className="text-sm text-blue-700">
                  Items selected: {selectedItems.length}
                </p>
                <p className="text-sm text-blue-700">
                  Total item value: ₹{totalRefundAmount.toFixed(2)}
                </p>
                <p className="text-lg font-semibold text-blue-900 mt-1">
                  Expected refund ({refundPercentage}%): ₹{(totalRefundAmount * refundPercentage / 100).toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  * Refund amount is {refundPercentage}% of item value as per cancellation policy
                </p>
              </div>
            )}

            {/* Cancellation Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a reason</option>
                {cancellationReasons.map((reasonOption) => (
                  <option key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Reason */}
            {reason === 'Other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify the reason *
                </label>
                <textarea
                  value={additionalReason}
                  onChange={(e) => setAdditionalReason(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="Please provide more details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            )}

            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <FaExclamationTriangle className="text-yellow-400 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">Important:</p>
                  <ul className="text-yellow-700 mt-1 list-disc list-inside space-y-1">
                    <li>Cancellation requests are subject to approval</li>
                    <li>Refunds will be processed based on our cancellation policy</li>
                    <li>Processing time may vary depending on payment method</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaCheck className="w-4 h-4" />
                    Submit Cancellation Request
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartialCancellationModal;
