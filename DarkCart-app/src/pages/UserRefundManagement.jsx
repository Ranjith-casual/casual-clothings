import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
    FaUser, 
    FaEnvelope, 
    FaHashtag, 
    FaMoneyBillWave, 
    FaPercent, 
    FaCheck, 
    FaHourglass, 
    FaTimes,
    FaCalendarAlt,
    FaShoppingCart,
    FaInfoCircle,
    FaEye,
    FaChartLine,
    FaFilter,
    FaRupeeSign,
    FaSpinner,
    FaDownload,
    FaClipboardList
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import noCart from '../assets/noCart.jpg';

const UserRefundManagement = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const user = useSelector(state => state?.user?.user);

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                toast.error("Please log in to view your refund dashboard");
                return;
            }

            const response = await Axios({
                ...SummaryApi.getUserRefundDashboard,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                console.log('🔍 Frontend Dashboard Data Received:', response.data.data);
                
                // Debug refund percentages specifically
                if (response.data.data.refundBreakdown && response.data.data.refundBreakdown.length > 0) {
                    console.log('🔍 Frontend Refund Percentages Debug:');
                    response.data.data.refundBreakdown.forEach((refund, index) => {
                        console.log(`Refund ${index}:`, {
                            orderId: refund.orderId,
                            refundPercentage: refund.refundPercentage,
                            totalRefundAmount: refund.totalRefundAmount,
                            items: refund.items?.map(item => ({
                                productName: item.productName,
                                price: item.price,
                                originalPrice: item.originalPrice,
                                discountAmount: item.discountAmount,
                                discountPercentage: item.discountPercentage,
                                itemStatus: item.itemStatus,
                                itemType: item.itemType
                            }))
                        });
                    });
                }
                
                setDashboardData(response.data.data);
            } else {
                toast.error("Failed to fetch refund dashboard data");
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error(error.response?.data?.message || "Error fetching refund dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { 
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get status badge
    const getStatusBadge = (status, refundStatus) => {
        if (status === 'REJECTED') {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <FaTimes className="w-3 h-3 mr-1" />
                    Rejected
                </span>
            );
        }
        if (status === 'PENDING') {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <FaHourglass className="w-3 h-3 mr-1" />
                    Pending
                </span>
            );
        }
        if (status === 'APPROVED') {
            if (refundStatus === 'COMPLETED') {
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FaCheck className="w-3 h-3 mr-1" />
                        Refunded
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <FaSpinner className="w-3 h-3 mr-1" />
                    Processing
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Active
            </span>
        );
    };

    // Get image source
    const getImageSource = (item) => {
        if (item?.image) return item.image;
        return noCart;
    };

    // Filter refunds based on status and search term
    const filteredRefunds = dashboardData?.refundBreakdown?.filter(refund => {
        const matchesStatus = filterStatus === 'all' || refund.status.toLowerCase() === filterStatus.toLowerCase();
        const matchesSearch = searchTerm === '' || 
            refund.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            refund.reason.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    }) || [];

    // Pagination
    const totalPages = Math.ceil(filteredRefunds.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRefunds = filteredRefunds.slice(startIndex, startIndex + itemsPerPage);

    // Progress steps for refunds
    const getRefundProgress = (status, refundStatus) => {
        const steps = [
            { label: 'Requested', completed: true },
            { label: 'Approved', completed: status === 'APPROVED' || status === 'PROCESSED' },
            { label: 'Processing', completed: status === 'APPROVED' && refundStatus !== 'PENDING' },
            { label: 'Refunded', completed: refundStatus === 'COMPLETED' }
        ];
        return steps;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-lg text-gray-600">Loading your refund dashboard...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaInfoCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">Unable to load refund dashboard</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Management</h1>
                    <p className="text-gray-600">Track your order cancellations and refund status</p>
                </div>

                {/* User Details Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <FaUser className="mr-2 text-blue-500" />
                        Account Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                            <FaUser className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium text-gray-900">{dashboardData.userDetails.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <FaEnvelope className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium text-gray-900">{dashboardData.userDetails.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <FaHashtag className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Customer ID</p>
                                <p className="font-medium text-gray-900">{dashboardData.userDetails.userId}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Refund Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <FaChartLine className="mr-2 text-blue-500" />
                        Refund Summary
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Total Orders Placed</p>
                                    <p className="text-2xl font-bold text-blue-900">{dashboardData.summary.totalOrdersPlaced}</p>
                                </div>
                                <FaShoppingCart className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-yellow-600">Total Cancelled Orders</p>
                                    <p className="text-2xl font-bold text-yellow-900">{dashboardData.summary.totalCancelledOrders}</p>
                                </div>
                                <FaTimes className="w-8 h-8 text-yellow-500" />
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Total Refunds Processed</p>
                                    <p className="text-2xl font-bold text-green-900">{dashboardData.summary.totalRefundsProcessed}</p>
                                </div>
                                <FaCheck className="w-8 h-8 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-600">Total Refunded Amount</p>
                                    <p className="text-2xl font-bold text-purple-900 flex items-center">
                                        <FaRupeeSign className="text-xl mr-1" />
                                        {dashboardData.summary.totalRefundedAmount ? dashboardData.summary.totalRefundedAmount.toFixed(2) : '0.00'}
                                    </p>
                                </div>
                                <FaMoneyBillWave className="w-8 h-8 text-purple-500" />
                            </div>
                        </div>
                    </div>

                    {/* Additional Summary Info */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Partial Cancellations</span>
                                <span className="font-semibold text-gray-900">{dashboardData.summary.totalPartialCancellations}</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Overall Refund Percentage</span>
                                <span className="font-semibold text-gray-900 flex items-center">
                                    {dashboardData.summary.overallRefundPercentage}%
                                    <FaPercent className="ml-1 text-xs" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
                            <input
                                type="text"
                                placeholder="Search by Order ID or Reason..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="md:w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Refund Breakdown Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <FaClipboardList className="mr-2 text-blue-500" />
                            Refund History ({filteredRefunds.length} records)
                        </h2>
                    </div>

                    {paginatedRefunds.length === 0 ? (
                        <div className="p-12 text-center">
                            <img src={noCart} alt="No refunds" className="w-32 h-32 mx-auto mb-4 opacity-50" />
                            <p className="text-gray-500 text-lg">No refund records found</p>
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund Info</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedRefunds.map((refund) => (
                                            <tr key={refund._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">#{refund.orderId}</div>
                                                        <div className="text-sm text-gray-500">
                                                            Ordered: {formatDate(refund.orderDate)}
                                                        </div>
                                                        <div className="text-sm text-blue-600">
                                                            {refund.cancellationType === 'PARTIAL_ITEMS' ? 'Partial Cancellation' : 'Full Order Cancellation'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900 flex items-center">
                                                            <FaRupeeSign className="text-sm mr-1" />
                                                            {refund.totalRefundAmount ? refund.totalRefundAmount.toFixed(2) : '0.00'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {refund.refundPercentage}% refund
                                                        </div>
                                                        {refund.refundId && (
                                                            <div className="text-xs text-blue-600">
                                                                ID: {refund.refundId}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(refund.status, refund.refundStatus)}
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Requested: {formatDate(refund.requestDate)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-full">
                                                        {getRefundProgress(refund.status, refund.refundStatus).map((step, index) => (
                                                            <div key={index} className="flex items-center mb-1">
                                                                <div className={`w-3 h-3 rounded-full mr-2 ${
                                                                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                                                                }`}></div>
                                                                <span className={`text-xs ${
                                                                    step.completed ? 'text-green-600' : 'text-gray-500'
                                                                }`}>
                                                                    {step.label}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRefund(refund);
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                                                    >
                                                        <FaEye className="w-4 h-4 mr-1" />
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRefunds.length)} of {filteredRefunds.length} results
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                Previous
                                            </button>
                                            <span className="px-3 py-1 text-sm text-gray-700">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Detail Modal */}
                {showDetailModal && selectedRefund && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Refund Details - Order #{selectedRefund.orderId}
                                    </h3>
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Refund Summary */}
                                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Refund Summary</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Refund Amount</p>
                                            <p className="font-semibold text-lg text-green-600 flex items-center">
                                                <FaRupeeSign className="mr-1" />
                                                {selectedRefund.totalRefundAmount ? selectedRefund.totalRefundAmount.toFixed(2) : '0.00'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Refund Percentage</p>
                                            <p className="font-semibold text-lg text-blue-600">
                                                {selectedRefund.refundPercentage || 0}%
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Cancellation Reason</p>
                                            <p className="font-medium text-gray-900">{selectedRefund.reason}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Request Date</p>
                                            <p className="font-medium text-gray-900">{formatDate(selectedRefund.requestDate)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Item Breakdown */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Item Breakdown</h4>
                                    {selectedRefund.cancellationType === 'FULL_ORDER' && (
                                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-700">
                                                <FaInfoCircle className="inline mr-2" />
                                                This is a full order cancellation. The total refund amount is shown in the summary above.
                                            </p>
                                        </div>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border border-gray-200 rounded-lg">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Price</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Discount</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item Status</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Refund Status</th>
                                                    {selectedRefund.cancellationType !== 'FULL_ORDER' && (
                                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Refunded Amount</th>
                                                    )}
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Refunded On</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedRefund.items.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center">
                                                                <img
                                                                    src={getImageSource(item)}
                                                                    alt={item.productName}
                                                                    className="w-10 h-10 rounded-lg object-cover mr-3"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = noCart;
                                                                    }}
                                                                />
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{item.productName}</p>
                                                                    <p className="text-sm text-gray-500 capitalize">{item.itemType}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                {/* Show original price with strikethrough if there's a discount */}
                                                                {item.originalPrice && item.originalPrice > 0 && item.discountPercentage > 0 && (
                                                                    <span className="text-xs text-gray-400 line-through flex items-center">
                                                                        <FaRupeeSign className="text-xs mr-1" />
                                                                        {item.originalPrice.toFixed(2)}
                                                                    </span>
                                                                )}
                                                                {/* Current/discounted price */}
                                                                <span className="flex items-center">
                                                                    <FaRupeeSign className="text-sm mr-1" />
                                                                    {item.price && item.price > 0 ? item.price.toFixed(2) : (
                                                                        <span className="text-gray-400 italic">
                                                                            {item.price === 0 ? '0.00' : 'N/A'}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.discountPercentage && item.discountPercentage > 0 ? (
                                                                <div className="text-sm">
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                        {item.discountPercentage}% OFF
                                                                    </span>
                                                                    {item.discountAmount && item.discountAmount > 0 && (
                                                                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                                                                            Save <FaRupeeSign className="text-xs mx-1" />{item.discountAmount.toFixed(2)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">No Discount</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                item.itemStatus === 'Active' 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {item.itemStatus || 'Cancelled'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.itemStatus === 'Active' ? (
                                                                <span className="text-gray-500 text-sm">N/A</span>
                                                            ) : (
                                                                getStatusBadge(selectedRefund.status, item.refundStatus)
                                                            )}
                                                        </td>
                                                        {selectedRefund.cancellationType !== 'FULL_ORDER' && (
                                                            <td className="px-4 py-3">
                                                                {item.itemStatus === 'Active' ? (
                                                                    <span className="text-gray-500 text-sm">₹0.00</span>
                                                                ) : (
                                                                    <span className="flex items-center text-green-600 font-medium">
                                                                        <FaRupeeSign className="text-sm mr-1" />
                                                                        {item.refundedAmount ? item.refundedAmount.toFixed(2) : '0.00'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            {item.itemStatus === 'Active' ? 'N/A' : formatDate(item.refundedOn)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Admin Comments */}
                                {selectedRefund.adminComments && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-blue-900 mb-2">Admin Comments</h4>
                                        <p className="text-blue-800">{selectedRefund.adminComments}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserRefundManagement;
