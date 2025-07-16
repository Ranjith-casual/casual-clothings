import React, { useState, useEffect } from 'react'
import { FaEye, FaCheck, FaTimes, FaSearch, FaFilter, FaRupeeSign, FaClock, FaUser, FaCalendarAlt, FaInfo } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'

function CancellationManagement() {
    const [cancellationRequests, setCancellationRequests] = useState([])
    const [filteredRequests, setFilteredRequests] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchCancellationRequests()
    }, [])

    useEffect(() => {
        filterRequests()
    }, [cancellationRequests, searchTerm, statusFilter])

    const fetchCancellationRequests = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            const response = await Axios({
                ...SummaryApi.getCancellationRequests,
                headers: {
                    authorization: `Bearer ${token}`
                }
            })
            if (response.data.success) {
                // The data structure from the API is response.data.data.requests
                setCancellationRequests(response.data.data?.requests || [])
            }
        } catch (error) {
            AxiosTostError(error)
            setCancellationRequests([]) // Set empty array on error
        } finally {
            setLoading(false)
        }
    }

    const filterRequests = () => {
        let filtered = Array.isArray(cancellationRequests) ? cancellationRequests : []

        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(request => 
                request.orderId.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.userId.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.userId.email?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filter by status
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(request => request.status === statusFilter)
        }

        // Sort by creation date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        setFilteredRequests(filtered)
    }

    const handleProcessRequest = async (requestId, action, adminComments = '') => {
        setActionLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            const response = await Axios({
                ...SummaryApi.processCancellationRequest,
                headers: {
                    authorization: `Bearer ${token}`
                },
                data: {
                    requestId,
                    action,
                    adminComments,
                    customRefundPercentage: 75 // Setting fixed 75% refund percentage
                }
            })

            if (response.data.success) {
                toast.success(`Cancellation request ${action.toLowerCase()} successfully!`)
                fetchCancellationRequests()
                setShowDetailsModal(false)
                
                // Store notification for the user about the refund
                if (action === 'APPROVED' && selectedRequest?.userId) {
                    const userId = selectedRequest.userId._id || selectedRequest.userId;
                    const orderId = selectedRequest.orderId._id || selectedRequest.orderId;
                    const orderNumber = selectedRequest.orderId.orderId || 'N/A';
                    const refundAmount = (selectedRequest.orderId.totalAmt * 0.75).toFixed(2);
                    
                    // Create notification
                    const notification = {
                        id: `cancel-${orderId}-${Date.now()}`,
                        type: 'refund',
                        title: `Refund Processed for Order #${orderNumber}`,
                        message: `Your cancellation request has been approved. A refund of ₹${refundAmount} (75% of order amount) will be processed to your original payment method within 5-7 business days.`,
                        time: new Date().toISOString(),
                        read: false,
                        refundAmount: refundAmount,
                        orderNumber: orderNumber
                    };
                    
                    // Store notification in local storage
                    const existingNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
                    localStorage.setItem(`notifications_${userId}`, JSON.stringify([notification, ...existingNotifications]));
                    
                    // Trigger storage event for cross-tab notification
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: `notifications_${userId}`,
                        newValue: JSON.stringify([notification, ...existingNotifications])
                    }));
                    
                    // Display a toast message showing the refund amount
                    toast.success(`Refund amount: ₹${refundAmount} (75% of total)`, {
                        duration: 5000,
                        style: {
                            background: '#F0FFF4',
                            color: '#22543D',
                            fontWeight: 'bold',
                            border: '1px solid #C6F6D5'
                        },
                        icon: '💰'
                    });
                    
                    // Send email notification to user
                    try {
                        const userEmail = selectedRequest.userId.email;
                        if (userEmail) {
                            await Axios({
                                ...SummaryApi.sendRefundEmail,
                                headers: {
                                    authorization: `Bearer ${token}`
                                },
                                data: {
                                    email: userEmail,
                                    subject: `Refund Processed for Order #${orderNumber}`,
                                    orderNumber: orderNumber,
                                    refundAmount: refundAmount,
                                    refundPercentage: 75,
                                    orderAmount: selectedRequest.orderId.totalAmt.toFixed(2),
                                    userName: selectedRequest.userId.name || 'Customer',
                                    products: selectedRequest.orderId.products || [],
                                    cancellationReason: selectedRequest.reason || 'Not provided',
                                    paymentMethod: selectedRequest.orderId.paymentType || 'Not available'
                                }
                            });
                            
                            toast.success('Email notification sent to customer');
                        }
                    } catch (emailError) {
                        console.error('Failed to send email notification:', emailError);
                    }
                }
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            APPROVED: 'bg-green-100 text-green-800 border-green-200',
            REJECTED: 'bg-red-100 text-red-800 border-red-200',
            PROCESSED: 'bg-blue-100 text-blue-800 border-blue-200'
        }
        return `px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`
    }

    const getPriorityColor = (createdAt) => {
        const hoursSinceCreated = (new Date() - new Date(createdAt)) / (1000 * 60 * 60)
        if (hoursSinceCreated > 48) return 'text-red-500' // Overdue
        if (hoursSinceCreated > 24) return 'text-orange-500' // Urgent
        return 'text-green-500' // Normal
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const CancellationDetailsModal = () => {
        const [adminNotes, setAdminNotes] = useState('')

        if (!selectedRequest) return null

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b">
                        <h2 className="text-xl font-bold">Cancellation Request Details</h2>
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Request Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-3">Request Information</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Request ID:</span>
                                        <span className="font-medium">#{selectedRequest._id.slice(-8)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className={getStatusBadge(selectedRequest.status)}>{selectedRequest.status}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Requested On:</span>
                                        <span className="font-medium">{formatDate(selectedRequest.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Customer:</span>
                                        <span className="font-medium">{selectedRequest.userId?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Email:</span>
                                        <span className="font-medium">{selectedRequest.userId?.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-3">Order Information</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Order ID:</span>
                                        <span className="font-medium">#{selectedRequest.orderId?.orderId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Order Amount:</span>
                                        <span className="font-medium">₹{selectedRequest.orderId?.totalAmt?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Order Date:</span>
                                        <span className="font-medium">{formatDate(selectedRequest.orderId?.orderDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment Method:</span>
                                        <span className="font-medium">{selectedRequest.orderId?.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Order Status:</span>
                                        <span className="font-medium">{selectedRequest.orderId?.orderStatus}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cancellation Reason */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3">Cancellation Reason</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-2">
                                    <span className="font-medium">Primary Reason: </span>
                                    <span>{selectedRequest.reason}</span>
                                </div>
                                {selectedRequest.additionalReason && (
                                    <div>
                                        <span className="font-medium">Additional Details: </span>
                                        <span>{selectedRequest.additionalReason}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Refund Calculation */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3">Refund Information</h3>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600">Original Amount</div>
                                        <div className="text-lg font-bold">₹{selectedRequest.orderId?.totalAmt?.toFixed(2)}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600">Refund Percentage</div>
                                        <div className="text-lg font-bold text-blue-600">75%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600">Refund Amount</div>
                                        <div className="text-lg font-bold text-green-600">₹{(selectedRequest.orderId?.totalAmt * 0.75)?.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Admin Response Section */}
                        {selectedRequest.status === 'PENDING' && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-lg mb-3">Admin Response</h3>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <FaInfo className="text-blue-500" />
                                        <span className="font-medium">Refund Policy: 75% of order amount will be refunded</span>
                                    </div>
                                    <p className="text-sm text-blue-600 mt-1">
                                        Upon approval, the customer will receive a 75% refund of the total order amount (₹{(selectedRequest.orderId?.totalAmt * 0.75)?.toFixed(2)}).
                                        This information will be sent to the customer's email.
                                    </p>
                                </div>
                                <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Admin Notes (Optional)
                                        </label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="3"
                                            placeholder="Add any notes or comments for this decision..."
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleProcessRequest(selectedRequest._id, 'APPROVED', adminNotes)}
                                            disabled={actionLoading}
                                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FaCheck />
                                            {actionLoading ? 'Processing...' : 'Approve Cancellation'}
                                        </button>
                                        <button
                                            onClick={() => handleProcessRequest(selectedRequest._id, 'REJECTED', adminNotes)}
                                            disabled={actionLoading}
                                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FaTimes />
                                            {actionLoading ? 'Processing...' : 'Reject Cancellation'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Previous Admin Response */}
                        {selectedRequest.adminResponse && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-lg mb-3">Admin Response</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="mb-2">
                                        <span className="font-medium">Decision: </span>
                                        <span className={getStatusBadge(selectedRequest.status)}>{selectedRequest.status}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-medium">Response Date: </span>
                                        <span>{formatDate(selectedRequest.adminResponse.respondedAt)}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-medium">Refund Percentage: </span>
                                        <span className="text-blue-600 font-medium">75%</span>
                                    </div>
                                    {selectedRequest.status === 'APPROVED' && (
                                        <div className="mb-2">
                                            <span className="font-medium">Email Sent: </span>
                                            <span className="text-green-600">Refund information sent to customer</span>
                                        </div>
                                    )}
                                    {selectedRequest.adminResponse.notes && (
                                        <div>
                                            <span className="font-medium">Admin Notes: </span>
                                            <span>{selectedRequest.adminResponse.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Cancellation Management</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="PROCESSED">Processed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-600 text-sm font-medium">Pending</p>
                            <p className="text-2xl font-bold text-yellow-800">
                                {Array.isArray(cancellationRequests) ? cancellationRequests.filter(r => r.status === 'PENDING').length : 0}
                            </p>
                        </div>
                        <FaClock className="text-yellow-600 text-2xl" />
                    </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">Approved</p>
                            <p className="text-2xl font-bold text-green-800">
                                {Array.isArray(cancellationRequests) ? cancellationRequests.filter(r => r.status === 'APPROVED').length : 0}
                            </p>
                        </div>
                        <FaCheck className="text-green-600 text-2xl" />
                    </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-600 text-sm font-medium">Rejected</p>
                            <p className="text-2xl font-bold text-red-800">
                                {Array.isArray(cancellationRequests) ? cancellationRequests.filter(r => r.status === 'REJECTED').length : 0}
                            </p>
                        </div>
                        <FaTimes className="text-red-600 text-2xl" />
                    </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium">Processed</p>
                            <p className="text-2xl font-bold text-blue-800">
                                {Array.isArray(cancellationRequests) ? cancellationRequests.filter(r => r.status === 'PROCESSED').length : 0}
                            </p>
                        </div>
                        <FaRupeeSign className="text-blue-600 text-2xl" />
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Request Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order Info
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Refund Amount
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
                                    <td colSpan="6" className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No cancellation requests found
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request) => (
                                    <tr key={request._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{request._id.slice(-8)}
                                                </div>
                                                <div className={`text-sm ${getPriorityColor(request.createdAt)}`}>
                                                    {formatDate(request.createdAt)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {request.reason}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {request.userId?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {request.userId?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{request.orderId?.orderId}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ₹{request.orderId?.totalAmt?.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {request.orderId?.orderStatus}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-green-600">
                                                ₹{(request.orderId?.totalAmt * 0.75)?.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                75% of order
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={getStatusBadge(request.status)}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request)
                                                    setShowDetailsModal(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                            >
                                                <FaEye />
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showDetailsModal && <CancellationDetailsModal />}
        </div>
    )
}

export default CancellationManagement
