import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaEye, FaCheck, FaTimes, FaSearch, FaFilter, FaDownload, FaBox, FaUser, FaCalendar, FaRupeeSign, FaEdit } from 'react-icons/fa';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import Loading from '../components/Loading';

const AdminReturnManagement = () => {
    const [returnRequests, setReturnRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
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
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
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
        fetchReturnRequests();
        fetchStats();
    }, [filters, sortBy, sortOrder, pagination.page]);

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

    const processReturnRequest = async (returnId, action, comments = '') => {
        try {
            setProcessing(prev => ({ ...prev, [returnId]: true }));
            
            const response = await Axios({
                ...SummaryApi.processReturnRequest,
                url: SummaryApi.processReturnRequest.url.replace(':returnId', returnId),
                data: {
                    action, // 'approve' or 'reject'
                    adminComments: comments
                }
            });

            if (response.data.success) {
                toast.success(`Return request ${action}d successfully`);
                fetchReturnRequests();
                fetchStats();
                setShowDetailsModal(false);
                setAdminResponse('');
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
                fetchReturnRequests();
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
                                                onClick={() => {
                                                    setSelectedReturn(returnRequest);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <FaEye />
                                            </button>
                                            
                                            {(returnRequest.status === 'REQUESTED' || returnRequest.status === 'pending') && (
                                                <>
                                                    <button
                                                        onClick={() => processReturnRequest(returnRequest._id, 'approve')}
                                                        disabled={processing[returnRequest._id]}
                                                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        onClick={() => processReturnRequest(returnRequest._id, 'reject')}
                                                        disabled={processing[returnRequest._id]}
                                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
                                                    title="Update Refund Status"
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

            {/* Details Modal */}
            {showDetailsModal && selectedReturn && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Return Request Details
                                </h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                                    <p className="text-sm text-gray-600">Name: {selectedReturn.userId.name}</p>
                                    <p className="text-sm text-gray-600">Email: {selectedReturn.userId.email}</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Return Item</h4>
                                    <div className="space-y-2">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={selectedReturn.itemDetails?.image || '/placeholder.png'}
                                                    alt={selectedReturn.itemDetails?.name || 'Product'}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                                <div>
                                                    <p className="font-medium">{selectedReturn.itemDetails?.name || 'Unknown Item'}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Size: {selectedReturn.itemDetails?.size || 'N/A'} | Quantity: {selectedReturn.itemDetails?.quantity || 1}
                                                    </p>
                                                    <p className="text-sm text-gray-600">Reason: {selectedReturn.returnReason || 'Not specified'}</p>
                                                    {selectedReturn.returnDescription && (
                                                        <p className="text-sm text-gray-500">Comments: {selectedReturn.returnDescription}</p>
                                                    )}
                                                    <p className="text-sm text-gray-600">
                                                        Original Price: ₹{selectedReturn.itemDetails?.originalPrice || 0} | 
                                                        Refund Amount: ₹{selectedReturn.itemDetails?.refundAmount || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Total Refund Amount: ₹{selectedReturn.itemDetails?.refundAmount * (selectedReturn.itemDetails?.quantity || 1) || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Return Status: <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedReturn.status)}`}>
                                            {selectedReturn.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </p>
                                    {selectedReturn.refundDetails && (
                                        <p className="text-sm text-gray-600">
                                            Refund Status: <span className={`px-2 py-1 rounded-full text-xs ${getRefundStatusColor(selectedReturn.refundDetails.refundStatus)}`}>
                                                {selectedReturn.refundDetails.refundStatus.toUpperCase()}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {selectedReturn.refundDetails && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Refund Information</h4>
                                        <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                            <p className="text-sm text-gray-600">
                                                Status: <span className="font-medium">{selectedReturn.refundDetails.refundStatus}</span>
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Method: <span className="font-medium">{selectedReturn.refundDetails.refundMethod}</span>
                                            </p>
                                            {selectedReturn.refundDetails.refundId && (
                                                <p className="text-sm text-gray-600">
                                                    Transaction ID: <span className="font-medium">{selectedReturn.refundDetails.refundId}</span>
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-600">
                                                Amount: <span className="font-medium">₹{selectedReturn.refundDetails.actualRefundAmount || 0}</span>
                                            </p>
                                            {selectedReturn.refundDetails.refundDate && (
                                                <p className="text-sm text-gray-600">
                                                    Date: <span className="font-medium">{formatDate(selectedReturn.refundDetails.refundDate)}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {(selectedReturn.status === 'REQUESTED' || selectedReturn.status === 'pending') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Admin Response (Optional)
                                        </label>
                                        <textarea
                                            value={adminResponse}
                                            onChange={(e) => setAdminResponse(e.target.value)}
                                            placeholder="Add comments for the customer..."
                                            rows="3"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <div className="flex space-x-3 mt-3">
                                            <button
                                                onClick={() => processReturnRequest(selectedReturn._id, 'approve', adminResponse)}
                                                disabled={processing[selectedReturn._id]}
                                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                                            >
                                                Approve Return
                                            </button>
                                            <button
                                                onClick={() => processReturnRequest(selectedReturn._id, 'reject', adminResponse)}
                                                disabled={processing[selectedReturn._id]}
                                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                                            >
                                                Reject Return
                                            </button>
                                        </div>
                                    </div>
                                )}
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
