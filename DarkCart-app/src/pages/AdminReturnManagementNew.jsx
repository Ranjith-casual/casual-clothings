import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import Loading from '../components/Loading';
import { 
    FaSearch, 
    FaEye, 
    FaCheck, 
    FaTimes, 
    FaBox, 
    FaRupeeSign,
    FaArrowLeft,
    FaUser,
    FaCalendar,
    FaUndo,
    FaEdit,
    FaFilter,
    FaChevronDown,
    FaChevronUp,
    FaExclamationTriangle
} from 'react-icons/fa';

const AdminReturnManagement = () => {
    // State management
    const [returnRequests, setReturnRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'order-details'
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    
    // Modal states
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    
    // Approval form data
    const [approvalData, setApprovalData] = useState({
        returnRequest: null,
        adminComments: '',
        customRefundAmount: '',
        useCustomAmount: false
    });
    
    // Refund form data
    const [refundData, setRefundData] = useState({
        refundStatus: 'PENDING',
        refundId: '',
        refundMethod: 'ORIGINAL_PAYMENT_METHOD',
        refundAmount: '',
        adminNotes: ''
    });
    
    // Filters and pagination
    const [filters, setFilters] = useState({
        status: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    });
    
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    });
    
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Stats
    const [stats, setStats] = useState({
        totalReturns: 0,
        pendingReturns: 0,
        approvedReturns: 0,
        totalRefundAmount: 0
    });

    // Status options
    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'REQUESTED', label: 'Requested' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
        { value: 'PICKED_UP', label: 'Picked Up' },
        { value: 'INSPECTED', label: 'Inspected' },
        { value: 'REFUND_PROCESSED', label: 'Refund Processed' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' }
    ];

    const refundStatusOptions = [
        { value: 'PENDING', label: 'Pending' },
        { value: 'PROCESSING', label: 'Processing' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'FAILED', label: 'Failed' }
    ];

    // Fetch data on component mount and when filters change
    useEffect(() => {
        if (currentView === 'list') {
            fetchReturnRequests();
            fetchStats();
        }
    }, [filters, sortBy, sortOrder, pagination.page, currentView]);

    // Fetch all return requests
    const fetchReturnRequests = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.getAllReturnRequests,
                data: {
                    ...filters,
                    sortBy,
                    sortOrder,
                    page: pagination.page,
                    limit: pagination.limit
                }
            });

            if (response.data.success) {
                const returnData = response.data.data?.returns || response.data.data || [];
                setReturnRequests(Array.isArray(returnData) ? returnData : []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data?.pagination?.totalItems || response.data.total || 0
                }));
            } else {
                setReturnRequests([]);
                toast.error(response.data.message || 'Failed to fetch return requests');
            }
        } catch (error) {
            console.error('Error fetching return requests:', error);
            setReturnRequests([]);
            toast.error('Failed to fetch return requests');
        } finally {
            setLoading(false);
        }
    };

    // Fetch order details with return information
    const fetchOrderDetails = async (orderId) => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.getOrderWithReturnDetails,
                url: `${SummaryApi.getOrderWithReturnDetails.url}/${orderId}`
            });

            if (response.data.success) {
                setOrderDetails(response.data.data);
                setCurrentView('order-details');
                setSelectedOrderId(orderId);
            } else {
                toast.error(response.data.message || 'Failed to fetch order details');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    };

    // Fetch dashboard stats
    const fetchStats = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getReturnDashboardStats
            });

            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Process return request (approve/reject)
    const processReturnRequest = async (returnId, action, comments = '', customRefundAmount = null) => {
        try {
            setProcessing(prev => ({ ...prev, [returnId]: true }));

            const requestData = {
                action,
                adminComments: comments
            };

            if (action === 'approve' && customRefundAmount && parseFloat(customRefundAmount) > 0) {
                requestData.customRefundAmount = parseFloat(customRefundAmount);
            }

            const response = await Axios({
                ...SummaryApi.processReturnRequest,
                url: SummaryApi.processReturnRequest.url.replace(':returnId', returnId),
                data: requestData
            });

            if (response.data.success) {
                toast.success(`Return request ${action}d successfully`);
                
                // Refresh data
                if (currentView === 'list') {
                    fetchReturnRequests();
                } else if (currentView === 'order-details' && selectedOrderId) {
                    fetchOrderDetails(selectedOrderId);
                }
                fetchStats();
                
                // Close modals
                setShowApprovalModal(false);
                resetApprovalForm();
            } else {
                toast.error(response.data.message || `Failed to ${action} return request`);
            }
        } catch (error) {
            console.error(`Error ${action}ing return request:`, error);
            toast.error(`Failed to ${action} return request`);
        } finally {
            setProcessing(prev => ({ ...prev, [returnId]: false }));
        }
    };

    // Open approval modal
    const openApprovalModal = (returnRequest) => {
        const defaultRefundAmount = (returnRequest.itemDetails?.refundAmount || 0) * (returnRequest.itemDetails?.quantity || 1);
        
        setApprovalData({
            returnRequest,
            adminComments: '',
            customRefundAmount: defaultRefundAmount.toString(),
            useCustomAmount: false
        });
        
        setShowApprovalModal(true);
    };

    // Reset approval form
    const resetApprovalForm = () => {
        setApprovalData({
            returnRequest: null,
            adminComments: '',
            customRefundAmount: '',
            useCustomAmount: false
        });
    };

    // Handle approval submission
    const handleApprovalSubmit = () => {
        const { returnRequest, adminComments, customRefundAmount, useCustomAmount } = approvalData;
        
        if (!returnRequest) {
            toast.error('No return request selected');
            return;
        }

        const finalRefundAmount = useCustomAmount ? customRefundAmount : null;
        
        processReturnRequest(
            returnRequest._id, 
            'approve', 
            adminComments || 'Approved by admin',
            finalRefundAmount
        );
    };

    // Open refund modal
    const openRefundModal = (returnRequest) => {
        setSelectedReturn(returnRequest);
        setRefundData({
            refundStatus: returnRequest.refundDetails?.refundStatus || 'PENDING',
            refundId: returnRequest.refundDetails?.refundId || '',
            refundMethod: returnRequest.refundDetails?.refundMethod || 'ORIGINAL_PAYMENT_METHOD',
            refundAmount: returnRequest.refundDetails?.actualRefundAmount || 
                         (returnRequest.itemDetails?.refundAmount * returnRequest.itemDetails?.quantity),
            adminNotes: ''
        });
        setShowRefundModal(true);
    };

    // Update refund status
    const updateRefundStatus = async () => {
        try {
            if (!selectedReturn || !refundData.refundStatus) {
                toast.error('Please select a refund status');
                return;
            }

            setProcessing(prev => ({ ...prev, [selectedReturn._id]: true }));

            const response = await Axios({
                ...SummaryApi.updateRefundStatus,
                url: SummaryApi.updateRefundStatus.url.replace(':returnId', selectedReturn._id),
                data: refundData
            });

            if (response.data.success) {
                toast.success('Refund status updated successfully');
                
                // Refresh data
                if (currentView === 'list') {
                    fetchReturnRequests();
                } else if (currentView === 'order-details' && selectedOrderId) {
                    fetchOrderDetails(selectedOrderId);
                }
                
                setShowRefundModal(false);
                setSelectedReturn(null);
            } else {
                toast.error(response.data.message || 'Failed to update refund status');
            }
        } catch (error) {
            console.error('Error updating refund status:', error);
            toast.error('Failed to update refund status');
        } finally {
            setProcessing(prev => ({ ...prev, [selectedReturn._id]: false }));
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

    // Get refund status color
    const getRefundStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'PROCESSING':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'FAILED':
                return 'bg-red-100 text-red-800 border-red-200';
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

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            status: '',
            dateFrom: '',
            dateTo: '',
            search: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    if (loading) {
        return <Loading />;
    }

    // Render order details view
    if (currentView === 'order-details' && orderDetails) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => {
                                setCurrentView('list');
                                setSelectedOrderId(null);
                                setOrderDetails(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <FaArrowLeft className="w-4 h-4" />
                            Back to Returns
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Order Return Details</h1>
                            <p className="text-gray-600 mt-2">
                                Order #{orderDetails.order.orderId} • {orderDetails.order.customer.name}
                            </p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Order Date</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(orderDetails.order.orderDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Delivery Date</p>
                                <p className="font-medium text-gray-900">
                                    {orderDetails.order.actualDeliveryDate 
                                        ? new Date(orderDetails.order.actualDeliveryDate).toLocaleDateString()
                                        : 'Not delivered'
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Order Status</p>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(orderDetails.order.orderStatus)}`}>
                                    {orderDetails.order.orderStatus}
                                </span>
                            </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-700 font-medium">Total Items</p>
                                <p className="text-2xl font-bold text-blue-900">{orderDetails.summary.totalItems}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-sm text-green-700 font-medium">Order Value</p>
                                <p className="text-2xl font-bold text-green-900">₹{orderDetails.summary.totalOrderValue}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <p className="text-sm text-orange-700 font-medium">Return Requests</p>
                                <p className="text-2xl font-bold text-orange-900">{orderDetails.summary.totalReturnRequests}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <p className="text-sm text-purple-700 font-medium">Refunds Processed</p>
                                <p className="text-2xl font-bold text-purple-900">₹{orderDetails.summary.totalRefundProcessed}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Customer Name</p>
                                        <p className="font-medium text-gray-900">{orderDetails.order.customer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Email Address</p>
                                        <p className="font-medium text-gray-900">{orderDetails.order.customer.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                                        <p className="font-medium text-gray-900">
                                            {orderDetails.order.customer.phone || 
                                             orderDetails.order.deliveryAddress?.mobile || 
                                             orderDetails.order.deliveryAddress?.phone || 
                                             'Not provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                                    <div className="font-medium text-gray-900">
                                        {orderDetails.order.deliveryAddress ? (
                                            <div className="space-y-1">
                                                <p>{orderDetails.order.deliveryAddress.addressLine1}</p>
                                                {orderDetails.order.deliveryAddress.addressLine2 && (
                                                    <p>{orderDetails.order.deliveryAddress.addressLine2}</p>
                                                )}
                                                <p>
                                                    {orderDetails.order.deliveryAddress.city}, {orderDetails.order.deliveryAddress.state} {orderDetails.order.deliveryAddress.pincode}
                                                </p>
                                                {orderDetails.order.deliveryAddress.country && (
                                                    <p>{orderDetails.order.deliveryAddress.country}</p>
                                                )}
                                            </div>
                                        ) : (
                                            'Address not available'
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items with Return Information */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                            <FaBox className="w-5 h-5 mr-2 text-gray-600" />
                            Order Items & Returns
                        </h3>
                        
                        <div className="space-y-6">
                            {orderDetails.items.map((item) => (
                                <div key={item._id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                                    {/* Item Information */}
                                    <div className="flex items-start space-x-4 mb-4">
                                        <img
                                            src={item.image || '/placeholder.png'}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                                            <p className="text-sm text-gray-600 mb-3">Size: {item.size} | Type: {item.itemType}</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div className="bg-white p-3 rounded-lg border">
                                                    <span className="text-gray-600">Original Qty:</span>
                                                    <span className="ml-1 font-semibold text-gray-900">{item.originalQuantity}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border">
                                                    <span className="text-gray-600">Unit Price:</span>
                                                    <span className="ml-1 font-semibold text-gray-900">₹{item.unitPrice}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border">
                                                    <span className="text-gray-600">Returned:</span>
                                                    <span className="ml-1 font-semibold text-orange-600">{item.returnedQuantity}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border">
                                                    <span className="text-gray-600">Remaining:</span>
                                                    <span className="ml-1 font-semibold text-green-600">{item.remainingQuantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Return Requests for this item */}
                                    {item.returnRequests.length > 0 && (
                                        <div className="mt-6 pt-4 border-t border-gray-200">
                                            <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                                                <FaUndo className="w-4 h-4 mr-2 text-orange-500" />
                                                Return Requests ({item.returnRequests.length})
                                            </h5>
                                            <div className="space-y-4">
                                                {item.returnRequests.map((returnReq) => (
                                                    <div key={returnReq._id} className="bg-white p-4 rounded-lg border border-gray-200">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900 mb-1">
                                                                    Quantity: {returnReq.itemDetails.quantity} • 
                                                                    Reason: {returnReq.returnReason}
                                                                </p>
                                                                <p className="text-xs text-gray-600 mb-1">
                                                                    Requested on: {formatDate(returnReq.createdAt)}
                                                                </p>
                                                                {returnReq.returnDescription && (
                                                                    <p className="text-xs text-gray-600">
                                                                        Comment: {returnReq.returnDescription}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(returnReq.status)}`}>
                                                                    {returnReq.status.replace('_', ' ')}
                                                                </span>
                                                                <p className="text-sm font-semibold mt-2 text-gray-900">
                                                                    Refund: ₹{returnReq.itemDetails.refundAmount * returnReq.itemDetails.quantity}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Action buttons */}
                                                        <div className="flex gap-2 mt-4">
                                                            {returnReq.status === 'REQUESTED' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => openApprovalModal(returnReq)}
                                                                        disabled={processing[returnReq._id]}
                                                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <FaCheck className="w-3 h-3" />
                                                                        {processing[returnReq._id] ? 'Processing...' : 'Approve'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => processReturnRequest(returnReq._id, 'reject', 'Rejected by admin')}
                                                                        disabled={processing[returnReq._id]}
                                                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <FaTimes className="w-3 h-3" />
                                                                        {processing[returnReq._id] ? 'Processing...' : 'Reject'}
                                                                    </button>
                                                                </>
                                                            )}
                                                            {(returnReq.status === 'APPROVED' || returnReq.refundDetails) && (
                                                                <button
                                                                    onClick={() => openRefundModal(returnReq)}
                                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                                >
                                                                    <FaEdit className="w-3 h-3" />
                                                                    Manage Refund
                                                                </button>
                                                            )}
                                                            {returnReq.refundDetails && (
                                                                <div className="flex items-center text-sm">
                                                                    <span className="text-gray-600 mr-2">Refund Status:</span>
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRefundStatusColor(returnReq.refundDetails.refundStatus)}`}>
                                                                        {returnReq.refundDetails.refundStatus}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {item.returnRequests.length === 0 && (
                                        <div className="mt-4 text-center py-6 text-gray-500 text-sm border-t border-gray-200 bg-white rounded-lg">
                                            <FaExclamationTriangle className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                                            No return requests for this item
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render main list view
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header and Stats */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Return Management</h1>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FaBox className="text-blue-600 text-xl" />
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-600 text-sm font-medium">Total Returns</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalReturns}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <FaCalendar className="text-yellow-600 text-xl" />
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-600 text-sm font-medium">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pendingReturns}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <FaCheck className="text-green-600 text-xl" />
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-600 text-sm font-medium">Approved</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.approvedReturns}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <FaRupeeSign className="text-purple-600 text-xl" />
                            </div>
                            <div className="ml-4">
                                <p className="text-gray-600 text-sm font-medium">Total Refunds</p>
                                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRefundAmount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <FaFilter className="text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by customer..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="createdAt">Created Date</option>
                            <option value="status">Status</option>
                            <option value="totalRefundAmount">Refund Amount</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={resetFilters}
                            className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Return Requests Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Return ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Refund Amount
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Return Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Refund Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Created Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(returnRequests) && returnRequests.map((returnRequest) => (
                                <tr key={returnRequest._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-mono font-medium text-gray-900">
                                            #{returnRequest._id.slice(-8)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-gray-100 rounded-full mr-3">
                                                <FaUser className="text-gray-600 text-sm" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {returnRequest.userId.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {returnRequest.userId.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">
                                            {returnRequest.itemDetails?.quantity || 1} item(s)
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-900">
                                            ₹{returnRequest.itemDetails?.refundAmount * (returnRequest.itemDetails?.quantity || 1) || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(returnRequest.status)}`}>
                                            {returnRequest.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {returnRequest.refundDetails?.refundStatus ? (
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRefundStatusColor(returnRequest.refundDetails.refundStatus)}`}>
                                                {returnRequest.refundDetails.refundStatus.toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(returnRequest.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => fetchOrderDetails(returnRequest.orderId._id || returnRequest.orderId)}
                                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Order Details"
                                            >
                                                <FaEye className="w-4 h-4" />
                                            </button>
                                            
                                            {(returnRequest.status === 'REQUESTED' || returnRequest.status === 'pending') && (
                                                <>
                                                    <button
                                                        onClick={() => openApprovalModal(returnRequest)}
                                                        disabled={processing[returnRequest._id]}
                                                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Approve Return"
                                                    >
                                                        <FaCheck className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => processReturnRequest(returnRequest._id, 'reject')}
                                                        disabled={processing[returnRequest._id]}
                                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Reject Return"
                                                    >
                                                        <FaTimes className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {(returnRequest.status === 'APPROVED' || returnRequest.status === 'REFUND_PROCESSED' || returnRequest.refundDetails) && (
                                                <button
                                                    onClick={() => openRefundModal(returnRequest)}
                                                    disabled={processing[returnRequest._id]}
                                                    className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Manage Refund"
                                                >
                                                    <FaEdit className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page * pagination.limit >= pagination.total}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                                <span className="font-medium">
                                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                                </span> of{' '}
                                <span className="font-medium">{pagination.total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                    className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approval Modal */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center h-full w-full z-50">
                    <div className="relative bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg mx-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <FaCheck className="h-6 w-6 text-green-600" />
                            </div>
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Approve Return Request
                            </h3>
                            
                            {approvalData.returnRequest && (
                                <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Return ID:</span>
                                            <p className="font-medium">#{approvalData.returnRequest._id?.slice(-8)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Customer:</span>
                                            <p className="font-medium">{approvalData.returnRequest.userId?.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Item:</span>
                                            <p className="font-medium">{approvalData.returnRequest.itemDetails?.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Quantity:</span>
                                            <p className="font-medium">{approvalData.returnRequest.itemDetails?.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                                        Admin Comments
                                    </label>
                                    <textarea
                                        value={approvalData.adminComments}
                                        onChange={(e) => setApprovalData(prev => ({ ...prev, adminComments: e.target.value }))}
                                        placeholder="Add comments about the approval..."
                                        rows="3"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <div className="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            id="useCustomAmount"
                                            checked={approvalData.useCustomAmount}
                                            onChange={(e) => setApprovalData(prev => ({ ...prev, useCustomAmount: e.target.checked }))}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="useCustomAmount" className="ml-2 block text-sm font-medium text-gray-700">
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
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    )}
                                    {!approvalData.useCustomAmount && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Default refund amount: ₹{approvalData.customRefundAmount}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => {
                                        setShowApprovalModal(false);
                                        resetApprovalForm();
                                    }}
                                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprovalSubmit}
                                    className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    Approve Return
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Status Update Modal */}
            {showRefundModal && selectedReturn && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center h-full w-full z-50">
                    <div className="relative bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Update Refund Status
                            </h3>
                            <button
                                onClick={() => setShowRefundModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-3">Return Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Return ID:</span>
                                        <p className="font-medium">#{selectedReturn._id.slice(-8)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Customer:</span>
                                        <p className="font-medium">{selectedReturn.userId?.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Item:</span>
                                        <p className="font-medium">{selectedReturn.itemDetails?.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Expected Refund:</span>
                                        <p className="font-medium">
                                            ₹{selectedReturn.itemDetails?.refundAmount * (selectedReturn.itemDetails?.quantity || 1)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Refund Status *
                                    </label>
                                    <select
                                        value={refundData.refundStatus}
                                        onChange={(e) => setRefundData(prev => ({ ...prev, refundStatus: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Refund Method
                                    </label>
                                    <select
                                        value={refundData.refundMethod}
                                        onChange={(e) => setRefundData(prev => ({ ...prev, refundMethod: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="ORIGINAL_PAYMENT_METHOD">Original Payment Method</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="WALLET_CREDIT">Wallet Credit</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Refund ID/Transaction ID
                                    </label>
                                    <input
                                        type="text"
                                        value={refundData.refundId}
                                        onChange={(e) => setRefundData(prev => ({ ...prev, refundId: e.target.value }))}
                                        placeholder="Enter refund/transaction ID"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Actual Refund Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={refundData.refundAmount}
                                        onChange={(e) => setRefundData(prev => ({ ...prev, refundAmount: e.target.value }))}
                                        placeholder="Enter actual refund amount"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={refundData.adminNotes}
                                    onChange={(e) => setRefundData(prev => ({ ...prev, adminNotes: e.target.value }))}
                                    placeholder="Add notes about the refund update..."
                                    rows="4"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button
                                    onClick={() => setShowRefundModal(false)}
                                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={updateRefundStatus}
                                    disabled={!refundData.refundStatus || processing[selectedReturn._id]}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {processing[selectedReturn._id] ? 'Updating...' : 'Update Refund Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReturnManagement;
