import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import Loading from '../components/Loading';

const ReturnProduct = () => {
    const user = useSelector(state => state?.user);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId'); // Get orderId from URL parameters
    
    const [eligibleItems, setEligibleItems] = useState([]);
    const [userReturns, setUserReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('eligible');
    const [selectedItems, setSelectedItems] = useState({});
    const [returnReasons, setReturnReasons] = useState({});
    const [additionalComments, setAdditionalComments] = useState({});
    const [orderInfo, setOrderInfo] = useState(null); // Store order information

    const returnReasonOptions = [
        'Wrong size received',
        'Product damaged/defective',
        'Product quality not as expected',
        'Wrong product received',
        'Product not as described',
        'Damaged during shipping',
        'Changed mind',
        'Other'
    ];

    // Mapping frontend reasons to backend enum values
    const reasonMapping = {
        'Wrong size received': 'WRONG_SIZE',
        'Product damaged/defective': 'DEFECTIVE_PRODUCT',
        'Product quality not as expected': 'QUALITY_ISSUE',
        'Wrong product received': 'WRONG_ITEM',
        'Product not as described': 'NOT_AS_DESCRIBED',
        'Damaged during shipping': 'DAMAGED_IN_SHIPPING',
        'Changed mind': 'OTHER',
        'Other': 'OTHER'
    };

    useEffect(() => {
        fetchEligibleItems();
        fetchUserReturns();
    }, []);

    const fetchEligibleItems = async () => {
        try {
            // Build the request configuration
            const requestConfig = {
                ...SummaryApi.getEligibleReturnItems
            };

            // Add orderId as query parameter if provided
            if (orderId) {
                requestConfig.url += `?orderId=${orderId}`;
            }

            const response = await Axios(requestConfig);

            if (response.data.success) {
                setEligibleItems(response.data.data);
                
                // If we have items and orderId, extract order information
                if (response.data.data.length > 0 && orderId) {
                    const firstItem = response.data.data[0];
                    setOrderInfo({
                        orderId: firstItem.orderId,
                        orderNumber: firstItem.orderNumber,
                        deliveredAt: firstItem.deliveredAt
                    });
                }
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching eligible items:', error);
            toast.error('Failed to fetch eligible items');
        }
    };

    const fetchUserReturns = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getUserReturnRequests
            });

            if (response.data.success) {
                // The API returns data.returns, not data directly
                const returnData = response.data.data?.returns || response.data.data;
                setUserReturns(Array.isArray(returnData) ? returnData : []);
            } else {
                setUserReturns([]); // Set empty array on error
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching user returns:', error);
            setUserReturns([]); // Set empty array on error
            toast.error('Failed to fetch return requests');
        } finally {
            setLoading(false);
        }
    };

    const handleItemSelection = (orderItemId, isSelected) => {
        setSelectedItems(prev => ({
            ...prev,
            [orderItemId]: isSelected
        }));
    };

    const handleReasonChange = (orderItemId, reason) => {
        setReturnReasons(prev => ({
            ...prev,
            [orderItemId]: reason
        }));
    };

    const handleCommentChange = (orderItemId, comment) => {
        setAdditionalComments(prev => ({
            ...prev,
            [orderItemId]: comment
        }));
    };

    const calculateRefundAmount = (originalPrice, quantity) => {
        const totalAmount = originalPrice * quantity;
        return Math.floor(totalAmount * 0.65); // 65% refund
    };

    const createReturnRequest = async () => {
        const selectedItemsList = Object.keys(selectedItems)
            .filter(key => selectedItems[key])
            .map(orderItemId => {
                const item = eligibleItems.find(item => item._id === orderItemId);
                const frontendReason = returnReasons[orderItemId] || 'Other';
                const backendReason = reasonMapping[frontendReason] || 'OTHER';
                
                return {
                    orderItemId,
                    reason: backendReason, // Use mapped backend enum value
                    additionalComments: additionalComments[orderItemId] || '',
                    requestedQuantity: item.quantity // For now, returning full quantity
                };
            });

        if (selectedItemsList.length === 0) {
            toast.error('Please select at least one item to return');
            return;
        }

        // Check if all selected items have reasons
        const missingReasons = selectedItemsList.filter(item => !item.reason || item.reason === '');
        if (missingReasons.length > 0) {
            toast.error('Please provide a reason for all selected items');
            return;
        }

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.createReturnRequest,
                data: {
                    items: selectedItemsList
                }
            });

            if (response.data.success) {
                toast.success('Return request created successfully');
                setSelectedItems({});
                setReturnReasons({});
                setAdditionalComments({});
                fetchEligibleItems();
                fetchUserReturns();
                setActiveTab('returns');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error creating return request:', error);
            toast.error('Failed to create return request');
        } finally {
            setLoading(false);
        }
    };

    const cancelReturnRequest = async (returnId) => {
        try {
            const response = await Axios({
                ...SummaryApi.cancelReturnRequest,
                data: { returnId }
            });

            if (response.data.success) {
                toast.success('Return request cancelled successfully');
                fetchUserReturns();
                fetchEligibleItems();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error cancelling return request:', error);
            toast.error('Failed to cancel return request');
        }
    };

    const handleReRequestReturn = async (rejectedReturn) => {
        try {
            // Find the original order item to recreate the return request
            const originalItem = {
                orderItemId: rejectedReturn.itemId,
                reason: rejectedReturn.returnReason || 'OTHER',
                additionalComments: rejectedReturn.returnDescription || '',
                requestedQuantity: rejectedReturn.itemDetails?.quantity || 1
            };

            // Create a new return request with the same details
            const response = await Axios({
                ...SummaryApi.createReturnRequest,
                data: {
                    items: [originalItem]
                }
            });

            if (response.data.success) {
                toast.success('New return request created successfully');
                fetchUserReturns();
                fetchEligibleItems();
                setActiveTab('returns');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error creating new return request:', error);
            toast.error('Failed to create new return request');
        }
    };

    const getStatusColor = (status) => {
        const normalizedStatus = status?.toUpperCase();
        switch (normalizedStatus) {
            case 'PENDING':
            case 'REQUESTED': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-blue-100 text-blue-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'PICKUP_SCHEDULED':
            case 'PICKED_UP': return 'bg-purple-100 text-purple-800';
            case 'INSPECTED':
            case 'RECEIVED': return 'bg-indigo-100 text-indigo-800';
            case 'REFUND_PROCESSED': return 'bg-green-100 text-green-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header with back button for order-specific returns */}
                <div className="flex items-center gap-4 mb-8">
                    {orderId && (
                        <button
                            onClick={() => navigate('/my-orders')}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Orders
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {orderId ? 'Return Products' : 'Return Products'}
                        </h1>
                        {orderInfo && (
                            <p className="text-gray-600 mt-2">
                                Order #{orderInfo.orderNumber} • Delivered on {formatDate(orderInfo.deliveredAt)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('eligible')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'eligible'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Eligible Items ({eligibleItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('returns')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'returns'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        My Returns ({Array.isArray(userReturns) ? userReturns.length : 0})
                    </button>
                </div>

                {/* Eligible Items Tab */}
                {activeTab === 'eligible' && (
                    <div>
                        {eligibleItems.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-500 text-lg">
                                    {orderId 
                                        ? 'No items eligible for return in this order' 
                                        : 'No items eligible for return'
                                    }
                                </div>
                                <p className="text-gray-400 mt-2">
                                    Items are eligible for return within 1 day of delivery
                                </p>
                                {orderId && (
                                    <button
                                        onClick={() => navigate('/my-orders')}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Back to Orders
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <h3 className="font-medium text-blue-900 mb-2">Return Policy</h3>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Items can be returned within 1 day of delivery</li>
                                        <li>• You will receive 65% refund of the original amount</li>
                                        <li>• Items must be in original condition</li>
                                        <li>• Return requests require admin approval</li>
                                    </ul>
                                </div>

                                {/* Action buttons when viewing order-specific items */}
                                {orderId && (
                                    <div className="flex gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                                        <button
                                            onClick={() => navigate('/return-product')}
                                            className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                                        >
                                            View All Eligible Items
                                        </button>
                                        <button
                                            onClick={() => navigate('/my-orders')}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                                        >
                                            Back to Orders
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {eligibleItems.map((item) => (
                                        <div key={item._id} className="border border-gray-200 rounded-lg p-6">
                                            <div className="flex items-start space-x-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems[item._id] || false}
                                                    onChange={(e) => handleItemSelection(item._id, e.target.checked)}
                                                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <img
                                                    src={item.image || '/placeholder-image.jpg'}
                                                    alt={item.name}
                                                    className="w-20 h-20 object-cover rounded-lg"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Size: {item.size} | Quantity: {item.quantity}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Original Price: ₹{item.unitPrice} | 
                                                        Refund Amount: ₹{calculateRefundAmount(item.unitPrice, item.quantity)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Delivered on: {formatDate(item.deliveredAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {selectedItems[item._id] && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Return Reason *
                                                            </label>
                                                            <select
                                                                value={returnReasons[item._id] || ''}
                                                                onChange={(e) => handleReasonChange(item._id, e.target.value)}
                                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                <option value="">Select a reason</option>
                                                                {returnReasonOptions.map((reason) => (
                                                                    <option key={reason} value={reason}>
                                                                        {reason}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Additional Comments
                                                            </label>
                                                            <textarea
                                                                value={additionalComments[item._id] || ''}
                                                                onChange={(e) => handleCommentChange(item._id, e.target.value)}
                                                                placeholder="Optional additional details..."
                                                                rows="3"
                                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {Object.values(selectedItems).some(Boolean) && (
                                    <div className="mt-6">
                                        <button
                                            onClick={createReturnRequest}
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                                        >
                                            {loading ? 'Creating Request...' : 'Create Return Request'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* My Returns Tab */}
                {activeTab === 'returns' && (
                    <div>
                        {!Array.isArray(userReturns) || userReturns.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-500 text-lg">No return requests found</div>
                                <p className="text-gray-400 mt-2">
                                    Your return requests will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {userReturns.map((returnRequest) => (
                                    <div key={returnRequest._id} className="border border-gray-200 rounded-lg p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    Return Request #{returnRequest._id.slice(-8)}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Created: {formatDate(returnRequest.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(returnRequest.status)}`}>
                                                    {returnRequest.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                {(returnRequest.status === 'REQUESTED' || returnRequest.status === 'pending') && (
                                                    <button
                                                        onClick={() => cancelReturnRequest(returnRequest._id)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {returnRequest.status === 'REJECTED' && (
                                                    <button
                                                        onClick={() => handleReRequestReturn(returnRequest)}
                                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        Request Again
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {/* For current model structure, we have itemDetails instead of items array */}
                                            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                                <img
                                                    src={returnRequest.itemDetails?.image || '/placeholder-image.jpg'}
                                                    alt={returnRequest.itemDetails?.name || 'Product'}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">
                                                        {returnRequest.itemDetails?.name || 'Product Name'}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        Size: {returnRequest.itemDetails?.size || 'N/A'} | Quantity: {returnRequest.itemDetails?.quantity || 1}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Reason: {returnRequest.returnReason}
                                                    </p>
                                                    {returnRequest.returnDescription && (
                                                        <p className="text-sm text-gray-500">
                                                            Comments: {returnRequest.returnDescription}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {returnRequest.refundDetails && (
                                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <h4 className="font-medium text-green-900 mb-2">Refund Details</h4>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-green-800">
                                                        Status: <span className="font-medium">{returnRequest.refundDetails.refundStatus || 'Pending'}</span>
                                                    </p>
                                                    <p className="text-sm text-green-800">
                                                        Amount: <span className="font-medium">₹{returnRequest.refundDetails.actualRefundAmount || returnRequest.refundDetails.amount || (returnRequest.itemDetails?.refundAmount * returnRequest.itemDetails?.quantity)}</span>
                                                    </p>
                                                    {returnRequest.refundDetails.refundMethod && (
                                                        <p className="text-sm text-green-800">
                                                            Method: <span className="font-medium">{returnRequest.refundDetails.refundMethod.replace('_', ' ')}</span>
                                                        </p>
                                                    )}
                                                    {returnRequest.refundDetails.refundId && (
                                                        <p className="text-sm text-green-800">
                                                            Transaction ID: <span className="font-medium">{returnRequest.refundDetails.refundId}</span>
                                                        </p>
                                                    )}
                                                    {returnRequest.refundDetails.refundDate && (
                                                        <p className="text-sm text-green-800">
                                                            Processed: <span className="font-medium">{formatDate(returnRequest.refundDetails.refundDate)}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {returnRequest.adminResponse && (
                                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <h4 className="font-medium text-blue-900 mb-2">Admin Response</h4>
                                                <div className="space-y-2">
                                                    {returnRequest.adminResponse.adminComments && (
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-900">Comments:</p>
                                                            <p className="text-sm text-blue-800">{returnRequest.adminResponse.adminComments}</p>
                                                        </div>
                                                    )}
                                                    {returnRequest.adminResponse.inspectionNotes && (
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-900">Inspection Notes:</p>
                                                            <p className="text-sm text-blue-800">{returnRequest.adminResponse.inspectionNotes}</p>
                                                        </div>
                                                    )}
                                                    {returnRequest.adminResponse.processedDate && (
                                                        <p className="text-xs text-blue-600 mt-2">
                                                            Processed on: {formatDate(returnRequest.adminResponse.processedDate)}
                                                        </p>
                                                    )}
                                                    {returnRequest.adminResponse.processedBy && (
                                                        <p className="text-xs text-blue-600">
                                                            Processed by: {returnRequest.adminResponse.processedBy.name || 'Admin'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {returnRequest.timeline && returnRequest.timeline.length > 0 && (
                                            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-3">Return Timeline</h4>
                                                <div className="space-y-3">
                                                    {returnRequest.timeline.map((timelineItem, index) => (
                                                        <div key={index} className="flex items-start space-x-3">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {timelineItem.status.replace('_', ' ').toUpperCase()}
                                                                </p>
                                                                {timelineItem.note && (
                                                                    <p className="text-sm text-gray-600">{timelineItem.note}</p>
                                                                )}
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {formatDate(timelineItem.timestamp)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReturnProduct;
