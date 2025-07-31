import React, { useState, useEffect } from 'react';
import { FaSpinner, FaInfoCircle, FaDownload, FaTimes, FaCheck, FaBox } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AnimatedImage from '../components/NoData';
import BundleItemsModal from '../components/BundleItemsModal';
import noCart from '../assets/Empty-cuate.png';

// Helper function for formatting dates
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper function for displaying prices in Indian Rupees
const DisplayPriceInRupees = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(price || 0);
};

// Enhanced payment status function for consistent display
const getPaymentStatusDisplay = (order) => {
    if (!order) return 'N/A';
    
    const isOnlinePayment = order.paymentMethod === "Online Payment" || order.paymentMethod === "ONLINE";
    const status = order.paymentStatus;
    
    // Debug log for payment status detection
    console.log('MyRefunds Payment Status Debug:', {
        orderId: order.orderId,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        isOnlinePayment
    });
    
    // If it's online payment and status shows PAID, display as PAID
    if (isOnlinePayment && status === 'PAID') {
        return 'PAID';
    }
    
    return status || 'N/A';
};

// Helper function to get color based on request or refund status
const getStatusColor = (status, refundStatus) => {
    // First check cancellation request status
    switch (status?.toUpperCase()) {
        case 'PENDING':
            return "bg-yellow-100 text-yellow-800";
        case 'REJECTED':
            return "bg-red-100 text-red-800";
        case 'APPROVED':
            // For approved requests, check refund status
            switch (refundStatus?.toUpperCase()) {
                case 'COMPLETED':
                    return "bg-green-100 text-green-800";
                case 'PROCESSING':
                    return "bg-blue-100 text-blue-800";
                case 'FAILED':
                    return "bg-red-100 text-red-800";
                case 'PENDING':
                default:
                    return "bg-yellow-100 text-yellow-800";
            }
        default:
            return "bg-gray-100 text-gray-800";
    }
};

// Helper function to get display status text
const getDisplayStatus = (status, refundStatus) => {
    if (status === 'PENDING') {
        return 'REQUEST PENDING';
    } else if (status === 'REJECTED') {
        return 'REQUEST REJECTED';
    } else if (status === 'APPROVED') {
        return refundStatus ? `REFUND ${refundStatus}` : 'REFUND PENDING';
    } else {
        return status || 'UNKNOWN';
    }
};

// Get image source with proper fallbacks
const getImageSource = (item) => {
    if (!item) return noCart;
    
    // Initialize with fallback
    let imageSrc = noCart;
    
    // Debug logging
    console.log('🖼️ MyRefunds getImageSource debug:', {
        itemType: item.itemType,
        productId: item.productId,
        productDetails: item.productDetails,
        bundleId: item.bundleId,
        bundleDetails: item.bundleDetails
    });
    
    if (item.itemType === 'bundle') {
        // Enhanced bundle image handling
        if (item.bundleId && item.bundleId._id) {
            // Check if image is a string (URL) or array
            if (typeof item.bundleId.image === 'string') {
                imageSrc = item.bundleId.image;
            } else if (Array.isArray(item.bundleId.images) && item.bundleId.images.length > 0) {
                imageSrc = item.bundleId.images[0];
            } else if (Array.isArray(item.bundleId.image) && item.bundleId.image.length > 0) {
                imageSrc = item.bundleId.image[0];
            } else if (item.bundleId.bundleImage) {
                imageSrc = item.bundleId.bundleImage;
            }
        } else if (item.bundleDetails) {
            // Check if image is a string (URL) or array
            if (typeof item.bundleDetails.image === 'string') {
                imageSrc = item.bundleDetails.image;
            } else if (Array.isArray(item.bundleDetails.images) && item.bundleDetails.images.length > 0) {
                imageSrc = item.bundleDetails.images[0];
            } else if (Array.isArray(item.bundleDetails.image) && item.bundleDetails.image.length > 0) {
                imageSrc = item.bundleDetails.image[0];
            } else if (item.bundleDetails.bundleImage) {
                imageSrc = item.bundleDetails.bundleImage;
            }
        }
    } else {
        // For products
        if (item.productId && item.productId._id) {
            if (typeof item.productId.image === 'string') {
                imageSrc = item.productId.image;
            } else if (Array.isArray(item.productId.images) && item.productId.images.length > 0) {
                imageSrc = item.productId.images[0];
            } else if (Array.isArray(item.productId.image) && item.productId.image.length > 0) {
                imageSrc = item.productId.image[0];
            }
        } else if (item.productDetails) {
            if (typeof item.productDetails.image === 'string') {
                imageSrc = item.productDetails.image;
            } else if (Array.isArray(item.productDetails.image) && item.productDetails.image.length > 0) {
                imageSrc = item.productDetails.image[0];
            } else if (Array.isArray(item.productDetails.images) && item.productDetails.images.length > 0) {
                imageSrc = item.productDetails.images[0];
            }
        }
    }
    
    console.log('🖼️ MyRefunds final image source:', imageSrc);
    return imageSrc || noCart;
};

// Helper function to get the correct price for an item
const getItemPrice = (item) => {
    if (!item) return 0;
    
    if (item.itemType === 'bundle') {
        // Try different sources for bundle price
        const bundlePrice = item.bundleId?.bundlePrice || 
               item.bundleId?.originalPrice || 
               item.bundleDetails?.bundlePrice || 
               item.bundleDetails?.originalPrice || 
               0;
        
        console.log('🏷️ Bundle Price Debug:', {
            itemName: item.bundleDetails?.title || item.bundleId?.title,
            bundlePrice,
            bundleId: item.bundleId,
            bundleDetails: item.bundleDetails
        });
        
        return bundlePrice;
    } else {
        // For products, check if there's a discount
        const productPrice = item.productId?.price || 
                            item.productDetails?.price || 
                            0;
        
        const productDiscount = item.productId?.discount || 
                               item.productDetails?.discount || 
                               0;
        
        let finalPrice = productPrice;
        
        // If there's a discounted price, use that; otherwise calculate from discount
        if (item.productId?.discountedPrice) {
            finalPrice = item.productId.discountedPrice;
        } else if (item.productDetails?.discountedPrice) {
            finalPrice = item.productDetails.discountedPrice;
        } else if (productDiscount > 0 && productPrice > 0) {
            finalPrice = productPrice * (1 - productDiscount / 100);
        } else {
            finalPrice = productPrice;
        }
        
        console.log('🏷️ Product Price Debug:', {
            itemName: item.productDetails?.name || item.productId?.name,
            originalPrice: productPrice,
            discount: productDiscount,
            discountedPrice: item.productId?.discountedPrice || item.productDetails?.discountedPrice,
            calculatedPrice: productDiscount > 0 ? productPrice * (1 - productDiscount / 100) : productPrice,
            finalPrice
        });
        
        return finalPrice;
    }
};

// Helper function to get refund amount for an item
const getItemRefundAmount = (item) => {
    // First check if there's a specific refund amount for this item
    if (item.refundAmount && item.refundAmount > 0) {
        console.log('💰 Using specific refund amount:', {
            itemName: item.productDetails?.name || item.productId?.name || item.bundleDetails?.title || item.bundleId?.title,
            refundAmount: item.refundAmount
        });
        return item.refundAmount;
    }
    
    // If no specific refund amount, calculate based on item total or price * quantity
    const itemTotal = item.itemTotal;
    if (itemTotal && itemTotal > 0) {
        console.log('💰 Using item total:', {
            itemName: item.productDetails?.name || item.productId?.name || item.bundleDetails?.title || item.bundleId?.title,
            itemTotal
        });
        return itemTotal;
    }
    
    // Calculate from unit price and quantity
    const unitPrice = getItemPrice(item);
    const quantity = item.quantity || 1;
    const calculatedTotal = unitPrice * quantity;
    
    console.log('💰 Calculating refund amount:', {
        itemName: item.productDetails?.name || item.productId?.name || item.bundleDetails?.title || item.bundleId?.title,
        unitPrice,
        quantity,
        calculatedTotal
    });
    
    return calculatedTotal;
};

const RefundDetailsModal = ({ refund, onClose, onShowBundleItems }) => {
    if (!refund) return null;

    const order = refund.orderId || {};
    const user = refund.userId || {};
    const refundDetails = refund.refundDetails || {};
    const adminResponse = refund.adminResponse || {};

    // Download invoice if available
    const downloadInvoice = async () => {
        try {
            if (!refundDetails.refundId) {
                toast.error("No invoice available for this refund");
                return;
            }
            
            toast.loading('Downloading invoice...');
            
            // Make API call to download invoice
            const response = await fetch(`/api/order-cancellation/invoice/${refundDetails.refundId}`, {
                headers: {
                    authorization: `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to download invoice');
            }
            
            // Create blob from response
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary link and trigger download
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `refund-invoice-${refundDetails.refundId}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.dismiss();
            toast.success('Invoice downloaded successfully');
        } catch (error) {
            console.error('Error downloading invoice:', error);
            toast.dismiss();
            toast.error('Failed to download invoice');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">
                            {refund.status === 'APPROVED' ? 'Refund Details' : 'Cancellation Request Details'}
                        </h2>
                        <button 
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    {/* Refund Status Banner */}
                    <div className="flex flex-wrap items-center mb-6">
                        <div className="w-full mb-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(refund.status, refundDetails.refundStatus)}`}>
                                {getDisplayStatus(refund.status, refundDetails.refundStatus)}
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
                            <p><span className="font-medium">Payment Status:</span> {getPaymentStatusDisplay(order)}</p>
                            <p><span className="font-medium">Total Amount:</span> {DisplayPriceInRupees(order.totalAmt)}</p>
                        </div>

                        {/* Cancellation Details */}
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h3 className="font-semibold text-lg mb-3 text-red-800 flex items-center">
                                <span className="mr-2">❌</span>
                                Cancellation Details
                            </h3>
                            <div className="space-y-2">
                                <p><span className="font-medium text-red-700">Cancellation Reason:</span> {refund.reason}</p>
                                {refund.additionalReason && (
                                    <p><span className="font-medium text-red-700">Additional Information:</span> {refund.additionalReason}</p>
                                )}
                                <p><span className="font-medium text-red-700">Request Status:</span> 
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                                        refund.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                        refund.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {refund.status}
                                    </span>
                                </p>
                                {adminResponse.processedDate && (
                                    <p><span className="font-medium text-red-700">Processed Date:</span> {formatDate(adminResponse.processedDate)}</p>
                                )}
                                
                                {/* Clear cancellation summary */}
                                <div className="mt-3 p-3 bg-red-100 rounded-md border border-red-300">
                                    <p className="text-red-800 font-medium text-sm">
                                        🚫 <strong>Order Cancelled:</strong> All items in this order have been cancelled and are eligible for refund.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Refund Details */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="font-semibold text-lg mb-3 text-green-800 flex items-center">
                                <span className="mr-2">💰</span>
                                Refund Information
                            </h3>
                            <div className="space-y-2">
                                <p><span className="font-medium text-green-700">Refund Status:</span> 
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                                        refundDetails.refundStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        refundDetails.refundStatus === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {refundDetails.refundStatus || 'PROCESSING'}
                                    </span>
                                </p>
                                <p><span className="font-medium text-green-700">Refund Percentage:</span> {
                                    (() => {
                                        // Debug logging for refund percentage
                                        console.log('🔍 Refund Percentage Debug:', {
                                            adminResponse_refundPercentage: adminResponse.refundPercentage,
                                            refundDetails_refundPercentage: refundDetails?.refundPercentage,
                                            refund_refundDetails_refundPercentage: refund.refundDetails?.refundPercentage,
                                            adminResponse_full: adminResponse,
                                            refundDetails_full: refundDetails,
                                            refund_full: refund,
                                            // Check all possible percentage sources
                                            adminResponse_keys: Object.keys(adminResponse),
                                            possible_percentage_sources: {
                                                'adminResponse.refundPercentage': adminResponse.refundPercentage,
                                                'adminResponse.percentage': adminResponse.percentage,
                                                'adminResponse.refund_percentage': adminResponse.refund_percentage,
                                                'refundDetails.refundPercentage': refundDetails?.refundPercentage,
                                                'refundDetails.percentage': refundDetails?.percentage,
                                                'refund.adminResponse.refundPercentage': refund.adminResponse?.refundPercentage,
                                                'refund.refundPercentage': refund.refundPercentage
                                            }
                                        });
                                        
                                        // Try multiple sources for the dynamic percentage
                                        const dynamicPercentage = 
                                            adminResponse.refundPercentage ||
                                            adminResponse.percentage ||
                                            adminResponse.refund_percentage ||
                                            refundDetails?.refundPercentage ||
                                            refundDetails?.percentage ||
                                            refund.adminResponse?.refundPercentage ||
                                            refund.refundPercentage ||
                                            refund.refundDetails?.refundPercentage;
                                        
                                        console.log('🎯 Selected dynamic percentage:', dynamicPercentage);
                                        
                                        if (dynamicPercentage && dynamicPercentage > 0) {
                                            return `${dynamicPercentage}%`;
                                        } else {
                                            return 'Admin will verify and update';
                                        }
                                    })()
                                }</p>
                                <p><span className="font-medium text-green-700">Refund Amount:</span> {
                                    (refund.status === 'PENDING' || !adminResponse.refundAmount || adminResponse.refundAmount <= 0) 
                                        ? 'Admin will verify and update' 
                                        : DisplayPriceInRupees(adminResponse.refundAmount)
                                }</p>
                                
                                {refundDetails.refundId && (
                                    <>
                                        <p><span className="font-medium text-green-700">Refund ID:</span> {refundDetails.refundId}</p>
                                        <p><span className="font-medium text-green-700">Refund Date:</span> {formatDate(refundDetails.refundDate)}</p>
                                    </>
                                )}

                                {adminResponse.adminComments && (
                                    <p><span className="font-medium text-green-700">Admin Comments:</span> {adminResponse.adminComments}</p>
                                )}
                                
                                {/* Clear refund summary */}
                                {refundDetails.refundStatus === 'COMPLETED' && (
                                    <div className="mt-3 p-3 bg-green-100 rounded-md border border-green-300">
                                        <p className="text-green-800 font-medium text-sm">
                                            ✅ <strong>Refund Completed:</strong> Your refund has been processed and will be credited to your original payment method within 5-7 business days.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Products Details - Enhanced with Cancelled and Remaining Products */}
                        <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-lg">Order Items Summary</h3>
                                <div className="text-sm">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                                        {order.items?.length || 0} total item{order.items?.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md font-medium">
                                        Total: {DisplayPriceInRupees(order.totalAmt)}
                                    </span>
                                </div>
                            </div>
                            
                            {order.items && order.items.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Cancelled/Refunded Products Section */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h4 className="font-semibold text-red-800 text-lg">❌ Cancelled & Refunded Items</h4>
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm font-medium">
                                                {order.items?.filter(item => 
                                                    item.status === 'Cancelled' || 
                                                    refund.cancelledItems?.some(cancelled => cancelled._id === item._id)
                                                ).length || 0} item{(order.items?.filter(item => 
                                                    item.status === 'Cancelled' || 
                                                    refund.cancelledItems?.some(cancelled => cancelled._id === item._id)
                                                ).length || 0) !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-3">
                                            {order.items
                                                .filter(item => 
                                                    item.status === 'Cancelled' || 
                                                    refund.cancelledItems?.some(cancelled => cancelled._id === item._id)
                                                )
                                                .map((item, index) => (
                                                <div key={`cancelled-${index}`} className="border border-red-200 rounded-lg p-3 flex items-center bg-white">
                                                    <div className="flex-shrink-0 w-16 h-16 mr-4 relative">
                                                        <img 
                                                            src={getImageSource(item)}
                                                            alt={item.itemType === 'product' 
                                                                ? (item.productDetails?.name || item.productId?.name || 'Product') 
                                                                : (item.bundleDetails?.title || item.bundleId?.title || 'Bundle')} 
                                                            className="w-full h-full object-cover rounded"
                                                            onError={(e) => {
                                                                console.log('Image failed to load:', e.target.src);
                                                                e.target.src = noCart;
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded flex items-center justify-center">
                                                            <span className="text-red-600 font-bold text-xs">❌</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h5 className="font-medium text-gray-800">
                                                                {item.itemType === 'product' 
                                                                    ? item.productDetails?.name || item.productId?.name || 'Product' 
                                                                    : item.bundleDetails?.title || item.bundleId?.title || 'Bundle'}
                                                            </h5>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                item.itemType === 'bundle' 
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {item.itemType === 'bundle' ? '📦 Bundle' : '🏷️ Product'}
                                                            </span>
                                                            {item.itemType === 'bundle' && onShowBundleItems && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const bundleData = {
                                                                            ...item,
                                                                            ...(item?.bundleDetails || {}),
                                                                            ...(item?.bundleId && typeof item?.bundleId === 'object' ? item.bundleId : {}),
                                                                            title: item?.bundleDetails?.title || 
                                                                                   (item?.bundleId && typeof item?.bundleId === 'object' && item?.bundleId?.title) ||
                                                                                   item?.title ||
                                                                                   'Bundle'
                                                                        };
                                                                        onShowBundleItems(bundleData, order);
                                                                    }}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                                    title="View all items in this bundle"
                                                                >
                                                                    <FaBox className="w-3 h-3 mr-1" />
                                                                    View Items
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-2 items-center">
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-medium">
                                                                Quantity: {item.quantity}
                                                            </span>
                                                            
                                                            {item.itemType === 'product' && (item.size || item.productDetails?.size) && (
                                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md font-medium">
                                                                    Size: {item.size || item.productDetails?.size}
                                                                </span>
                                                            )}
                                                            
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-md font-medium">
                                                                Price: {DisplayPriceInRupees(getItemPrice(item))}
                                                            </span>
                                                            
                                                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-200">
                                                                ❌ REFUNDED
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-medium mt-2">
                                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md inline-flex items-center">
                                                                <span className="mr-1">Refund Amount:</span>
                                                                <span className="text-red-700 font-bold">
                                                                    {DisplayPriceInRupees(getItemRefundAmount(item))}
                                                                </span>
                                                                {item.quantity > 1 && (
                                                                    <span className="ml-1 text-xs text-gray-600">
                                                                        ({item.quantity} × {DisplayPriceInRupees(getItemPrice(item))})
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Remaining/Active Products Section */}
                                    {order.items.filter(item => 
                                        item.status !== 'Cancelled' && 
                                        !refund.cancelledItems?.some(cancelled => cancelled._id === item._id)
                                    ).length > 0 && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <h4 className="font-semibold text-green-800 text-lg">✅ Remaining Active Items</h4>
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm font-medium">
                                                    {order.items?.filter(item => 
                                                        item.status !== 'Cancelled' && 
                                                        !refund.cancelledItems?.some(cancelled => cancelled._id === item._id)
                                                    ).length || 0} item{(order.items?.filter(item => 
                                                        item.status !== 'Cancelled' && 
                                                        !refund.cancelledItems?.some(cancelled => cancelled._id === item._id)
                                                    ).length || 0) !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-green-700 text-sm mb-3 font-medium">
                                                These items remain active in your order and will be delivered as scheduled.
                                            </p>
                                            
                                            <div className="grid grid-cols-1 gap-3">
                                                {order.items
                                                    .filter(item => 
                                                        item.status !== 'Cancelled' && 
                                                        !refund.cancelledItems?.some(cancelled => cancelled._id === item._id)
                                                    )
                                                    .map((item, index) => (
                                                    <div key={`remaining-${index}`} className="border border-green-200 rounded-lg p-3 flex items-center bg-white">
                                                        <div className="flex-shrink-0 w-16 h-16 mr-4 relative">
                                                            <img 
                                                                src={getImageSource(item)}
                                                                alt={item.itemType === 'product' 
                                                                    ? (item.productDetails?.name || item.productId?.name || 'Product') 
                                                                    : (item.bundleDetails?.title || item.bundleId?.title || 'Bundle')} 
                                                                className="w-full h-full object-cover rounded"
                                                                onError={(e) => {
                                                                    console.log('Image failed to load:', e.target.src);
                                                                    e.target.src = noCart;
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded flex items-center justify-center">
                                                                <span className="text-green-600 font-bold text-xs">✅</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-grow">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h5 className="font-medium text-gray-800">
                                                                    {item.itemType === 'product' 
                                                                        ? item.productDetails?.name || item.productId?.name || 'Product' 
                                                                        : item.bundleDetails?.title || item.bundleId?.title || 'Bundle'}
                                                                </h5>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    item.itemType === 'bundle' 
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                    {item.itemType === 'bundle' ? '📦 Bundle' : '🏷️ Product'}
                                                                </span>
                                                                {item.itemType === 'bundle' && onShowBundleItems && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const bundleData = {
                                                                                ...item,
                                                                                ...(item?.bundleDetails || {}),
                                                                                ...(item?.bundleId && typeof item?.bundleId === 'object' ? item.bundleId : {}),
                                                                                title: item?.bundleDetails?.title || 
                                                                                       (item?.bundleId && typeof item?.bundleId === 'object' && item?.bundleId?.title) ||
                                                                                       item?.title ||
                                                                                       'Bundle'
                                                                            };
                                                                            onShowBundleItems(bundleData, order);
                                                                        }}
                                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 bg-green-100 text-green-800 hover:bg-green-200"
                                                                        title="View all items in this bundle"
                                                                    >
                                                                        <FaBox className="w-3 h-3 mr-1" />
                                                                        View Items
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-2 items-center">
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-medium">
                                                                    Quantity: {item.quantity}
                                                                </span>
                                                                
                                                                {item.itemType === 'product' && (item.size || item.productDetails?.size) && (
                                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md font-medium">
                                                                        Size: {item.size || item.productDetails?.size}
                                                                    </span>
                                                                )}
                                                                
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-md font-medium">
                                                                    Price: {DisplayPriceInRupees(getItemPrice(item))}
                                                                </span>
                                                                
                                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">
                                                                    ✅ ACTIVE
                                                                </span>
                                                            </div>
                                                            <div className="text-sm font-medium mt-2">
                                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md inline-flex items-center">
                                                                    <span className="mr-1">Item Total:</span>
                                                                    <span className="text-green-700 font-bold">
                                                                        {DisplayPriceInRupees(getItemRefundAmount(item))}
                                                                    </span>
                                                                    {item.quantity > 1 && (
                                                                        <span className="ml-1 text-xs text-gray-600">
                                                                            ({item.quantity} × {DisplayPriceInRupees(getItemPrice(item))})
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500">No product details available</p>
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
                        
                        {refund.status === 'APPROVED' && refundDetails.refundStatus === 'COMPLETED' && (
                            <button 
                                onClick={downloadInvoice}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                            >
                                <FaDownload className="mr-2" /> Download Invoice
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyRefunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    
    // Bundle Items Modal States
    const [showBundleItemsModal, setShowBundleItemsModal] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [orderContext, setOrderContext] = useState(null);

    // Fetch user's refunds
    const fetchUserRefunds = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.getUserRefunds,
            });

            if (response.data.success) {
                setRefunds(response.data.data);
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

    // Fetch refunds on component mount
    useEffect(() => {
        fetchUserRefunds();
    }, []);

    // View refund details
    const handleViewRefund = (refund) => {
        setSelectedRefund(refund);
        setShowDetailsModal(true);
    };

    // Close refund details modal
    const handleCloseModal = () => {
        setShowDetailsModal(false);
    };

    // Bundle Items Modal Handlers
    const handleShowBundleItems = (bundle, order = null) => {
        setSelectedBundle(bundle);
        setOrderContext(order);
        setShowBundleItemsModal(true);
    };

    const handleCloseBundleItemsModal = () => {
        setShowBundleItemsModal(false);
        setSelectedBundle(null);
        setOrderContext(null);
    };

    return (
        <div className="py-6">
            <h1 className="text-2xl font-bold mb-6">My Cancellation &amp; Refund Requests</h1>
            
            {/* Refresh Button */}
            <div className="mb-6">
                <button
                    onClick={fetchUserRefunds}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                    <FaSpinner className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Refunds List */}
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <FaSpinner className="animate-spin mr-2 text-2xl" />
                    <span>Loading refunds...</span>
                </div>
            ) : refunds.length === 0 ? (
                <div className="text-center py-8">
                    <AnimatedImage height={200} />
                    <p className="mt-4 text-gray-500 text-lg">No refunds found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Request Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount/Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {refunds.map(refund => (
                                <tr key={refund._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {refund.orderId?.orderId || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(refund.requestDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {refund.reason || 'Not specified'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(refund.status, refund.refundDetails?.refundStatus)}`}>
                                            {getDisplayStatus(refund.status, refund.refundDetails?.refundStatus)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {refund.status === 'APPROVED' ? 
                                          (refund.adminResponse?.refundAmount && refund.adminResponse.refundAmount > 0 
                                            ? DisplayPriceInRupees(refund.adminResponse.refundAmount) 
                                            : 'Admin will verify and update'
                                          ) :
                                          (refund.status === 'REJECTED' ? 
                                            formatDate(refund.adminResponse?.processedDate) : 
                                            'Admin will verify and update')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleViewRefund(refund)}
                                            className="text-blue-600 hover:text-blue-900 flex items-center ml-auto"
                                        >
                                            <FaInfoCircle className="mr-1" /> Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Refund Details Modal */}
            {showDetailsModal && selectedRefund && (
                <RefundDetailsModal 
                    refund={selectedRefund} 
                    onClose={handleCloseModal}
                    onShowBundleItems={handleShowBundleItems}
                />
            )}

            {/* Bundle Items Modal */}
            {showBundleItemsModal && selectedBundle && (
                <BundleItemsModal
                    bundle={selectedBundle}
                    isOpen={showBundleItemsModal}
                    onClose={handleCloseBundleItemsModal}
                    orderContext={orderContext}
                />
            )}
        </div>
    );
};

export default MyRefunds;
