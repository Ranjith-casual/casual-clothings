import React, { useState } from 'react';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';

const CancelledItemsDisplay = ({ cancelledItems, refundDetails, onClose }) => {
  if (!cancelledItems || cancelledItems.length === 0) {
    return null;
  }

  // Format price in Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Cancelled Items</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Refund Status */}
          {refundDetails && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-500 mt-1 mr-2" />
                <div>
                  <h3 className="font-medium text-blue-800">Refund Details</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Status: <span className="font-medium">{refundDetails.refundStatus}</span>
                  </p>
                  {refundDetails.refundAmount && (
                    <p className="text-sm text-blue-700 mt-1">
                      Amount: <span className="font-medium">{formatCurrency(refundDetails.refundAmount)}</span>
                    </p>
                  )}
                  {refundDetails.transactionId && (
                    <p className="text-sm text-blue-700 mt-1">
                      Transaction ID: <span className="font-medium">{refundDetails.transactionId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cancelled Items List */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Items Cancelled:</h3>
            
            {cancelledItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  {/* Item Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.image || '/placeholder-image.jpg'}
                      alt={item.name || 'Product'}
                      className="w-16 h-16 object-cover rounded-md border"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-900">{item.name || 'Product'}</h4>
                    
                    <div className="text-sm text-gray-600 mt-1">
                      {item.size && <span className="inline-block mr-3">Size: {item.size}</span>}
                      <span>Qty: {item.quantity || 1}</span>
                    </div>
                    
                    {item.originalPrice && (
                      <div className="flex items-baseline mt-2">
                        <span className="text-sm text-gray-500 mr-2">Original Price:</span>
                        <span className="text-md font-medium text-gray-700">{formatCurrency(item.originalPrice)}</span>
                      </div>
                    )}
                    
                    {item.refundAmount && (
                      <div className="flex items-baseline mt-1">
                        <span className="text-sm text-gray-500 mr-2">Refund Amount:</span>
                        <span className="text-md font-semibold text-green-600">{formatCurrency(item.refundAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelledItemsDisplay;
