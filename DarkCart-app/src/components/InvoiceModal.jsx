import React from 'react'
import { FaTimes, FaFileInvoice, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaPhone } from 'react-icons/fa'

function InvoiceModal({ payment: originalPayment, onClose }) {
    if (!originalPayment) return null
    
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
    
    // Debug: Check payment object structure
    console.log('Payment object in InvoiceModal:', payment);
    console.log('Payment status:', payment.paymentStatus);
    console.log('Refund details (after calculation):', payment.refundDetails);

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

                {/* Invoice Content */}
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
                                                return item.itemType === 'bundle' ? 'Bundle Item' : 'Product Item';
                                            };

                                            // Enhanced price calculation
                                            const getUnitPrice = () => {
                                                // Check productDetails first (most reliable source)
                                                if (item.productDetails && item.productDetails.price) {
                                                    return item.productDetails.price;
                                                }
                                                // Check bundleDetails first (most reliable source)
                                                if (item.bundleDetails && (item.bundleDetails.bundlePrice || item.bundleDetails.price)) {
                                                    return item.bundleDetails.bundlePrice || item.bundleDetails.price;
                                                }
                                                // Check if productId is populated object
                                                if (item.productId && typeof item.productId === 'object' && item.productId.price) {
                                                    return item.productId.price;
                                                }
                                                // Check if bundleId is populated object
                                                if (item.bundleId && typeof item.bundleId === 'object') {
                                                    return item.bundleId.bundlePrice || item.bundleId.price || 0;
                                                }
                                                // Fallback to calculating from itemTotal and quantity
                                                if (item.itemTotal && item.quantity) {
                                                    return item.itemTotal / item.quantity;
                                                }
                                                // Last resort: use payment total divided by quantity
                                                if (payment.subTotalAmt && payment.totalQuantity && payment.totalQuantity > 0) {
                                                    return payment.subTotalAmt / payment.totalQuantity;
                                                }
                                                return 0;
                                            };

                                            const unitPrice = getUnitPrice();
                                            const itemTotal = item.itemTotal || (unitPrice * item.quantity) || payment.subTotalAmt || 0;

                                            return (
                                                <tr key={index} className="border-b border-gray-200">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center">
                                                            {/* Product Image */}
                                                            {(() => {
                                                                // Get product image URL
                                                                let imageUrl = null;
                                                                
                                                                // Try to get from productDetails first
                                                                if (item.productDetails && item.productDetails.image && item.productDetails.image.length) {
                                                                    imageUrl = item.productDetails.image[0];
                                                                }
                                                                // Then try bundleDetails
                                                                else if (item.bundleDetails && item.bundleDetails.image) {
                                                                    imageUrl = item.bundleDetails.image;
                                                                }
                                                                // Special handling for bundleDetails with images array
                                                                else if (item.bundleDetails && item.bundleDetails.images && item.bundleDetails.images.length) {
                                                                    imageUrl = item.bundleDetails.images[0];
                                                                }
                                                                // Then try populated productId
                                                                else if (item.productId && typeof item.productId === 'object' && item.productId.image && item.productId.image.length) {
                                                                    imageUrl = item.productId.image[0];
                                                                }
                                                                // Then try populated bundleId
                                                                else if (item.bundleId && typeof item.bundleId === 'object' && item.bundleId.image) {
                                                                    imageUrl = item.bundleId.image;
                                                                }
                                                                // Special handling for bundleId with images array
                                                                else if (item.bundleId && typeof item.bundleId === 'object' && item.bundleId.images && item.bundleId.images.length) {
                                                                    imageUrl = item.bundleId.images[0];
                                                                }
                                                                
                                                                return imageUrl ? (
                                                                    <div className="w-12 h-12 mr-4 overflow-hidden rounded border border-gray-200">
                                                                        <img 
                                                                            src={imageUrl} 
                                                                            alt={getProductName()}
                                                                            className="w-full h-full object-cover"
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
                                                                <p className="font-medium text-gray-900">
                                                                    {getProductName()}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {item.itemType === 'bundle' ? 'Bundle' : 'Product'}
                                                                </p>
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
