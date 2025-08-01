import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaSearch, FaFilter, FaCheck, FaSpinner, FaTimes, FaMoneyBillWave, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import noCart from '../assets/noCart.jpg'; // Import fallback image

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
            const token = localStorage.getItem('accessToken');
            if (!token) {
                toast.error("Authentication token missing. Please log in again.");
                setLoading(false);
                return;
            }

            const response = await Axios({
                ...SummaryApi.getAllRefunds,
                url: `${SummaryApi.getAllRefunds.url}?page=${page}&limit=10&status=${filterStatus}`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                console.log("Full response data:", response.data);
                setRefunds(response.data.data.refunds);
                setCurrentPage(response.data.data.currentPage);
                setTotalPages(response.data.data.totalPages);
                
                // Log detailed information about the first refund for debugging
                if (response.data.data.refunds && response.data.data.refunds.length > 0) {
                    const firstRefund = response.data.data.refunds[0];
                    console.log("Sample refund data:", firstRefund);
                    console.log("Order data:", firstRefund?.orderId);
                    
                    // Log product/bundle data if available
                    if (firstRefund?.orderId?.items && firstRefund.orderId.items.length > 0) {
                        console.log("First order item:", firstRefund.orderId.items[0]);
                        const firstItem = firstRefund.orderId.items[0];
                        if (firstItem.itemType === 'product') {
                            console.log("Product data:", firstItem.productId);
                            console.log("Product details:", firstItem.productDetails);
                        } else {
                            console.log("Bundle data:", firstItem.bundleId);
                            console.log("Bundle details:", firstItem.bundleDetails);
                        }
                    }
                }
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
    
    // Get image source with proper fallbacks
    const getImageSource = (item) => {
        if (!item) return noCart;
        
        // Initialize with fallback
        let imageSrc = noCart;
        
        try {
            // Log for debugging
            console.log("Getting image for item:", item);
            
            if (item.itemType === 'bundle') {
                // First check if bundleId is an object with images
                if (item.bundleId && typeof item.bundleId === 'object') {
                    console.log("Bundle ID is object:", item.bundleId);
                    if (item.bundleId.images && item.bundleId.images.length > 0) {
                        imageSrc = item.bundleId.images[0];
                    } else if (item.bundleId.image) {
                        // Handle both string and array cases for image
                        imageSrc = Array.isArray(item.bundleId.image) ? item.bundleId.image[0] : item.bundleId.image;
                    }
                }
                // Then try bundleDetails
                else if (item.bundleDetails) {
                    console.log("Using bundle details:", item.bundleDetails);
                    if (Array.isArray(item.bundleDetails.images)) {
                        imageSrc = item.bundleDetails.images[0] || noCart;
                    } else if (Array.isArray(item.bundleDetails.image)) {
                        imageSrc = item.bundleDetails.image[0] || noCart;
                    } else {
                        imageSrc = item.bundleDetails.image || noCart;
                    }
                }
                // Try directly from item (some responses might have it flattened)
                else if (item.images && item.images.length > 0) {
                    imageSrc = item.images[0];
                } else if (item.image) {
                    imageSrc = Array.isArray(item.image) ? item.image[0] : item.image;
                }
            } else {
                // For products, check if productId is an object with images
                if (item.productId && typeof item.productId === 'object') {
                    console.log("Product ID is object:", item.productId);
                    if (item.productId.images && item.productId.images.length > 0) {
                        imageSrc = item.productId.images[0];
                    } else if (item.productId.image) {
                        // Handle both string and array cases for image
                        imageSrc = Array.isArray(item.productId.image) ? item.productId.image[0] : item.productId.image;
                    }
                }
                // Then try productDetails
                else if (item.productDetails) {
                    console.log("Using product details:", item.productDetails);
                    if (Array.isArray(item.productDetails.images)) {
                        imageSrc = item.productDetails.images[0] || noCart;
                    } else if (Array.isArray(item.productDetails.image)) {
                        imageSrc = item.productDetails.image[0] || noCart;
                    } else {
                        imageSrc = item.productDetails.image || noCart;
                    }
                }
                // Try directly from item (some responses might have it flattened)
                else if (item.images && item.images.length > 0) {
                    imageSrc = item.images[0];
                } else if (item.image) {
                    imageSrc = Array.isArray(item.image) ? item.image[0] : item.image;
                }
            }
        } catch (error) {
            console.error("Error getting image source:", error);
            return noCart;
        }
        
        // Final fallback check
        return imageSrc || noCart;
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
            const token = localStorage.getItem('accessToken');
            if (!token) {
                toast.error("Authentication token missing. Please log in again.");
                setProcessingRefundId(null);
                return;
            }
            
            const response = await Axios({
                ...SummaryApi.completeRefund,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
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

        // Debug the refund structure
        console.log("RefundDetailsModal received refund:", refund);

        const order = refund.orderId || {};
        const user = refund.userId || {};
        const refundDetails = refund.refundDetails || {};
        const adminResponse = refund.adminResponse || {};
        
        console.log("Order details:", order);
        console.log("Order items:", order.items);

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
                                <p><span className="font-medium">Subtotal:</span> {DisplayPriceInRupees(order.subTotalAmt || 0)}</p>
                                {order.deliveryCharge > 0 && (
                                    <p className="text-blue-700"><span className="font-medium">Delivery Charge:</span> {DisplayPriceInRupees(order.deliveryCharge)}</p>
                                )}
                                <p className="font-bold border-t border-gray-300 mt-2 pt-2"><span className="font-medium">Total Amount:</span> {DisplayPriceInRupees(order.totalAmt)}</p>
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
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md">
                                        <span className="font-medium text-blue-700">Refund Status:</span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(refundDetails.refundStatus || 'PROCESSING')}`}>
                                            {refundDetails.refundStatus || 'PROCESSING'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md">
                                        <span className="font-medium text-blue-700">Refund Policy:</span>
                                        <span className="text-blue-800">90% of item price</span>
                                    </div>
                                    
                                    {/* Calculate total refund with enhanced discount pricing support */}
                                    {(() => {
                                        // Priority 1: Use enhanced refund data with discount pricing (HIGHEST PRIORITY)
                                        if (refundDetails.enhancedRefundData?.finalRefundAmount !== undefined) {
                                            const enhancedAmount = refundDetails.enhancedRefundData.finalRefundAmount;
                                            console.log('✅ Using enhanced refund data (includes delivery):', enhancedAmount);
                                            
                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-3 py-1.5 bg-green-50 border border-green-100 rounded-md">
                                                        <span className="font-medium text-green-700">Final Refund Amount:</span>
                                                        <span className="text-green-800 font-bold">{DisplayPriceInRupees(enhancedAmount)}</span>
                                                    </div>
                                                    
                                                    {/* Show refund percentage */}
                                                    <div className="flex justify-between items-center px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md">
                                                        <span className="font-medium text-blue-700">Applied Refund Rate:</span>
                                                        <span className="text-blue-800 font-semibold">
                                                            90%
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Show itemized breakdown if available */}
                                                    {refundDetails.enhancedRefundData.itemsRefund !== undefined && (
                                                        <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs">
                                                            <div className="font-medium text-gray-700">Items Refund:</div>
                                                            <div className="text-right text-gray-800">{DisplayPriceInRupees(refundDetails.enhancedRefundData.itemsRefund)}</div>
                                                            
                                                            {order.deliveryCharge > 0 && refundDetails.enhancedRefundData.deliveryRefund !== undefined && (
                                                                <>
                                                                    <div className="font-medium text-blue-700">Delivery Refund:</div>
                                                                    <div className="text-right text-blue-800">{DisplayPriceInRupees(refundDetails.enhancedRefundData.deliveryRefund)}</div>
                                                                </>
                                                            )}
                                                            
                                                            <div className="font-medium text-gray-800 border-t border-gray-300 pt-1">Total Refund:</div>
                                                            <div className="text-right font-bold text-green-700 border-t border-gray-300 pt-1">{DisplayPriceInRupees(enhancedAmount)}</div>
                                                        </div>
                                                    )}
                                                    
                                                    {refundDetails.enhancedRefundData.basedOnDiscountedPricing && (
                                                        <div className="text-xs text-green-600 px-3 py-1 bg-green-50 rounded">
                                                            ✅ Calculated using discounted prices the customer actually paid
                                                        </div>
                                                    )}
                                                    
                                                    {refundDetails.enhancedRefundData.cancellationType && (
                                                        <div className="text-xs text-blue-600 px-3 py-1 bg-blue-50 rounded">
                                                            <span className="font-semibold">Type:</span> {refundDetails.enhancedRefundData.cancellationType.replace('_', ' ')}
                                                            {refundDetails.enhancedRefundData.cancellationType === 'PARTIAL_ITEMS' && 
                                                             order.deliveryCharge > 0 && 
                                                             ' (includes proportional delivery charge)'}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                        
                                        // Priority 2: Use direct adminResponse.refundAmount
                                        let totalRefundAmount = parseFloat(adminResponse.refundAmount || 0);
                                        
                                        // Priority 3: Calculate from item refund amounts (fallback)
                                        if (totalRefundAmount < 1 && order.items && Array.isArray(order.items)) {
                                            const cancelledItems = order.items.filter(item => item?.status === 'Cancelled' || item?.cancelApproved === true);
                                            
                                            // Sum up individual refund amounts
                                            let calculatedTotal = 0;
                                            cancelledItems.forEach(item => {
                                                // Use item's refundAmount if available, otherwise calculate it
                                                if (item.refundAmount && parseFloat(item.refundAmount) > 0) {
                                                    calculatedTotal += parseFloat(item.refundAmount);
                                                } else {
                                                    // Calculate refund percentage based on order timing
                                                    const orderDate = order.orderDate || order.createdAt;
                                                    let refundPercentage = 75; // Default fallback
                                                    
                                                    if (orderDate) {
                                                        const hoursSinceOrder = (new Date() - new Date(orderDate)) / (1000 * 60 * 60);
                                                        refundPercentage = hoursSinceOrder <= 24 ? 90 : 75;
                                                    }
                                                    const itemPrice = 
                                                        item.productId?.price || 
                                                        item.productDetails?.price || 
                                                        item.price || 
                                                        (item.itemTotal / (item.quantity || 1)) || 
                                                        0;
                                                        
                                                    calculatedTotal += parseFloat(itemPrice) * (item.quantity || 1) * (refundPercentage / 100);
                                                }
                                            });
                                            
                                            // Check if this is a partial order but effectively all items are being cancelled
                                            // This can happen when the user cancels one item now and another item later
                                            const isFullOrderCancellation = cancelledItems.length === order.items.length;
                                            
                                            // For any cancellation with all items cancelled, add full delivery charge refund at 90%
                                            if (isFullOrderCancellation && order.deliveryCharge > 0) {
                                                // Always use 90% for full order refunds
                                                const deliveryRefund = (order.deliveryCharge * 90) / 100;
                                                calculatedTotal += deliveryRefund;
                                                console.log('Added full delivery charge refund (90%):', deliveryRefund);
                                            }
                                            // For partial cancellations, add proportional delivery refund
                                            else if (!isFullOrderCancellation && order.deliveryCharge > 0 && cancelledItems.length > 0) {
                                                const totalOrderValue = order.subTotalAmt || (order.totalAmt - order.deliveryCharge);
                                                let cancelledValue = 0;
                                                cancelledItems.forEach(item => {
                                                    const itemPrice = item.productId?.price || item.productDetails?.price || item.price || 0;
                                                    cancelledValue += itemPrice * (item.quantity || 1);
                                                });
                                                
                                                if (totalOrderValue > 0) {
                                                    const deliveryProportion = cancelledValue / totalOrderValue;
                                                    // Always use 90% for partial cancellation delivery refunds
                                                    const proportionalDeliveryRefund = (order.deliveryCharge * deliveryProportion * 90) / 100;
                                                    calculatedTotal += proportionalDeliveryRefund;
                                                    console.log('Added proportional delivery refund (90%):', proportionalDeliveryRefund);
                                                }
                                            }
                                            
                                            if (calculatedTotal > 0) {
                                                totalRefundAmount = calculatedTotal;
                                                console.log(`⚠️ Fallback calculated total refund (includes delivery): ${totalRefundAmount}`);
                                            }
                                        }
                                        
                                        // Calculate the estimated portion of refund that came from delivery charge
                                        const isFullOrderCancellation = order.items && 
                                            Array.isArray(order.items) && 
                                            order.items.length > 0 && 
                                            order.items.every(item => item?.status === 'Cancelled' || item?.cancelApproved === true);
                                            
                                        // Calculate refund percentage based on order timing
                                        const orderDate = order?.orderDate || order?.createdAt;
                                        let refundPercentage = 75; // Default fallback
                                        
                                        if (orderDate) {
                                            const hoursSinceOrder = (new Date() - new Date(orderDate)) / (1000 * 60 * 60);
                                            refundPercentage = hoursSinceOrder <= 24 ? 90 : 75;
                                        }
                                        
                                        let estimatedDeliveryRefund = 0;
                                        
                                        if (order.deliveryCharge > 0) {
                                            if (isFullOrderCancellation) {
                                                estimatedDeliveryRefund = (order.deliveryCharge * refundPercentage / 100);
                                            } else {
                                                // For partial cancellations, estimate proportional delivery refund
                                                const cancelledItems = order.items.filter(item => 
                                                    item?.status === 'Cancelled' || item?.cancelApproved === true);
                                                
                                                if (cancelledItems.length > 0 && order.items.length > 0) {
                                                    estimatedDeliveryRefund = (order.deliveryCharge * (cancelledItems.length / order.items.length) * refundPercentage / 100);
                                                }
                                            }
                                        }
                                        
                                        const estimatedItemsRefund = totalRefundAmount - estimatedDeliveryRefund;
                                            
                                        return (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center px-3 py-1.5 bg-green-50 border border-green-100 rounded-md">
                                                    <span className="font-medium text-green-700">Total Refund Amount:</span>
                                                    <span className="text-green-800 font-bold">{DisplayPriceInRupees(totalRefundAmount)}</span>
                                                </div>
                                                
                                                {/* Show refund percentage */}
                                                <div className="flex justify-between items-center px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md">
                                                    <span className="font-medium text-blue-700">Applied Refund Rate:</span>
                                                    <span className="text-blue-800 font-semibold">{refundPercentage}%</span>
                                                </div>
                                                
                                                {/* Show estimated breakdown for better transparency */}
                                                {order.deliveryCharge > 0 && (
                                                    <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs">
                                                        <div className="font-medium text-gray-700">Estimated Items Refund:</div>
                                                        <div className="text-right text-gray-800">{DisplayPriceInRupees(estimatedItemsRefund)}</div>
                                                        
                                                        <div className="font-medium text-blue-700">Estimated Delivery Refund:</div>
                                                        <div className="text-right text-blue-800">{DisplayPriceInRupees(estimatedDeliveryRefund)}</div>
                                                        
                                                        <div className="font-medium text-gray-800 border-t border-gray-300 pt-1">Total Refund:</div>
                                                        <div className="text-right font-bold text-green-700 border-t border-gray-300 pt-1">{DisplayPriceInRupees(totalRefundAmount)}</div>
                                                    </div>
                                                )}
                                                
                                                {isFullOrderCancellation && order.deliveryCharge > 0 && (
                                                    <div className="text-xs text-blue-600 px-3 py-1 bg-blue-50 rounded">
                                                        💡 Full order cancellation - includes {refundPercentage}% of delivery charge (₹{order.deliveryCharge})
                                                    </div>
                                                )}
                                                
                                                {!isFullOrderCancellation && order.deliveryCharge > 0 && (
                                                    <div className="text-xs text-blue-600 px-3 py-1 bg-blue-50 rounded">
                                                        💡 Partial cancellation - includes proportional delivery charge refund
                                                    </div>
                                                )}
                                                
                                                {totalRefundAmount > 0 && (
                                                    <div className="text-xs text-yellow-600 px-3 py-1 bg-yellow-50 rounded">
                                                        ⚠️ Using estimated calculation - refund values are approximate
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    
                                    {refundDetails.refundId && (
                                        <>
                                            <div className="flex justify-between items-center px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-md">
                                                <span className="font-medium text-purple-700">Refund ID:</span>
                                                <span className="text-purple-800">{refundDetails.refundId}</span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-md">
                                                <span className="font-medium text-purple-700">Refund Date:</span>
                                                <span className="text-purple-800">{formatDate(refundDetails.refundDate)}</span>
                                            </div>
                                        </>
                                    )}

                                    {/* Cancellation Type - Full or Partial */}
                                    <div className="flex justify-between items-center px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-md">
                                        <span className="font-medium text-orange-700">Cancellation Type:</span>
                                        <span className="text-orange-800">
                                            {order.items && Array.isArray(order.items) && 
                                             order.items.some(item => item?.status !== 'Cancelled' && item?.cancelApproved !== true) 
                                             ? 'Partial Cancellation' : 'Full Order Cancellation'}
                                        </span>
                                    </div>
                                    
                                    {/* Count of cancelled items */}
                                    {order.items && Array.isArray(order.items) && (
                                        <div className="flex justify-between items-center px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-md">
                                            <span className="font-medium text-orange-700">Items Cancelled:</span>
                                            <span className="text-orange-800">
                                                {order.items.filter(item => item?.status === 'Cancelled' || item?.cancelApproved === true).length} 
                                                {' of '} 
                                                {order.items.length}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {adminResponse.adminComments && (
                                        <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md">
                                            <p className="font-medium text-gray-700">Admin Comments:</p>
                                            <p className="text-gray-800 mt-1">{adminResponse.adminComments}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Products Details */}
                            <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                                <h3 className="font-semibold text-lg mb-3">Product Details</h3>
                                {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 mt-2">
                                        {order.items.map((item, index) => {
                                            // Debug: Log item structure to console
                                            console.log(`Item ${index}:`, item);
                                            
                                            // Check if item is cancelled
                                            const isItemCancelled = item?.status === 'Cancelled' || item?.cancelApproved === true;
                                            
                                            // Get item name with enhanced fallback logic
                                            let itemName = 'Product';
                                            if (item.itemType === 'bundle') {
                                                // Check all possible places where bundle name could be stored
                                                if (item.bundleId && typeof item.bundleId === 'object') {
                                                    itemName = item.bundleId.title || item.bundleId.name || 'Bundle';
                                                } else if (item.bundleDetails) {
                                                    itemName = item.bundleDetails.title || item.bundleDetails.name || 'Bundle';
                                                } else if (item.title) {
                                                    itemName = item.title;
                                                } else if (item.name) {
                                                    itemName = item.name;
                                                }
                                            } else {
                                                // Check all possible places where product name could be stored
                                                if (item.productId && typeof item.productId === 'object') {
                                                    itemName = item.productId.name || item.productId.title || 'Product';
                                                } else if (item.productDetails) {
                                                    itemName = item.productDetails.name || item.productDetails.title || 'Product';
                                                } else if (item.name) {
                                                    itemName = item.name;
                                                } else if (item.title) {
                                                    itemName = item.title;
                                                }
                                            }
                                            
                                            // Get item price with enhanced fallback logic
                                            let itemPrice = 0;
                                            if (item.itemType === 'bundle') {
                                                // Check all possible places where bundle price could be stored
                                                if (item.bundleId && typeof item.bundleId === 'object') {
                                                    itemPrice = item.bundleId.bundlePrice || item.bundleId.price || 0;
                                                } else if (item.bundleDetails) {
                                                    itemPrice = item.bundleDetails.bundlePrice || item.bundleDetails.price || 0;
                                                } else if (item.bundlePrice) {
                                                    itemPrice = item.bundlePrice;
                                                } else if (item.price) {
                                                    itemPrice = item.price;
                                                }
                                            } else {
                                                // Check all possible places where product price could be stored
                                                if (item.productId && typeof item.productId === 'object') {
                                                    itemPrice = item.productId.price || 0;
                                                } else if (item.productDetails) {
                                                    itemPrice = item.productDetails.price || 0;
                                                } else if (item.price) {
                                                    itemPrice = item.price;
                                                }
                                            }
                                            
                                            // Calculate refund amount for this item if it's cancelled
                                            // Calculate refund percentage based on order timing
                                            const orderDate = order?.orderDate || order?.createdAt;
                                            let refundPercentage = 75; // Default fallback
                                            
                                            if (orderDate) {
                                                const hoursSinceOrder = (new Date() - new Date(orderDate)) / (1000 * 60 * 60);
                                                refundPercentage = hoursSinceOrder <= 24 ? 90 : 75;
                                            }
                                            
                                            // Use item's saved refundAmount if available, otherwise calculate it
                                            let itemRefundAmount = 0;
                                            if (isItemCancelled) {
                                                // First check if the item already has a refund amount set
                                                if (item.refundAmount && parseFloat(item.refundAmount) > 0) {
                                                    itemRefundAmount = parseFloat(item.refundAmount).toFixed(2);
                                                    console.log(`Using saved refund amount: ${itemRefundAmount}`);
                                                } else {
                                                    // If not, calculate it from the item price and percentage
                                                    // Make sure we're using the correct price from productId if available
                                                    const actualPrice = item.productId?.price || 
                                                                        item.productDetails?.price || 
                                                                        itemPrice || 
                                                                        (item.itemTotal / (item.quantity || 1)) || 
                                                                        0;
                                                    
                                                    itemRefundAmount = (parseFloat(actualPrice) * (item.quantity || 1) * (refundPercentage / 100)).toFixed(2);
                                                    console.log(`Calculated refund amount: ${itemRefundAmount} from price ${actualPrice}`);
                                                }
                                            }
                                            
                                            console.log(`Extracted name: ${itemName}, price: ${itemPrice}, actual price: ${item.productId?.price}, cancelled: ${isItemCancelled}, refund: ${itemRefundAmount}`);
                                            
                                            return (
                                                <div key={index} className={`border rounded-lg p-3 flex items-center relative ${
                                                    isItemCancelled ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                                                }`}>
                                                    {isItemCancelled && (
                                                        <div className="absolute top-0 right-0 transform -translate-y-1/3 translate-x-1/3">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                                Cancelled
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex-shrink-0 w-16 h-16 mr-4">
                                                        <img 
                                                            src={getImageSource(item)}
                                                            alt={itemName}
                                                            className={`w-full h-full object-cover rounded ${isItemCancelled ? 'opacity-75' : ''}`}
                                                            onError={(e) => {
                                                                console.log("Image error, falling back to noCart");
                                                                e.target.onerror = null; 
                                                                e.target.src = noCart;
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <h4 className={`font-medium ${isItemCancelled ? 'line-through text-red-700' : ''}`}>
                                                            {itemName}
                                                        </h4>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            <span>Quantity: {item.quantity || 1}</span>
                                                            <span className="mx-2">•</span>
                                                            <span>Price: {DisplayPriceInRupees(itemPrice)}</span>
                                                        </div>
                                                        <div className="text-sm font-medium mt-1">
                                                            Subtotal: {DisplayPriceInRupees(item.itemTotal || (itemPrice * (item.quantity || 1)))}
                                                        </div>
                                                        
                                                        {isItemCancelled && (
                                                            <div className="mt-2 pt-2 border-t border-red-200">
                                                                <div className="text-sm font-medium">
                                                                    <div className="flex justify-between text-blue-700">
                                                                        <span>Refund Percentage:</span>
                                                                        <span>{refundPercentage}%</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-red-700">
                                                                        <span>Refund Amount:</span>
                                                                        <span className="font-bold">{DisplayPriceInRupees(itemRefundAmount)}</span>
                                                                    </div>
                                                                    {item.refundAmount && parseFloat(item.refundAmount) > 0 ? (
                                                                        <div className="text-xs text-green-600 mt-1">
                                                                            ✅ Using confirmed refund amount
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-xs text-yellow-600 mt-1">
                                                                            ⚠️ Estimated refund (calculated)
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-yellow-700 font-medium">No product details available</p>
                                        <p className="text-sm text-yellow-600 mt-1">
                                            {!order.items ? "Order items array is missing" : 
                                            !Array.isArray(order.items) ? "Order items is not an array" : 
                                            "Order items array is empty"}
                                        </p>
                                    </div>
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
                            
                            {(refundDetails.refundStatus === 'PROCESSING' || 
                              refundDetails.refundStatus === 'PENDING') && (
                                <button 
                                    onClick={() => {
                                        setSelectedRefund(refund);
                                        setShowCompleteModal(true);
                                        onClose();
                                    }}
                                    className=""
                                >
                                    {/* <FaCheck className="mr-2" /> Complete Refund */}
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
        
        // Calculate the correct refund amount using enhanced data
        const getModalRefundAmount = () => {
            // Priority 1: Use enhanced refund data (discount-based calculation)
            if (selectedRefund.refundDetails?.enhancedRefundData?.finalRefundAmount !== undefined) {
                console.log('CompleteRefundModal: Using enhanced refund amount:', selectedRefund.refundDetails.enhancedRefundData.finalRefundAmount);
                return selectedRefund.refundDetails.enhancedRefundData.finalRefundAmount;
            }
            
            // Priority 2: Fallback to adminResponse.refundAmount
            const fallbackAmount = parseFloat(selectedRefund.adminResponse?.refundAmount || 0);
            console.log('CompleteRefundModal: Using fallback refund amount:', fallbackAmount);
            return fallbackAmount;
        };
        
        const finalRefundAmount = getModalRefundAmount();
        
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
                            
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-blue-700">Refund Policy:</span>
                                    <span className="font-medium text-blue-800">
                                        90%
                                    </span>
                                </div>
                                
                                {/* Display delivery info if available */}
                                {selectedRefund.orderId?.deliveryCharge > 0 && (
                                    <div className="text-xs text-blue-600 mt-1.5">
                                        {selectedRefund.refundDetails?.enhancedRefundData?.cancellationType === 'PARTIAL_ITEMS' 
                                        ? '💲 Includes proportional delivery charge refund' 
                                        : '💲 Includes delivery charge in refund calculation'}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                <span className="font-medium text-green-700">Final Refund Amount:</span>
                                <span className="font-bold text-green-800 text-xl">{DisplayPriceInRupees(finalRefundAmount)}</span>
                            </div>
                            
                            {selectedRefund.refundDetails?.enhancedRefundData?.basedOnDiscountedPricing && (
                                <div className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded-lg">
                                    ✅ Calculated using actual discounted prices paid by customer
                                </div>
                            )}
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
                                    Items Cancelled
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Refund Amount
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
                                    <td colSpan={7} className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center">
                                            <FaSpinner className="animate-spin mr-2" />
                                            Loading refunds...
                                        </div>
                                    </td>
                                </tr>
                            ) : refunds.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
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
                                            <div className="text-gray-900">
                                                {refund.orderId?.items && Array.isArray(refund.orderId.items) ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {refund.orderId.items.filter(item => item?.status === 'Cancelled' || item?.cancelApproved === true).length} 
                                                            {' of '} 
                                                            {refund.orderId.items.length}
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                            {refund.orderId.items.filter(item => item?.status === 'Cancelled' || item?.cancelApproved === true).length === refund.orderId.items.length
                                                                ? 'Full Order' : 'Partial Cancel'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">Unknown</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900 font-medium">
                                                {(() => {
                                                    // Priority 1: Use enhanced refund data with discount pricing (HIGHEST PRIORITY)
                                                    if (refund.refundDetails?.enhancedRefundData?.finalRefundAmount !== undefined) {
                                                        const enhancedAmount = refund.refundDetails.enhancedRefundData.finalRefundAmount;
                                                        console.log('✅ Table using enhanced refund data:', enhancedAmount);
                                                        return (
                                                            <div className="flex flex-col">
                                                                <span>{DisplayPriceInRupees(enhancedAmount)}</span>
                                                                {refund.refundDetails.enhancedRefundData.basedOnDiscountedPricing && (
                                                                    <span className="text-xs text-green-600 font-normal">✅ Discount-based</span>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    // Priority 2: Use direct adminResponse.refundAmount
                                                    let totalRefundAmount = parseFloat(refund.adminResponse?.refundAmount || 0);
                                                    
                                                    // Priority 3: Calculate from item refund amounts (fallback)
                                                    if (totalRefundAmount < 1 && refund.orderId?.items && Array.isArray(refund.orderId.items)) {
                                                        const cancelledItems = refund.orderId.items.filter(
                                                            item => item?.status === 'Cancelled' || item?.cancelApproved === true
                                                        );
                                                        
                                                        // Sum up individual refund amounts
                                                        let calculatedTotal = 0;
                                                        cancelledItems.forEach(item => {
                                                            // Use item's refundAmount if available, otherwise calculate it
                                                            if (item.refundAmount && parseFloat(item.refundAmount) > 0) {
                                                                calculatedTotal += parseFloat(item.refundAmount);
                                                            } else {
                                                                // Calculate refund percentage based on order timing
                                                                const orderDate = order?.orderDate || order?.createdAt;
                                                                let refundPercentage = 75; // Default fallback
                                                                
                                                                if (orderDate) {
                                                                    const hoursSinceOrder = (new Date() - new Date(orderDate)) / (1000 * 60 * 60);
                                                                    refundPercentage = hoursSinceOrder <= 24 ? 90 : 75;
                                                                }
                                                                const itemPrice = 
                                                                    item.productId?.price || 
                                                                    item.productDetails?.price || 
                                                                    item.price || 
                                                                    0;
                                                                    
                                                                calculatedTotal += parseFloat(itemPrice || 0) * (item.quantity || 1) * (refundPercentage / 100);
                                                            }
                                                        });
                                                        
                                                        if (calculatedTotal > 0) {
                                                            totalRefundAmount = calculatedTotal;
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <div className="flex flex-col">
                                                            <span>{DisplayPriceInRupees(totalRefundAmount)}</span>
                                                            {totalRefundAmount > 0 && (
                                                                <span className="text-xs text-yellow-600 font-normal">⚠️ Fallback calc</span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                90% of price
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
                                                
                                                {(refund.refundDetails?.refundStatus === 'PROCESSING' || 
                                                  refund.refundDetails?.refundStatus === 'PENDING') && (
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
