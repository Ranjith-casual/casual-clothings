import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle, FaCheck, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';

const PartialCancellationModal = ({ isOpen, onClose, order, onCancellationSuccess }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [additionalReason, setAdditionalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalRefundAmount, setTotalRefundAmount] = useState(0);

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

  // Calculate size-based price for an item
  const calculateItemPrice = (item) => {
    let basePrice = 0;
    
    if (item.itemType === 'product') {
      basePrice = item.sizeAdjustedPrice || item.productDetails?.price || 0;
    } else if (item.itemType === 'bundle') {
      basePrice = item.bundleDetails?.bundlePrice || 0;
    }
    
    return basePrice * item.quantity;
  };

  // Calculate total refund amount when selected items change
  useEffect(() => {
    const total = selectedItems.reduce((sum, itemId) => {
      const item = order.items.find(item => item._id === itemId);
      return sum + (item ? calculateItemPrice(item) : 0);
    }, 0);
    setTotalRefundAmount(total);
  }, [selectedItems, order.items]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]);
      setReason('');
      setAdditionalReason('');
      setTotalRefundAmount(0);
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

    setIsSubmitting(true);

    try {
      const requestData = {
        orderId: order._id,
        itemsToCancel: selectedItems.map(itemId => ({ itemId })),
        reason,
        additionalReason: reason === 'Other' ? additionalReason : ''
      };

      const response = await Axios({
        ...SummaryApi.requestPartialItemCancellation,
        data: requestData
      });

      if (response.data.success) {
        toast.success('Partial cancellation request submitted successfully');
        onCancellationSuccess();
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to submit cancellation request');
      }
    } catch (error) {
      console.error('Error submitting partial cancellation:', error);
      toast.error(error.response?.data?.message || 'Failed to submit cancellation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItemCard = (item, index) => {
    const isSelected = selectedItems.includes(item._id);
    const itemPrice = calculateItemPrice(item);
    
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
                    : item.bundleDetails?.title
                  }
                </h4>
                
                <div className="text-sm text-gray-600 mt-1">
                  {item.itemType === 'product' && item.size && (
                    <span className="inline-block mr-3">Size: {item.size}</span>
                  )}
                  <span>Qty: {item.quantity}</span>
                </div>
                
                <div className="text-lg font-semibold text-gray-900 mt-2">
                  ₹{itemPrice.toFixed(2)}
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
                {order.items && order.items.map((item, index) => 
                  renderItemCard(item, index)
                )}
              </div>
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
                <p className="text-lg font-semibold text-blue-900 mt-1">
                  Expected refund: ₹{totalRefundAmount.toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  * Final refund amount may vary based on cancellation policy
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
