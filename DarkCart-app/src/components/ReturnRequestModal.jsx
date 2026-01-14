import React from 'react';
import { FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ReturnRequestModal = ({
    showModal,
    onClose,
    selectedItems,
    returnReasons,
    additionalComments,
    eligibleItems,
    returnReasonOptions,
    handleReasonChange,
    handleCommentsChange,
    submitReturnRequest,
    submitting
}) => {
    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center h-full w-full z-50 p-2 sm:p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header - Fixed */}
                <div className="flex justify-between items-start p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">Return Request Details</h3>
                        {(() => {
                            const selectedItemKeys = Object.keys(selectedItems).filter(key => selectedItems[key]);
                            const missingReasons = selectedItemKeys.filter(key => !returnReasons[key]);
                            
                            return missingReasons.length > 0 ? (
                                <p className="text-xs sm:text-sm text-orange-600 mt-1 leading-relaxed">
                                    Please provide return reasons for all selected items below
                                </p>
                            ) : (
                                <p className="text-xs sm:text-sm text-green-600 mt-1 leading-relaxed">
                                    Review your return request and submit
                                </p>
                            );
                        })()}
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
                        {/* Return Summary */}
                        {(() => {
                            const selectedItemKeys = Object.keys(selectedItems).filter(key => selectedItems[key]);
                            const missingReasons = selectedItemKeys.filter(key => !returnReasons[key]);
                            const hasAllReasons = missingReasons.length === 0;
                            
                            return (
                                <div className={`border rounded-lg p-3 sm:p-4 ${hasAllReasons ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                                    <h4 className={`font-medium text-sm sm:text-base mb-2 ${hasAllReasons ? 'text-green-900' : 'text-orange-900'}`}>
                                        Return Summary {!hasAllReasons && '(Incomplete)'}
                                    </h4>
                                    <div className={`text-xs sm:text-sm space-y-1 ${hasAllReasons ? 'text-green-800' : 'text-orange-800'}`}>
                                        <p>• {selectedItemKeys.length} item(s) selected for return</p>
                                        <p>• {hasAllReasons ? 'All return reasons provided' : `${missingReasons.length} item(s) need return reasons`}</p>
                                        <p>• Returns will be processed within 2-3 business days</p>
                                        <p>• Pickup will be scheduled after approval</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Selected Items */}
                        <div className="space-y-2 sm:space-y-3">
                            {Object.keys(selectedItems)
                                .filter(key => selectedItems[key])
                                .map(itemKey => {
                                    const item = eligibleItems.find(item => 
                                        `${item.orderId}_${item._id}` === itemKey
                                    );
                                    
                                    if (!item) {
                                        console.warn('Item not found for key:', itemKey);
                                        return null;
                                    }
                                    
                                    const hasReason = returnReasons[itemKey];
                                    
                                    return (
                                        <div key={itemKey} className={`border rounded-lg p-3 sm:p-4 ${hasReason ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
                                            {/* Item Header */}
                                            <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-3 mb-3 sm:mb-4">
                                                <img
                                                    src={item.image || '/placeholder.png'}
                                                    alt={item.name}
                                                    className="w-16 h-16 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0 mx-auto sm:mx-0"
                                                />
                                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                                    <h5 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{item.name}</h5>
                                                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                                        Size: {item.size} | Type: {item.itemType}
                                                    </p>
                                                    {hasReason ? (
                                                        <p className="text-xs sm:text-sm text-green-600 font-medium flex items-center justify-center sm:justify-start gap-1">
                                                            <FaCheck className="w-3 h-3" />
                                                            Reason: {returnReasons[itemKey]}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs sm:text-sm text-red-600 font-medium flex items-center justify-center sm:justify-start gap-1">
                                                            <FaExclamationTriangle className="w-3 h-3" />
                                                            Return reason required
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-center sm:text-right flex-shrink-0">
                                                    <p className="font-semibold text-green-600 text-sm sm:text-base">₹{item.refundAmount}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Return reason selection */}
                                            <div className="space-y-3">
                                                <div>
                                                    <label className={`block text-xs sm:text-sm font-medium mb-2 ${!hasReason ? 'text-red-700' : 'text-gray-700'}`}>
                                                        Return Reason *
                                                        {!hasReason && (
                                                            <span className="ml-1 text-red-600 font-semibold">(Required)</span>
                                                        )}
                                                    </label>
                                                    <select
                                                        value={returnReasons[itemKey] || ''}
                                                        onChange={(e) => handleReasonChange(itemKey, e.target.value)}
                                                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                            !hasReason ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                        required
                                                    >
                                                        <option value="">Select a reason</option>
                                                        {returnReasonOptions.map(reason => (
                                                            <option key={reason} value={reason}>
                                                                {reason}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {!hasReason && (
                                                        <p className="mt-1 text-xs text-red-600">
                                                            Please select a reason to continue with this return
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                                        Additional Comments (Optional)
                                                    </label>
                                                    <textarea
                                                        value={additionalComments[itemKey] || ''}
                                                        onChange={(e) => handleCommentsChange(itemKey, e.target.value)}
                                                        placeholder="Provide additional details about the return..."
                                                        rows="2"
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                                .filter(Boolean) // Remove null items
                            }
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
                        {(() => {
                            const selectedItemKeys = Object.keys(selectedItems).filter(key => selectedItems[key]);
                            const missingReasons = selectedItemKeys.filter(key => !returnReasons[key]);
                            const hasAllReasons = missingReasons.length === 0;
                            
                            return (
                                <button
                                    onClick={() => {
                                        if (!hasAllReasons) {
                                            const missingItemNames = missingReasons.map(key => {
                                                const item = eligibleItems.find(item => `${item.orderId}_${item._id}` === key);
                                                return item?.name || 'Unknown item';
                                            });
                                            
                                            toast.error(
                                                `Please select return reasons for:\n${missingItemNames.join('\n')}`,
                                                {
                                                    duration: 4000,
                                                    style: {
                                                        minWidth: '300px',
                                                        whiteSpace: 'pre-line'
                                                    }
                                                }
                                            );
                                            return;
                                        }
                                        submitReturnRequest();
                                    }}
                                    disabled={submitting}
                                    className={`w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base ${
                                        hasAllReasons && !submitting
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : !submitting
                                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span className="hidden sm:inline">Submitting...</span>
                                            <span className="sm:hidden">Submitting</span>
                                        </>
                                    ) : hasAllReasons ? (
                                        <>
                                            <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Submit Return Request</span>
                                            <span className="sm:hidden">Submit Return</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaExclamationTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Complete Reasons to Submit</span>
                                            <span className="sm:hidden">Complete Reasons</span>
                                        </>
                                    )}
                                </button>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnRequestModal;
