import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import Loading from '../components/Loading';
import AdminApprovalModal from '../components/AdminApprovalModal';
import AdminRefundModal from '../components/AdminRefundModal';
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
    const [showDebug, setShowDebug] = useState(false); // Debug panel visibility toggle
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
                url: `${SummaryApi.getOrderWithReturnDetails.url}/${orderId}?t=${Date.now()}` // Add timestamp to prevent caching
            });

            if (response.data.success) {
                const orderData = response.data.data;
                console.log('=== 🔍 ORDER DETAILS LOADED ===');
                console.log('Order ID:', orderData.order.orderId);
                console.log('Total items:', orderData.items.length);
                console.log('Total return requests:', orderData.summary.totalReturnRequests);
                
                // Log admin comments specifically with emphasis
                orderData.items.forEach((item, itemIndex) => {
                    console.log(`\n📦 Item ${itemIndex + 1}: ${item.name}`);
                    console.log(`   Return requests: ${item.returnRequests.length}`);
                    
                    item.returnRequests.forEach((returnReq, reqIndex) => {
                        console.log(`\n   🔄 Return ${reqIndex + 1}:`);
                        console.log(`      - Status: ${returnReq.status}`);
                        console.log(`      - Reason: ${returnReq.returnReason}`);
                        console.log(`      - Has Description: ${returnReq.hasOwnProperty('returnDescription')}`);
                        console.log(`      - Description Value: "${returnReq.returnDescription}"`);
                        console.log(`      - Description Type: ${typeof returnReq.returnDescription}`);
                        console.log(`      - Description Length: ${(returnReq.returnDescription || '').length}`);
                        console.log(`      - Will Show Customer Comment: ${returnReq.returnDescription ? 'YES' : 'NO (fallback)'}`);
                        console.log(`      - Direct adminComments: "${returnReq.adminComments || 'NONE'}"`);
                        console.log(`      - AdminResponse exists: ${!!returnReq.adminResponse}`);
                        if (returnReq.adminResponse) {
                            console.log(`      - AdminResponse.adminComments: "${returnReq.adminResponse.adminComments || 'NONE'}"`);
                            console.log(`      - AdminResponse.processedDate: ${returnReq.adminResponse.processedDate || 'NONE'}`);
                            console.log(`      - AdminResponse keys: [${Object.keys(returnReq.adminResponse).join(', ')}]`);
                        }
                        
                        // Test the display logic
                        let testAdminComments = returnReq.adminComments || returnReq.adminResponse?.adminComments;
                        if (!testAdminComments) {
                            if (returnReq.status === 'APPROVED') {
                                testAdminComments = 'Return request approved by admin';
                            } else if (returnReq.status === 'REJECTED') {
                                testAdminComments = 'Return request rejected by admin';
                            }
                        }
                        console.log(`      - 🎯 WILL DISPLAY: "${testAdminComments || 'NOTHING'}"`);
                    });
                });
                
                console.log('\n=== 🎯 END ADMIN COMMENTS DEBUG ===');
                
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
            <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 sm:mb-6">
                        <button
                            onClick={() => {
                                setCurrentView('list');
                                setSelectedOrderId(null);
                                setOrderDetails(null);
                            }}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 w-fit"
                        >
                            <FaArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-sm sm:text-base">Back to Returns</span>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Order Return Details</h1>
                            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                                Order #{orderDetails.order.orderId} • {orderDetails.order.customer.name}
                            </p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Order Date</p>
                                <p className="font-medium text-gray-900 text-sm sm:text-base">
                                    {new Date(orderDetails.order.orderDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Delivery Date</p>
                                <p className="font-medium text-gray-900 text-sm sm:text-base">
                                    {orderDetails.order.actualDeliveryDate 
                                        ? new Date(orderDetails.order.actualDeliveryDate).toLocaleDateString()
                                        : 'Not delivered'
                                    }
                                </p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1">
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Order Status</p>
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(orderDetails.order.orderStatus)}`}>
                                    {orderDetails.order.orderStatus}
                                </span>
                            </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="mt-4 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                                <p className="text-xs sm:text-sm text-blue-700 font-medium truncate">Total Items</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{orderDetails.summary.totalItems}</p>
                            </div>
                            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                                <p className="text-xs sm:text-sm text-green-700 font-medium truncate">Order Value</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">₹{orderDetails.summary.totalOrderValue}</p>
                            </div>
                            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
                                <p className="text-xs sm:text-sm text-orange-700 font-medium truncate">Return Requests</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900">{orderDetails.summary.totalReturnRequests}</p>
                            </div>
                            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                                <p className="text-xs sm:text-sm text-purple-700 font-medium truncate">Refunds Processed</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">₹{orderDetails.summary.totalRefundProcessed}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Customer Information</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Customer Name</p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">{orderDetails.order.customer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Email Address</p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base break-all">{orderDetails.order.customer.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Phone Number</p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">
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
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Delivery Address</p>
                                    <div className="font-medium text-gray-900 text-sm sm:text-base">
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
                    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                            <FaBox className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
                            Order Items & Returns
                        </h3>
                        
                        <div className="space-y-4 sm:space-y-6">
                            {orderDetails.items.map((item) => (
                                <div key={item._id} className="border border-gray-200 rounded-xl p-3 sm:p-4 lg:p-6 bg-gray-50">
                                    {/* Item Information */}
                                    <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                                        <img
                                            src={item.image || '/placeholder.png'}
                                            alt={item.name}
                                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200 mx-auto sm:mx-0 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{item.name}</h4>
                                            <p className="text-xs sm:text-sm text-gray-600 mb-3">Size: {item.size} | Type: {item.itemType}</p>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                                                <div className="bg-white p-2 sm:p-3 rounded-lg border">
                                                    <span className="text-gray-600 block truncate">Original Qty:</span>
                                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.originalQuantity}</span>
                                                </div>
                                                <div className="bg-white p-2 sm:p-3 rounded-lg border">
                                                    <span className="text-gray-600 block truncate">Unit Price:</span>
                                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">₹{item.unitPrice}</span>
                                                </div>
                                                <div className="bg-white p-2 sm:p-3 rounded-lg border">
                                                    <span className="text-gray-600 block truncate">Returned:</span>
                                                    <span className="font-semibold text-orange-600 text-sm sm:text-base">{item.returnedQuantity}</span>
                                                </div>
                                                <div className="bg-white p-2 sm:p-3 rounded-lg border">
                                                    <span className="text-gray-600 block truncate">Remaining:</span>
                                                    <span className="font-semibold text-green-600 text-sm sm:text-base">{item.remainingQuantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Return Requests for this item */}
                                    {item.returnRequests.length > 0 && (
                                        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                                <h5 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                                                    <FaUndo className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-orange-500" />
                                                    Return Requests ({item.returnRequests.length})
                                                </h5>
                                                <button 
                                                    onClick={() => setShowDebug(!showDebug)} 
                                                    className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
                                                >
                                                    {showDebug ? 'Hide Debug' : 'Show Debug'}
                                                </button>
                                            </div>
                                            <div className="space-y-3 sm:space-y-4">
                                                {item.returnRequests.map((returnReq) => (
                                                    <div key={returnReq._id} className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                                                        {/* Mobile-First Layout */}
                                                        <div className="space-y-3">
                                                            {/* DEBUG PANEL - TOGGLE THIS TO SHOW/HIDE */}
                                                            {showDebug && (
                                                                <div className="bg-gray-900 text-white p-3 rounded text-xs overflow-auto max-h-40 mb-3">
                                                                <p className="font-mono">Return Request Debug:</p>
                                                                <pre className="overflow-x-auto whitespace-pre-wrap">
                                                                    {JSON.stringify({
                                                                        id: returnReq._id,
                                                                        reason: returnReq.returnReason,
                                                                        description: returnReq.returnDescription,
                                                                        descType: typeof returnReq.returnDescription,
                                                                        descLength: returnReq.returnDescription?.length || 0,
                                                                        hasDesc: Boolean(returnReq.returnDescription),
                                                                        status: returnReq.status,
                                                                        adminComments: returnReq.adminComments || returnReq.adminResponse?.adminComments || 'None'
                                                                    }, null, 2)}
                                                                </pre>
                                                                {returnReq.returnDescription && (
                                                                    <div className="mt-2 p-2 bg-green-800 rounded border border-green-600">
                                                                        <p className="font-mono text-green-300 mb-1">Description Found:</p>
                                                                        <p className="text-white break-words bg-green-900 p-1 rounded">"{returnReq.returnDescription}"</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            )}
                                                            {/* Request Info */}
                                                            <div className="space-y-2">
                                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                                                                            <span className="inline-block">Quantity: {returnReq.itemDetails.quantity}</span>
                                                                        </p>
                                                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                                            <span className="font-medium">Reason:</span> {returnReq.returnReason}
                                                                        </p>
                                                                        
                                                                        {/* User's Return Description/Comment - Enhanced Display */}
                                                                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded shadow-sm">
                                                                            <p className="text-xs sm:text-sm text-gray-800">
                                                                                <span className="font-medium text-gray-900 block mb-1">Customer Comment:</span> 
                                                                                {returnReq.returnDescription && returnReq.returnDescription.trim() !== '' ? (
                                                                                    <span className="block px-2 py-1 bg-white rounded border border-yellow-100 break-words">{returnReq.returnDescription}</span>
                                                                                ) : (
                                                                                    <span className="block px-2 py-1 italic text-gray-500">No additional details provided by customer</span>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        {/* Admin Comments Display */}
                                                                        {(() => {
                                                                            // Try multiple sources for admin comments
                                                                            let adminComments = returnReq.adminComments || returnReq.adminResponse?.adminComments;
                                                                            
                                                                            // If no explicit comments but status indicates admin action, show default message
                                                                            if (!adminComments) {
                                                                                if (returnReq.status === 'APPROVED') {
                                                                                    adminComments = 'Return request approved by admin';
                                                                                } else if (returnReq.status === 'REJECTED') {
                                                                                    adminComments = 'Return request rejected by admin';
                                                                                }
                                                                            }
                                                                            
                                                                            // Display admin comments if available
                                                                            if (adminComments) {
                                                                                return (
                                                                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                                                                        <p className="text-xs sm:text-sm text-blue-700 break-words">
                                                                                            <span className="font-medium">Admin Comments:</span> {adminComments}
                                                                                        </p>
                                                                                        {returnReq.adminResponse?.processedDate && (
                                                                                            <p className="text-xs text-blue-600 mt-1">
                                                                                                Processed: {new Date(returnReq.adminResponse.processedDate).toLocaleDateString('en-US', {
                                                                                                    year: 'numeric',
                                                                                                    month: 'short',
                                                                                                    day: 'numeric',
                                                                                                    hour: '2-digit',
                                                                                                    minute: '2-digit'
                                                                                                })}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            
                                                                            // Show pending message for requests awaiting admin action
                                                                            if (returnReq.status === 'REQUESTED') {
                                                                                return (
                                                                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                                                        <p className="text-xs sm:text-sm text-yellow-700">
                                                                                            <span className="font-medium">Status:</span> Awaiting admin review
                                                                                        </p>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            
                                                                            return null;
                                                                        })()}
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Requested on: {formatDate(returnReq.createdAt)}
                                                                        </p>
                                                                    </div>
                                                                    
                                                                    {/* Status and Refund - Mobile Stacked */}
                                                                    <div className="flex flex-col space-y-2 sm:items-end">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(returnReq.status)} self-start sm:self-end`}>
                                                                            {returnReq.status.replace('_', ' ')}
                                                                        </span>
                                                                        <div className="bg-gray-50 px-2 py-1 rounded text-xs sm:text-sm">
                                                                            <span className="text-gray-600">Refund:</span>
                                                                            <span className="font-semibold text-gray-900 ml-1">
                                                                                {returnReq.itemDetails?.refundAmount ? 
                                                                                    `₹${returnReq.itemDetails.refundAmount * returnReq.itemDetails.quantity}` : 
                                                                                    'Admin will verify and update'
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Action buttons */}
                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                <div className="flex gap-2">
                                                                    {returnReq.status === 'REQUESTED' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => openApprovalModal(returnReq)}
                                                                                disabled={processing[returnReq._id]}
                                                                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                                                            >
                                                                                <FaCheck className="w-3 h-3" />
                                                                                {processing[returnReq._id] ? 'Processing...' : 'Approve'}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => processReturnRequest(returnReq._id, 'reject', 'Rejected by admin')}
                                                                                disabled={processing[returnReq._id]}
                                                                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                                                            >
                                                                                <FaTimes className="w-3 h-3" />
                                                                                {processing[returnReq._id] ? 'Processing...' : 'Reject'}
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    {(returnReq.status === 'APPROVED' || returnReq.refundDetails) && (
                                                                        <button
                                                                            onClick={() => openRefundModal(returnReq)}
                                                                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                                                        >
                                                                            <FaEdit className="w-3 h-3" />
                                                                            Manage Refund
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {returnReq.refundDetails && (
                                                                    <div className="flex items-center text-xs sm:text-sm bg-gray-50 p-2 rounded-lg">
                                                                        <span className="text-gray-600 mr-2">Refund Status:</span>
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRefundStatusColor(returnReq.refundDetails.refundStatus)}`}>
                                                                            {returnReq.refundDetails.refundStatus}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {item.returnRequests.length === 0 && (
                                        <div className="mt-3 sm:mt-4 text-center py-4 sm:py-6 text-gray-500 text-xs sm:text-sm border-t border-gray-200 bg-white rounded-lg">
                                            <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2 text-gray-400" />
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
        <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
            {/* Header and Stats */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Return Management</h1>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                                <FaBox className="text-blue-600 text-base sm:text-lg lg:text-xl" />
                            </div>
                            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Total Returns</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalReturns}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                                <FaCalendar className="text-yellow-600 text-base sm:text-lg lg:text-xl" />
                            </div>
                            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Pending</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.pendingReturns}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                                <FaCheck className="text-green-600 text-base sm:text-lg lg:text-xl" />
                            </div>
                            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Approved</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.approvedReturns}</p>
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
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <FaFilter className="text-gray-500 text-sm sm:text-base" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search by customer..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="pl-9 sm:pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="createdAt">Created Date</option>
                            <option value="status">Status</option>
                            <option value="totalRefundAmount">Refund Amount</option>
                        </select>
                    </div>
                    <div className="flex items-end sm:col-span-2 lg:col-span-1">
                        <button
                            onClick={resetFilters}
                            className="w-full bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Return Requests Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Return ID
                                </th>
                                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Refund Amount
                                </th>
                                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Return Status
                                </th>
                                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Refund Status
                                </th>
                                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Created Date
                                </th>
                                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(returnRequests) && returnRequests.map((returnRequest) => (
                                <tr key={returnRequest._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                        <span className="text-sm font-mono font-medium text-gray-900">
                                            #{returnRequest._id.slice(-8)}
                                        </span>
                                    </td>
                                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-gray-100 rounded-full mr-3 flex-shrink-0">
                                                <FaUser className="text-gray-600 text-sm" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {returnRequest.userId.name}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {returnRequest.userId.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">
                                            {returnRequest.itemDetails?.quantity || 1} item(s)
                                        </span>
                                    </td>
                                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-900">
                                            ₹{returnRequest.itemDetails?.refundAmount * (returnRequest.itemDetails?.quantity || 1) || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(returnRequest.status)}`}>
                                            {returnRequest.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                        {returnRequest.refundDetails?.refundStatus ? (
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRefundStatusColor(returnRequest.refundDetails.refundStatus)}`}>
                                                {returnRequest.refundDetails.refundStatus.toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(returnRequest.createdAt)}
                                    </td>
                                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-1 xl:space-x-2">
                                            <button
                                                onClick={() => fetchOrderDetails(returnRequest.orderId._id || returnRequest.orderId)}
                                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Order Details"
                                            >
                                                <FaEye className="w-3 h-3 xl:w-4 xl:h-4" />
                                            </button>
                                            
                                            {(returnRequest.status === 'REQUESTED' || returnRequest.status === 'pending') && (
                                                <>
                                                    <button
                                                        onClick={() => openApprovalModal(returnRequest)}
                                                        disabled={processing[returnRequest._id]}
                                                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Approve Return"
                                                    >
                                                        <FaCheck className="w-3 h-3 xl:w-4 xl:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => processReturnRequest(returnRequest._id, 'reject')}
                                                        disabled={processing[returnRequest._id]}
                                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Reject Return"
                                                    >
                                                        <FaTimes className="w-3 h-3 xl:w-4 xl:h-4" />
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
                                                    <FaEdit className="w-3 h-3 xl:w-4 xl:h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile/Tablet Cards */}
                <div className="lg:hidden">
                    <div className="space-y-3 p-3 sm:p-4">
                        {Array.isArray(returnRequests) && returnRequests.map((returnRequest) => (
                            <div key={returnRequest._id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-white rounded-full mr-3 flex-shrink-0">
                                            <FaUser className="text-gray-600 text-sm" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {returnRequest.userId.name}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                #{returnRequest._id.slice(-8)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => fetchOrderDetails(returnRequest.orderId._id || returnRequest.orderId)}
                                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="View Order Details"
                                        >
                                            <FaEye className="w-4 h-4" />
                                        </button>
                                        
                                        {(returnRequest.status === 'REQUESTED' || returnRequest.status === 'pending') && (
                                            <>
                                                <button
                                                    onClick={() => openApprovalModal(returnRequest)}
                                                    disabled={processing[returnRequest._id]}
                                                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Approve Return"
                                                >
                                                    <FaCheck className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => processReturnRequest(returnRequest._id, 'reject')}
                                                    disabled={processing[returnRequest._id]}
                                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
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
                                                className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                                                title="Manage Refund"
                                            >
                                                <FaEdit className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500">Items:</span>
                                        <span className="ml-1 font-medium">{returnRequest.itemDetails?.quantity || 1}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Amount:</span>
                                        <span className="ml-1 font-semibold">₹{returnRequest.itemDetails?.refundAmount * (returnRequest.itemDetails?.quantity || 1) || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Return Status:</span>
                                        <div className="mt-1">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border ${getStatusColor(returnRequest.status)}`}>
                                                {returnRequest.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Refund Status:</span>
                                        <div className="mt-1">
                                            {returnRequest.refundDetails?.refundStatus ? (
                                                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border ${getRefundStatusColor(returnRequest.refundDetails.refundStatus)}`}>
                                                    {returnRequest.refundDetails.refundStatus.toUpperCase()}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">N/A</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                    <span className="text-xs text-gray-500">Created: {formatDate(returnRequest.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-gray-500 flex items-center">
                            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page * pagination.limit >= pagination.total}
                            className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-700">
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
                                    className="relative inline-flex items-center px-2 sm:px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    className="relative inline-flex items-center px-2 sm:px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Responsive Approval Modal */}
            <AdminApprovalModal
                showModal={showApprovalModal}
                onClose={() => setShowApprovalModal(false)}
                approvalData={approvalData}
                setApprovalData={setApprovalData}
                handleApprovalSubmit={handleApprovalSubmit}
                resetApprovalForm={resetApprovalForm}
            />

            {/* Responsive Refund Status Update Modal */}
            <AdminRefundModal
                showModal={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                selectedReturn={selectedReturn}
                refundData={refundData}
                setRefundData={setRefundData}
                refundStatusOptions={refundStatusOptions}
                updateRefundStatus={updateRefundStatus}
                processing={processing}
            />
        </div>
    );
};

export default AdminReturnManagement;
