import React, { useState, useEffect } from 'react'
import { FaTimes, FaFileInvoice, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaPhone } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

function InvoiceModal({ payment: originalPayment, onClose }) {
    const [enhancedPayment, setEnhancedPayment] = useState(null)
    const [loadingBundles, setLoadingBundles] = useState(false)
    
    if (!originalPayment) return null
    
    // Enhanced bundle fetching logic
    useEffect(() => {
        const enhancePaymentWithBundles = async () => {
            setLoadingBundles(true)
            
            // Create a copy of payment and ensure refundDetails exists
            const payment = {
                ...originalPayment,
                refundDetails: originalPayment.refundDetails || {}
            };
            
            // Calculate refund and retained amounts if not already set
            console.log('Original payment data:', originalPayment);
            console.log('Original refund details:', originalPayment.refundDetails);
            
            if (payment.paymentStatus && (
                payment.paymentStatus.includes('REFUND') || 
                payment.paymentStatus === 'REFUND_SUCCESSFUL' || 
                payment.paymentStatus.toLowerCase().includes('refund')
            )) {
                // Ensure refundDetails exists
                if (!payment.refundDetails) {
                    payment.refundDetails = {};
                }
                
                console.log('Before calculation - refundDetails:', payment.refundDetails);
                
                // If we have a refund percentage but no refund amount, calculate it
                if (typeof payment.refundDetails.refundPercentage !== 'undefined' && !payment.refundDetails.refundAmount) {
                    const percentage = parseFloat(payment.refundDetails.refundPercentage) || 0;
                    payment.refundDetails.refundAmount = (payment.totalAmt || 0) * (percentage / 100);
                }
                
                // If we have refund amount but no percentage, calculate it
                if (payment.refundDetails.refundAmount && typeof payment.refundDetails.refundPercentage === 'undefined') {
                    payment.refundDetails.refundPercentage = ((payment.refundDetails.refundAmount / (payment.totalAmt || 1)) * 100).toFixed(0);
                }
                
                // Calculate retained amount if not set
                if (!payment.refundDetails.retainedAmount) {
                    payment.refundDetails.retainedAmount = (payment.totalAmt || 0) - (payment.refundDetails.refundAmount || 0);
                }
                
                // Default to 75% refund if no percentage is set
                if (typeof payment.refundDetails.refundPercentage === 'undefined' || payment.refundDetails.refundPercentage === null) {
                    payment.refundDetails.refundPercentage = 75;
                    payment.refundDetails.refundAmount = (payment.totalAmt || 0) * 0.75;
                    payment.refundDetails.retainedAmount = (payment.totalAmt || 0) * 0.25;
                }
                
                console.log('After calculation - refundDetails:', payment.refundDetails);
            }
            
            // Enhanced bundle detection and fetching
            if (payment.items && payment.items.length > 0) {
                const enhancedItems = await Promise.all(
                    payment.items.map(async (item) => {
                        // Check if this is a bundle that needs enhancement
                        const isBundle = item.itemType === 'bundle' || 
                                       (item.bundleId && typeof item.bundleId === 'object') ||
                                       (item.bundleDetails && typeof item.bundleDetails === 'object') ||
                                       (typeof item.bundleId === 'string' && item.bundleId) ||
                                       (item.type === 'Bundle') ||
                                       (item.productType === 'bundle');
                        
                        if (isBundle) {
                            let bundleIdToFetch = null;
                            
                            // Extract bundle ID from various possible sources
                            if (typeof item.bundleId === 'string' && item.bundleId) {
                                bundleIdToFetch = item.bundleId;
                            } else if (typeof item.bundleId === 'object' && item.bundleId && item.bundleId._id) {
                                bundleIdToFetch = item.bundleId._id;
                            } else if (typeof item.bundleId === 'object' && item.bundleId && item.bundleId.id) {
                                bundleIdToFetch = item.bundleId.id;
                            }
                            
                            // Check if we need to fetch bundle details
                            const needsBundleDetails = bundleIdToFetch && (
                                !item.productDetails || 
                                (typeof item.productDetails === 'object' && (!item.productDetails.length || item.productDetails.length === 0)) ||
                                (Array.isArray(item.productDetails) && item.productDetails.length === 0) ||
                                (item.productDetails && typeof item.productDetails === 'object' && Object.keys(item.productDetails).length <= 1)
                            );
                            
                            if (needsBundleDetails) {
                                // Bundle ID exists but bundle details are incomplete, need to fetch bundle details
                                try {
                                    console.log('Fetching bundle details for bundle ID:', bundleIdToFetch);
                                    const response = await Axios({
                                        ...SummaryApi.getBundleById,
                                        url: SummaryApi.getBundleById.url.replace(':id', bundleIdToFetch)
                                    });
                                    
                                    if (response.data.success && response.data.data) {
                                        console.log('Successfully fetched bundle details:', response.data.data);
                                        return {
                                            ...item,
                                            bundleDetails: response.data.data,
                                            bundleId: response.data.data, // Also populate bundleId as object
                                            productDetails: response.data.data.productDetails || response.data.data.items || []
                                        };
                                    } else {
                                        console.log('Failed to fetch bundle details:', response.data);
                                    }
                                } catch (error) {
                                    console.error('Error fetching bundle details:', error);
                                }
                            }
                        }
                        
                        return item; // Return original item if no enhancement needed
                    })
                );
                
                payment.items = enhancedItems;
            }
            
            // Debug: Check payment object structure
            console.log('Enhanced payment object in InvoiceModal:', payment);
            console.log('Payment status:', payment.paymentStatus);
            console.log('Refund details (after calculation):', payment.refundDetails);
            
            setEnhancedPayment(payment);
            setLoadingBundles(false);
        };
        
        enhancePaymentWithBundles();
    }, [originalPayment]);
    
    // Use enhanced payment if available, otherwise use original
    const payment = enhancedPayment || {
        ...originalPayment,
        refundDetails: originalPayment.refundDetails || {}
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount)
    }

    const handlePrint = () => {
        window.print()
    }

    const handleDownload = () => {
        // Convert the invoice to PDF and download
        // This would typically use a library like jsPDF or html2pdf
        const element = document.getElementById('invoice-content')
        
        // For now, we'll just trigger print dialog
        window.print()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <FaFileInvoice className="mr-2 text-blue-600" />
                        Invoice - #{payment.orderId}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Loading State */}
                {loadingBundles && (
                    <div className="p-6 text-center">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Loading bundle details...</span>
                        </div>
                    </div>
                )}

                {/* Invoice Content */}
                {!loadingBundles && (
                <div id="invoice-content" className="p-6">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-black">casualclothings</h1>
                            <p className="text-gray-600 mt-1">Fashion & Lifestyle Store</p>
                            <div className="mt-4 text-sm text-gray-600">
                                <p>123 Fashion Street</p>
                                <p>Tirupur, Tamil Nadu 641601</p>
                                <p>Phone: +91 98765 43210</p>
                                <p>Email: orders@casualclothings.com</p>
                                <p>GST: 33ABCDE1234F1Z5</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                            <div className="mt-4 text-sm">
                                <p><span className="font-semibold">Invoice No:</span> INV-{payment.orderId}</p>
                                <p><span className="font-semibold">Order ID:</span> {payment.orderId}</p>
                                <p><span className="font-semibold">Date:</span> {new Date(payment.orderDate).toLocaleDateString('en-IN')}</p>
                                <p><span className="font-semibold">Payment Method:</span> {payment.paymentMethod || 'Cash on Delivery'}</p>
                                <p><span className="font-semibold">Status:</span> 
                                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                        payment.paymentStatus?.toLowerCase() === 'paid' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {payment.paymentStatus}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Billing Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <FaUser className="mr-2 text-blue-600" />
                                Bill To
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-semibold text-gray-900">{payment.customerName}</p>
                                {payment.deliveryAddress && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p className="flex items-start">
                                            <FaMapMarkerAlt className="mr-2 mt-1 text-gray-400 flex-shrink-0" />
                                            <span>
                                                {payment.deliveryAddress.address_line}<br />
                                                {payment.deliveryAddress.city}, {payment.deliveryAddress.state}<br />
                                                PIN: {payment.deliveryAddress.pincode}
                                            </span>
                                        </p>
                                        <p className="flex items-center mt-2">
                                            <FaPhone className="mr-2 text-gray-400" />
                                            {payment.deliveryAddress.mobile}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <FaCalendarAlt className="mr-2 text-blue-600" />
                                Order Information
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Order Date</p>
                                        <p className="font-semibold">{new Date(payment.orderDate).toLocaleDateString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Order Status</p>
                                        <p className="font-semibold">{payment.orderStatus}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Total Items</p>
                                        <p className="font-semibold">{payment.totalQuantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Payment ID</p>
                                        <p className="font-semibold">{payment.paymentId || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Debug payment status */}
                    {console.log('Payment status check:', payment.paymentStatus, 
                       'REFUND_SUCCESSFUL check:', payment.paymentStatus === 'REFUND_SUCCESSFUL', 
                       'includes REFUND check:', payment.paymentStatus && payment.paymentStatus.includes('REFUND'))}
                    
                    {/* Refund Information - Show only if the order was refunded */}
                    {payment.paymentStatus && (
                        payment.paymentStatus.includes('REFUND') || 
                        payment.paymentStatus === 'REFUND_SUCCESSFUL' || 
                        payment.paymentStatus.toLowerCase().includes('refund')
                    ) && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <FaCalendarAlt className="mr-2 text-red-600" />
                                Refund Information
                            </h3>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <div className="flex flex-wrap items-center mb-2">
                                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                                                REFUNDED
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {payment.refundDetails && payment.refundDetails.refundDate ? 
                                                  `Processed on ${new Date(payment.refundDetails.refundDate).toLocaleDateString('en-IN')}` : 
                                                  'Processing date not available'}
                                            </span>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded-lg mt-2 text-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                                <div>
                                                    <p className="font-medium text-gray-700">Order Date:</p>
                                                    <p>{new Date(payment.orderDate).toLocaleDateString('en-IN')}</p>
                                                </div>
                                                
                                                {payment.refundDetails && payment.refundDetails.requestDate && (
                                                    <div>
                                                        <p className="font-medium text-gray-700">Cancellation Request Date:</p>
                                                        <p>{new Date(payment.refundDetails.requestDate).toLocaleDateString('en-IN')}</p>
                                                    </div>
                                                )}
                                                
                                                {payment.refundDetails && payment.refundDetails.approvalDate && (
                                                    <div>
                                                        <p className="font-medium text-gray-700">Admin Approval Date:</p>
                                                        <p>{new Date(payment.refundDetails.approvalDate).toLocaleDateString('en-IN')}</p>
                                                    </div>
                                                )}
                                                
                                                {payment.refundDetails && payment.refundDetails.refundDate && (
                                                    <div>
                                                        <p className="font-medium text-gray-700">Refund Completed Date:</p>
                                                        <p>{new Date(payment.refundDetails.refundDate).toLocaleDateString('en-IN')}</p>
                                                    </div>
                                                )}
                                                
                                                {payment.refundDetails && payment.refundDetails.reason && (
                                                    <div className="col-span-1 md:col-span-2">
                                                        <p className="font-medium text-gray-700">Reason for Cancellation:</p>
                                                        <p>{payment.refundDetails.reason}</p>
                                                    </div>
                                                )}
                                                
                                                {payment.refundDetails && payment.refundDetails.adminComments && (
                                                    <div className="col-span-1 md:col-span-2">
                                                        <p className="font-medium text-gray-700">Admin Comments:</p>
                                                        <p>{payment.refundDetails.adminComments}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-600">Refund ID</p>
                                        <p className="font-semibold">{payment.refundDetails?.refundId || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-600">Refund Date</p>
                                        <p className="font-semibold">
                                            {payment.refundDetails?.refundDate ? 
                                                new Date(payment.refundDetails.refundDate).toLocaleDateString('en-IN') : 'N/A'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-600">Refund Percentage</p>
                                        <p className="font-semibold">{parseFloat(payment.refundDetails?.refundPercentage || 0).toFixed(0)}%</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-600">Refund Method</p>
                                        <p className="font-semibold">Original Payment Method</p>
                                    </div>
                                    
                                    <div className="bg-white p-3 rounded-lg border border-red-100 col-span-1 md:col-span-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">ORIGINAL ORDER AMOUNT</p>
                                                <p className="text-xl font-bold text-gray-900">{formatCurrency(payment.totalAmt || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    REFUNDED AMOUNT ({parseFloat(payment.refundDetails?.refundPercentage || 0).toFixed(0)}%)
                                                </p>
                                                <p className="text-xl font-bold text-red-600">
                                                    {formatCurrency(payment.refundDetails?.refundAmount || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    RETAINED AMOUNT ({(100 - parseFloat(payment.refundDetails?.refundPercentage || 0)).toFixed(0)}%)
                                                </p>
                                                <p className="text-xl font-bold text-green-600">
                                                    {formatCurrency(payment.refundDetails?.retainedAmount || 
                                                        (payment.totalAmt - (payment.refundDetails?.refundAmount || 0)))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Item
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Unit Price
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {/* Debug payment data structure with more details */}
                                    {console.log('Payment data structure:', JSON.stringify(payment, null, 2))}
                                    {payment.items && payment.items.length > 0 && console.log('First item details:', JSON.stringify(payment.items[0], null, 2))}
                                    {payment.items && payment.items.length > 0 ? (
                                        payment.items.map((item, index) => {
                                            console.log('Item structure:', item);
                                            // Enhanced product name resolution
                                            const getProductName = () => {
                                                // Check productDetails first (most reliable source)
                                                if (item.productDetails && item.productDetails.name) {
                                                    return item.productDetails.name;
                                                }
                                                // Check bundleDetails first (most reliable source)
                                                if (item.bundleDetails && item.bundleDetails.title) {
                                                    return item.bundleDetails.title;
                                                }
                                                // Check if productId is populated object
                                                if (item.productId && typeof item.productId === 'object') {
                                                    return item.productId.name || item.productId.title;
                                                }
                                                // Check if bundleId is populated object
                                                if (item.bundleId && typeof item.bundleId === 'object') {
                                                    return item.bundleId.title || item.bundleId.name;
                                                }
                                                return isBundle ? 'Bundle Item' : 'Product Item';
                                            };

                                            // Enhanced price calculation
                                            const getUnitPrice = () => {
                                                // For your requirement: unit price should equal total price
                                                return item.itemTotal || 0;
                                            };

                                            const unitPrice = getUnitPrice();
                                            const itemTotal = unitPrice; // Unit price equals total price as requested
                                            
                                            // Enhanced bundle detection - check multiple sources
                                            const isBundle = item.itemType === 'bundle' || 
                                                           (item.bundleId && typeof item.bundleId === 'object') ||
                                                           (item.bundleDetails && typeof item.bundleDetails === 'object') ||
                                                           (item.type === 'Bundle') ||
                                                           (item.productType === 'bundle');

                                            return (
                                                <tr key={index} className="border-b border-gray-200">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center">
                                            {/* Product Image */}
                                            {(() => {
                                                // Enhanced product image resolution function
                                                const getProductImage = () => {
                                                    // Add debugging
                                                    console.log('Invoice modal image debug - item:', item);
                                                    
                                                    // Try all possible image sources in order of preference
                                                    let imageUrl = null;
                                                    
                                                    // First try bundleId (most specific for bundles)
                                                    if (item.bundleId && typeof item.bundleId === 'object') {
                                                        imageUrl = item.bundleId.images?.[0] || item.bundleId.image?.[0] || item.bundleId.bundleImage;
                                                        if (imageUrl) return imageUrl;
                                                    }
                                                    
                                                    // Then try bundleDetails
                                                    if (item.bundleDetails) {
                                                        imageUrl = item.bundleDetails.images?.[0] || item.bundleDetails.image?.[0] || item.bundleDetails.bundleImage;
                                                        if (imageUrl) return imageUrl;
                                                    }
                                                    
                                                    // Then try productId
                                                    if (item.productId && typeof item.productId === 'object') {
                                                        imageUrl = item.productId.images?.[0] || item.productId.image?.[0];
                                                        if (imageUrl) return imageUrl;
                                                    }
                                                    
                                                    // Finally try productDetails
                                                    if (item.productDetails) {
                                                        imageUrl = item.productDetails.images?.[0] || item.productDetails.image?.[0];
                                                        if (imageUrl) return imageUrl;
                                                    }
                                                    
                                                    return null;
                                                };

                                                const imageUrl = getProductImage();
                                                
                                                return imageUrl ? (
                                                    <div className="w-12 h-12 mr-4 overflow-hidden rounded border border-gray-200">
                                                        <img 
                                                            src={imageUrl} 
                                                            alt={getProductName()}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = `
                                                                    <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                                        </svg>
                                                                    </div>
                                                                `;
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 mr-4 bg-gray-100 rounded flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                        </svg>
                                                    </div>
                                                );
                                                            })()}
                                                            
                                                            {/* Product Name and Type */}
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium text-gray-900">
                                                                        {getProductName()}
                                                                    </p>
                                                                    {isBundle && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            Bundle
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500">
                                                                    Type: {isBundle ? 'Bundle' : 'Product'}
                                                                </p>
                                                                
                                                                {/* Bundle Items Details */}
                                                                {isBundle && (() => {
                                                                    // Enhanced bundle items detection function
                                                                    const getBundleItems = () => {
                                                                        // Use bundle item data
                                                                        const bundleData = item;
                                                                        console.log('=== BUNDLE ITEMS DETECTION START ===');
                                                                        console.log('Debug: Bundle item data received:', bundleData);
                                                                        console.log('Item keys:', Object.keys(bundleData));
                                                                        console.log('bundleId structure:', bundleData.bundleId);
                                                                        console.log('bundleDetails structure:', bundleData.bundleDetails);
                                                                        console.log('productDetails structure:', bundleData.productDetails);
                                                                        
                                                                        // 1. Check for direct bundle items array
                                                                        if (bundleData.items && Array.isArray(bundleData.items) && bundleData.items.length > 0) {
                                                                            console.log('✅ Found items in bundleData.items:', bundleData.items);
                                                                            return bundleData.items;
                                                                        }
                                                                        
                                                                        // 2. Check bundleDetails.items (most common for populated bundles)
                                                                        if (bundleData.bundleDetails && bundleData.bundleDetails.items && Array.isArray(bundleData.bundleDetails.items)) {
                                                                            console.log('✅ Found items in bundleData.bundleDetails.items:', bundleData.bundleDetails.items);
                                                                            return bundleData.bundleDetails.items;
                                                                        }
                                                                        
                                                                        // 2.1. Check bundleDetails.productDetails (newly fetched API structure)
                                                                        if (bundleData.bundleDetails && bundleData.bundleDetails.productDetails && Array.isArray(bundleData.bundleDetails.productDetails) && bundleData.bundleDetails.productDetails.length > 0) {
                                                                            console.log('✅ Found items in bundleData.bundleDetails.productDetails:', bundleData.bundleDetails.productDetails);
                                                                            return bundleData.bundleDetails.productDetails;
                                                                        }
                                                                        
                                                                        // 3. Check productDetails array (alternative structure for bundles)
                                                                        if (bundleData.productDetails && Array.isArray(bundleData.productDetails) && bundleData.productDetails.length > 0) {
                                                                            console.log('✅ Found items in bundleData.productDetails:', bundleData.productDetails);
                                                                            return bundleData.productDetails;
                                                                        }
                                                                        
                                                                        // 2.1. Enhanced bundleDetails check - look deeper into the object
                                                                        if (bundleData.bundleDetails && typeof bundleData.bundleDetails === 'object') {
                                                                            console.log('Detailed bundleDetails analysis:', bundleData.bundleDetails);
                                                                            console.log('bundleDetails keys:', Object.keys(bundleData.bundleDetails));
                                                                            
                                                                            // Check all properties in bundleDetails for arrays
                                                                            for (const [key, value] of Object.entries(bundleData.bundleDetails)) {
                                                                                if (Array.isArray(value) && value.length > 0) {
                                                                                    console.log(`Found array in bundleDetails.${key}:`, value);
                                                                                    // Check if this array contains items that look like products/bundle items
                                                                                    if (value[0] && (value[0].name || value[0].title || value[0].productId || value[0]._id)) {
                                                                                        console.log(`Using bundleDetails.${key} as bundle items`);
                                                                                        return value;
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        
                                                                        // 3. Check bundleId.items (if bundleId is populated object)
                                                                        if (bundleData.bundleId && typeof bundleData.bundleId === 'object' && bundleData.bundleId.items && Array.isArray(bundleData.bundleId.items)) {
                                                                            console.log('Found items in bundleData.bundleId.items:', bundleData.bundleId.items);
                                                                            return bundleData.bundleId.items;
                                                                        }
                                                                        
                                                                        // 3.1. Check bundleId.productDetails (newly fetched bundle structure)
                                                                        if (bundleData.bundleId && typeof bundleData.bundleId === 'object' && bundleData.bundleId.productDetails && Array.isArray(bundleData.bundleId.productDetails) && bundleData.bundleId.productDetails.length > 0) {
                                                                            console.log('✅ Found items in bundleData.bundleId.productDetails:', bundleData.bundleId.productDetails);
                                                                            return bundleData.bundleId.productDetails;
                                                                        }
                                                                        
                                                                        // 3.2. Enhanced bundleId check - look deeper into the object
                                                                        if (bundleData.bundleId && typeof bundleData.bundleId === 'object') {
                                                                            console.log('Detailed bundleId analysis:', bundleData.bundleId);
                                                                            console.log('bundleId keys:', Object.keys(bundleData.bundleId));
                                                                            
                                                                            // Check all properties in bundleId for arrays
                                                                            for (const [key, value] of Object.entries(bundleData.bundleId)) {
                                                                                if (Array.isArray(value) && value.length > 0) {
                                                                                    console.log(`Found array in bundleId.${key}:`, value);
                                                                                    // Check if this array contains items that look like products/bundle items
                                                                                    if (value[0] && (value[0].name || value[0].title || value[0].productId || value[0]._id)) {
                                                                                        console.log(`Using bundleId.${key} as bundle items`);
                                                                                        return value;
                                                                                    }
                                                                                }
                                                                                
                                                                                // Check nested objects for items arrays
                                                                                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                                                                    for (const [nestedKey, nestedValue] of Object.entries(value)) {
                                                                                        if (nestedKey === 'items' && Array.isArray(nestedValue) && nestedValue.length > 0) {
                                                                                            console.log(`✅ Found items in bundleId.${key}.${nestedKey}:`, nestedValue);
                                                                                            return nestedValue;
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        
                                                                        // 4. Deep search in bundleDetails for items (check all properties)
                                                                        if (bundleData.bundleDetails && typeof bundleData.bundleDetails === 'object') {
                                                                            console.log('Searching bundleDetails for items:', Object.keys(bundleData.bundleDetails));
                                                                            
                                                                            // Check for items in different possible locations within bundleDetails
                                                                            const searchForItems = (obj, path = 'bundleDetails') => {
                                                                                if (!obj || typeof obj !== 'object') return null;
                                                                                
                                                                                for (const [key, value] of Object.entries(obj)) {
                                                                                    if (key === 'items' && Array.isArray(value) && value.length > 0) {
                                                                                        console.log(`Found items in ${path}.${key}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                    
                                                                                    // Also check for products, bundleItems, etc.
                                                                                    if ((key === 'products' || key === 'bundleItems') && Array.isArray(value) && value.length > 0) {
                                                                                        console.log(`Found ${key} in ${path}.${key}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                    
                                                                                    // Recursive search in nested objects
                                                                                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                                                                        const found = searchForItems(value, `${path}.${key}`);
                                                                                        if (found) return found;
                                                                                    }
                                                                                }
                                                                                return null;
                                                                            };
                                                                            
                                                                            const foundItems = searchForItems(bundleData.bundleDetails);
                                                                            if (foundItems) return foundItems;
                                                                        }
                                                                        
                                                                        // 5. Deep search in bundleId for items (check all properties)
                                                                        if (bundleData.bundleId && typeof bundleData.bundleId === 'object') {
                                                                            console.log('Searching bundleId for items:', Object.keys(bundleData.bundleId));
                                                                            
                                                                            const searchForItems = (obj, path = 'bundleId') => {
                                                                                if (!obj || typeof obj !== 'object') return null;
                                                                                
                                                                                for (const [key, value] of Object.entries(obj)) {
                                                                                    if (key === 'items' && Array.isArray(value) && value.length > 0) {
                                                                                        console.log(`Found items in ${path}.${key}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                    
                                                                                    // Also check for products, bundleItems, etc.
                                                                                    if ((key === 'products' || key === 'bundleItems') && Array.isArray(value) && value.length > 0) {
                                                                                        console.log(`Found ${key} in ${path}.${key}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                    
                                                                                    // Recursive search in nested objects
                                                                                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                                                                        const found = searchForItems(value, `${path}.${key}`);
                                                                                        if (found) return found;
                                                                                    }
                                                                                }
                                                                                return null;
                                                                            };
                                                                            
                                                                            const foundItems = searchForItems(bundleData.bundleId);
                                                                            if (foundItems) return foundItems;
                                                                        }
                                                                        
                                                                        // 4. If bundle itself looks like bundleId object with items
                                                                        if (bundleData._id && bundleData.title && bundleData.bundlePrice && bundleData.items && Array.isArray(bundleData.items)) {
                                                                            console.log('Bundle looks like a populated bundleId object:', bundleData.items);
                                                                            return bundleData.items;
                                                                        }
                                                                        
                                                                        // 5. Search for nested bundle structures
                                                                        const findBundleItemsRecursively = (obj, path = 'root', maxDepth = 2, currentDepth = 0) => {
                                                                            if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) return null;
                                                                            
                                                                            for (const [key, value] of Object.entries(obj)) {
                                                                                const currentPath = `${path}.${key}`;
                                                                                
                                                                                // Only look for bundle-specific item arrays
                                                                                if (key === 'items' && Array.isArray(value) && value.length > 0) {
                                                                                    // Check if this looks like bundle items
                                                                                    if (path.includes('bundle') || path.includes('Bundle')) {
                                                                                        console.log(`Found bundle items in ${currentPath}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                }
                                                                                
                                                                                // Look for bundleItems arrays (specific to bundles)
                                                                                if (key === 'bundleItems' && Array.isArray(value) && value.length > 0) {
                                                                                    console.log(`Found bundleItems in ${currentPath}:`, value);
                                                                                    return value;
                                                                                }
                                                                                
                                                                                // Continue recursive search only in bundle-related nested objects
                                                                                if (typeof value === 'object' && value !== null) {
                                                                                    if (key.toLowerCase().includes('bundle')) {
                                                                                        const found = findBundleItemsRecursively(value, currentPath, maxDepth, currentDepth + 1);
                                                                                        if (found) return found;
                                                                                    }
                                                                                }
                                                                            }
                                                                            return null;
                                                                        };
                                                                        
                                                                        const foundBundleItems = findBundleItemsRecursively(bundleData);
                                                                        if (foundBundleItems) {
                                                                            return foundBundleItems;
                                                                        }
                                                                        
                                                                        // 7. Check productDetails array (alternative structure for bundles)
                                                                        if (bundleData.productDetails && Array.isArray(bundleData.productDetails) && bundleData.productDetails.length > 0) {
                                                                            console.log('Found items in bundleData.productDetails:', bundleData.productDetails);
                                                                            return bundleData.productDetails;
                                                                        }
                                                                        
                                                                        // 8. Comprehensive recursive search for any array with product-like objects
                                                                        const searchAllProperties = (obj, path = 'root', depth = 0) => {
                                                                            if (!obj || typeof obj !== 'object' || depth > 3) return null;
                                                                            
                                                                            for (const [key, value] of Object.entries(obj)) {
                                                                                const currentPath = `${path}.${key}`;
                                                                                
                                                                                // Look for any array that might contain bundle items
                                                                                if (Array.isArray(value) && value.length > 0) {
                                                                                    // Check if array contains objects that look like products
                                                                                    const firstItem = value[0];
                                                                                    if (typeof firstItem === 'object' && firstItem !== null) {
                                                                                        const hasProductProperties = (
                                                                                            firstItem.name || 
                                                                                            firstItem.title || 
                                                                                            firstItem.productId || 
                                                                                            firstItem._id ||
                                                                                            firstItem.price !== undefined ||
                                                                                            firstItem.quantity !== undefined
                                                                                        );
                                                                                        
                                                                                        if (hasProductProperties) {
                                                                                            console.log(`✅ Found potential bundle items in ${currentPath}:`, value);
                                                                                            return value;
                                                                                        }
                                                                                    }
                                                                                }
                                                                                
                                                                                // Recursively search nested objects
                                                                                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                                                                    const result = searchAllProperties(value, currentPath, depth + 1);
                                                                                    if (result) return result;
                                                                                }
                                                                            }
                                                                            return null;
                                                                        };
                                                                        
                                                                        // Try recursive search on the entire bundle object
                                                                        const recursiveResult = searchAllProperties(bundleData);
                                                                        if (recursiveResult) {
                                                                            return recursiveResult;
                                                                        }
                                                                        
                                                                        console.log('❌ No bundle items found in any expected location');
                                                                        console.log('=== COMPLETE BUNDLE DATA DUMP ===');
                                                                        console.log('Full bundle object:', JSON.stringify(bundleData, null, 2));
                                                                        
                                                                        // Additional detailed logging for debugging
                                                                        console.log('=== DETAILED BUNDLE ANALYSIS ===');
                                                                        console.log('bundleData keys:', Object.keys(bundleData));
                                                                        console.log('bundleData._id:', bundleData._id);
                                                                        console.log('bundleData.productId:', bundleData.productId);
                                                                        console.log('bundleData.name:', bundleData.name);
                                                                        console.log('bundleData.title:', bundleData.title);
                                                                        
                                                                        if (bundleData.bundleDetails) {
                                                                            console.log('bundleDetails exists - keys:', Object.keys(bundleData.bundleDetails));
                                                                            console.log('bundleDetails full object:', JSON.stringify(bundleData.bundleDetails, null, 2));
                                                                        } else {
                                                                            console.log('❌ bundleDetails is null/undefined');
                                                                        }
                                                                        
                                                                        if (bundleData.bundleId) {
                                                                            console.log('bundleId exists - type:', typeof bundleData.bundleId);
                                                                            if (typeof bundleData.bundleId === 'object') {
                                                                                console.log('bundleId keys:', Object.keys(bundleData.bundleId));
                                                                                console.log('bundleId full object:', JSON.stringify(bundleData.bundleId, null, 2));
                                                                            } else {
                                                                                console.log('bundleId value (string):', bundleData.bundleId);
                                                                            }
                                                                        } else {
                                                                            console.log('❌ bundleId is null/undefined');
                                                                        }
                                                                        
                                                                        if (bundleData.productDetails) {
                                                                            console.log('productDetails exists - length:', bundleData.productDetails.length);
                                                                            console.log('productDetails content:', bundleData.productDetails);
                                                                        } else {
                                                                            console.log('❌ productDetails is null/undefined');
                                                                        }
                                                                        
                                                                        console.log('=== END BUNDLE ITEMS DETECTION ===');
                                                                        
                                                                        return [];
                                                                    };
                                                                    
                                                                    const bundleItems = getBundleItems();
                                                                    
                                                                    if (bundleItems.length > 0) {
                                                                        return (
                                                                            <div className="mt-2">
                                                                                <p className="text-xs font-medium text-gray-600 mb-1">
                                                                                    Bundle includes ({bundleItems.length} items):
                                                                                </p>
                                                                                <div className="space-y-1">
                                                                                    {bundleItems.map((bundleItem, bundleIndex) => (
                                                                                        <div key={bundleIndex} className="text-xs text-gray-500 pl-2 border-l-2 border-gray-200">
                                                                                            • {bundleItem.name || bundleItem.title || 'Bundle Item'} 
                                                                                            (Qty: {bundleItem.quantity || 1}, Price: {formatCurrency(bundleItem.price || 0)})
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    } else {
                                                                        return (
                                                                            <div className="mt-2">
                                                                                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border">
                                                                                    ⚠️ Bundle items details not available
                                                                                </p>
                                                                                <details className="mt-1">
                                                                                    <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                                                                                    <div className="text-xs text-gray-400 mt-1 bg-gray-50 p-2 rounded border max-h-20 overflow-auto">
                                                                                        <p><strong>Bundle Keys:</strong> {Object.keys(item).join(', ')}</p>
                                                                                        <p><strong>Has bundleId:</strong> {item.bundleId ? 'Yes' : 'No'}</p>
                                                                                        <p><strong>Has bundleDetails:</strong> {item.bundleDetails ? 'Yes' : 'No'}</p>
                                                                                        <p><strong>Has items:</strong> {item.items ? 'Yes' : 'No'}</p>
                                                                                        <p><strong>bundleId type:</strong> {typeof item.bundleId}</p>
                                                                                        <p><strong>bundleDetails type:</strong> {typeof item.bundleDetails}</p>
                                                                                    </div>
                                                                                </details>
                                                                            </div>
                                                                        );
                                                                    }
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-900">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-900">
                                                        {formatCurrency(unitPrice)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                        {formatCurrency(itemTotal)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        // Fallback for legacy order structure
                                        <tr className="border-b border-gray-200">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {payment.productDetails?.name || payment.productDetails?.title || 'Product Item'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">Product</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-900">
                                                {payment.orderQuantity || payment.totalQuantity || 1}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-900">
                                                {formatCurrency(payment.productDetails?.price || (payment.subTotalAmt / (payment.orderQuantity || payment.totalQuantity || 1)))}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                {formatCurrency(payment.subTotalAmt || payment.totalAmt)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-md">
                            <div className="bg-gray-50 p-6 rounded-lg border">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="text-gray-900">{formatCurrency(payment.subTotalAmt)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Delivery Charges:</span>
                                        <span className="text-gray-900">
                                            {formatCurrency((payment.totalAmt || 0) - (payment.subTotalAmt || 0))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax (GST):</span>
                                        <span className="text-gray-900">Included</span>
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span className="text-gray-900">Total Amount:</span>
                                            <span className="text-gray-900">{formatCurrency(payment.totalAmt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="text-center text-sm text-gray-600">
                            <p className="mb-2"><strong>Thank you for shopping with casualclothings!</strong></p>
                            <p>For any queries, contact us at orders@casualclothings.com or call +91 98765 43210</p>
                            <p className="mt-2">This is a computer generated invoice and does not require signature.</p>
                        </div>
                    </div>
                </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Print Invoice
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                        Download PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InvoiceModal
