import React from 'react';
import { FaTimes } from 'react-icons/fa';

const AdminRefundModal = ({
    showModal,
    onClose,
    selectedReturn,
    refundData,
    setRefundData,
    refundStatusOptions,
    updateRefundStatus,
    processing
}) => {
    if (!showModal || !selectedReturn) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center h-full w-full z-50 p-2 sm:p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header - Fixed */}
                <div className="flex justify-between items-start p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                            Update Refund Status
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Close modal"
                    >
                        <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
                
                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-0">
                    <div className="space-y-4 sm:space-y-6">
                        {/* Return Details */}
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Return Details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                    <span className="text-gray-600">Return ID:</span>
                                    <p className="font-medium break-words">#{selectedReturn._id.slice(-8)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Customer:</span>
                                    <p className="font-medium break-words">{selectedReturn.userId?.name}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-gray-600">Item:</span>
                                    <p className="font-medium break-words">{selectedReturn.itemDetails?.name}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-gray-600">Expected Refund:</span>
                                    <p className="font-medium">
                                        ₹{selectedReturn.itemDetails?.refundAmount * (selectedReturn.itemDetails?.quantity || 1)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Refund Form */}
                        <div className="space-y-4">
                            {/* Refund Status and Method */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Refund Status *
                                    </label>
                                    <select
                                        value={refundData.refundStatus}
                                        onChange={(e) => setRefundData(prev => ({ ...prev, refundStatus: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                        required
                                    >
                                        {refundStatusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Refund Method
                                    </label>
                                    <select
                                        value={refundData.refundMethod}
                                        onChange={(e) => setRefundData(prev => ({ ...prev, refundMethod: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                    >
                                        <option value="ORIGINAL_PAYMENT_METHOD">Original Payment Method</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="WALLET_CREDIT">Wallet Credit</option>
                                    </select>
                                </div>
                            </div>

                            {/* Refund ID and Amount */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Refund ID/Transaction ID
                                    </label>
                                    <input
                                        type="text"
                                        value={refundData.refundId}
                                        onChange={(e) => setRefundData(prev => ({ ...prev, refundId: e.target.value }))}
                                        placeholder="Enter refund/transaction ID"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Actual Refund Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={refundData.refundAmount}
                                        onChange={(e) => setRefundData(prev => ({ ...prev, refundAmount: e.target.value }))}
                                        placeholder="Enter actual refund amount"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={refundData.adminNotes}
                                    onChange={(e) => setRefundData(prev => ({ ...prev, adminNotes: e.target.value }))}
                                    placeholder="Add notes about the refund update..."
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="border-t border-gray-200 p-4 sm:p-6 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={updateRefundStatus}
                            disabled={!refundData.refundStatus || processing[selectedReturn._id]}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
                        >
                            {processing[selectedReturn._id] ? 'Updating...' : 'Update Refund Status'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRefundModal;
