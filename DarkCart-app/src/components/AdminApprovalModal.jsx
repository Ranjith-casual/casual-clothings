import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

const AdminApprovalModal = ({
    showModal,
    onClose,
    approvalData,
    setApprovalData,
    handleApprovalSubmit,
    resetApprovalForm
}) => {
    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center h-full w-full z-50 p-2 sm:p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header - Fixed */}
                <div className="text-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 mb-3 sm:mb-4">
                        <FaCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                        Approve Return Request
                    </h3>
                    
                    <button
                        onClick={() => {
                            onClose();
                            resetApprovalForm();
                        }}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-0">
                    {approvalData.returnRequest && (
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                    <span className="text-gray-600">Return ID:</span>
                                    <p className="font-medium break-words">#{approvalData.returnRequest._id?.slice(-8)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Customer:</span>
                                    <p className="font-medium break-words">{approvalData.returnRequest.userId?.name}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-gray-600">Item:</span>
                                    <p className="font-medium break-words">{approvalData.returnRequest.itemDetails?.name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Quantity:</span>
                                    <p className="font-medium">{approvalData.returnRequest.itemDetails?.quantity}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-4 sm:space-y-4">
                        {/* Admin Comments */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                Admin Comments
                            </label>
                            <textarea
                                value={approvalData.adminComments}
                                onChange={(e) => setApprovalData(prev => ({ ...prev, adminComments: e.target.value }))}
                                placeholder="Add comments about the approval..."
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                            />
                        </div>
                        
                        {/* Custom Refund Amount */}
                        <div>
                            <div className="flex items-start sm:items-center mb-2 space-x-2">
                                <input
                                    type="checkbox"
                                    id="useCustomAmount"
                                    checked={approvalData.useCustomAmount}
                                    onChange={(e) => setApprovalData(prev => ({ ...prev, useCustomAmount: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 sm:mt-0 flex-shrink-0"
                                />
                                <label htmlFor="useCustomAmount" className="block text-xs sm:text-sm font-medium text-gray-700">
                                    Use Custom Refund Amount
                                </label>
                            </div>
                            {approvalData.useCustomAmount && (
                                <input
                                    type="number"
                                    step="0.01"
                                    value={approvalData.customRefundAmount}
                                    onChange={(e) => setApprovalData(prev => ({ ...prev, customRefundAmount: e.target.value }))}
                                    placeholder="Enter custom refund amount"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                />
                            )}
                            {!approvalData.useCustomAmount && (
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Default refund amount: ₹{approvalData.customRefundAmount}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="border-t border-gray-200 p-4 sm:p-6 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                            onClick={() => {
                                onClose();
                                resetApprovalForm();
                            }}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApprovalSubmit}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                        >
                            Approve Return
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminApprovalModal;
