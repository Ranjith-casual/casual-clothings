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
    FaFilter,
    FaPercentage,
    FaTag
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

    // Size-based price calculation utility function
    const calculateSizeBasedPrice = (item, productInfo = null) => {
        try {
            const size = item?.size;
            
            // If no size, return original price
            if (!size) {
                return item?.itemTotal || 
                       (productInfo?.price || productInfo?.bundlePrice || 0) * (item?.quantity || 1);
            }

            // Check if product has size-based pricing
            const product = productInfo || item?.productId || item?.bundleId || item?.productDetails || item?.bundleDetails;
            
            if (product && product.sizePricing && typeof product.sizePricing === 'object') {
                // Direct size-price mapping
                const sizePrice = product.sizePricing[size] || product.sizePricing[size.toUpperCase()] || product.sizePricing[size.toLowerCase()];
                if (sizePrice) {
                    return sizePrice * (item?.quantity || 1);
                }
            }

            // Check for size variants array
            if (product && product.variants && Array.isArray(product.variants)) {
                const sizeVariant = product.variants.find(variant => 
                    variant.size === size || 
                    variant.size === size.toUpperCase() || 
                    variant.size === size.toLowerCase()
                );
                if (sizeVariant && sizeVariant.price) {
                    return sizeVariant.price * (item?.quantity || 1);
                }
            }

            // Check for size multipliers
            const sizeMultipliers = {
                'XS': 0.9,
                'S': 1.0,
                'M': 1.1,
                'L': 1.2,
                'XL': 1.3,
                'XXL': 1.4,
                '28': 0.9,
                '30': 1.0,
                '32': 1.1,
                '34': 1.2,
                '36': 1.3,
                '38': 1.4,
                '40': 1.5,
                '42': 1.6
            };

            const basePrice = product?.price || product?.bundlePrice || 0;
            const multiplier = sizeMultipliers[size] || sizeMultipliers[size.toUpperCase()] || 1.0;
            
            return (basePrice * multiplier) * (item?.quantity || 1);

        } catch (error) {
            console.error('Error calculating size-based price:', error);
            // Fallback to original pricing
            return item?.itemTotal || 
                   (productInfo?.price || productInfo?.bundlePrice || 0) * (item?.quantity || 1);
        }
    };

    // Get size-based unit price
    const getSizeBasedUnitPrice = (item, productInfo = null) => {
        const totalPrice = calculateSizeBasedPrice(item, productInfo);
        return totalPrice / (item?.quantity || 1);
    };

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

    // Calculate pricing details with discount information for payment management
    const calculateItemPricingDetails = (item, productInfo = null) => {
        try {
            const product = productInfo || item?.productId || item?.bundleId || item?.productDetails || item?.bundleDetails;
            
            // Get original price before any discounts
            let originalPrice = 0;
            let finalPrice = 0;
            let discountPercentage = 0;
            
            if (item.itemType === 'product' || !item.itemType) {
                // For products, check for stored discounted price first
                if (product?.discountedPrice && product.discountedPrice > 0) {
                    finalPrice = product.discountedPrice;
                    originalPrice = product?.price || finalPrice;
                } else if (product?.price) {
                    originalPrice = product.price;
                    // Apply discount if available
                    discountPercentage = product?.discount || 0;
                    finalPrice = discountPercentage > 0 ? originalPrice * (1 - discountPercentage / 100) : originalPrice;
                } else {
                    // Fallback to calculated size-based price
                    finalPrice = getSizeBasedUnitPrice(item, productInfo);
                    originalPrice = finalPrice;
                }
            } else if (item.itemType === 'bundle') {
                // For bundles
                finalPrice = product?.bundlePrice || 0;
                originalPrice = product?.originalPrice || finalPrice;
            }
            
            // Recalculate discount if we have both prices
            if (originalPrice > finalPrice && originalPrice > 0) {
                discountPercentage = ((originalPrice - finalPrice) / originalPrice) * 100;
            }
            
            const discountAmount = Math.max(0, originalPrice - finalPrice);
            
            return {
                originalPrice,
                finalPrice,
                discountAmount,
                discountPercentage: Math.round(discountPercentage),
                hasDiscount: discountAmount > 0,
                isBundle: item.itemType === 'bundle'
            };
        } catch (error) {
            console.error('Error calculating pricing details:', error);
            const fallbackPrice = getSizeBasedUnitPrice(item, productInfo);
            return {
                originalPrice: fallbackPrice,
                finalPrice: fallbackPrice,
                discountAmount: 0,
                discountPercentage: 0,
                hasDiscount: false,
                isBundle: false
            };
        }
    };

    // Calculate total discount savings for an order
    const calculateOrderDiscountSavings = (payment) => {
        let totalSavings = 0;
        let totalOriginalAmount = 0;
        let totalFinalAmount = 0;

        if (payment.items && payment.items.length > 0) {
            payment.items.forEach(item => {
                const productInfo = item?.productId || item?.bundleId;
                const pricingDetails = calculateItemPricingDetails(item, productInfo);
                const quantity = item.quantity || 1;
                
                totalOriginalAmount += pricingDetails.originalPrice * quantity;
                totalFinalAmount += pricingDetails.finalPrice * quantity;
                totalSavings += pricingDetails.discountAmount * quantity;
            });
        }

        return {
            totalSavings,
            totalOriginalAmount,
            totalFinalAmount,
            hasSavings: totalSavings > 0,
            savingsPercentage: totalOriginalAmount > 0 ? Math.round((totalSavings / totalOriginalAmount) * 100) : 0
        };
    };

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
                                        <div className="flex items-center">
                                            <FaRupeeSign className="mr-1" />
                                            Amount & Discounts
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Delivery Status
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
                                        <td colSpan="7" className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
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
                                                    {/* Display product sizes and discount info */}
                                                    {payment.items && payment.items.length > 0 && (
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            <span className="text-gray-500">Sizes: </span>
                                                            {(() => {
                                                                // Extract unique sizes from items
                                                                const sizes = payment.items
                                                                    .map(item => item.size)
                                                                    .filter(size => size)
                                                                    .filter((size, index, arr) => arr.indexOf(size) === index)
                                                                    .slice(0, 3); // Limit to first 3 sizes
                                                                
                                                                if (sizes.length === 0) return 'N/A';
                                                                
                                                                return sizes.map((size, index) => (
                                                                    <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs mr-1">
                                                                        {size}
                                                                    </span>
                                                                ));
                                                            })()}
                                                            {payment.items.map(item => item.size).filter(size => size).length > 3 && (
                                                                <span className="text-gray-400 text-xs">+{payment.items.map(item => item.size).filter(size => size).length - 3} more</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Display individual item discount information */}
                                                    {payment.items && payment.items.length > 0 && (() => {
                                                        const itemsWithDiscount = payment.items
                                                            .map(item => {
                                                                const productInfo = item?.productId || item?.bundleId;
                                                                const pricingDetails = calculateItemPricingDetails(item, productInfo);
                                                                return { item, pricingDetails };
                                                            })
                                                            .filter(({ pricingDetails }) => pricingDetails.hasDiscount);
                                                        
                                                        if (itemsWithDiscount.length > 0) {
                                                            return (
                                                                <div className="text-xs text-green-600 mt-1 space-y-0.5">
                                                                    {itemsWithDiscount.slice(0, 2).map(({ item, pricingDetails }, index) => {
                                                                        const productName = item.productId?.name || item.bundleId?.title || 'Item';
                                                                        const displayName = productName.length > 15 ? productName.substring(0, 15) + '...' : productName;
                                                                        
                                                                        return (
                                                                            <div key={index} className="flex items-center justify-between">
                                                                                <span className="text-gray-600">{displayName}:</span>
                                                                                <div className="flex items-center space-x-1">
                                                                                    <span className="line-through text-gray-400 text-xs">
                                                                                        ₹{pricingDetails.originalPrice}
                                                                                    </span>
                                                                                    <span className="text-green-600 font-medium">
                                                                                        ₹{pricingDetails.finalPrice}
                                                                                    </span>
                                                                                    <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                                                                                        {pricingDetails.discountPercentage}%
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {itemsWithDiscount.length > 2 && (
                                                                        <div className="text-xs text-gray-500">
                                                                            +{itemsWithDiscount.length - 2} more items with discounts
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                    {payment.estimatedDeliveryDate && (
                                                        <div className="text-xs text-blue-600 mt-1">
                                                            Est. Delivery: {new Date(payment.estimatedDeliveryDate).toLocaleDateString('en-IN')}
                                                        </div>
                                                    )}
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
                                                {(() => {
                                                    // Calculate and display discount information
                                                    const discountSavings = calculateOrderDiscountSavings(payment);
                                                    
                                                    if (discountSavings.hasSavings) {
                                                        return (
                                                            <div className="mt-1">
                                                                <div className="text-xs text-green-600 font-medium">
                                                                    💰 You saved: {formatCurrency(discountSavings.totalSavings)}
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    Original: {formatCurrency(discountSavings.totalOriginalAmount)}
                                                                </div>
                                                                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                                                    {discountSavings.savingsPercentage}% OFF
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(() => {
                                                    // Get delivery status information
                                                    const getDeliveryInfo = () => {
                                                        // Check if order is cancelled
                                                        if (payment.orderStatus === 'CANCELLED' || payment.paymentStatus === 'REFUNDED') {
                                                            return {
                                                                status: 'Cancelled',
                                                                date: payment.estimatedDeliveryDate ? new Date(payment.estimatedDeliveryDate).toLocaleDateString('en-IN') : null,
                                                                color: 'bg-red-100 text-red-800',
                                                                icon: '❌'
                                                            };
                                                        }
                                                        
                                                        if (payment.actualDeliveryDate) {
                                                            return {
                                                                status: 'Delivered',
                                                                date: new Date(payment.actualDeliveryDate).toLocaleDateString('en-IN'),
                                                                color: 'bg-green-100 text-green-800',
                                                                icon: '✅'
                                                            };
                                                        }
                                                        
                                                        if (payment.estimatedDeliveryDate) {
                                                            const estimatedDate = new Date(payment.estimatedDeliveryDate);
                                                            const isOverdue = new Date() > estimatedDate;
                                                            
                                                            if (isOverdue) {
                                                                return {
                                                                    status: 'Overdue',
                                                                    date: estimatedDate.toLocaleDateString('en-IN'),
                                                                    color: 'bg-red-100 text-red-800',
                                                                    icon: '⚠️'
                                                                };
                                                            } else {
                                                                return {
                                                                    status: 'In Transit',
                                                                    date: estimatedDate.toLocaleDateString('en-IN'),
                                                                    color: 'bg-blue-100 text-blue-800',
                                                                    icon: '🚚'
                                                                };
                                                            }
                                                        }
                                                        
                                                        return {
                                                            status: 'Not Set',
                                                            date: null,
                                                            color: 'bg-gray-100 text-gray-800',
                                                            icon: '📦'
                                                        };
                                                    };
                                                    
                                                    const deliveryInfo = getDeliveryInfo();
                                                    
                                                    return (
                                                        <div>
                                                            <div className="flex items-center">
                                                                <span className="mr-1">{deliveryInfo.icon}</span>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${deliveryInfo.color}`}>
                                                                    {deliveryInfo.status}
                                                                </span>
                                                            </div>
                                                            {deliveryInfo.date && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {deliveryInfo.status === 'Delivered' ? 'Delivered: ' : 
                                                                     deliveryInfo.status === 'Cancelled' ? 'Was Expected: ' :
                                                                     deliveryInfo.status === 'Overdue' ? 'Expected: ' : 
                                                                     'Expected: '}{deliveryInfo.date}
                                                                </div>
                                                            )}
                                                            {payment.deliveryNotes && (
                                                                <div className="text-xs text-gray-400 mt-1 truncate max-w-32" title={payment.deliveryNotes}>
                                                                    {payment.deliveryNotes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
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
