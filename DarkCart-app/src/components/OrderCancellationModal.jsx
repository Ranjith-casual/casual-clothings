import React, { useState, useEffect } from 'react'
import { FaTimes, FaExclamationTriangle, FaInfoCircle, FaRupeeSign, FaCheck, FaExclamationCircle, FaTag, FaPercent } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'
import noCart from '../assets/Empty-cuate.png'
import ensureUserId from '../utils/ensureUserId'
import { RefundPolicyService } from '../utils/RefundPolicyService'

function OrderCancellationModal({ order, onClose, onCancellationRequested }) {
    const [reason, setReason] = useState('')
    const [additionalReason, setAdditionalReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [policy, setPolicy] = useState(null)
    // Start with null instead of 0 to prevent display until calculated
    const [estimatedRefund, setEstimatedRefund] = useState(null)
    const [refundCalculation, setRefundCalculation] = useState(null)
    const [cancelMode, setCancelMode] = useState(() => {
        // Auto-determine initial cancel mode based on active items
        if (order?.items) {
            const activeItems = order.items.filter(item => 
                item.status !== 'Cancelled' && !item.cancelApproved
            );
            return activeItems.length <= 1 ? 'full' : 'full'; // Default to 'full' always
        }
        return 'full';
    }) // 'full' or 'partial'
    const [selectedItems, setSelectedItems] = useState({})

    // Calculate discounted price for an item
    const calculateItemPrice = (item) => {
        let basePrice = 0;
        let originalPrice = 0;
        let discountPercentage = 0;
        
        console.log('Calculating discounted price for item:', {
            itemId: item._id,
            itemType: item.itemType,
            productId: item.productId,
            productDetails: item.productDetails,
            sizeAdjustedPrice: item.sizeAdjustedPrice,
            size: item.size,
            quantity: item.quantity,
            productIdDiscountedPrice: item.productId?.discountedPrice,
            productDetailsDiscountedPrice: item.productDetails?.discountedPrice
        });
        
        if (item.itemType === 'product') {
            // Get the original price first - check multiple sources
            originalPrice = item.productId?.price || item.productDetails?.price || item.price || 0;
            
            // Priority 1: Use stored discounted price from product model (HIGHEST PRIORITY)
            if (item.productId?.discountedPrice && item.productId.discountedPrice > 0) {
                basePrice = item.productId.discountedPrice;
                if (originalPrice > basePrice && originalPrice > 0) {
                    discountPercentage = ((originalPrice - basePrice) / originalPrice) * 100;
                }
                console.log('✅ Using stored discountedPrice from productId:', { 
                    originalPrice, 
                    discountedPrice: basePrice, 
                    discount: discountPercentage 
                });
            }
            // Priority 2: Use stored discounted price from product details
            else if (item.productDetails?.discountedPrice && item.productDetails.discountedPrice > 0) {
                basePrice = item.productDetails.discountedPrice;
                if (originalPrice > basePrice && originalPrice > 0) {
                    discountPercentage = ((originalPrice - basePrice) / originalPrice) * 100;
                }
                console.log('✅ Using stored discountedPrice from productDetails:', { 
                    originalPrice, 
                    discountedPrice: basePrice, 
                    discount: discountPercentage 
                });
            }
            // Priority 3: Use explicit final price if available
            else if (item.productDetails?.finalPrice && item.productDetails.finalPrice > 0) {
                basePrice = item.productDetails.finalPrice;
                if (originalPrice > basePrice) {
                    discountPercentage = ((originalPrice - basePrice) / originalPrice) * 100;
                }
                console.log('Using finalPrice:', { finalPrice: basePrice, discount: discountPercentage });
            }
            // Priority 4: Use size-adjusted price
            else if (item.sizeAdjustedPrice && item.sizeAdjustedPrice > 0) {
                basePrice = item.sizeAdjustedPrice;
                originalPrice = basePrice; // For size-adjusted, use it as base
                
                // Check if there's still a discount to apply
                const itemDiscount = item.productId?.discount || item.productDetails?.discount || item.discount || 0;
                if (itemDiscount > 0) {
                    const discountedPrice = basePrice * (1 - itemDiscount / 100);
                    basePrice = discountedPrice;
                    discountPercentage = itemDiscount;
                }
                console.log('Using sizeAdjustedPrice:', { sizeAdjustedPrice: item.sizeAdjustedPrice, finalPrice: basePrice, discount: discountPercentage });
            }
            // Priority 5: Calculate discount from available discount percentage
            else if ((item.productId?.discount || item.productDetails?.discount || item.discount) && originalPrice > 0) {
                discountPercentage = item.productId?.discount || item.productDetails?.discount || item.discount || 0;
                basePrice = originalPrice * (1 - discountPercentage / 100);
                console.log('Calculated discounted price from discount percentage:', { originalPrice, discount: discountPercentage, calculatedPrice: basePrice });
            }
            // Priority 6: Use unit price or fallback to original price
            else {
                basePrice = item.unitPrice || originalPrice || (item.itemTotal / item.quantity) || 0;
                console.log('Using fallback price:', { unitPrice: item.unitPrice, originalPrice, itemTotal: item.itemTotal, quantity: item.quantity, finalPrice: basePrice });
            }
        } else if (item.itemType === 'bundle') {
            // For bundles
            basePrice = item.bundleId?.bundlePrice || item.bundleDetails?.bundlePrice || 0;
            originalPrice = item.bundleId?.originalPrice || item.bundleDetails?.originalPrice || basePrice;
            
            // Calculate discount percentage for display
            if (originalPrice > basePrice && originalPrice > 0) {
                discountPercentage = ((originalPrice - basePrice) / originalPrice) * 100;
            }
        }
        
        return {
            unitPrice: basePrice,
            originalPrice: originalPrice,
            discount: discountPercentage,
            totalPrice: basePrice * item.quantity
        };
    };

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
            
            // Log active items count for debugging
            const activeItems = order.items?.filter(item => 
                item.status !== 'Cancelled' && !item.cancelApproved
            ) || [];
            console.log(`🔍 Active items count: ${activeItems.length} of ${order.items?.length || 0} total items`);
            
            // Log cancelled items for debugging
            const cancelledItems = order.items?.filter(item => 
                item.status === 'Cancelled' || item.cancelApproved
            ) || [];
            console.log(`❌ Cancelled items count: ${cancelledItems.length}`);
            
            if (activeItems.length === 1) {
                console.log('💡 Only one active item remaining - will force full cancellation mode');
            }
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
    
    // Effect to recalculate refund when policy or order changes
    useEffect(() => {
        if (policy && order) {
            try {
                // Calculate refund details separately to prevent infinite loop
                if (RefundPolicyService) {
                    // Get user info for customer loyalty bonuses
                    const customerInfo = {
                        isVip: localStorage.getItem('userRole') === 'VIP' || localStorage.getItem('membershipTier') === 'VIP',
                        membershipTier: localStorage.getItem('membershipTier') || 'REGULAR',
                        orderHistory: order.orderHistory || [],
                        purchaseHistory: localStorage.getItem('purchaseCount') ? parseInt(localStorage.getItem('purchaseCount')) : 0
                    };
                    
                    // Prepare cancellation context
                    const cancellationContext = {
                        requestDate: new Date(),
                        orderDate: new Date(order.orderDate || order.createdAt),
                        deliveryInfo: {
                            wasPastDeliveryDate: order.estimatedDeliveryDate && new Date() > new Date(order.estimatedDeliveryDate),
                            actualDeliveryDate: order.actualDeliveryDate,
                            estimatedDeliveryDate: order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate) : null
                        },
                        orderStatus: order.orderStatus
                    };
                    
                    // Calculate refund directly in this effect
                    const calculation = RefundPolicyService.calculateRefundAmount(
                        order, 
                        cancellationContext,
                        null,
                        customerInfo
                    );
                    
                    setRefundCalculation(calculation);
                    console.log("Refund calculation refreshed due to policy or order change:", calculation);
                }
            } catch (err) {
                console.error("Error refreshing refund calculation:", err);
            }
        }
    }, [policy, order])

    const getTimeBasedRefund = () => {
        if (!policy || !order) {
            console.log("Using default refund percentage: 75%");
            return 75;
        }

        // Use the refundCalculation if it exists (set by the useEffect)
        if (refundCalculation && refundCalculation.refundPercentage) {
            return refundCalculation.refundPercentage;
        }

        try {
            // Fall back to legacy calculation if refundCalculation is not yet available
            const orderDate = new Date(order.orderDate)
            const now = new Date()
            const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60)
            
            const timeRule = policy.timeBasedRules?.find(rule => 
                hoursSinceOrder <= rule.timeFrameHours
            )

            const percentage = timeRule?.refundPercentage || policy.refundPercentage || 75;
            console.log(`Using fallback calculation: ${percentage}%`);
            return percentage;
        } catch (error) {
            console.error("Error in fallback refund calculation:", error);
            return 75; // Default fallback
        }
    }

    useEffect(() => {
        if (policy && order) {
            const refundPercentage = refundCalculation?.refundPercentage || getTimeBasedRefund()
            
            if (cancelMode === 'full') {
                // For full cancellation, calculate total based on discounted prices of all items
                let activeItemsTotal = 0;
                
                if (order && order.items) {
                    order.items.forEach(item => {
                        if (item.status !== 'Cancelled' && !item.cancelApproved) {
                            const priceData = calculateItemPrice(item);
                            activeItemsTotal += priceData.totalPrice;
                        }
                    });
                }
                
                // Include delivery charge in refund calculation for full order cancellation
                // Customer paid for delivery and deserves refund if entire order is cancelled
                const deliveryCharge = order.deliveryCharge || 0;
                const totalWithDelivery = activeItemsTotal + deliveryCharge;
                
                console.log(`Full cancellation - Calculated total with delivery: ${totalWithDelivery} (items: ${activeItemsTotal} + delivery: ${deliveryCharge}), Refund %: ${refundPercentage}`);
                
                // Make sure we calculate the refund based on the actual amount instead of any cached value
                const refundAmount = (totalWithDelivery * refundPercentage) / 100;
                console.log(`Setting full refund amount to: ${refundAmount} (${refundPercentage}% of ${totalWithDelivery})`);
                
                // Use a timeout to ensure this happens after initial render
                setTimeout(() => {
                    setEstimatedRefund(refundAmount);
                }, 0);
            } else {
                // For partial mode, calculation is handled by another useEffect
                // that watches the selectedItems state
            }
        }
    }, [policy, order, cancelMode, calculateItemPrice, refundCalculation])

    const fetchCancellationPolicy = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getCancellationPolicy
            })
            
            if (response.data.success) {
                console.log('Cancellation Policy:', response.data.data.refundPercentage)
                // Set the policy from the API response instead of hardcoding to 75
                setPolicy(response.data.data)
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
        if (!currentUserId) {
            toast.error("Authentication error: User ID not found, please log in again")
            console.error('Current user ID missing')
            return
        }
        
        if (!orderUserId) {
            // For order data that might not have userId populated correctly
            // This could happen with partially cancelled orders or older orders
            console.warn('Order user ID is missing, attempting to proceed anyway as this may be a legacy or partially processed order');
        } else if (currentUserId.toString() !== (orderUserId?.toString() || '')) {
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
                
                // Check if all active items are selected (effectively full cancellation)
                const activeItems = order.items.filter(item => 
                    item.status !== 'Cancelled' && !item.cancelApproved
                );
                
                console.log('Cancellation check:', {
                    selectedItems: selectedItemIds.length,
                    activeItems: activeItems.length,
                    totalItems: order.items.length,
                    cancelledItems: order.items.filter(item => item.status === 'Cancelled' || item.cancelApproved).length,
                    isLastRemainingItem: activeItems.length === 1 && selectedItemIds.length === 1
                });
                
                if (activeItems.length === 1 && selectedItemIds.length === 1) {
                    console.log('🔄 Last remaining item being cancelled - using special handling');
                    toast.info('Processing final item cancellation from this order', {
                        duration: 3000,
                        position: 'top-center'
                    });
                    // Continue with partial cancellation but with special handling for last item
                    // This avoids issues with user verification in multi-stage cancellations
                } else if (selectedItemIds.length === activeItems.length) {
                    console.log('🔄 Converting partial cancellation to full cancellation - all active items selected');
                    toast.info('Converting to full order cancellation since all remaining items are selected', {
                        duration: 3000,
                        position: 'top-center'
                    });
                    // Switch to full mode and continue with full cancellation logic
                    setCancelMode('full');
                    // Don't return here - let it continue as full cancellation
                }
            }        setLoading(true)

        try {
            const token = localStorage.getItem('accessToken')
            
            if (cancelMode === 'full') {
                // Full order cancellation - calculate comprehensive pricing info for admin review
                let totalDiscountedAmount = 0;
                let totalOriginalAmount = 0;
                let totalSavingsAmount = 0;
                
                const itemPricingBreakdown = order.items
                    .filter(item => item.status !== 'Cancelled' && !item.cancelApproved)
                    .map(item => {
                        const priceData = calculateItemPrice(item);
                        totalDiscountedAmount += priceData.totalPrice;
                        totalOriginalAmount += (priceData.originalPrice * item.quantity);
                        totalSavingsAmount += ((priceData.originalPrice - priceData.unitPrice) * item.quantity);
                        
                        return {
                            itemId: item._id,
                            itemName: item.itemType === 'product' 
                                ? item.productDetails?.name 
                                : item.bundleDetails?.title,
                            quantity: item.quantity,
                            originalRetailPrice: priceData.originalPrice,
                            customerPaidPrice: priceData.unitPrice, // Discounted price customer paid
                            discountApplied: priceData.discount,
                            totalCustomerPaid: priceData.totalPrice
                        };
                    });
                
                const refundPercentage = refundCalculation?.refundPercentage || getTimeBasedRefund();
                const deliveryCharge = order.deliveryCharge || 0;
                const totalWithDelivery = totalDiscountedAmount + deliveryCharge;
                const refundWithDelivery = (totalWithDelivery * refundPercentage) / 100;
                
                console.log('🎯 Full Order Cancellation - Pricing Summary:', {
                    totalDiscountedAmount,
                    deliveryCharge,
                    totalWithDelivery,
                    totalOriginalAmount,
                    totalSavingsAmount,
                    refundPercentage,
                    calculatedRefund: refundWithDelivery,
                    itemCount: itemPricingBreakdown.length
                });
                
                const response = await Axios({
                    ...SummaryApi.requestOrderCancellation,
                    headers: {
                        authorization: `Bearer ${token}`
                    },
                    data: {
                        orderId: order._id,
                        reason,
                        additionalReason: additionalReason.trim(),
                        // Enhanced pricing information for admin review
                        pricingInformation: {
                            totalAmountCustomerPaid: totalWithDelivery, // Total including delivery charge
                            totalOriginalRetailPrice: totalOriginalAmount + deliveryCharge, // Include delivery in original total
                            totalCustomerSavings: totalSavingsAmount, // Savings from discounts (delivery charge not discounted)
                            refundPercentage: refundPercentage,
                            calculatedRefundAmount: refundWithDelivery,
                            deliveryCharge: deliveryCharge,
                            itemBreakdown: itemPricingBreakdown,
                            note: "Refund calculated based on discounted prices + delivery charge customer actually paid"
                        }
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
                
                // Prepare items to cancel with discounted price information
                const itemsToCancel = selectedItemIds.map(itemId => {
                    const item = order.items.find(i => i._id === itemId);
                    const priceData = calculateItemPrice(item);
                    const refundPercentage = refundCalculation?.refundPercentage || getTimeBasedRefund();
                    
                    return {
                        itemId,
                        itemPrice: priceData.unitPrice, // Discounted unit price (what customer actually paid per unit)
                        originalPrice: priceData.originalPrice, // Original retail price before discount
                        totalPrice: priceData.totalPrice, // Total discounted price for this item (discounted unitPrice * quantity)
                        quantity: item.quantity,
                        discount: priceData.discount,
                        itemType: item.itemType,
                        productName: item.itemType === 'product' 
                            ? item.productDetails?.name 
                            : item.bundleDetails?.title,
                        size: item.size || null,
                        refundAmount: (priceData.totalPrice * refundPercentage / 100), // Dynamic refund % of discounted price
                        refundPercentage: refundPercentage,
                        // Additional pricing context for admin review
                        pricingBreakdown: {
                            originalRetailPrice: priceData.originalPrice,
                            customerPaidPrice: priceData.unitPrice, // This is the discounted price customer actually paid
                            discountApplied: priceData.discount,
                            totalCustomerPaid: priceData.totalPrice, // Total amount customer paid for this item
                            calculatedRefund: (priceData.totalPrice * refundPercentage / 100)
                        }
                    };
                });
                
                console.log('🎯 Partial Cancellation - Items to Cancel:', {
                    selectedItemsCount: selectedItemIds.length,
                    totalRefundAmount: itemsToCancel.reduce((sum, item) => sum + item.refundAmount, 0),
                    totalItemValue: itemsToCancel.reduce((sum, item) => sum + item.totalPrice, 0),
                    refundPercentage: refundCalculation?.refundPercentage || getTimeBasedRefund(),
                    itemDetails: itemsToCancel.map(item => ({
                        name: item.productName,
                        customerPaid: item.totalPrice,
                        refundAmount: item.refundAmount,
                        originalPrice: item.originalPrice,
                        discount: item.discount
                    }))
                });
                
                // Check if ALL available items are selected (effectively cancelling entire order)
                const availableItems = order.items.filter(item => item.status !== 'Cancelled' && !item.cancelApproved);
                const isEffectivelyFullCancellation = selectedItemIds.length === availableItems.length && availableItems.length > 0;
                
                // Calculate totals for backend
                let totalRefundAmount = itemsToCancel.reduce((sum, item) => sum + item.refundAmount, 0);
                const totalItemValue = itemsToCancel.reduce((sum, item) => sum + item.totalPrice, 0);
                
                // Include delivery charge if all items are being cancelled
                let deliveryChargeRefund = 0;
                if (isEffectivelyFullCancellation) {
                    const deliveryCharge = order.deliveryCharge || 0;
                    deliveryChargeRefund = (deliveryCharge * (refundCalculation?.refundPercentage || getTimeBasedRefund())) / 100;
                    totalRefundAmount += deliveryChargeRefund;
                    
                    console.log('🚚 Including delivery charge in partial cancellation (all items selected):', {
                        deliveryCharge,
                        deliveryChargeRefund,
                        updatedTotalRefund: totalRefundAmount
                    });
                }
                
                // Special handling for continuation cancellations (when cancelling items from an order with existing cancellations)
                const isContinuationCancellation = order.items.some(item => item.status === 'Cancelled' || item.cancelApproved);
                const isLastRemainingItem = order.items.filter(item => 
                    item.status !== 'Cancelled' && !item.cancelApproved
                ).length === selectedItemIds.length;
                
                console.log('Cancellation request context:', {
                    isContinuationCancellation,
                    isLastRemainingItem,
                    itemsToCancel: itemsToCancel.length,
                    totalActiveItems: order.items.filter(item => item.status !== 'Cancelled' && !item.cancelApproved).length
                });
                
                const response = await Axios({
                    ...SummaryApi.requestPartialItemCancellation,
                    headers: {
                        authorization: `Bearer ${token}`
                    },
                    data: {
                        orderId: order._id,
                        itemsToCancel,
                        reason,
                        additionalReason: additionalReason.trim(),
                        // Enhanced totals for backend processing
                        totalRefundAmount: totalRefundAmount,
                        totalItemValue: totalItemValue,
                        // Add delivery charge information
                        deliveryChargeRefund: deliveryChargeRefund,
                        isEffectivelyFullCancellation: isEffectivelyFullCancellation || isLastRemainingItem,
                        deliveryCharge: order.deliveryCharge || 0,
                        // Add continuation cancellation flag
                        isContinuationCancellation,
                        isLastRemainingItem
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
            
            // Check if ALL available items are selected (effectively cancelling entire order)
            const availableItems = order.items.filter(item => item.status !== 'Cancelled' && !item.cancelApproved);
            const selectedIds = Object.keys(newSelection).filter(id => newSelection[id]);
            const isEffectivelyFullCancellation = selectedIds.length === availableItems.length && availableItems.length > 0;
            
            console.log(`[toggleItemSelection] Is effectively full cancellation? ${isEffectivelyFullCancellation} (selected: ${selectedIds.length}, available: ${availableItems.length})`);
            
            // If all items are selected, automatically switch to full cancellation mode
            if (isEffectivelyFullCancellation && cancelMode === 'partial') {
                console.log(`[toggleItemSelection] Switching to full cancellation mode since all items are selected`);
                setCancelMode('full');
                toast.success('Switched to full order cancellation since all items are selected', {
                    duration: 3000,
                    position: 'top-center'
                });
                return {}; // Clear item selection since we're switching to full mode
            }
            
            // Update estimated refund based on selected items - now handled by useEffect
            if (order && policy) {
                // Let the useEffect handle the calculation instead of doing it here
                if (selectedIds.length === 0) {
                    setEstimatedRefund(0)
                }
                // The rest of the calculation is now handled by the useEffect that watches selectedItems
                console.log('Item selection changed, refund calculation will be handled by useEffect')
            }
            
            return newSelection;
        });
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
            
            // Check if ALL available items are selected (effectively cancelling entire order)
            const availableItems = order.items.filter(item => item.status !== 'Cancelled' && !item.cancelApproved);
            const isEffectivelyFullCancellation = selectedItemIds.length === availableItems.length && availableItems.length > 0;
            
            console.log(`[useEffect Debug] Is effectively full cancellation? ${isEffectivelyFullCancellation} (selected: ${selectedItemIds.length}, available: ${availableItems.length})`);
            
            let totalRefund = 0
            selectedItemIds.forEach(itemId => {
                const item = order.items.find(i => i._id === itemId)
                if (item && item.status !== 'Cancelled' && !item.cancelApproved) {
                    // Use the calculateItemPrice function for consistent discounted pricing
                    const priceData = calculateItemPrice(item);
                    const itemTotal = priceData.totalPrice; // This is the discounted total price
                    
                    console.log(`[useEffect] Item: ${item._id}, Discounted Price: ${priceData.unitPrice}, Original Price: ${priceData.originalPrice}, Discount: ${priceData.discount}%, Quantity: ${item.quantity}, Discounted Total: ${itemTotal}`);
                    
                    const refundPercentage = refundCalculation?.refundPercentage || getTimeBasedRefund()
                    const itemRefund = (itemTotal * refundPercentage) / 100;
                    console.log(`[useEffect] Refund percentage: ${refundPercentage}%, Item discounted refund: ${itemRefund}`);
                    
                    totalRefund += itemRefund
                }
            })
            
            // If ALL available items are selected, include delivery charge in refund
            if (isEffectivelyFullCancellation) {
                const deliveryCharge = order.deliveryCharge || 0;
                const deliveryRefund = (deliveryCharge * (refundCalculation?.refundPercentage || getTimeBasedRefund())) / 100;
                totalRefund += deliveryRefund;
                
                console.log(`[useEffect Debug] Adding delivery charge to partial cancellation: ${deliveryCharge} -> Refund: ${deliveryRefund}`);
                console.log(`[useEffect Debug] Total refund with delivery: ${totalRefund}`);
            }
            
            console.log(`[useEffect] Setting total refund amount: ${totalRefund}`);
            setEstimatedRefund(totalRefund)
        }
    }, [selectedItems, policy, order, cancelMode, calculateItemPrice, refundCalculation])

    // Auto-switch to full cancellation mode when only one active item remains
    useEffect(() => {
        if (!order?.items) return;
        
        const availableItems = order.items.filter(item => 
            item.status !== 'Cancelled' && !item.cancelApproved
        );
        
        // If only one active item exists and user is in partial mode, switch to full
        if (availableItems.length === 1 && cancelMode === 'partial') {
            console.log('Auto-switching to full cancellation mode: only one active item available');
            setCancelMode('full');
            setSelectedItems({}); // Clear selections
            
            toast.info('Switched to full order cancellation since only one active item remains', {
                duration: 4000,
                position: 'top-center'
            });
        }
        
        // If no active items left, close the modal (shouldn't happen but safety check)
        if (availableItems.length === 0) {
            console.log('No active items left to cancel');
            toast.error('No active items left to cancel in this order', {
                duration: 3000,
                position: 'top-center'
            });
            onClose();
        }
    }, [order?.items, cancelMode, onClose]);

    const canCancelOrder = () => {
        // Orders cannot be cancelled if they are delivered, already cancelled, or out for delivery
        const nonCancellableStatuses = ['DELIVERED', 'CANCELLED', 'OUT FOR DELIVERY']
        
        // Check if there are any active items left to cancel
        const activeItems = order?.items?.filter(item => 
            item.status !== 'Cancelled' && !item.cancelApproved
        ) || [];
        
        if (activeItems.length === 0) {
            console.log('No active items left to cancel');
            return false;
        }
        
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
                                
                                // Check if there are active items left
                                const activeItems = order?.items?.filter(item => 
                                    item.status !== 'Cancelled' && !item.cancelApproved
                                ) || [];
                                
                                if (activeItems.length === 0) {
                                    return "All items in this order have already been cancelled. No items left to cancel.";
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
                        
                        {/* Only show partial cancellation option if there are multiple ACTIVE items */}
                        {(() => {
                            const activeItems = order?.items?.filter(item => 
                                item.status !== 'Cancelled' && !item.cancelApproved
                            ) || [];
                            
                            console.log('Active items count for cancellation options:', activeItems.length);
                            
                            // Only show partial cancellation if there are 2 or more active items
                            if (activeItems.length > 1) {
                                return (
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
                                );
                            }
                            
                            return null; // Don't show partial cancellation option if 1 or 0 active items
                        })()}
                        
                        {/* Show info when only one active item exists */}
                        {(() => {
                            const activeItems = order?.items?.filter(item => 
                                item.status !== 'Cancelled' && !item.cancelApproved
                            ) || [];
                            
                            return activeItems.length === 1 ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                                    <div className="flex items-center">
                                        <FaInfoCircle className="text-yellow-600 mr-2" />
                                        <span className="text-sm text-yellow-800 font-medium">
                                            Since this order contains only one remaining active item, cancelling it will cancel the entire order.
                                        </span>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>
                </div>

                {/* Item Selection for Partial Cancellation */}
                {cancelMode === 'partial' && (
                    <div className="p-6 border-b">
                        <h3 className="font-semibold mb-3">Select Items to Cancel</h3>
                        <div className="space-y-3 mb-4">
                            <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                <FaInfoCircle className="inline-block mr-1 text-blue-600" />
                                Check the boxes next to items you wish to cancel. Refund amount will be calculated based on your selection.
                            </p>
                            
                            {/* Warning when selecting all items would effectively cancel entire order */}
                            {(() => {
                                const availableItems = order?.items?.filter(item => 
                                    item.status !== 'Cancelled' && !item.cancelApproved
                                ) || [];
                                const selectedCount = Object.keys(selectedItems).filter(id => selectedItems[id]).length;
                                const wouldCancelAll = selectedCount === availableItems.length - 1 && availableItems.length > 1;
                                
                                if (wouldCancelAll) {
                                    return (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                            <div className="flex items-center">
                                                <FaExclamationTriangle className="text-orange-600 mr-2" />
                                                <span className="text-sm text-orange-800 font-medium">
                                                    Selecting one more item will cancel the entire order. Consider using "Cancel entire order" option.
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            
                        </div>
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
                                                        {(() => {
                                                            const priceData = calculateItemPrice(item);
                                                            const { unitPrice, originalPrice, discount } = priceData;
                                                            
                                                            return (
                                                                <div className="text-right">
                                                                    {discount > 0 && originalPrice > unitPrice ? (
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <span className="text-lg font-bold text-green-600">₹{unitPrice.toFixed(2)}</span>
                                                                                <span className="text-xs text-white bg-red-500 px-1 py-0.5 rounded">
                                                                                    {discount.toFixed(0)}% OFF
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-xs line-through text-gray-500">₹{originalPrice.toFixed(2)}</div>
                                                                            <div className="text-xs text-green-600">Save ₹{(originalPrice - unitPrice).toFixed(2)}</div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-lg font-bold text-gray-900">₹{unitPrice.toFixed(2)}</div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
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
                                ₹ {estimatedRefund !== null ? parseFloat(estimatedRefund).toFixed(2) : 'Calculating...'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Refund Percentage:</span>
                            <span className="text-green-600">
                                ✓ {refundCalculation?.refundPercentage || getTimeBasedRefund()}% of discounted order value
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
                                                        
                                                        // Use the calculateItemPrice function for consistent pricing
                                                        const priceData = calculateItemPrice(item);
                                                        const { unitPrice, originalPrice, discount, totalPrice } = priceData;
                                                        
                                                        // Calculate refund amount using discounted price
                                                        const refundPercentage = refundCalculation?.refundPercentage || getTimeBasedRefund();
                                                        const refundAmount = ((totalPrice * refundPercentage) / 100).toFixed(2);
                                                        console.log(`Item: ${itemName}, Discounted Price: ${unitPrice}, Original Price: ${originalPrice}, Discount: ${discount}%, Total: ${totalPrice}, Refund %: ${refundPercentage}, Refund amount: ${refundAmount}`);
                                                        
                                                        return (
                                                            <li key={id} className="flex justify-between p-2 bg-gray-50 rounded border">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{itemName} {item.size ? `(${item.size})` : ''}</span>
                                                                    <div className="text-xs text-gray-500">
                                                                        {discount > 0 && originalPrice > unitPrice ? (
                                                                            <div className="space-y-1">
                                                                                <div>Quantity: {item.quantity} × ₹{unitPrice.toFixed(2)} <span className="text-green-600 font-medium">(Discounted)</span></div>
                                                                                <div className="line-through text-gray-400">Was: {item.quantity} × ₹{originalPrice.toFixed(2)}</div>
                                                                                <div className="text-green-600">Saved: ₹{((originalPrice - unitPrice) * item.quantity).toFixed(2)} ({discount.toFixed(0)}% OFF)</div>
                                                                            </div>
                                                                        ) : (
                                                                            <div>Quantity: {item.quantity} × ₹{unitPrice.toFixed(2)}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <div className="flex items-center">
                                                                        <FaRupeeSign size={10} className="mr-0.5" />
                                                                        <span className="font-medium text-green-600">{totalPrice.toFixed(2)}</span>
                                                                        {discount > 0 && (
                                                                            <span className="text-xs text-white bg-red-500 px-1 py-0.5 rounded ml-1">
                                                                                {discount.toFixed(0)}% OFF
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center text-green-600 text-xs">
                                                                        <FaPercent size={8} className="mr-1" />
                                                                        <span>{refundPercentage}% refund: ₹{refundAmount}</span>
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
                                                    {estimatedRefund !== null ? parseFloat(estimatedRefund).toFixed(2) : 'Calculating...'}
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
                            <li>• Refund amount is <span className="font-semibold text-green-700">{refundCalculation?.refundPercentage || getTimeBasedRefund()}%</span> of the <span className="font-medium text-green-700">discounted order value</span> (amount you actually paid)</li>
                            <li>• Approved refunds will be processed within 5-7 business days</li>
                            <li>• Refund will be credited to your original payment method</li>
                            <li>• This action cannot be undone once submitted</li>
                        </ul>

                        {/* Enhanced Refund Calculation Details */}
                        {refundCalculation && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                                    <FaTag className="mr-2 text-blue-600" /> 
                                    Dynamic Refund Calculation:
                                </h5>
                                
                                <div className="bg-white p-3 rounded border">
                                    {/* Dynamic refund breakdown factors */}
                                    {refundCalculation.breakdownFactors && refundCalculation.breakdownFactors.length > 0 ? (
                                        <div className="space-y-2">
                                            {refundCalculation.breakdownFactors.map((factor, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-700">{factor.name}:</span>
                                                        <span className="ml-1 text-gray-600">{factor.value}</span>
                                                        {factor.description && (
                                                            <span className="ml-1 text-gray-500 italic">({factor.description})</span>
                                                        )}
                                                    </div>
                                                    {factor.impact !== undefined && (
                                                        <span className={`font-medium ${factor.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {factor.impact > 0 ? '+' : ''}{factor.impact}%
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : refundCalculation.penalties && refundCalculation.bonuses ? (
                                        <div className="space-y-2">
                                            {/* Base percentage */}
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-medium text-gray-700">Base refund rate:</span>
                                                <span className="font-medium">{refundCalculation.appliedPolicy?.standardRefundPercentage || 75}%</span>
                                            </div>
                                            
                                            {/* Show timing adjustment */}
                                            <div className="flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="font-medium text-gray-700">Order timing:</span>
                                                    <span className="ml-1 text-gray-600">{refundCalculation.cancellationTiming?.toLowerCase()}</span>
                                                    <span className="ml-1 text-gray-500 italic">({refundCalculation.daysSinceOrder} days since order)</span>
                                                </div>
                                                <span className={`font-medium ${refundCalculation.cancellationTiming === 'EARLY' ? 'text-green-600' : refundCalculation.cancellationTiming === 'LATE' ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {refundCalculation.cancellationTiming === 'EARLY' ? '+15%' : refundCalculation.cancellationTiming === 'LATE' ? '-25%' : '0%'}
                                                </span>
                                            </div>
                                            
                                            {/* Show penalties */}
                                            {refundCalculation.penalties?.reasons && refundCalculation.penalties.reasons.length > 0 && (
                                                <div className="mt-1">
                                                    <div className="text-xs font-medium text-gray-700">Penalties:</div>
                                                    {refundCalculation.penalties.reasons.map((reason, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs mt-1">
                                                            <span className="text-gray-600 ml-2">• {reason.split('(')[0]}</span>
                                                            <span className="text-red-600 font-medium">
                                                                {reason.includes('penalty') ? reason.match(/\(([^)]+)%/)?.[1] : null}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Show bonuses */}
                                            {refundCalculation.bonuses?.reasons && refundCalculation.bonuses.reasons.length > 0 && (
                                                <div className="mt-1">
                                                    <div className="text-xs font-medium text-gray-700">Bonuses:</div>
                                                    {refundCalculation.bonuses.reasons.map((reason, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs mt-1">
                                                            <span className="text-gray-600 ml-2">• {reason.split('(')[0]}</span>
                                                            <span className="text-green-600 font-medium">
                                                                +{reason.match(/\(([^)]+)%/)?.[1]}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-600">Standard refund policy applied: {refundCalculation.refundPercentage || getTimeBasedRefund()}%</p>
                                    )}

                                    {/* Final calculation summary */}
                                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                                        <span className="font-semibold text-gray-800">Final Refund:</span>
                                        <div className="text-right">
                                            <div className="font-bold text-green-700">
                                                ₹{estimatedRefund !== null ? parseFloat(estimatedRefund).toFixed(2) : (refundCalculation?.refundAmount ? parseFloat(refundCalculation.refundAmount).toFixed(2) : 'Calculating...')}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                ({refundCalculation.refundPercentage || getTimeBasedRefund()}% of order value)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
