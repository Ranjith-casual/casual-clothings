import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaEye, FaCheck, FaTimes, FaSearch, FaFilter, FaDownload, FaBox, FaUser, FaCalendar, FaRupeeSign, FaEdit, FaArrowLeft, FaUndo } from 'react-icons/fa';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import Loading from '../components/Loading';

const AdminReturnManagement = () => {
    const [returnRequests, setReturnRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'order-details'
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    });
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalData, setApprovalData] = useState({
        returnRequest: null,
        adminComments: '',
        customRefundAmount: '',
        useCustomAmount: false
    });
    const [adminResponse, setAdminResponse] = useState('');
    const [refundUpdateData, setRefundUpdateData] = useState({
        refundStatus: '',
        refundId: '',
        refundMethod: 'ORIGINAL_PAYMENT_METHOD',
        refundAmount: '',
        adminNotes: ''
    });
    const [stats, setStats] = useState({
        totalReturns: 0,
        pendingReturns: 0,
        approvedReturns: 0,
        totalRefundAmount: 0
    });

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

    useEffect(() => {
        if (currentView === 'list') {
            fetchReturnRequests();
            fetchStats();
        }
    }, [filters, sortBy, sortOrder, pagination.page, currentView]);

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
                // Extract returns array from the nested data structure
                const returnData = response.data.data?.returns || response.data.data;
                setReturnRequests(Array.isArray(returnData) ? returnData : []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data?.pagination?.totalItems || response.data.total || 0
                }));
            } else {
                setReturnRequests([]); // Set empty array on error
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching return requests:', error);
            setReturnRequests([]); // Set empty array on error
            toast.error('Failed to fetch return requests');
        } finally {
            setLoading(false);
        }
    };

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
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    };

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

    const processReturnRequest = async (returnId, action, comments = '', customRefundAmount = null) => {
        console.log('processReturnRequest called with:', { returnId, action, comments, customRefundAmount });
        try {
            setProcessing(prev => ({ ...prev, [returnId]: true }));
            
            const requestData = {
                action, // 'approve' or 'reject'
                adminComments: comments
            };

            // Add custom refund amount if provided for approval
            if (action === 'approve' && customRefundAmount && customRefundAmount > 0) {
                requestData.customRefundAmount = parseFloat(customRefundAmount);
            }

            console.log('Sending request with data:', requestData);
            
            const response = await Axios({
                ...SummaryApi.processReturnRequest,
                url: SummaryApi.processReturnRequest.url.replace(':returnId', returnId),
                data: requestData
            });

            console.log('Response received:', response.data);

            if (response.data.success) {
                toast.success(`Return request ${action}d successfully`);
                
                // Refresh data based on current view
                if (currentView === 'list') {
                    fetchReturnRequests();
                } else if (currentView === 'order-details' && selectedOrderId) {
                    fetchOrderDetails(selectedOrderId);
                }
                fetchStats();
                setAdminResponse('');
                setShowApprovalModal(false);
                resetApprovalForm();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(`Error ${action}ing return request:`, error);
            toast.error(`Failed to ${action} return request`);
        } finally {
            setProcessing(prev => ({ ...prev, [returnId]: false }));
        }
    };

    const openApprovalModal = (returnRequest) => {
        console.log('🚀 openApprovalModal called with:', returnRequest);
        
        const defaultRefundAmount = (returnRequest.itemDetails?.refundAmount || 0) * (returnRequest.itemDetails?.quantity || 1);
        console.log('💰 Calculated default refund amount:', defaultRefundAmount);
        
        const newApprovalData = {
            returnRequest: returnRequest,
            adminComments: '',
            customRefundAmount: defaultRefundAmount.toString(),
            useCustomAmount: false
        };
        
        console.log('📝 Setting approval data:', newApprovalData);
        setApprovalData(newApprovalData);
        
        console.log('🔓 Setting showApprovalModal to true');
        setShowApprovalModal(true);
        
        // Debug check after state updates
        setTimeout(() => {
            console.log('⏰ After timeout - showApprovalModal should be true');
            console.log('🔍 Checking if modal exists in DOM...');
            const modalElement = document.querySelector('[style*="z-index: 9999"]');
            console.log('📍 Modal element found:', modalElement ? 'YES' : 'NO');
            if (modalElement) {
                console.log('🎨 Modal styles:', modalElement.style.cssText);
                console.log('📐 Modal position:', modalElement.getBoundingClientRect());
            }
        }, 100);
    };

    const resetApprovalForm = () => {
        setApprovalData({
            returnRequest: null,
            adminComments: '',
            customRefundAmount: '',
            useCustomAmount: false
        });
    };

    const handleApprovalSubmit = () => {
        console.log('handleApprovalSubmit called with approvalData:', approvalData);
        const { returnRequest, adminComments, customRefundAmount, useCustomAmount } = approvalData;
        
        if (!returnRequest) {
            console.error('No return request found in approval data');
            return;
        }

        const finalRefundAmount = useCustomAmount ? customRefundAmount : null;
        console.log('Calling processReturnRequest with:', {
            returnId: returnRequest._id,
            action: 'approve',
            comments: adminComments || 'Approved by admin',
            finalRefundAmount
        });
        
        processReturnRequest(
            returnRequest._id, 
            'approve', 
            adminComments || 'Approved by admin',
            finalRefundAmount
        );
    };

    const confirmProductReceived = async (returnId) => {
        try {
            setProcessing(prev => ({ ...prev, [returnId]: true }));
            
            const response = await Axios({
                ...SummaryApi.confirmProductReceived,
                data: { returnId }
            });

            if (response.data.success) {
                toast.success('Product receipt confirmed successfully');
                fetchReturnRequests();
                fetchStats();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error confirming product receipt:', error);
            toast.error('Failed to confirm product receipt');
        } finally {
            setProcessing(prev => ({ ...prev, [returnId]: false }));
        }
    };

    const processRefund = async (returnId) => {
        try {
            setProcessing(prev => ({ ...prev, [returnId]: true }));
            
            const response = await Axios({
                ...SummaryApi.processRefund,
                url: SummaryApi.processRefund.url.replace(':returnId', returnId),
                data: {}
            });

            if (response.data.success) {
                toast.success('Refund processed successfully');
                fetchReturnRequests();
                fetchStats();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error processing refund:', error);
            toast.error('Failed to process refund');
        } finally {
            setProcessing(prev => ({ ...prev, [returnId]: false }));
        }
    };

    const updateRefundStatus = async () => {
        try {
            setProcessing(prev => ({ ...prev, [selectedReturn._id]: true }));
            
            const response = await Axios({
                ...SummaryApi.updateRefundStatus,
                url: SummaryApi.updateRefundStatus.url.replace(':returnId', selectedReturn._id),
                data: refundUpdateData
            });

            if (response.data.success) {
                toast.success('Refund status updated successfully');
                
                // Refresh data based on current view
                if (currentView === 'list') {
                    fetchReturnRequests();
                } else if (currentView === 'order-details' && selectedOrderId) {
                    fetchOrderDetails(selectedOrderId);
                }
                fetchStats();
                setShowRefundModal(false);
                resetRefundForm();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error updating refund status:', error);
            toast.error('Failed to update refund status');
        } finally {
            setProcessing(prev => ({ ...prev, [selectedReturn._id]: false }));
        }
    };

    const openRefundModal = (returnRequest) => {
        setSelectedReturn(returnRequest);
        setRefundUpdateData({
            refundStatus: returnRequest.refundDetails?.refundStatus || 'PENDING',
            refundId: returnRequest.refundDetails?.refundId || '',
            refundMethod: returnRequest.refundDetails?.refundMethod || 'ORIGINAL_PAYMENT_METHOD',
            refundAmount: returnRequest.refundDetails?.actualRefundAmount || (returnRequest.itemDetails?.refundAmount * returnRequest.itemDetails?.quantity),
            adminNotes: ''
        });
        setShowRefundModal(true);
    };

    const resetRefundForm = () => {
        setRefundUpdateData({
            refundStatus: '',
            refundId: '',
            refundMethod: 'ORIGINAL_PAYMENT_METHOD',
            refundAmount: '',
            adminNotes: ''
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'REQUESTED':
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
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

    const getRefundStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PROCESSING': return 'bg-blue-100 text-blue-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
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

    const calculateTotalRefund = (items) => {
        return items.reduce((total, item) => {
            const itemTotal = item.orderItemId.unitPrice * item.requestedQuantity;
            return total + Math.floor(itemTotal * 0.65); // 65% refund
        }, 0);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

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
            <div className="p-6">
                {/* Header with back button */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => {
                                setCurrentView('list');
                                setSelectedOrderId(null);
                                setOrderDetails(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            <FaArrowLeft className="w-4 h-4" />
                            Back to Returns
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Order Return Management</h1>
                            <p className="text-gray-600 mt-2">
                                Order #{orderDetails.order.orderId} • {orderDetails.order.customer.name}
                            </p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Order Date</p>
                                <p className="font-medium">{new Date(orderDetails.order.orderDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Delivery Date</p>
                                <p className="font-medium">
                                    {orderDetails.order.actualDeliveryDate 
                                        ? new Date(orderDetails.order.actualDeliveryDate).toLocaleDateString()
                                        : 'Not delivered'
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Order Status</p>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderDetails.order.orderStatus)}`}>
                                    {orderDetails.order.orderStatus}
                                </span>
                            </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-600">Total Items</p>
                                <p className="text-xl font-bold text-blue-900">{orderDetails.summary.totalItems}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-600">Order Value</p>
                                <p className="text-xl font-bold text-green-900">₹{orderDetails.summary.totalOrderValue}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-orange-600">Return Requests</p>
                                <p className="text-xl font-bold text-orange-900">{orderDetails.summary.totalReturnRequests}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-purple-600">Refunds Processed</p>
                                <p className="text-xl font-bold text-purple-900">₹{orderDetails.summary.totalRefundProcessed}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Customer Name</p>
                                        <p className="font-medium text-gray-900">{orderDetails.order.customer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email Address</p>
                                        <p className="font-medium text-gray-900">{orderDetails.order.customer.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Phone Number</p>
                                        <p className="font-medium text-gray-900">
                                            {orderDetails.order.customer.mobile || 
                                             orderDetails.order.deliveryAddress?.mobile || 
                                             'Not provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Delivery Address</p>
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
                    </div>

                    {/* Order Items with Return Information */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Items & Returns</h3>
                        
                        <div className="space-y-6">
                            {orderDetails.items.map((item) => (
                                <div key={item._id} className="border border-gray-200 rounded-lg p-6">
                                    {/* Item Information */}
                                    <div className="flex items-start space-x-4 mb-4">
                                        <img
                                            src={item.image || '/placeholder.png'}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded-lg"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                                            <p className="text-sm text-gray-600">Size: {item.size} | Type: {item.itemType}</p>
                                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Original Qty:</span>
                                                    <span className="ml-1 font-medium">{item.originalQuantity}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Unit Price:</span>
                                                    <span className="ml-1 font-medium">₹{item.unitPrice}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Returned:</span>
                                                    <span className="ml-1 font-medium text-orange-600">{item.returnedQuantity}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Remaining:</span>
                                                    <span className="ml-1 font-medium text-green-600">{item.remainingQuantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Return Requests for this item */}
                                    {item.returnRequests.length > 0 && (
                                        <div className="mt-4 border-t pt-4">
                                            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                                <FaUndo className="w-4 h-4 mr-2 text-orange-500" />
                                                Return Requests ({item.returnRequests.length})
                                            </h5>
                                            <div className="space-y-3">
                                                {item.returnRequests.map((returnReq) => (
                                                    <div key={returnReq._id} className="bg-gray-50 p-4 rounded-lg">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    Quantity: {returnReq.itemDetails.quantity} • 
                                                                    Reason: {returnReq.returnReason}
                                                                </p>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    Requested on: {new Date(returnReq.createdAt).toLocaleDateString()}
                                                                </p>
                                                                {returnReq.returnDescription && (
                                                                    <p className="text-xs text-gray-600 mt-1">
                                                                        Comment: {returnReq.returnDescription}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(returnReq.status)}`}>
                                                                    {returnReq.status.replace('_', ' ')}
                                                                </span>
                                                                <p className="text-sm font-medium mt-1">
                                                                    Refund: ₹{returnReq.itemDetails.refundAmount * returnReq.itemDetails.quantity}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Action buttons for return requests */}
                                                        <div className="flex gap-2 mt-3">
                                                            {returnReq.status === 'REQUESTED' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            console.log('Approve button clicked for return request:', returnReq);
                                                                            openApprovalModal(returnReq);
                                                                        }}
                                                                        disabled={processing[returnReq._id]}
                                                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                                                    >
                                                                        {processing[returnReq._id] ? 'Processing...' : 'Approve'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => processReturnRequest(returnReq._id, 'reject', 'Rejected by admin')}
                                                                        disabled={processing[returnReq._id]}
                                                                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                                                                    >
                                                                        {processing[returnReq._id] ? 'Processing...' : 'Reject'}
                                                                    </button>
                                                                </>
                                                            )}
                                                            {returnReq.status === 'APPROVED' && (
                                                                <button
                                                                    onClick={() => openRefundModal(returnReq)}
                                                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                                >
                                                                    Manage Refund
                                                                </button>
                                                            )}
                                                            {returnReq.refundDetails && (
                                                                <div className="text-xs text-gray-600">
                                                                    Refund Status: 
                                                                    <span className={`ml-1 px-2 py-1 rounded-full ${getRefundStatusColor(returnReq.refundDetails.refundStatus)}`}>
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
                                        <div className="mt-4 text-center py-3 text-gray-500 text-sm border-t">
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
        <div className="p-6">
            {/* Header and Stats */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Return Management</h1>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <FaBox className="text-blue-500 text-2xl mr-3" />
                            <div>
                                <p className="text-gray-600 text-sm">Total Returns</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalReturns}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <FaCalendar className="text-yellow-500 text-2xl mr-3" />
                            <div>
                                <p className="text-gray-600 text-sm">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pendingReturns}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <FaCheck className="text-green-500 text-2xl mr-3" />
                            <div>
                                <p className="text-gray-600 text-sm">Approved</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.approvedReturns}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <FaRupeeSign className="text-purple-500 text-2xl mr-3" />
                            <div>
                                <p className="text-gray-600 text-sm">Total Refunds</p>
                                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRefundAmount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
                                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="createdAt">Created Date</option>
                            <option value="status">Status</option>
                            <option value="totalRefundAmount">Refund Amount</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={resetFilters}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Return Requests Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Return ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Refund Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Return Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Refund Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(returnRequests) && returnRequests.map((returnRequest) => (
                                <tr key={returnRequest._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{returnRequest._id.slice(-8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <FaUser className="text-gray-400 mr-2" />
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {returnRequest.itemDetails?.quantity || 1} item(s)
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{returnRequest.itemDetails?.refundAmount * (returnRequest.itemDetails?.quantity || 1) || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(returnRequest.status)}`}>
                                            {returnRequest.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {returnRequest.refundDetails?.refundStatus ? (
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRefundStatusColor(returnRequest.refundDetails.refundStatus)}`}>
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
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View Order Details"
                                            >
                                                <FaEye />
                                            </button>
                                            
                                            {(returnRequest.status === 'REQUESTED' || returnRequest.status === 'pending') && (
                                                <>
                                                    <button
                                                        onClick={() => openApprovalModal(returnRequest)}
                                                        disabled={processing[returnRequest._id]}
                                                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                        title="Approve Return"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        onClick={() => processReturnRequest(returnRequest._id, 'reject')}
                                                        disabled={processing[returnRequest._id]}
                                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                        title="Reject Return"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </>
                                            )}
                                            
                                            {(returnRequest.status === 'PICKED_UP' || returnRequest.status === 'picked_up') && (
                                                <button
                                                    onClick={() => confirmProductReceived(returnRequest._id)}
                                                    disabled={processing[returnRequest._id]}
                                                    className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                                                    title="Confirm Product Received"
                                                >
                                                    <FaBox />
                                                </button>
                                            )}
                                            
                                            {(returnRequest.status === 'INSPECTED' || returnRequest.status === 'received') && !returnRequest.refundDetails && (
                                                <button
                                                    onClick={() => processRefund(returnRequest._id)}
                                                    disabled={processing[returnRequest._id]}
                                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                    title="Process Refund"
                                                >
                                                    <FaRupeeSign />
                                                </button>
                                            )}

                                            {(returnRequest.status === 'APPROVED' || returnRequest.status === 'REFUND_PROCESSED' || returnRequest.refundDetails) && (
                                                <button
                                                    onClick={() => openRefundModal(returnRequest)}
                                                    disabled={processing[returnRequest._id]}
                                                    className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                                                    title="Manage Refund"
                                                >
                                                    <FaEdit />
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
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page * pagination.limit >= pagination.total}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approval Modal - Enhanced for Debugging */}
            {showApprovalModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center h-full w-full"
                    style={{ zIndex: 9999 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            console.log('🔒 Modal backdrop clicked - closing modal');
                            setShowApprovalModal(false);
                            resetApprovalForm();
                        }
                    }}
                >
                    <div 
                        className="relative bg-white p-6 rounded-lg shadow-2xl w-96 max-w-md mx-4"
                        style={{ 
                            zIndex: 10000,
                            border: '2px solid #ff0000', // Red border for debugging visibility
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <div className="bg-red-100 p-4 rounded-lg mb-4">
                                <h3 className="text-lg font-bold text-red-900 mb-2">
                                    🔍 DEBUG: Modal is Visible!
                                </h3>
                                <p className="text-sm text-red-700">
                                    Modal State: {showApprovalModal ? 'TRUE' : 'FALSE'}
                                </p>
                            </div>
                            
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Approve Return Request
                            </h3>
                            
                            {approvalData.returnRequest && (
                                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                                    <p className="text-sm"><strong>Return ID:</strong> #{approvalData.returnRequest._id?.slice(-8)}</p>
                                    <p className="text-sm"><strong>Customer:</strong> {approvalData.returnRequest.userId?.name}</p>
                                    <p className="text-sm"><strong>Refund Amount:</strong> ₹{approvalData.customRefundAmount}</p>
                                </div>
                            )}
                            
                            <p className="text-sm text-gray-600 mb-6">
                                Are you sure you want to approve this return request?
                            </p>
                            
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => {
                                        console.log('🚫 Cancel button clicked');
                                        setShowApprovalModal(false);
                                        resetApprovalForm();
                                    }}
                                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        console.log('✅ Approve button clicked');
                                        handleApprovalSubmit();
                                    }}
                                    className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
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
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Update Refund Status
                                </h3>
                                <button
                                    onClick={() => setShowRefundModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Return Details</h4>
                                    <p className="text-sm text-gray-600">Return ID: #{selectedReturn._id.slice(-8)}</p>
                                    <p className="text-sm text-gray-600">Customer: {selectedReturn.userId?.name}</p>
                                    <p className="text-sm text-gray-600">Item: {selectedReturn.itemDetails?.name}</p>
                                    <p className="text-sm text-gray-600">
                                        Expected Refund: ₹{selectedReturn.itemDetails?.refundAmount * (selectedReturn.itemDetails?.quantity || 1)}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Refund Status *
                                        </label>
                                        <select
                                            value={refundUpdateData.refundStatus}
                                            onChange={(e) => setRefundUpdateData(prev => ({ ...prev, refundStatus: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Select Status</option>
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
                                            value={refundUpdateData.refundMethod}
                                            onChange={(e) => setRefundUpdateData(prev => ({ ...prev, refundMethod: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="ORIGINAL_PAYMENT_METHOD">Original Payment Method</option>
                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                            <option value="WALLET_CREDIT">Wallet Credit</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Refund ID/Transaction ID
                                        </label>
                                        <input
                                            type="text"
                                            value={refundUpdateData.refundId}
                                            onChange={(e) => setRefundUpdateData(prev => ({ ...prev, refundId: e.target.value }))}
                                            placeholder="Enter refund/transaction ID"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Actual Refund Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={refundUpdateData.refundAmount}
                                            onChange={(e) => setRefundUpdateData(prev => ({ ...prev, refundAmount: e.target.value }))}
                                            placeholder="Enter actual refund amount"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Notes
                                    </label>
                                    <textarea
                                        value={refundUpdateData.adminNotes}
                                        onChange={(e) => setRefundUpdateData(prev => ({ ...prev, adminNotes: e.target.value }))}
                                        placeholder="Add notes about the refund update..."
                                        rows="3"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        onClick={updateRefundStatus}
                                        disabled={!refundUpdateData.refundStatus || processing[selectedReturn._id]}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing[selectedReturn._id] ? 'Updating...' : 'Update Refund Status'}
                                    </button>
                                    <button
                                        onClick={() => setShowRefundModal(false)}
                                        className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReturnManagement;
