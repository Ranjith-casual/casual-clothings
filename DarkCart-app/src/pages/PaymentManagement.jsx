import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'
import { 
    FaSearch, 
    FaDownload, 
    FaEye, 
    FaCreditCard, 
    FaMoneyBillWave, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaUndoAlt,
    FaCog,
    FaFileInvoice,
    FaCalendarAlt,
    FaRupeeSign,
    FaFilter
} from 'react-icons/fa'
import InvoiceModal from '../components/InvoiceModal'
import PaymentGatewaySettings from '../components/PaymentGatewaySettings'
import PaymentStatsCards from '../components/PaymentStatsCards'

function PaymentManagement() {
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterMethod, setFilterMethod] = useState('all')
    const [filterDate, setFilterDate] = useState('all')
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const user = useSelector((state) => state?.user)

    const fetchPayments = async (page = 1) => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getAllPayments,
                data: {
                    page,
                    limit: 15,
                    search: searchTerm,
                    status: filterStatus === 'all' ? undefined : filterStatus,
                    method: filterMethod === 'all' ? undefined : filterMethod,
                    dateFilter: filterDate === 'all' ? undefined : filterDate
                }
            })

            if (response.data.success) {
                setPayments(response.data.data.payments)
                setTotalPages(response.data.data.totalPages)
                setCurrentPage(page)
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPayments()
    }, [searchTerm, filterStatus, filterMethod, filterDate])

    const handleViewInvoice = (payment) => {
        setSelectedPayment(payment)
        setShowInvoiceModal(true)
    }

    const handleDownloadInvoice = async (payment) => {
        try {
            const response = await Axios({
                ...SummaryApi.downloadInvoice,
                data: { orderId: payment.orderId },
                responseType: 'blob'
            })

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `invoice-${payment.orderId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            
            toast.success('Invoice downloaded successfully')
        } catch (error) {
            AxiosTostError(error)
        }
    }

    const handleRefundPayment = async (paymentId) => {
        if (!window.confirm('Are you sure you want to initiate a refund for this payment?')) {
            return
        }

        try {
            const response = await Axios({
                ...SummaryApi.initiateRefund,
                data: { paymentId }
            })

            if (response.data.success) {
                toast.success(response.data.message)
                fetchPayments(currentPage)
            }
        } catch (error) {
            AxiosTostError(error)
        }
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
            case 'successful':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'refunded':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'cash on delivery':
                return 'bg-orange-100 text-orange-800 border-orange-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getMethodIcon = (method) => {
        switch (method?.toLowerCase()) {
            case 'cash on delivery':
                return <FaMoneyBillWave className="text-orange-600" />
            case 'razorpay':
            case 'credit card':
            case 'debit card':
                return <FaCreditCard className="text-blue-600" />
            default:
                return <FaCreditCard className="text-gray-600" />
        }
    }

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
            case 'successful':
                return <FaCheckCircle className="text-green-600" />
            case 'failed':
                return <FaTimesCircle className="text-red-600" />
            case 'refunded':
                return <FaUndoAlt className="text-blue-600" />
            default:
                return <FaTimesCircle className="text-yellow-600" />
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount)
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 max-w-7xl">
                {/* Header */}
                <div className="bg-black text-white p-6 rounded-lg shadow-md mb-6">
                    <h1 className="text-2xl font-bold font-serif mb-2">Payments & Transactions</h1>
                    <p className="text-gray-300 text-sm">
                        Manage payment history, gateway settings, and generate invoices
                    </p>
                </div>

                {/* Payment Statistics Cards */}
                <PaymentStatsCards />

                {/* Filters and Search */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Amount..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                            <option value="cash on delivery">COD</option>
                        </select>

                        {/* Method Filter */}
                        <select
                            value={filterMethod}
                            onChange={(e) => setFilterMethod(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="all">All Methods</option>
                            <option value="cash on delivery">Cash on Delivery</option>
                            <option value="razorpay">Razorpay</option>
                            <option value="credit card">Credit Card</option>
                            <option value="debit card">Debit Card</option>
                            <option value="upi">UPI</option>
                            <option value="net banking">Net Banking</option>
                        </select>

                        {/* Date Filter */}
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                        </select>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSettingsModal(true)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
                                title="Payment Gateway Settings"
                            >
                                <FaCog />
                            </button>
                            <button
                                onClick={() => fetchPayments(currentPage)}
                                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
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
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            No payments found
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((payment) => (
                                        <tr key={payment._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        #{payment.orderId}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Customer: {payment.customerName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Items: {payment.totalQuantity}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {getMethodIcon(payment.paymentMethod)}
                                                    <div className="ml-2">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {payment.paymentMethod || 'Cash on Delivery'}
                                                        </div>
                                                        {payment.paymentId && (
                                                            <div className="text-sm text-gray-500">
                                                                ID: {payment.paymentId}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(payment.totalAmt)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Subtotal: {formatCurrency(payment.subTotalAmt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {getStatusIcon(payment.paymentStatus)}
                                                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(payment.paymentStatus)}`}>
                                                        {payment.paymentStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <FaCalendarAlt className="mr-1" />
                                                    {new Date(payment.orderDate).toLocaleDateString('en-IN')}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(payment.orderDate).toLocaleTimeString('en-IN')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewInvoice(payment)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Invoice"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadInvoice(payment)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Download Invoice"
                                                    >
                                                        <FaDownload />
                                                    </button>
                                                   
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
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => fetchPayments(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => fetchPayments(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Page <span className="font-medium">{currentPage}</span> of{' '}
                                        <span className="font-medium">{totalPages}</span>
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => fetchPayments(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    page === currentPage
                                                        ? 'z-10 bg-black border-black text-white'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showInvoiceModal && (
                <InvoiceModal
                    payment={selectedPayment}
                    onClose={() => setShowInvoiceModal(false)}
                />
            )}

            {showSettingsModal && (
                <PaymentGatewaySettings
                    onClose={() => setShowSettingsModal(false)}
                />
            )}
        </div>
    )
}

export default PaymentManagement
