import React from 'react'
import { FaTimes, FaFileInvoice, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaPhone } from 'react-icons/fa'

function InvoiceModal({ payment, onClose }) {
    if (!payment) return null

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
                            <h1 className="text-3xl font-bold text-black">DarkCart</h1>
                            <p className="text-gray-600 mt-1">Fashion & Lifestyle Store</p>
                            <div className="mt-4 text-sm text-gray-600">
                                <p>123 Fashion Street</p>
                                <p>Tirupur, Tamil Nadu 641601</p>
                                <p>Phone: +91 98765 43210</p>
                                <p>Email: orders@darkcart.com</p>
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
                                    {payment.items?.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-200">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {item.productDetails?.name || item.bundleDetails?.title || 'Product'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {item.itemType === 'bundle' ? 'Bundle' : 'Product'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-900">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-900">
                                                {formatCurrency(item.itemTotal / item.quantity)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                {formatCurrency(item.itemTotal)}
                                            </td>
                                        </tr>
                                    ))}
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
                            <p className="mb-2"><strong>Thank you for shopping with DarkCart!</strong></p>
                            <p>For any queries, contact us at orders@darkcart.com or call +91 98765 43210</p>
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
