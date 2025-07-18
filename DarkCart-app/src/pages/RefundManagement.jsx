import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaSearch, FaFilter, FaCheck, FaSpinner, FaTimes, FaMoneyBillWave, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';

const RefundManagement = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [processingRefundId, setProcessingRefundId] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [adminComments, setAdminComments] = useState('');

    // Fetch refunds with filters
    const fetchRefunds = async (page = 1) => {
        setLoading(true);
        try {
            const response = await Axios({
                ...SummaryApi.getAllRefunds,
                url: `${SummaryApi.getAllRefunds.url}?page=${page}&limit=10&status=${filterStatus}`
            });

            if (response.data.success) {
                setRefunds(response.data.data.refunds);
                setCurrentPage(response.data.data.currentPage);
                setTotalPages(response.data.data.totalPages);
            } else {
                toast.error("Failed to fetch refunds");
            }
        } catch (error) {
            console.error("Error fetching refunds:", error);
            toast.error(error.response?.data?.message || "Error fetching refunds");
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and when filters change
    useEffect(() => {
        fetchRefunds(1);
    }, [filterStatus]);

    // Handle search functionality
    const handleSearch = () => {
        fetchRefunds(1);
    };

    // Format date in readable format
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get color based on refund status
    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return 'text-yellow-600 bg-yellow-100';
            case 'PROCESSING':
                return 'text-blue-600 bg-blue-100';
            case 'COMPLETED':
                return 'text-green-600 bg-green-100';
            case 'FAILED':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
            fetchRefunds(newPage);
        }
    };

    // Handle refund completion
    const handleCompleteRefund = async () => {
        if (!selectedRefund) return;

        setProcessingRefundId(selectedRefund._id);
        
        try {
            const response = await Axios({
                ...SummaryApi.completeRefund,
                data: {
                    requestId: selectedRefund._id,
                    transactionId: transactionId || `REF-${Date.now()}`,
                    adminComments: adminComments
                }
            });

            if (response.data.success) {
                toast.success("Refund processed successfully");
                setShowCompleteModal(false);
                setSelectedRefund(null);
                setTransactionId('');
                setAdminComments('');
                fetchRefunds(currentPage);
            } else {
                toast.error(response.data.message || "Failed to process refund");
            }
        } catch (error) {
            console.error("Error processing refund:", error);
            toast.error(error.response?.data?.message || "Error processing refund");
        } finally {
            setProcessingRefundId(null);
        }
    };

    // View refund details modal
    const RefundDetailsModal = ({ refund, onClose }) => {
        if (!refund) return null;

        const order = refund.orderId || {};
        const user = refund.userId || {};
        const refundDetails = refund.refundDetails || {};
        const adminResponse = refund.adminResponse || {};

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Refund Details</h2>
                            <button 
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        {/* Refund Status */}
                        <div className="flex flex-wrap items-center mb-6">
                            <div className="w-full mb-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(refundDetails.refundStatus)}`}>
                                    {refundDetails.refundStatus || 'PROCESSING'}
                                </span>
                                <p className="text-sm text-gray-500 mt-1">
                                    Request Date: {formatDate(refund.requestDate)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Order Details */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-3">Order Details</h3>
                                <p><span className="font-medium">Order ID:</span> {order.orderId}</p>
                                <p><span className="font-medium">Order Date:</span> {formatDate(order.orderDate)}</p>
                                <p><span className="font-medium">Order Status:</span> {order.orderStatus}</p>
                                <p><span className="font-medium">Payment Method:</span> {order.paymentMethod}</p>
                                <p><span className="font-medium">Payment Status:</span> {order.paymentStatus}</p>
                                <p><span className="font-medium">Total Amount:</span> {DisplayPriceInRupees(order.totalAmt)}</p>
                            </div>

                            {/* Customer Details */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-3">Customer Details</h3>
                                <p><span className="font-medium">Name:</span> {user.name}</p>
                                <p><span className="font-medium">Email:</span> {user.email}</p>
                                <p><span className="font-medium">Cancellation Reason:</span> {refund.reason}</p>
                                {refund.additionalReason && (
                                    <p><span className="font-medium">Additional Information:</span> {refund.additionalReason}</p>
                                )}
                            </div>

                            {/* Refund Details */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-3">Refund Information</h3>
                                <p><span className="font-medium">Refund Status:</span> {refundDetails.refundStatus || 'PROCESSING'}</p>
                                <p><span className="font-medium">Refund Percentage:</span> {adminResponse.refundPercentage}%</p>
                                <p><span className="font-medium">Refund Amount:</span> {DisplayPriceInRupees(adminResponse.refundAmount)}</p>
                                
                                {refundDetails.refundId && (
                                    <>
                                        <p><span className="font-medium">Refund ID:</span> {refundDetails.refundId}</p>
                                        <p><span className="font-medium">Refund Date:</span> {formatDate(refundDetails.refundDate)}</p>
                                    </>
                                )}

                                {adminResponse.adminComments && (
                                    <p><span className="font-medium">Admin Comments:</span> {adminResponse.adminComments}</p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex justify-end space-x-3">
                            <button 
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Close
                            </button>
                            
                            {refundDetails.refundStatus === 'PROCESSING' && (
                                <button 
                                    onClick={() => {
                                        setSelectedRefund(refund);
                                        setShowCompleteModal(true);
                                        onClose();
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                                >
                                    <FaCheck className="mr-2" /> Complete Refund
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Complete Refund Modal
    const CompleteRefundModal = () => {
        if (!selectedRefund) return null;
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-6">Complete Refund Process</h2>
                        
                        <div className="mb-4">
                            <p className="mb-2">
                                <span className="font-medium">Order ID:</span> {selectedRefund.orderId?.orderId}
                            </p>
                            <p className="mb-2">
                                <span className="font-medium">Customer:</span> {selectedRefund.userId?.name}
                            </p>
                            <p className="mb-2">
                                <span className="font-medium">Refund Amount:</span> {DisplayPriceInRupees(selectedRefund.adminResponse?.refundAmount)}
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Transaction ID (Optional)</label>
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="Enter refund transaction ID"
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                A random ID will be generated if not provided
                            </p>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">Admin Comments (Optional)</label>
                            <textarea
                                value={adminComments}
                                onChange={(e) => setAdminComments(e.target.value)}
                                placeholder="Any additional comments about this refund"
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => {
                                    setShowCompleteModal(false);
                                    setTransactionId('');
                                    setAdminComments('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                disabled={processingRefundId === selectedRefund._id}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCompleteRefund}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                                disabled={processingRefundId === selectedRefund._id}
                            >
                                {processingRefundId === selectedRefund._id ? (
                                    <>
                                        <FaSpinner className="mr-2 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck className="mr-2" /> Complete Refund
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <h1 className="text-2xl font-bold mb-4 md:mb-0">Refund Management</h1>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="flex">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by order ID"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="text-gray-400" />
                                </div>
                            </div>
                            <button
                                onClick={handleSearch}
                                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Search
                            </button>
                        </div>

                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="FAILED">Failed</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaFilter className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Refunds Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center">
                                            <FaSpinner className="animate-spin mr-2" />
                                            Loading refunds...
                                        </div>
                                    </td>
                                </tr>
                            ) : refunds.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        No refund requests found
                                    </td>
                                </tr>
                            ) : (
                                refunds.map((refund) => (
                                    <tr key={refund._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">
                                                {refund.orderId?.orderId || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900">
                                                {refund.userId?.name || 'Unknown'}
                                            </div>
                                            <div className="text-gray-500 text-sm">
                                                {refund.userId?.email || 'No email'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900 font-medium">
                                                {DisplayPriceInRupees(refund.adminResponse?.refundAmount || 0)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900">
                                                {formatDate(refund.requestDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(refund.refundDetails?.refundStatus || 'PROCESSING')}`}>
                                                {refund.refundDetails?.refundStatus || 'PROCESSING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setSelectedRefund(refund)}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center"
                                                    title="View Details"
                                                >
                                                    <FaEye className="mr-1" /> View
                                                </button>
                                                
                                                {refund.refundDetails?.refundStatus === 'PROCESSING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRefund(refund);
                                                            setShowCompleteModal(true);
                                                        }}
                                                        className="text-green-600 hover:text-green-900 flex items-center"
                                                        title="Complete Refund"
                                                    >
                                                        <FaMoneyBillWave className="mr-1" /> Complete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-700">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded ${
                                    currentPage === 1 
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded ${
                                    currentPage === totalPages 
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedRefund && !showCompleteModal && (
                <RefundDetailsModal
                    refund={selectedRefund}
                    onClose={() => setSelectedRefund(null)}
                />
            )}

            {/* Complete Refund Modal */}
            {showCompleteModal && (
                <CompleteRefundModal />
            )}
        </div>
    );
};

export default RefundManagement;
