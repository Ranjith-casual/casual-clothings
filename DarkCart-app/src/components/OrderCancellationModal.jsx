import React, { useState, useEffect } from 'react'
import { FaTimes, FaExclamationTriangle, FaInfoCircle, FaRupeeSign, FaCheck, FaExclamationCircle, FaTag, FaPercent } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'
import noCart from '../assets/Empty-cuate.png'
import ensureUserId from '../utils/ensureUserId'

function OrderCancellationModal({ order, onClose, onCancellationRequested }) {
    const [reason, setReason] = useState('')
    const [additionalReason, setAdditionalReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [policy, setPolicy] = useState(null)
    const [estimatedRefund, setEstimatedRefund] = useState(0)
    const [cancelMode, setCancelMode] = useState('full') // 'full' or 'partial'
    const [selectedItems, setSelectedItems] = useState({})

    const cancellationReasons = [
        'Changed mind',
        'Found better price',
        'Wrong item ordered',
        'Delivery delay',
        'Product defect expected',
        'Financial constraints',
        'Duplicate order',
        'Other'
    ]

    useEffect(() => {
        fetchCancellationPolicy()
        
        // Debug: Log order data to understand structure
        console.log('Order data in cancellation modal:', order);
        if (order) {
            console.log('Order totalAmt:', order.totalAmt);
            console.log('Order total:', order.total);
            console.log('Order items:', order.items);
            console.log('Order paymentStatus:', order.paymentStatus);
            console.log('Order paymentMethod:', order.paymentMethod);
        }
    }, [])
    
    // Add effect to ensure user ID is available
    useEffect(() => {
        const checkUserId = async () => {
            try {
                const userId = await ensureUserId();
                console.log("Component loaded: User ID check result:", userId);
            } catch (err) {
                console.error("Error checking user ID on component load:", err);
            }
        };
        
        checkUserId();
    }, [])

    useEffect(() => {
        if (policy && order) {
            const refundPercentage = getTimeBasedRefund()
            
            if (cancelMode === 'full') {
                // For full cancellation, use the stored order total amount as this is what was charged
                // and subtract any delivery charge if needed based on refund policy
                let activeItemsTotal = order.totalAmt || 0;
                
                // If we need to exclude delivery charge from refund calculation
                // (this depends on your business policy)
                const deliveryCharge = order.deliveryCharge || 0;
                // Uncomment the line below if delivery charge should not be refunded
                // activeItemsTotal -= deliveryCharge;
                
                console.log(`Full cancellation - Order total: ${order.totalAmt}, Active items total: ${activeItemsTotal}, Refund %: ${refundPercentage}`);
                setEstimatedRefund((activeItemsTotal * refundPercentage) / 100);
            } else {
                // For partial mode, calculation is handled by another useEffect
                // that watches the selectedItems state
            }
        }
    }, [policy, order, cancelMode])

    const fetchCancellationPolicy = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getCancellationPolicy
            })
            
            if (response.data.success) {
                console.log('Cancellation Policy:', response.data.data.refundPercentage)
                setPolicy(75)
            }
        } catch (error) {
            console.error('Error fetching cancellation policy:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!reason) {
            toast.error('Please select a reason for cancellation')
            return
        }

        if (reason === 'Other' && !additionalReason.trim()) {
            toast.error('Please provide additional details for other reason')
            return
        }
        
        // Double check user authentication before submitting
        let currentUserId = localStorage.getItem('userId')
        const orderUserId = order?.userId?._id || order?.userId
        
        // Try to ensure we have a user ID if it's missing
        if (!currentUserId) {
            try {
                currentUserId = await ensureUserId();
                console.log("Retrieved user ID from API:", currentUserId);
            } catch (err) {
                console.error("Error ensuring user ID:", err);
            }
        }
        
        // Always convert both IDs to strings for consistent comparison
        if (!currentUserId || !orderUserId || 
            (currentUserId.toString() !== (orderUserId?.toString() || ''))) {
            toast.error("Authentication error: You can only cancel your own orders")
            console.error('User ID mismatch:', { 
                currentUserId: currentUserId, 
                orderUserIdString: orderUserId?.toString() || 'undefined',
                currentUserIdString: currentUserId?.toString() || 'undefined',
                orderUserId: orderUserId
            })
            return
        }

        // For partial cancellation, check if any items are selected
        if (cancelMode === 'partial') {
            const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id])
            if (selectedItemIds.length === 0) {
                toast.error('Please select at least one item to cancel')
                return
            }
        }

        setLoading(true)

        try {
            const token = localStorage.getItem('accessToken')
            
            if (cancelMode === 'full') {
                // Full order cancellation
                const response = await Axios({
                    ...SummaryApi.requestOrderCancellation,
                    headers: {
                        authorization: `Bearer ${token}`
                    },
                    data: {
                        orderId: order._id,
                        reason,
                        additionalReason: additionalReason.trim()
                    }
                })

                if (response.data.success) {
                    toast.success('Cancellation request submitted successfully!')
                    onCancellationRequested && onCancellationRequested()
                    onClose()
                }
            } else {
                // Partial item cancellation
                const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id])
                
                if (selectedItemIds.length === 0) {
                    toast.error('Please select at least one item to cancel')
                    setLoading(false)
                    return
                }
                
                // Prepare items to cancel
                const itemsToCancel = selectedItemIds.map(itemId => ({
                    itemId
                }))
                
                const response = await Axios({
                    ...SummaryApi.requestPartialItemCancellation,
                    headers: {
                        authorization: `Bearer ${token}`
                    },
                    data: {
                        orderId: order._id,
                        itemsToCancel,
                        reason,
                        additionalReason: additionalReason.trim()
                    }
                })

                if (response.data.success) {
                    toast.success('Partial cancellation request submitted successfully!')
                    onCancellationRequested && onCancellationRequested()
                    onClose()
                }
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setLoading(false)
        }
    }
    
    // Handle item selection for partial cancellation
    const toggleItemSelection = (itemId) => {
        // Find the item to check if it's already cancelled
        const item = order?.items?.find(i => i._id === itemId);
        if (item && (item.status === 'Cancelled' || item.cancelApproved)) {
            // Don't allow toggling already cancelled items
            console.log(`Item ${itemId} is already cancelled, cannot toggle selection`);
            return;
        }
        
        setSelectedItems(prev => {
            const newSelection = {
                ...prev,
                [itemId]: !prev[itemId]
            }
            
            // Update estimated refund based on selected items
            if (order && policy) {
                const refundPercentage = getTimeBasedRefund()
                const selectedIds = Object.keys(newSelection).filter(id => newSelection[id])
                
                if (selectedIds.length === 0) {
                    setEstimatedRefund(0)
                } else {
                    let totalRefund = 0
                    selectedIds.forEach(id => {
                        const item = order.items.find(i => i._id === id)
                        if (item && item.status !== 'Cancelled' && !item.cancelApproved) {
                            // Calculate item price based on item type
                            let itemPrice = 0
                            
                            if (item.itemType === 'bundle') {
                                // For bundles
                                itemPrice = parseFloat(item.bundleDetails?.bundlePrice) || 
                                           parseFloat(item.bundleId?.bundlePrice) || 
                                           (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                           0;
                            } else {
                                // For products
                                itemPrice = parseFloat(item.sizeAdjustedPrice) || 
                                           parseFloat(item.unitPrice) || 
                                           parseFloat(item.productDetails?.price) || 
                                           (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                           0;
                            }
                            
                            // Calculate total for this item
                            const itemTotal = itemPrice * parseFloat(item.quantity);
                            console.log(`Item: ${item._id}, Price: ${itemPrice}, Quantity: ${item.quantity}, Total: ${itemTotal}`);
                            
                            // Calculate refund amount with percentage
                            const itemRefund = (itemTotal * refundPercentage) / 100;
                            console.log(`Refund percentage: ${refundPercentage}%, Item refund: ${itemRefund}`);
                            
                            totalRefund += itemRefund
                        }
                    })
                    console.log(`Total refund amount: ${totalRefund}`);
                    setEstimatedRefund(totalRefund)
                }
            }
            
            return newSelection
        })
    }
    
    // Calculate estimated refund based on selected items
    useEffect(() => {
        if (policy && order && cancelMode === 'partial') {
            // Debug log for all order items
            if (order.items && order.items.length > 0) {
                console.log('[useEffect Debug] All order items count:', order.items.length);
                const availableItems = order.items.filter(item => item.status !== 'Cancelled' && !item.cancelApproved);
                console.log('[useEffect Debug] Available items count:', availableItems.length);
                
                if (availableItems.length > 0) {
                    // Log first available item structure
                    console.log('[useEffect Debug] Sample available item structure:', availableItems[0]);
                }
            }
            
            const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
            console.log('[useEffect Debug] Selected item IDs:', selectedItemIds);
            
            let totalRefund = 0
            selectedItemIds.forEach(itemId => {
                const item = order.items.find(i => i._id === itemId)
                if (item && item.status !== 'Cancelled' && !item.cancelApproved) {
                    // Use stored itemTotal first, then fallback to calculations
                    let itemTotal = parseFloat(item.itemTotal) || 0;
                    
                    // Only calculate if itemTotal is not available
                    if (itemTotal === 0) {
                        let itemPrice = 0
                        
                        if (item.itemType === 'bundle') {
                            // For bundles
                            itemPrice = parseFloat(item.bundleDetails?.bundlePrice) || 
                                       parseFloat(item.bundleId?.bundlePrice) || 
                                       0;
                        } else {
                            // For products, handle size-based pricing
                            const productInfo = item.productId || item.productDetails;
                            itemPrice = parseFloat(item.sizeAdjustedPrice) || 
                                      parseFloat(item.unitPrice) || 
                                      parseFloat(productInfo?.price) || 
                                      0;
                        }
                        
                        // Calculate total price for this item as fallback
                        itemTotal = itemPrice * parseFloat(item.quantity);
                    }
                    
                    console.log(`[useEffect] Item: ${item._id}, Stored Total: ${item.itemTotal}, Calculated Total: ${itemTotal}`);
                    
                    const refundPercentage = getTimeBasedRefund()
                    const itemRefund = (itemTotal * refundPercentage) / 100;
                    console.log(`[useEffect] Refund percentage: ${refundPercentage}%, Item refund: ${itemRefund}`);
                    
                    totalRefund += itemRefund
                }
            })
            
            console.log(`[useEffect] Setting total refund amount: ${totalRefund}`);
            setEstimatedRefund(totalRefund)
        }
    }, [selectedItems, policy, order, cancelMode])

    const getTimeBasedRefund = () => {
        if (!policy || !order) {
            console.log("Using default refund percentage: 75%");
            return 75;
        }

        const orderDate = new Date(order.orderDate)
        const now = new Date()
        const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60)
        
        const timeRule = policy.timeBasedRules?.find(rule => 
            hoursSinceOrder <= rule.timeFrameHours
        )

        const percentage = timeRule?.refundPercentage || policy.refundPercentage || 75;
        console.log(`Calculated refund percentage: ${percentage}%`);
        return percentage;
    }

    const canCancelOrder = () => {
        // Orders cannot be cancelled if they are delivered, already cancelled, or out for delivery
        const nonCancellableStatuses = ['DELIVERED', 'CANCELLED', 'OUT FOR DELIVERY']
        
        // Check user authentication - make sure current user matches order user
        const currentUserId = localStorage.getItem('userId')
        const orderUserId = order?.userId?._id || order?.userId
        
        console.log('Order user ID:', orderUserId)
        console.log('Current user ID:', currentUserId)
        
        // Perform user ID check with proper error handling
        let isUserMatched = false;
        if (currentUserId && orderUserId) {
            try {
                isUserMatched = currentUserId.toString() === (orderUserId?.toString() || '');
                console.log(`User ID match result in canCancelOrder: ${isUserMatched}`);
            } catch (err) {
                console.error("Error comparing IDs in canCancelOrder:", err);
            }
        }
        
        // Return true if user matches and order status is cancellable
        return isUserMatched && !nonCancellableStatuses.includes(order?.orderStatus)
    }

    if (!canCancelOrder()) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-6">
                        <div className="flex items-center justify-center mb-4">
                            <FaExclamationTriangle className="text-red-500 text-4xl" />
                        </div>
                        <h2 className="text-xl font-bold text-center mb-4">Cannot Cancel Order</h2>
                        <p className="text-gray-600 text-center mb-6">
                            {(() => {
                                // Get current user ID and order user ID
                                const currentUserId = localStorage.getItem('userId')
                                const orderUserId = order?.userId?._id || order?.userId
                                
                                // Check if user is logged in first
                                if (!currentUserId) {
                                    // Try to handle session refresh with React state
                                    try {
                                        // Use optional chain to safely navigate in case user object is not available
                                        // This will be more consistent with server-side user ID
                                        const refreshAttempt = ensureUserId();
                                        console.log("Attempting to refresh user ID:", refreshAttempt);
                                    } catch (err) {
                                        console.error("Error refreshing user ID:", err);
                                    }
                                    
                                    return "Authentication required. Please log in again to cancel this order.";
                                }
                                
                                // Always convert both IDs to strings before comparing
                                let isUserMatched = false;
                                try {
                                    const currentIdStr = currentUserId.toString();
                                    const orderIdStr = orderUserId?.toString() || '';
                                    isUserMatched = currentIdStr === orderIdStr;
                                    console.log(`Comparing IDs: ${currentIdStr} vs ${orderIdStr}, match: ${isUserMatched}`);
                                } catch (err) {
                                    console.error("Error comparing user IDs:", err);
                                }
                                
                                // If user doesn't match order owner, log the mismatch for debugging
                                if (!isUserMatched) {
                                    console.error("Order does not match user:", {
                                        orderUserId,
                                        currentUserId,
                                        orderUserIdType: typeof orderUserId,
                                        currentUserIdType: typeof currentUserId,
                                        orderIdString: orderUserId?.toString() || 'undefined',
                                        currentIdString: currentUserId?.toString() || 'undefined',
                                        order
                                    });
                                    return "You don't have permission to cancel this order. It belongs to another account."
                                }
                                
                                // Status-based messages
                                if (order?.orderStatus === 'DELIVERED') {
                                    return "This order cannot be cancelled as it has already been delivered."
                                } else if (order?.orderStatus === 'OUT FOR DELIVERY') {
                                    return "This order cannot be cancelled as it is already out for delivery."
                                } else if (order?.orderStatus === 'CANCELLED') {
                                    return "This order has already been cancelled."
                                } else if (nonCancellableStatuses.includes(order?.orderStatus)) {
                                    return `This order cannot be cancelled as it has status: ${order?.orderStatus}.`
                                } else {
                                    // This shouldn't happen - if we get here, there might be a bug
                                    console.error("Unexpected condition: Order should be cancellable but canCancelOrder() returned false", {
                                        orderStatus: order?.orderStatus,
                                        currentUserId: localStorage.getItem('userId'),
                                        orderUserId: order?.userId?._id || order?.userId
                                    })
                                    return `Sorry, there was an error processing your cancellation request. Please contact customer support.`
                                }
                            })()}
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold">Cancel Order</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Order Details */}
                <div className="p-6 border-b bg-gray-50">
                    <h3 className="font-semibold mb-2">Order Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Order ID:</span>
                            <span className="ml-2 font-medium">#{order?.orderId}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Original Order Amount:</span>
                            <span className="ml-2 font-medium">₹{(() => {
                                // Use the actual order total amount from database as this is what was charged
                                const totalAmt = order?.totalAmt || 0;
                                
                                // If total is still 0, calculate from items as fallback
                                if (totalAmt === 0 && order?.items && Array.isArray(order.items)) {
                                    let calculatedTotal = 0;
                                    order.items.forEach(item => {
                                        // Use stored itemTotal if available, otherwise calculate
                                        const itemTotal = item.itemTotal || 
                                                        (item.unitPrice || 0) * (item.quantity || 1);
                                        calculatedTotal += itemTotal;
                                    });
                                    
                                    // Add delivery charge if available
                                    const deliveryCharge = order?.deliveryCharge || 0;
                                    calculatedTotal += deliveryCharge;
                                    
                                    return calculatedTotal.toFixed(2);
                                }
                                
                                return totalAmt.toFixed(2);
                            })()}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Order Date:</span>
                            <span className="ml-2 font-medium">
                                {new Date(order?.orderDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Status:</span>
                            <span className="ml-2 font-medium">{order?.orderStatus}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Payment Status:</span>
                            <span className={`ml-2 font-medium ${(() => {
                                const paymentStatus = order?.paymentStatus;
                                const paymentMethod = order?.paymentMethod;
                                
                                console.log('Payment Status Check:', { paymentStatus, paymentMethod });
                                
                                // For refund successful, show green
                                if (paymentStatus === 'REFUND_SUCCESSFUL') return 'text-green-600';
                                // For paid status, show green
                                if (paymentStatus === 'PAID') return 'text-green-600';
                                // For online payments, show green
                                if (paymentMethod === 'ONLINE' || paymentMethod === 'Online Payment') return 'text-green-600';
                                // For pending, show yellow
                                return 'text-yellow-600';
                            })()}`}>
                                {(() => {
                                    const paymentStatus = order?.paymentStatus;
                                    const paymentMethod = order?.paymentMethod;
                                    
                                    // Handle different payment statuses
                                    if (paymentStatus === 'REFUND_SUCCESSFUL') return '✓ Refund Processed';
                                    if (paymentStatus === 'PAID') return '✓ Paid';
                                    if ((paymentMethod === 'ONLINE' || paymentMethod === 'Online Payment') && 
                                        order?.orderStatus !== 'CANCELLED') return '✓ Paid';
                                    if (paymentStatus === 'PENDING') return '⏱ Payment Pending';
                                    
                                    // Default fallback
                                    return paymentStatus || 'Pending';
                                })()}
                            </span>
                        </div>

                        {/* Calculate and show active order amount */}
                        {order?.items && Array.isArray(order.items) && (
                            <div className="col-span-2 mt-3 pt-2 border-t border-gray-300">
                                <div className="flex justify-between font-medium">
                                    <span>Active Order Amount:</span>
                                    <span className="text-green-700">₹{(() => {
                                        let activeTotal = 0;
                                        
                                        order.items.forEach(item => {
                                            if (item.status !== 'Cancelled' && !item.cancelApproved) {
                                                // Calculate item price based on item type
                                                let itemPrice = 0;
                                                
                                                if (item.itemType === 'bundle') {
                                                    itemPrice = parseFloat(item.bundleDetails?.bundlePrice) || 
                                                              parseFloat(item.bundleId?.bundlePrice) || 
                                                              (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                                              0;
                                                } else {
                                                    const productInfo = item.productId || item.productDetails;
                                                    itemPrice = parseFloat(item.sizeAdjustedPrice) || 
                                                              parseFloat(item.unitPrice) || 
                                                              parseFloat(productInfo?.price) || 
                                                              (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                                              0;
                                                }
                                                
                                                activeTotal += itemPrice * parseFloat(item.quantity);
                                            }
                                        });
                                        
                                        return activeTotal.toFixed(2);
                                    })()}</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Show already cancelled items summary if any */}
                        {order?.items && Array.isArray(order.items) && 
                         order.items.some(item => item.status === 'Cancelled' || item.cancelApproved) && (
                            <div className="col-span-2 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <div className="flex items-center mb-2">
                                    <FaInfoCircle className="text-yellow-600 mr-2" />
                                    <span className="font-medium text-yellow-800">Some items in this order have already been cancelled</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Items Already Cancelled:</span>
                                    <span className="font-medium">
                                        {order.items.filter(item => item.status === 'Cancelled' || item.cancelApproved).length} of {order.items.length}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-600">Cancelled Amount:</span>
                                    <span className="font-medium text-red-600">
                                        ₹{(() => {
                                            let cancelledTotal = 0;
                                            order.items.forEach(item => {
                                                if (item.status === 'Cancelled' || item.cancelApproved) {
                                                    let itemPrice = 0;
                                                    if (item.itemType === 'bundle') {
                                                        itemPrice = parseFloat(item.bundleDetails?.bundlePrice) || 
                                                                  parseFloat(item.bundleId?.bundlePrice) || 
                                                                  (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                                                  0;
                                                    } else {
                                                        const productInfo = item.productId || item.productDetails;
                                                        itemPrice = parseFloat(item.sizeAdjustedPrice) || 
                                                                  parseFloat(item.unitPrice) || 
                                                                  parseFloat(productInfo?.price) || 
                                                                  (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                                                  0;
                                                    }
                                                    cancelledTotal += itemPrice * parseFloat(item.quantity);
                                                }
                                            });
                                            return cancelledTotal.toFixed(2);
                                        })()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Cancellation Options */}
                <div className="p-6 border-b">
                    <h3 className="font-semibold mb-3">Cancellation Options</h3>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="fullCancel"
                                name="cancelType"
                                value="full"
                                checked={cancelMode === 'full'}
                                onChange={() => setCancelMode('full')}
                                className="h-4 w-4 text-blue-600"
                            />
                            <label htmlFor="fullCancel" className="text-sm font-medium text-gray-700">
                                Cancel entire order
                            </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="partialCancel"
                                name="cancelType"
                                value="partial"
                                checked={cancelMode === 'partial'}
                                onChange={() => setCancelMode('partial')}
                                className="h-4 w-4 text-blue-600"
                            />
                            <label htmlFor="partialCancel" className="text-sm font-medium text-gray-700">
                                Cancel specific items
                            </label>
                        </div>
                    </div>
                </div>

                {/* Item Selection for Partial Cancellation */}
                {cancelMode === 'partial' && (
                    <div className="p-6 border-b">
                        <h3 className="font-semibold mb-3">Select Items to Cancel</h3>
                        <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-2 rounded">
                            <FaInfoCircle className="inline-block mr-1 text-blue-600" />
                            Check the boxes next to items you wish to cancel. Refund amount will be calculated based on your selection.
                        </p>
                        {order?.items?.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 text-left">Select</th>
                                            <th className="p-2 text-left">Item</th>
                                            <th className="p-2 text-right">Quantity</th>
                                            <th className="p-2 text-right">Price</th>
                                            <th className="p-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.filter(item => item.status !== 'Cancelled' && !item.cancelApproved).map((item) => (
                                            <tr 
                                                key={item._id} 
                                                className={`border-t ${
                                                    selectedItems[item._id] ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <td className="p-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`item-${item._id}`}
                                                        checked={selectedItems[item._id] || false}
                                                        onChange={() => toggleItemSelection(item._id)}
                                                        className="h-4 w-4 text-blue-600 rounded"
                                                        disabled={item.status === 'Cancelled' || item.cancelApproved}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 flex-shrink-0 mr-2 bg-gray-100 rounded">
                                                            {/* Use proper image display logic */}
                                                            {(() => {
                                                                let imageSrc;
                                                                if (item.itemType === 'bundle') {
                                                                    // For bundles
                                                                    imageSrc = item.bundleDetails?.image || 
                                                                              (item.bundleDetails?.images && item.bundleDetails.images[0]) || 
                                                                              noCart;
                                                                } else {
                                                                    // For products
                                                                    imageSrc = (item.productDetails?.image && item.productDetails.image[0]) || 
                                                                              noCart;
                                                                }
                                                                
                                                                return (
                                                                    <img 
                                                                        src={imageSrc} 
                                                                        alt={item.itemType === 'bundle' 
                                                                            ? (item.bundleDetails?.title || 'Bundle') 
                                                                            : (item.productDetails?.name || 'Product')} 
                                                                        className="w-full h-full object-cover rounded"
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = noCart;
                                                                        }}
                                                                    />
                                                                );
                                                            })()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">
                                                                {item.itemType === 'bundle' 
                                                                    ? (item.bundleDetails?.title || 'Bundle') 
                                                                    : (item.productDetails?.name || 'Product')}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {item.size && `Size: ${item.size}`} 
                                                                {item.itemType === 'bundle' ? ' | Bundle' : ' | Product'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right">{item.quantity}</td>
                                                <td className="p-2 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center justify-end">
                                                            <span>₹ {(() => {
                                                                // Get price based on item type
                                                                if (item.itemType === 'bundle') {
                                                                    return (parseFloat(item.bundleDetails?.bundlePrice) || 
                                                                           parseFloat(item.bundleId?.bundlePrice) || 
                                                                           (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                                                           0).toFixed(2);
                                                                } else {
                                                                    // For products, handle size-based pricing
                                                                    const productInfo = item.productId || item.productDetails;
                                                                    const unitPrice = parseFloat(item.sizeAdjustedPrice) || 
                                                                                     parseFloat(item.unitPrice) || 
                                                                                     parseFloat(productInfo?.price) || 
                                                                                     (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                                                                     0;
                                                                    console.log(`Item display price: ${item.productDetails?.name}, sizeAdjustedPrice: ${item.sizeAdjustedPrice}, unitPrice: ${item.unitPrice}, productPrice: ${productInfo?.price}, itemTotal: ${item.itemTotal}, quantity: ${item.quantity}, calculatedUnitPrice: ${unitPrice}`);
                                                                    return unitPrice.toFixed(2);
                                                                }
                                                            })() || '0.00'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Available
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">No items available for cancellation</p>
                        )}
                    </div>
                )}

                {/* Refund Information */}
                <div className="p-6 border-b">
                    <div className="flex items-center mb-3">
                        <FaInfoCircle className="text-blue-600 mr-2" />
                        <h3 className="font-semibold text-blue-800">Refund Information</h3>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700">Estimated Refund Amount:</span>
                            <span className="font-bold text-green-600 text-lg">
                                ₹ {estimatedRefund > 0 ? estimatedRefund.toFixed(2) : '0.00'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Refund Percentage:</span>
                            <span className="text-green-600">
                                ✓ {getTimeBasedRefund()}% of order value
                            </span>
                        </div>
                        
                        {/* Partial Cancellation Summary */}
                        {cancelMode === 'partial' && (
                            <div className="mt-3 border-t pt-3">
                                <h4 className="font-medium text-sm mb-2">Cancellation Summary</h4>
                                <div className="text-sm space-y-1">
                                    {Object.keys(selectedItems).filter(id => selectedItems[id]).length > 0 ? (
                                        <>
                                            <p className="flex items-center mb-2">
                                                <span className="text-green-600 mr-1">✓</span> 
                                                Items selected for cancellation: <span className="font-medium ml-1">{Object.keys(selectedItems).filter(id => selectedItems[id]).length}</span>
                                            </p>
                                            <ul className="space-y-2 mt-2 border-t pt-2">
                                                {Object.keys(selectedItems)
                                                    .filter(id => selectedItems[id])
                                                    .map(id => {
                                                        const item = order.items.find(i => i._id === id);
                                                        if (!item) return null;
                                                        
                                                        // Get item name from productDetails or bundleDetails
                                                        const itemName = item.itemType === 'bundle' 
                                                            ? (item.bundleDetails?.title || 'Bundle') 
                                                            : (item.productDetails?.name || 'Product');
                                                        
                                                        // Calculate item price properly
                                                        let itemPrice = 0;
                                                        if (item.itemType === 'bundle') {
                                                            itemPrice = parseFloat(item.bundleDetails?.bundlePrice) || 
                                                                        parseFloat(item.bundleId?.bundlePrice) || 
                                                                        (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                                                        0;
                                                        } else {
                                                            // For products, handle size-based pricing
                                                            const productInfo = item.productId || item.productDetails;
                                                            itemPrice = parseFloat(item.sizeAdjustedPrice) || 
                                                                         parseFloat(item.unitPrice) || 
                                                                         parseFloat(productInfo?.price) || 
                                                                         (parseFloat(item.itemTotal) / parseFloat(item.quantity)) || 
                                                                         0;
                                                        }
                                                        
                                                        const itemTotal = itemPrice * parseFloat(item.quantity);
                                                        // Calculate refund amount
                                                        const refundPercentage = getTimeBasedRefund();
                                                        const refundAmount = ((itemTotal * refundPercentage) / 100).toFixed(2);
                                                        console.log(`Item: ${itemName}, Price: ${itemPrice}, Quantity: ${item.quantity}, Total: ${itemTotal}, Refund %: ${refundPercentage}, Refund amount: ${refundAmount}`);
                                                        
                                                        return (
                                                            <li key={id} className="flex justify-between p-2 bg-gray-50 rounded border">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{itemName} {item.size ? `(${item.size})` : ''}</span>
                                                                    <span className="text-xs text-gray-500">Quantity: {item.quantity} × ₹{itemPrice.toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <div className="flex items-center">
                                                                        <FaRupeeSign size={10} className="mr-0.5" />
                                                                        <span className="font-medium">{itemTotal.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="flex items-center text-green-600 text-xs">
                                                                        <FaPercent size={8} className="mr-1" />
                                                                        <span>{getTimeBasedRefund()}% refund: ₹{refundAmount}</span>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                            </ul>
                                            
                                            {/* Total refund amount */}
                                            <div className="mt-3 pt-3 border-t flex justify-between items-center p-2 bg-green-50 rounded">
                                                <span className="font-medium">Total Refund:</span>
                                                <span className="font-bold text-green-600 flex items-center text-lg">
                                                    <FaRupeeSign size={14} className="mr-1" />
                                                    {estimatedRefund > 0 ? estimatedRefund.toFixed(2) : '0.00'}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-yellow-600">No items selected for cancellation</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <p className="text-sm text-yellow-800">
                                <strong>Processing Time:</strong> Admin will review your request within {policy?.responseTimeHours || 48} hours. 
                                If approved, refund will be processed within 5-7 business days.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cancellation Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <div className="flex items-center mb-3">
                            <FaExclamationCircle className="text-red-500 mr-2" />
                            <label className="text-md font-medium text-gray-800">
                                Reason for Cancellation *
                            </label>
                        </div>
                        <div className="space-y-2 bg-gray-50 p-3 rounded-md border">
                            {cancellationReasons.map((reasonOption) => (
                                <label 
                                    key={reasonOption} 
                                    className={`flex items-center p-2 rounded-md transition-colors ${
                                        reason === reasonOption 
                                            ? 'bg-red-50 border border-red-200' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={reasonOption}
                                        checked={reason === reasonOption}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="mr-3 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm">{reasonOption}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {reason === 'Other' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Please specify the reason *
                            </label>
                            <textarea
                                value={additionalReason}
                                onChange={(e) => setAdditionalReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows="3"
                                placeholder="Please provide details about your cancellation reason..."
                                maxLength="500"
                            />
                            <div className="text-right text-xs text-gray-500 mt-1">
                                {additionalReason.length}/500 characters
                            </div>
                        </div>
                    )}

                    {reason && reason !== 'Other' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Comments (Optional)
                            </label>
                            <textarea
                                value={additionalReason}
                                onChange={(e) => setAdditionalReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows="2"
                                placeholder="Any additional information you'd like to share..."
                                maxLength="500"
                            />
                        </div>
                    )}

                    {/* Terms */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-medium text-gray-800 mb-2">Cancellation Terms:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Admin will review your request within {policy?.responseTimeHours || 48} hours</li>
                            <li>• Refund amount is {getTimeBasedRefund()}% of the order value</li>
                            <li>• Approved refunds will be processed within 5-7 business days</li>
                            <li>• Refund will be credited to your original payment method</li>
                            <li>• This action cannot be undone once submitted</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Keep Order
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Submitting...' : 'Submit Cancellation Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default OrderCancellationModal
