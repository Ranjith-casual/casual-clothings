import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import Loading from '../components/Loading';
import { 
    FaBox, 
    FaSearch, 
    FaFilter, 
    FaPlus, 
    FaEye, 
    FaTimes,
    FaCheck,
    FaUndo,
    FaExclamationTriangle,
    FaClock,
    FaShippingFast,
    FaMoneyBillWave,
    FaInfoCircle,
    FaArrowRight
} from 'react-icons/fa';

const ReturnProduct = () => {
    const user = useSelector(state => state?.user);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId');
    
    // State management
    const [eligibleItems, setEligibleItems] = useState([]);
    const [userReturns, setUserReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('eligible');
    const [selectedItems, setSelectedItems] = useState({});
    const [returnReasons, setReturnReasons] = useState({});
    const [additionalComments, setAdditionalComments] = useState({});
    const [orderInfo, setOrderInfo] = useState(null);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Filter states
    const [returnFilter, setReturnFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Fetch eligible items for return
    const fetchEligibleItems = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.getEligibleReturnItems,
                params: orderId ? { orderId } : {}
            });

            if (response.data.success) {
                setEligibleItems(response.data.data.eligibleItems || []);
                if (response.data.data.orderInfo) {
                    setOrderInfo(response.data.data.orderInfo);
                }
            } else {
                toast.error(response.data.message || 'Failed to fetch eligible items');
            }
        } catch (error) {
            console.error('Error fetching eligible items:', error);
            toast.error('Failed to fetch eligible items');
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's return requests
    const fetchUserReturns = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getUserReturnRequests
            });

            if (response.data.success) {
                setUserReturns(response.data.data?.returns || response.data.data || []);
            } else {
                console.error('Failed to fetch user returns:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching user returns:', error);
        }
    };

    // Handle item selection for return
    const handleItemSelection = (itemKey, checked) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemKey]: checked
        }));

        if (!checked) {
            setReturnReasons(prev => {
                const newReasons = { ...prev };
                delete newReasons[itemKey];
                return newReasons;
            });
            setAdditionalComments(prev => {
                const newComments = { ...prev };
                delete newComments[itemKey];
                return newComments;
            });
        }
    };

    // Handle return reason change
    const handleReasonChange = (itemKey, reason) => {
        setReturnReasons(prev => ({
            ...prev,
            [itemKey]: reason
        }));
    };

    // Handle additional comments change
    const handleCommentsChange = (itemKey, comments) => {
        setAdditionalComments(prev => ({
            ...prev,
            [itemKey]: comments
        }));
    };

    // Submit return request
    const submitReturnRequest = async () => {
        try {
            const selectedItemKeys = Object.keys(selectedItems).filter(key => selectedItems[key]);
            
            if (selectedItemKeys.length === 0) {
                toast.error('Please select at least one item to return');
                return;
            }

            // Validate that all selected items have reasons
            const missingReasons = selectedItemKeys.filter(key => !returnReasons[key]);
            if (missingReasons.length > 0) {
                toast.error('Please provide return reasons for all selected items');
                return;
            }

            setSubmitting(true);

            const returnRequests = selectedItemKeys.map(itemKey => {
                const item = eligibleItems.find(item => 
                    `${item.orderId}_${item.itemIndex}` === itemKey
                );
                
                return {
                    orderId: item.orderId,
                    itemId: item.itemIndex.toString(),
                    returnReason: reasonMapping[returnReasons[itemKey]] || 'OTHER',
                    returnDescription: additionalComments[itemKey] || '',
                    itemDetails: {
                        itemType: item.itemType,
                        productId: item.productId,
                        bundleId: item.bundleId,
                        name: item.name,
                        image: item.image,
                        size: item.size,
                        quantity: 1, // For now, returning 1 item at a time
                        originalPrice: item.unitPrice,
                        refundAmount: item.refundAmount
                    }
                };
            });

            // Submit each return request
            const promises = returnRequests.map(request => 
                Axios({
                    ...SummaryApi.createReturnRequest,
                    data: request
                })
            );

            const results = await Promise.all(promises);
            
            // Check if all requests were successful
            const allSuccessful = results.every(result => result.data.success);
            
            if (allSuccessful) {
                toast.success(`Successfully submitted ${returnRequests.length} return request(s)`);
                
                // Reset form
                setSelectedItems({});
                setReturnReasons({});
                setAdditionalComments({});
                setShowReturnModal(false);
                
                // Refresh data
                fetchEligibleItems();
                fetchUserReturns();
                setActiveTab('returns');
            } else {
                toast.error('Some return requests failed. Please try again.');
            }

        } catch (error) {
            console.error('Error submitting return request:', error);
            toast.error('Failed to submit return request');
        } finally {
            setSubmitting(false);
        }
    };

    // Re-request return for rejected items
    const handleReRequestReturn = async (returnId) => {
        try {
            const response = await Axios({
                ...SummaryApi.reRequestReturn,
                data: { returnId }
            });

            if (response.data.success) {
                toast.success('Return request resubmitted successfully');
                fetchUserReturns();
            } else {
                toast.error(response.data.message || 'Failed to resubmit return request');
            }
        } catch (error) {
            console.error('Error resubmitting return request:', error);
            toast.error('Failed to resubmit return request');
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'REQUESTED':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'APPROVED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'PICKUP_SCHEDULED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'PICKED_UP':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'INSPECTED':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'REFUND_PROCESSED':
                return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'COMPLETED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter returns based on status and search
    const filteredReturns = userReturns.filter(returnItem => {
        const matchesFilter = returnFilter === 'all' || returnItem.status.toLowerCase() === returnFilter.toLowerCase();
        const matchesSearch = !searchQuery || 
                             returnItem.itemDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             returnItem.returnReason?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Return Management</h1>
                    <p className="text-gray-600">Request returns for eligible items and track your return requests</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('eligible')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'eligible'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FaBox className="w-4 h-4" />
                                    Eligible Items ({eligibleItems.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('returns')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'returns'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FaUndo className="w-4 h-4" />
                                    My Returns ({userReturns.length})
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'eligible' && (
                            <div>
                                {/* Order Info */}
                                {orderInfo && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaInfoCircle className="text-blue-600" />
                                            <h3 className="font-semibold text-blue-900">Order Information</h3>
                                        </div>
                                        <p className="text-sm text-blue-800">
                                            Order #{orderInfo.orderId} • Delivered on {formatDate(orderInfo.deliveryDate)}
                                        </p>
                                    </div>
                                )}

                                {/* Return Policy Notice */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <FaExclamationTriangle className="text-yellow-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-yellow-900 mb-1">Return Policy</h3>
                                            <ul className="text-sm text-yellow-800 space-y-1">
                                                <li>• Items can be returned within 24 hours of delivery</li>
                                                <li>• 65% refund on original price</li>
                                                <li>• Items must be in original condition</li>
                                                <li>• Return pickup will be scheduled after approval</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Eligible Items */}
                                {eligibleItems.length > 0 ? (
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Eligible Items for Return
                                            </h3>
                                            {Object.keys(selectedItems).some(key => selectedItems[key]) && (
                                                <button
                                                    onClick={() => setShowReturnModal(true)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                                >
                                                    <FaArrowRight className="w-4 h-4" />
                                                    Continue Return Request
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {eligibleItems.map((item, index) => {
                                                const itemKey = `${item.orderId}_${item.itemIndex}`;
                                                const isSelected = selectedItems[itemKey];
                                                
                                                return (
                                                    <div
                                                        key={itemKey}
                                                        className={`border rounded-lg p-4 transition-all ${
                                                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-start space-x-4">
                                                            <div className="flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={(e) => handleItemSelection(itemKey, e.target.checked)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-2"
                                                                />
                                                            </div>
                                                            <img
                                                                src={item.image || '/placeholder.png'}
                                                                alt={item.name}
                                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                            />
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                                                                <p className="text-sm text-gray-600 mb-2">
                                                                    Size: {item.size} | Type: {item.itemType}
                                                                </p>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-gray-600">Original Price:</span>
                                                                        <p className="font-semibold">₹{item.unitPrice}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Refund Amount:</span>
                                                                        <p className="font-semibold text-green-600">₹{item.refundAmount}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Time Left:</span>
                                                                        <p className="font-semibold text-orange-600">
                                                                            {item.timeLeftForReturn || 'Calculating...'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isSelected && (
                                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                            Return Reason *
                                                                        </label>
                                                                        <select
                                                                            value={returnReasons[itemKey] || ''}
                                                                            onChange={(e) => handleReasonChange(itemKey, e.target.value)}
                                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                            required
                                                                        >
                                                                            <option value="">Select a reason</option>
                                                                            {returnReasonOptions.map(reason => (
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
                                                                            value={additionalComments[itemKey] || ''}
                                                                            onChange={(e) => handleCommentsChange(itemKey, e.target.value)}
                                                                            placeholder="Provide additional details..."
                                                                            rows="3"
                                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FaBox className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Eligible Items</h3>
                                        <p className="text-gray-600 mb-4">
                                            You don't have any items eligible for return at the moment.
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Items are eligible for return within 24 hours of delivery.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'returns' && (
                            <div>
                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search returns..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:w-48">
                                        <select
                                            value={returnFilter}
                                            onChange={(e) => setReturnFilter(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="requested">Requested</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Return Requests */}
                                {filteredReturns.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredReturns.map((returnItem) => (
                                            <div key={returnItem._id} className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-start space-x-4">
                                                    <img
                                                        src={returnItem.itemDetails?.image || '/placeholder.png'}
                                                        alt={returnItem.itemDetails?.name}
                                                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 mb-1">
                                                                    {returnItem.itemDetails?.name}
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    Return ID: #{returnItem._id.slice(-8)}
                                                                </p>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(returnItem.status)}`}>
                                                                {returnItem.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                                                            <div>
                                                                <span className="text-gray-600">Reason:</span>
                                                                <p className="font-medium">{returnItem.returnReason}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Refund Amount:</span>
                                                                <p className="font-medium text-green-600">
                                                                    ₹{returnItem.itemDetails?.refundAmount * (returnItem.itemDetails?.quantity || 1)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Requested:</span>
                                                                <p className="font-medium">{formatDate(returnItem.createdAt)}</p>
                                                            </div>
                                                        </div>

                                                        {returnItem.returnDescription && (
                                                            <div className="mb-4">
                                                                <span className="text-gray-600 text-sm">Comments:</span>
                                                                <p className="text-sm text-gray-800 mt-1">{returnItem.returnDescription}</p>
                                                            </div>
                                                        )}

                                                        {/* Admin Response */}
                                                        {returnItem.adminResponse && (
                                                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                                                <h5 className="font-medium text-gray-900 mb-2">Admin Response</h5>
                                                                <p className="text-sm text-gray-700">{returnItem.adminResponse.adminComments}</p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Processed on: {formatDate(returnItem.adminResponse.processedDate)}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Refund Details */}
                                                        {returnItem.refundDetails && (
                                                            <div className="bg-green-50 rounded-lg p-4 mb-4">
                                                                <h5 className="font-medium text-green-900 mb-2">Refund Information</h5>
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-green-700">Status:</span>
                                                                        <p className="font-medium">{returnItem.refundDetails.refundStatus}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-green-700">Amount:</span>
                                                                        <p className="font-medium">₹{returnItem.refundDetails.actualRefundAmount}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2">
                                                            {returnItem.status === 'REJECTED' && (
                                                                <button
                                                                    onClick={() => handleReRequestReturn(returnItem._id)}
                                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                                >
                                                                    <FaUndo className="w-3 h-3" />
                                                                    Request Again
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FaUndo className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Return Requests</h3>
                                        <p className="text-gray-600">
                                            {searchQuery || returnFilter !== 'all' 
                                                ? 'No returns match your filters.' 
                                                : 'You haven\'t made any return requests yet.'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Return Request Confirmation Modal */}
                {showReturnModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center h-full w-full z-50">
                        <div className="relative bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Confirm Return Request</h3>
                                <button
                                    onClick={() => setShowReturnModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2">Return Summary</h4>
                                    <div className="text-sm text-blue-800">
                                        <p>• {Object.keys(selectedItems).filter(key => selectedItems[key]).length} item(s) selected for return</p>
                                        <p>• Returns will be processed within 2-3 business days</p>
                                        <p>• Pickup will be scheduled after approval</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {Object.keys(selectedItems)
                                        .filter(key => selectedItems[key])
                                        .map(itemKey => {
                                            const item = eligibleItems.find(item => 
                                                `${item.orderId}_${item.itemIndex}` === itemKey
                                            );
                                            return (
                                                <div key={itemKey} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <img
                                                            src={item.image || '/placeholder.png'}
                                                            alt={item.name}
                                                            className="w-12 h-12 object-cover rounded-lg"
                                                        />
                                                        <div className="flex-1">
                                                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                                                            <p className="text-sm text-gray-600">
                                                                Reason: {returnReasons[itemKey]}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-green-600">₹{item.refundAmount}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>

                                <div className="flex justify-end space-x-4 pt-4">
                                    <button
                                        onClick={() => setShowReturnModal(false)}
                                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitReturnRequest}
                                        disabled={submitting}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheck className="w-4 h-4" />
                                                Submit Return Request
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReturnProduct;
