import React, { useState, useEffect } from 'react'
import { FaEye, FaCheck, FaTimes, FaSearch, FaFilter, FaRupeeSign, FaClock, FaUser, FaCalendarAlt, FaInfo } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi, { baseURL } from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'
import PricingService from '../utils/PricingService'
import { RefundPolicyService } from '../utils/RefundPolicyService'

// Make RefundPolicyService available globally for the JSX calculations
window.RefundPolicyService = RefundPolicyService;

function CancellationManagement() {
    const [cancellationRequests, setCancellationRequests] = useState([])
    const [filteredRequests, setFilteredRequests] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [bundleItemsCache, setBundleItemsCache] = useState({}) // Cache for bundle items
    const [fetchingBundles, setFetchingBundles] = useState(false) // Track bundle fetching state

    // Size-based price calculation utility function (using PricingService for consistency)
    const calculateSizeBasedPrice = (item, productInfo = null) => {
        try {
            // Use the centralized PricingService for consistent calculations
            const pricing = PricingService.calculateItemPricing(item, productInfo);
            return pricing.totalPrice;
        } catch (error) {
            console.error('Error calculating size-based price:', error);
            // Fallback to original pricing
            return item?.itemTotal || 
                   (productInfo?.price || productInfo?.bundlePrice || 0) * (item?.quantity || 1);
        }
    };

    // Helper function to calculate the correct refund percentage based on order timing
    const getTimeBasedRefundPercentage = (requestOrOrder) => {
        try {
            // Get the order date from any object structure
            const orderDate = requestOrOrder?.orderId?.orderDate || 
                              requestOrOrder?.orderId?.createdAt || 
                              requestOrOrder?.orderDate || 
                              requestOrOrder?.createdAt;
                              
            // If no order date, default to 75%
            if (!orderDate) {
                console.warn('⚠️ No order date found, defaulting to 75% refund');
                return 75;
            }
            
            // Parse dates and calculate differences more safely
            const currentTime = new Date();
            const orderTime = new Date(orderDate);
            
            // Validate parsed date
            if (isNaN(orderTime.getTime())) {
                console.error('❌ Invalid order date format:', orderDate);
                return 75;
            }
            
            // Calculate hours and days since order
            const timeDifferenceMs = currentTime - orderTime;
            const hoursSinceOrder = timeDifferenceMs / (1000 * 60 * 60);
            const daysSinceOrder = Math.floor(hoursSinceOrder / 24);
            
            // Use the same logic as RefundPolicyService for consistency
            let basePercentage;
            if (hoursSinceOrder <= 24) {
                // Early cancellation (within 24 hours)
                basePercentage = 90;
            } else if (daysSinceOrder <= 7) {
                // Standard cancellation (after 24 hours, up to 7 days)
                basePercentage = 75;
            } else {
                // Late cancellation (7+ days)
                basePercentage = 50;
            }
            
            // Apply penalties if order is delivered
            const orderStatus = requestOrOrder?.orderId?.orderStatus || requestOrOrder?.orderStatus;
            const actualDeliveryDate = requestOrOrder?.orderId?.actualDeliveryDate || requestOrOrder?.actualDeliveryDate;
            
            let penalties = 0;
            
            // Apply delivery penalty if order is delivered
            if (orderStatus === 'DELIVERED' || actualDeliveryDate) {
                if (actualDeliveryDate) {
                    const deliveryTime = new Date(actualDeliveryDate);
                    if (!isNaN(deliveryTime.getTime())) {
                        const daysSinceDelivery = Math.floor((currentTime - deliveryTime) / (1000 * 60 * 60 * 24));
                        if (daysSinceDelivery <= 7) {
                            penalties += 20; // weekAfterDeliveryPenalty
                        } else if (daysSinceDelivery <= 30) {
                            penalties += 30; // monthAfterDeliveryPenalty
                        } else {
                            penalties += 25; // deliveredOrderPenalty
                        }
                    }
                } else {
                    penalties += 25; // deliveredOrderPenalty for status only
                }
            }
            
            // Apply late request penalty
            if (daysSinceOrder > 7) {
                penalties += 15; // lateRequestPenalty
            }
            
            // Calculate final percentage with bounds
            const finalPercentage = Math.max(25, Math.min(100, basePercentage - penalties));
            
            console.log('🔄 Refund percentage calculation:', {
                orderDate: orderDate,
                orderTime: orderTime.toISOString(),
                currentTime: currentTime.toISOString(),
                hoursSinceOrder: hoursSinceOrder.toFixed(2),
                daysSinceOrder,
                basePercentage,
                penalties,
                finalPercentage,
                orderStatus,
                actualDeliveryDate
            });
            
            return Math.round(finalPercentage);
        } catch (error) {
            console.error('Error calculating refund percentage:', error);
            return 75; // Fallback
        }
    };
    
    // Helper function to get delivery charge consistently from any request or order object
    const getDeliveryCharge = (requestOrOrder) => {
        const deliveryCharge = requestOrOrder?.deliveryInfo?.deliveryCharge || 
                              requestOrOrder?.orderId?.deliveryCharge || 
                              requestOrOrder?.pricingInformation?.deliveryCharge ||
                              (requestOrOrder?.deliveryCharge !== undefined ? requestOrOrder.deliveryCharge : 0);
        
        console.log('🚚 getDeliveryCharge found:', deliveryCharge, 'for request/order:', 
            requestOrOrder?._id || requestOrOrder?.id || 'unknown');
        
        return deliveryCharge;
    };
    
    // Get size-based unit price
    const getSizeBasedUnitPrice = (item, productInfo = null) => {
        try {
            const pricing = PricingService.calculateItemPricing(item, productInfo);
            return pricing.unitPrice;
        } catch (error) {
            console.error('Error calculating unit price:', error);
            const totalPrice = calculateSizeBasedPrice(item, productInfo);
            return totalPrice / (item?.quantity || 1);
        }
    };

    // Calculate total discounted amount for entire order
    const calculateOrderDiscountedTotal = (order, cancellationRequest = null) => {
        // Priority 1: Use pricing information sent from OrderCancellationModal for full cancellations
        if (cancellationRequest?.pricingInformation?.totalAmountCustomerPaid !== undefined) {
            console.log('✅ Using pricingInformation.totalAmountCustomerPaid:', cancellationRequest.pricingInformation.totalAmountCustomerPaid);
            return cancellationRequest.pricingInformation.totalAmountCustomerPaid;
        }
        
        if (!order || !order.items) {
            return order?.totalAmt || 0;
        }

        let totalDiscountedAmount = 0;

        order.items.forEach(item => {
            // Priority: Use stored discounted price if available
            if (item.productId?.discountedPrice && item.productId.discountedPrice > 0) {
                totalDiscountedAmount += (item.productId.discountedPrice * item.quantity);
                console.log('✅ Using stored discountedPrice for item:', item.productId.discountedPrice);
            }
            else if (item.productDetails?.discountedPrice && item.productDetails.discountedPrice > 0) {
                totalDiscountedAmount += (item.productDetails.discountedPrice * item.quantity);
                console.log('✅ Using stored discountedPrice from productDetails:', item.productDetails.discountedPrice);
            }
            else {
                // Fallback to existing calculation logic
                const product = item.productId || item.bundleId || item.productDetails || item.bundleDetails;
                
                // Base price calculation with size adjustment
                let basePrice = calculateSizeBasedPrice(item, product);
                
                // Apply product discount if available
                if (product && product.discount > 0) {
                    const discountAmount = (basePrice * product.discount) / 100;
                    basePrice = basePrice - discountAmount;
                }
                
                // Apply bundle discount if it's a bundle item
                if (item.bundleId && product && product.bundleDiscount > 0) {
                    const bundleDiscountAmount = (basePrice * product.bundleDiscount) / 100;
                    basePrice = basePrice - bundleDiscountAmount;
                }
                
                totalDiscountedAmount += basePrice;
            }
        });

        console.log('📊 Order discounted total calculated:', totalDiscountedAmount);
        return totalDiscountedAmount;
    };

    // Get the total refund amount for full order cancellation using pricing information
    const getFullOrderRefundAmount = (cancellationRequest) => {
        console.log('📊 Calculating full order refund amount for:', cancellationRequest._id);
        
        // Priority 1: Use calculated refund amount from OrderCancellationModal
        if (cancellationRequest?.pricingInformation?.calculatedRefundAmount !== undefined) {
            console.log('✅ Using pricingInformation.calculatedRefundAmount:', cancellationRequest.pricingInformation.calculatedRefundAmount);
            return cancellationRequest.pricingInformation.calculatedRefundAmount;
        }
        
        // Priority 2: Calculate using refund percentage and customer paid amount + delivery charges
        // Use consistent priority logic for refund percentage
        const dynamicPercentage = getTimeBasedRefundPercentage(cancellationRequest);
        const storedPercentage = cancellationRequest?.pricingInformation?.refundPercentage || 
            cancellationRequest?.adminResponse?.refundPercentage || 
            cancellationRequest?.refundPercentage;
        
        const refundPercentage = cancellationRequest?.status === 'PENDING' ? 
            dynamicPercentage : (storedPercentage || dynamicPercentage);
        
        const customerPaidAmount = cancellationRequest?.pricingInformation?.totalAmountCustomerPaid || 
                                  calculateOrderDiscountedTotal(cancellationRequest.orderId, cancellationRequest);
        
        // Use our helper to get delivery charge consistently
        const deliveryCharge = getDeliveryCharge(cancellationRequest);
                    
        const totalAmountWithDelivery = customerPaidAmount + deliveryCharge;
        
        const calculatedRefund = (totalAmountWithDelivery * refundPercentage) / 100;
        
        console.log('📊 Full order refund calculation (with delivery):', {
            customerPaidAmount,
            deliveryCharge,
            totalAmountWithDelivery,
            refundPercentage,
            calculatedRefund
        });
        
        return calculatedRefund;
    };

    // Calculate total discounted amount for partial cancellation items only
    const calculatePartialCancellationTotal = (cancellationRequest) => {
        console.log('📊 Calculating partial cancellation total for request:', cancellationRequest._id);
        console.log('📦 Items to cancel:', cancellationRequest?.itemsToCancel);
        
        if (!cancellationRequest?.itemsToCancel) {
            return 0;
        }

        let totalPartialAmount = 0;

        cancellationRequest.itemsToCancel.forEach((cancelItem, index) => {
            console.log(`🔍 Processing cancel item ${index}:`, cancelItem);
            
            // Priority 1: Use pricing data sent from OrderCancellationModal (HIGHEST PRIORITY)
            if (cancelItem.pricingBreakdown?.totalCustomerPaid !== undefined) {
                // Use the exact amount customer paid (discounted price)
                totalPartialAmount += cancelItem.pricingBreakdown.totalCustomerPaid;
                console.log('✅ Using pricingBreakdown.totalCustomerPaid:', cancelItem.pricingBreakdown.totalCustomerPaid);
            }
            // Priority 2: Use direct pricing data from OrderCancellationModal
            else if (cancelItem.totalPrice !== undefined) {
                // Use the totalPrice sent from frontend (already discounted)
                totalPartialAmount += cancelItem.totalPrice;
                console.log('✅ Using cancelItem.totalPrice:', cancelItem.totalPrice);
            }
            // Priority 3: Use itemPrice * quantity if available
            else if (cancelItem.itemPrice !== undefined && cancelItem.quantity !== undefined) {
                // Use the discounted unit price sent from frontend
                totalPartialAmount += (cancelItem.itemPrice * cancelItem.quantity);
                console.log('✅ Using cancelItem.itemPrice * quantity:', cancelItem.itemPrice, '*', cancelItem.quantity);
            }
            // Priority 4: Fallback to finding the full item details from the order
            else if (cancellationRequest.orderId?.items) {
                const fullItem = cancellationRequest.orderId.items.find(
                    orderItem => orderItem._id?.toString() === cancelItem.itemId?.toString()
                );

                if (fullItem) {
                    let unitPrice = 0;

                    if (fullItem.itemType === 'product') {
                        // Check for stored discounted price first (highest priority)
                        if (fullItem.productId?.discountedPrice && fullItem.productId.discountedPrice > 0) {
                            unitPrice = fullItem.productId.discountedPrice;
                            console.log('✅ Using stored discountedPrice from productId:', unitPrice);
                        }
                        else if (fullItem.productDetails?.discountedPrice && fullItem.productDetails.discountedPrice > 0) {
                            unitPrice = fullItem.productDetails.discountedPrice;
                            console.log('✅ Using stored discountedPrice from productDetails:', unitPrice);
                        }
                        else if (fullItem.productDetails?.finalPrice) {
                            unitPrice = fullItem.productDetails.finalPrice;
                            console.log('Using finalPrice:', unitPrice);
                        } else if (fullItem.sizeAdjustedPrice) {
                            unitPrice = fullItem.sizeAdjustedPrice;
                            
                            // Apply any additional discounts
                            const itemDiscount = fullItem.productId?.discount || fullItem.productDetails?.discount || fullItem.discount || 0;
                            if (itemDiscount > 0) {
                                unitPrice = unitPrice * (1 - itemDiscount / 100);
                            }
                            console.log('Using sizeAdjustedPrice with discount:', unitPrice);
                        } else {
                            const originalPrice = fullItem.productId?.price || fullItem.productDetails?.price || 0;
                            const discount = fullItem.productId?.discount || fullItem.discount || 0;
                            unitPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
                            console.log('Calculated discounted price:', unitPrice);
                        }
                    } else if (fullItem.itemType === 'bundle') {
                        unitPrice = fullItem.bundleId?.bundlePrice || fullItem.bundleDetails?.bundlePrice || 0;
                        console.log('Using bundle price:', unitPrice);
                    }

                    totalPartialAmount += (unitPrice * fullItem.quantity);
                }
            }
        });

        console.log('📊 Partial cancellation total calculated:', totalPartialAmount);
        return totalPartialAmount;
    };

    // Calculate proportional delivery charge refund for partial cancellations
    const calculateProportionalDeliveryRefund = (order, itemsToCancel, refundPercentage = null) => {
        // Use provided refund percentage or get from request if available
        const effectiveRefundPercentage = refundPercentage || 
            itemsToCancel.refundPercentage ||
            order?.refundPercentage || 
            75; // Default fallback
            
        // Get delivery charge using our helper function
        const deliveryCharge = getDeliveryCharge(order);
        if (!deliveryCharge || deliveryCharge <= 0) {
            return 0; // No delivery charge to refund
        }

        if (!order.items || order.items.length === 0) {
            return 0; // No items in order
        }

        // Calculate total order value (excluding delivery)
        const totalOrderValue = order.subTotalAmt || (order.totalAmt - deliveryCharge);
        
        // Calculate value of cancelled items
        let cancelledItemsValue = 0;
        
        itemsToCancel.forEach(cancelItem => {
            const orderItem = order.items.find(item => 
                item._id && item._id.toString() === cancelItem.itemId.toString()
            );
            
            if (orderItem) {
                // Use the item total or calculate from unit price and quantity
                const itemValue = orderItem.itemTotal || 
                                 (orderItem.sizeAdjustedPrice || orderItem.productDetails?.price || 0) * orderItem.quantity;
                cancelledItemsValue += itemValue;
            }
        });

        // Calculate proportional delivery charge
        // Special case: if all items are being cancelled, include full delivery charge
        const orderItemsCount = order.items.length;
        const cancellingItemsCount = itemsToCancel.length;
        const isEffectivelyFullCancellation = orderItemsCount === cancellingItemsCount;
        
        let proportionalDeliveryCharge;
        if (isEffectivelyFullCancellation) {
            // If cancelling all items, refund full delivery charge
            proportionalDeliveryCharge = deliveryCharge;
        } else {
            // Otherwise, calculate proportional delivery charge
            const deliveryProportion = totalOrderValue > 0 ? (cancelledItemsValue / totalOrderValue) : 0;
            proportionalDeliveryCharge = deliveryCharge * deliveryProportion;
        }
        
        // Apply refund percentage to delivery charge
        const deliveryRefund = (proportionalDeliveryCharge * effectiveRefundPercentage) / 100;
        
        console.log('📦 Frontend Proportional Delivery Refund:', {
            totalOrderValue,
            cancelledItemsValue,
            deliveryCharge,
            orderItemsCount,
            cancellingItemsCount,
            isEffectivelyFullCancellation,
            proportionalDeliveryCharge,
            refundPercentage: effectiveRefundPercentage,
            deliveryRefund
        });
        
        return Math.round(deliveryRefund * 100) / 100; // Round to 2 decimal places
    };

    // Get the total refund amount for partial cancellation using dynamic refund percentage
    const getPartialCancellationRefundAmount = (cancellationRequest) => {
        console.log('📊 Calculating partial cancellation refund amount for:', cancellationRequest._id);
        
        // Priority 1: Use refund amount directly sent from OrderCancellationModal
        if (cancellationRequest?.totalRefundAmount !== undefined) {
            console.log('✅ Using directly sent totalRefundAmount:', cancellationRequest.totalRefundAmount);
            return cancellationRequest.totalRefundAmount;
        }
        
        // Priority 2: Calculate from individual item refund amounts
        if (cancellationRequest?.itemsToCancel && Array.isArray(cancellationRequest.itemsToCancel)) {
            let totalRefund = 0;
            let hasIndividualRefunds = false;
            
            cancellationRequest.itemsToCancel.forEach(cancelItem => {
                // Check if item has individual refund amount
                if (cancelItem.refundAmount !== undefined) {
                    totalRefund += cancelItem.refundAmount;
                    hasIndividualRefunds = true;
                    console.log('✅ Adding item refundAmount:', cancelItem.refundAmount);
                }
                // Check in pricing breakdown
                else if (cancelItem.pricingBreakdown?.calculatedRefund !== undefined) {
                    totalRefund += cancelItem.pricingBreakdown.calculatedRefund;
                    hasIndividualRefunds = true;
                    console.log('✅ Adding pricingBreakdown.calculatedRefund:', cancelItem.pricingBreakdown.calculatedRefund);
                }
            });
            
            if (hasIndividualRefunds) {
                // Add proportional delivery charge refund with consistent priority logic
                const dynamicPercentage = getTimeBasedRefundPercentage(cancellationRequest);
                const storedPercentage = cancellationRequest?.pricingInformation?.refundPercentage || 
                    cancellationRequest?.adminResponse?.refundPercentage || 
                    cancellationRequest?.refundPercentage;
                
                const refundPercentage = cancellationRequest?.status === 'PENDING' ? 
                    dynamicPercentage : (storedPercentage || dynamicPercentage);
                    
                const deliveryRefund = calculateProportionalDeliveryRefund(
                    cancellationRequest.orderId, 
                    cancellationRequest.itemsToCancel, 
                    refundPercentage
                );
                totalRefund += deliveryRefund;
                
                console.log('✅ Using sum of individual refund amounts + delivery:', {
                    itemsRefund: totalRefund - deliveryRefund,
                    deliveryRefund,
                    totalRefund
                });
                return totalRefund;
            }
        }
        
        // Priority 3: Use refund percentage from the request
        const refundPercentage = cancellationRequest?.refundPercentage || 
                                cancellationRequest?.adminResponse?.refundPercentage || 
                                75; // Default fallback
        
        // Calculate total and apply refund percentage
        const totalAmount = calculatePartialCancellationTotal(cancellationRequest);
        
        // Add proportional delivery charge refund
        const deliveryRefund = calculateProportionalDeliveryRefund(
            cancellationRequest.orderId, 
            cancellationRequest.itemsToCancel, 
            refundPercentage
        );
        
        const calculatedRefund = (totalAmount * refundPercentage) / 100 + deliveryRefund;
        
        console.log('📊 Fallback calculation (with delivery):', {
            totalAmount,
            refundPercentage,
            itemsRefund: (totalAmount * refundPercentage) / 100,
            deliveryRefund,
            calculatedRefund
        });
        
        return calculatedRefund;
    };

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
                const requestsData = response.data.data?.requests || [];
                setCancellationRequests(requestsData);
                
                // Auto-fetch bundle items for all bundles in the cancellation requests
                await fetchBundleItemsForRequests(requestsData);
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

    // Function to fetch bundle details by ID
    const fetchBundleDetails = async (bundleId) => {
        if (!bundleId) return null;
        
        // Check cache first
        if (bundleItemsCache[bundleId]) {
            return bundleItemsCache[bundleId];
        }

        try {
            const token = localStorage.getItem('accessToken')
            const response = await Axios({
                ...SummaryApi.getBundleById,
                url: SummaryApi.getBundleById.url.replace(':id', bundleId),
                headers: {
                    authorization: `Bearer ${token}`
                }
            })

            if (response.data.success && response.data.data) {
                const bundleData = response.data.data;
                // Cache the result
                setBundleItemsCache(prev => ({
                    ...prev,
                    [bundleId]: bundleData
                }));
                return bundleData;
            }
        } catch (error) {
            console.error('Error fetching bundle details:', error);
        }
        return null;
    }

    // Function to fetch bundle items for all bundles in cancellation requests
    const fetchBundleItemsForRequests = async (requestsData) => {
        if (!requestsData || !Array.isArray(requestsData)) return;

        const bundleIdsToFetch = new Set();
        
        // Collect all bundle IDs that need fetching
        requestsData.forEach(request => {
            if (request?.orderId?.items && Array.isArray(request.orderId.items)) {
                request.orderId.items.forEach(item => {
                    // Enhanced bundle detection
                    const isBundle = item.itemType === 'bundle' || 
                                   (item.bundleId && typeof item.bundleId === 'object') ||
                                   (item.bundleDetails && typeof item.bundleDetails === 'object') ||
                                   (item.bundle && typeof item.bundle === 'object') ||
                                   (item.productId && typeof item.productId === 'object' && item.productId.type === 'bundle') ||
                                   (item.type === 'bundle') ||
                                   item.isBundle;

                    if (isBundle) {
                        // Check if bundle items are already available
                        const hasExistingItems = (item.bundleId?.items && Array.isArray(item.bundleId.items) && item.bundleId.items.length > 0) ||
                                               (item.bundleDetails?.items && Array.isArray(item.bundleDetails.items) && item.bundleDetails.items.length > 0) ||
                                               (item.bundle?.items && Array.isArray(item.bundle.items) && item.bundle.items.length > 0);

                        if (!hasExistingItems) {
                            // Extract bundle ID for API fetch
                            let bundleId = null;
                            if (item.bundleId) {
                                bundleId = typeof item.bundleId === 'object' ? item.bundleId._id : item.bundleId;
                            } else if (item.productId) {
                                bundleId = typeof item.productId === 'object' ? item.productId._id : item.productId;
                            }

                            if (bundleId && !bundleItemsCache[bundleId]) {
                                bundleIdsToFetch.add(bundleId);
                            }
                        }
                    }
                });
            }
        });

        // Fetch bundle details for all collected IDs
        if (bundleIdsToFetch.size > 0) {
            console.log('Fetching bundle items for cancellation IDs:', Array.from(bundleIdsToFetch));
            setFetchingBundles(true);
            
            const fetchPromises = Array.from(bundleIdsToFetch).map(bundleId => 
                fetchBundleDetails(bundleId).catch(error => {
                    console.error(`Error fetching bundle ${bundleId}:`, error);
                    return null;
                })
            );

            try {
                await Promise.all(fetchPromises);
                console.log('Finished fetching all bundle items for cancellations');
            } catch (error) {
                console.error('Error fetching bundle items:', error);
            } finally {
                setFetchingBundles(false);
            }
        }
    };

    // Function to get bundle ID from item
    const getBundleId = (item) => {
        if (typeof item.bundleId === 'string') {
            return item.bundleId;
        }
        if (typeof item.bundleId === 'object' && item.bundleId?._id) {
            return item.bundleId._id;
        }
        if (typeof item.bundleDetails === 'object' && item.bundleDetails?._id) {
            return item.bundleDetails._id;
        }
        return null;
    }

    const handleProcessRequest = async (requestId, action, adminComments = '', refundPercentage = null) => {
        // Use provided refund percentage or calculate using consistent priority logic
        const request = cancellationRequests.find(req => req._id === requestId);
        
        let effectiveRefundPercentage;
        if (refundPercentage) {
            effectiveRefundPercentage = refundPercentage;
        } else {
            // Use consistent priority logic
            const dynamicPercentage = getTimeBasedRefundPercentage(request);
            const storedPercentage = request?.pricingInformation?.refundPercentage || 
                request?.adminResponse?.refundPercentage || 
                request?.refundPercentage;
            
            effectiveRefundPercentage = request?.status === 'PENDING' ? 
                dynamicPercentage : (storedPercentage || dynamicPercentage);
        }
        setActionLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            
            // Determine if this is a partial cancellation or full order cancellation
            const isPartialCancellation = selectedRequest?.cancellationType === 'PARTIAL_ITEMS';
            
            // Calculate the final refund amounts using discount-based pricing
            let calculatedRefundAmount = 0;
            let calculatedTotalValue = 0;
            
            if (isPartialCancellation) {
                calculatedRefundAmount = getPartialCancellationRefundAmount(selectedRequest);
                calculatedTotalValue = calculatePartialCancellationTotal(selectedRequest);
            } else {
                calculatedRefundAmount = getFullOrderRefundAmount(selectedRequest);
                calculatedTotalValue = calculateOrderDiscountedTotal(selectedRequest.orderId, selectedRequest);
            }
            
            let response;
            if (isPartialCancellation) {
                // Handle partial item cancellation
                response = await Axios({
                    ...SummaryApi.processPartialItemCancellation,
                    url: `${SummaryApi.processPartialItemCancellation.url}/${requestId}`,
                    headers: {
                        authorization: `Bearer ${token}`
                    },
                    data: {
                        action,
                        adminComments,
                        refundPercentage: effectiveRefundPercentage,
                        // Include calculated refund amounts based on discount pricing
                        calculatedRefundAmount: calculatedRefundAmount,
                        calculatedTotalValue: calculatedTotalValue,
                        // Enhanced refund data for refund management
                        refundData: {
                            finalRefundAmount: calculatedRefundAmount,
                            totalItemValue: calculatedTotalValue,
                            refundPercentage: refundPercentage,
                            cancellationType: 'PARTIAL_ITEMS',
                            basedOnDiscountedPricing: true
                        }
                    }
                })
            } else {
                // Handle full order cancellation
                response = await Axios({
                    ...SummaryApi.processCancellationRequest,
                    headers: {
                        authorization: `Bearer ${token}`
                    },
                    data: {
                        requestId,
                        action,
                        adminComments,
                        customRefundPercentage: refundPercentage,
                        // Include calculated refund amounts based on discount pricing
                        calculatedRefundAmount: calculatedRefundAmount,
                        calculatedTotalValue: calculatedTotalValue,
                        // Enhanced refund data for refund management
                        refundData: {
                            finalRefundAmount: calculatedRefundAmount,
                            customerPaidAmount: calculatedTotalValue,
                            refundPercentage: refundPercentage,
                            cancellationType: 'FULL_ORDER',
                            basedOnDiscountedPricing: true,
                            // Include pricing information for transparency
                            pricingBreakdown: selectedRequest.pricingInformation || null
                        }
                    }
                })
            }

            if (response.data.success) {
                const requestType = isPartialCancellation ? 'partial item cancellation' : 'cancellation';
                toast.success(`${requestType} request ${action.toLowerCase()} successfully!`)
                fetchCancellationRequests()
                setShowDetailsModal(false)
                
                // Store notification for the user about the refund
                if (action === 'APPROVED' && selectedRequest?.userId) {
                    const userId = selectedRequest.userId._id || selectedRequest.userId;
                    const orderId = selectedRequest.orderId._id || selectedRequest.orderId;
                    const orderNumber = selectedRequest.orderId.orderId || 'N/A';
                    
                    let refundAmount;
                    if (isPartialCancellation) {
                        // For partial cancellations, use the refund amount with proper pricing
                        refundAmount = getPartialCancellationRefundAmount(selectedRequest).toFixed(2);
                    } else {
                        // For full cancellations, use the enhanced refund calculation
                        refundAmount = getFullOrderRefundAmount(selectedRequest).toFixed(2);
                    }
                    
                    // Create notification
                    const notification = {
                        id: `cancel-${orderId}-${Date.now()}`,
                        type: 'refund',
                        title: `Refund Processed for Order #${orderNumber}`,
                        message: isPartialCancellation 
                            ? `Your partial cancellation request has been approved. A refund of ₹${refundAmount} for selected items will be processed to your original payment method within 5-7 business days.`
                            : `Your cancellation request has been approved. A refund of ₹${refundAmount} (${refundPercentage}% of total order amount) will be processed to your original payment method within 5-7 business days.`,
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
                    if (isPartialCancellation) {
                        const itemValueDisplay = selectedRequest.totalItemValue || 
                                               calculatePartialCancellationTotal(selectedRequest);
                        toast.success(`Refund amount: ₹${refundAmount} (${effectiveRefundPercentage}% of cancelled items total: ₹${itemValueDisplay.toFixed(2)})`, {
                            duration: 5000,
                            style: {
                                background: '#F0FFF4',
                                color: '#22543D',
                                fontWeight: 'bold',
                            }
                        });
                    } else {
                        const totalAmount = selectedRequest.orderId?.totalAmt || 0;
                        toast.success(`Refund amount: ₹${refundAmount} (${effectiveRefundPercentage}% of total order amount: ₹${totalAmount.toFixed(2)})`, {
                            duration: 5000,
                            style: {
                                background: '#F0FFF4',
                                color: '#22543D',
                                fontWeight: 'bold',
                                border: '1px solid #C6F6D5'
                            },
                            icon: '💰'
                        });
                    }
                    
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
                                    // Calculate refund percentage based on comprehensive logic
                                    refundPercentage: getTimeBasedRefundPercentage(cancellationRequest),
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
            PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-yellow-100',
            APPROVED: 'bg-green-100 text-green-800 border-green-200 shadow-green-100',
            REJECTED: 'bg-red-100 text-red-800 border-red-200 shadow-red-100',
            PROCESSED: 'bg-blue-100 text-blue-800 border-blue-200 shadow-blue-100'
        }
        return `px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${styles[status] || 'bg-gray-100 text-gray-800'}`
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

    console.log(selectedRequest)

    const CancellationDetailsModal = () => {
        const [adminNotes, setAdminNotes] = useState('')

        if (!selectedRequest) return null

        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 font-sans">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex h-10 w-10 rounded-full bg-blue-100 items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Cancellation Details</h2>
                        </div>
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="text-gray-400 hover:text-gray-800 transition-all hover:rotate-90 hover:scale-110 duration-300 p-2"
                            aria-label="Close"
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>

                    <div className="p-5 sm:p-6">
                        {/* Request Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4 bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 tracking-tight">Request Information</h3>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Request ID:</span>
                                        <span className="font-semibold text-gray-800 tracking-wide">#{selectedRequest._id.slice(-8)}</span>
                                    </div>
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Status:</span>
                                        <span className={getStatusBadge(selectedRequest.status) + " font-semibold"}>
                                            {selectedRequest.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Requested On:</span>
                                        <span className="font-semibold text-gray-800">{formatDate(selectedRequest.createdAt)}</span>
                                    </div>
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Customer:</span>
                                        <span className="font-semibold text-gray-800">{selectedRequest.userId?.name}</span>
                                    </div>
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Email:</span>
                                        <span className="font-semibold text-gray-800 break-all">{selectedRequest.userId?.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 tracking-tight">Order Information</h3>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Order ID:</span>
                                        <span className="font-semibold text-gray-800">#{selectedRequest.orderId?.orderId}</span>
                                    </div>
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Order Amount:</span>
                                        <span className="font-semibold text-gray-800">₹{selectedRequest.orderId?.totalAmt?.toFixed(2)}</span>
                                    </div>
                                    {/* Show delivery charge breakdown */}
                                    {selectedRequest.orderId?.deliveryCharge && selectedRequest.orderId.deliveryCharge > 0 && (
                                        <div className="flex flex-wrap justify-between items-center gap-2 pl-4 border-l-2 border-blue-200 bg-blue-50 p-2 rounded">
                                            <span className="text-gray-600 font-medium text-sm">📦 Delivery Charge:</span>
                                            <span className="font-semibold text-blue-600">₹{selectedRequest.orderId.deliveryCharge?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {selectedRequest.orderId?.deliveryCharge && selectedRequest.orderId.deliveryCharge > 0 && (
                                        <div className="flex flex-wrap justify-between items-center gap-2 pl-4 border-l-2 border-green-200 bg-green-50 p-2 rounded">
                                            <span className="text-gray-600 font-medium text-sm">🛍️ Items Subtotal:</span>
                                            <span className="font-semibold text-green-600">₹{(selectedRequest.orderId.totalAmt - selectedRequest.orderId.deliveryCharge)?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Order Date:</span>
                                        <span className="font-semibold text-gray-800">{formatDate(selectedRequest.orderId?.orderDate)}</span>
                                    </div>
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Payment Method:</span>
                                        <span className="font-semibold text-gray-800">
                                            {selectedRequest.orderId?.paymentMethod || 
                                             (selectedRequest.orderId?.paymentStatus === 'CASH ON DELIVERY' ? 'Cash on Delivery' : 'Online Payment')}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <span className="text-gray-600 font-medium">Order Status:</span>
                                        <span className="font-semibold text-gray-800">{selectedRequest.orderId?.orderStatus}</span>
                                    </div>
                                    {selectedRequest.deliveryInfo?.estimatedDeliveryDate && (
                                        <div className="flex flex-wrap justify-between items-center gap-2">
                                            <span className="text-gray-600 font-medium">Estimated Delivery:</span>
                                            <span className="font-semibold text-gray-800">{formatDate(selectedRequest.deliveryInfo.estimatedDeliveryDate)}</span>
                                        </div>
                                    )}
                                    {selectedRequest.orderId?.actualDeliveryDate && (
                                        <div className="flex flex-wrap justify-between items-center gap-2">
                                            <span className="text-gray-600 font-medium">Actual Delivery:</span>
                                            <span className="font-semibold text-green-600">{formatDate(selectedRequest.orderId.actualDeliveryDate)}</span>
                                        </div>
                                    )}
                                    {selectedRequest.orderId?.deliveryNotes && (
                                        <div className="flex flex-wrap justify-between items-center gap-2">
                                            <span className="text-gray-600 font-medium">Delivery Notes:</span>
                                            <span className="font-semibold text-gray-800">{selectedRequest.orderId.deliveryNotes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Cancellation Type */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 tracking-tight">Cancellation Type</h3>
                            <div className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-100">
                                {selectedRequest.cancellationType === 'PARTIAL_ITEMS' ? (
                                    <div>
                                        {(() => {
                                            // Check if this is effectively a full cancellation (only one item or all items selected)
                                            const orderItems = selectedRequest.orderId?.items || [];
                                            const cancelledItems = selectedRequest.itemsToCancel || [];
                                            const isEffectivelyFullCancellation = orderItems.length === 1 || 
                                                                                (orderItems.length > 0 && cancelledItems.length === orderItems.length);
                                            
                                            if (isEffectivelyFullCancellation && orderItems.length === 1) {
                                                return (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                            <span className="font-semibold text-blue-700 text-lg">Single Item Order Cancellation</span>
                                                        </div>
                                                        <p className="text-gray-700 mb-3">
                                                            This order contains only one item. Cancelling this item effectively cancels the entire order, including delivery charges.
                                                        </p>
                                                    </>
                                                );
                                            } else if (isEffectivelyFullCancellation) {
                                                return (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                            <span className="font-semibold text-red-700 text-lg">Complete Order Cancellation</span>
                                                        </div>
                                                        <p className="text-gray-700 mb-3">
                                                            The customer selected all items for cancellation, effectively cancelling the entire order including delivery charges.
                                                        </p>
                                                    </>
                                                );
                                            } else {
                                                return (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                                            <span className="font-semibold text-orange-700 text-lg">Partial Item Cancellation</span>
                                                        </div>
                                                        <p className="text-gray-700 mb-3">
                                                            The customer requested to cancel specific items from their order:
                                                        </p>
                                                    </>
                                                );
                                            }
                                        })()}
                                        {selectedRequest.itemsToCancel && selectedRequest.itemsToCancel.length > 0 && (
                                            <div className="bg-white p-4 rounded-lg border border-orange-200">
                                                <h4 className="font-medium text-gray-900 mb-3">Items to Cancel:</h4>
                                                <div className="space-y-3">
                                                    {selectedRequest.itemsToCancel.map((cancelItem, index) => {
                                                        console.log('🔍 Processing cancel item:', index, cancelItem);
                                                        console.log('📊 Cancel item pricing breakdown:', cancelItem.pricingBreakdown);
                                                        
                                                        // Find the full item details from the order
                                                        const fullItem = selectedRequest.orderId?.items?.find(
                                                            orderItem => orderItem._id?.toString() === cancelItem.itemId?.toString()
                                                        );
                                                        
                                                        if (!fullItem) {
                                                            return (
                                                                <div key={index} className="p-3 bg-gray-100 rounded-md">
                                                                    <span className="text-gray-600">Item details not found</span>
                                                                </div>
                                                            );
                                                        }

                                                        // Calculate pricing information
                                                        const calculateItemPricing = (item, cancelItemData = null) => {
                                                            let unitPrice = 0;
                                                            let originalPrice = 0;
                                                            let discountPercentage = 0;
                                                            
                                                            console.log('🎯 Calculating pricing for item:', item._id, 'with cancel data:', cancelItemData);
                                                            
                                                            // Priority 1: Use pricing breakdown sent from OrderCancellationModal (HIGHEST PRIORITY)
                                                            if (cancelItemData?.pricingBreakdown) {
                                                                const breakdown = cancelItemData.pricingBreakdown;
                                                                unitPrice = breakdown.unitCustomerPaid || breakdown.itemPrice || cancelItemData.itemPrice || 0;
                                                                originalPrice = breakdown.originalPrice || breakdown.unitPrice || cancelItemData.originalPrice || unitPrice;
                                                                discountPercentage = breakdown.discountPercentage || 0;
                                                                console.log('✅ Using pricingBreakdown:', { unitPrice, originalPrice, discountPercentage });
                                                            }
                                                            // Priority 2: Use direct pricing data from cancellation request
                                                            else if (cancelItemData && cancelItemData.itemPrice !== undefined) {
                                                                unitPrice = cancelItemData.itemPrice || 0;
                                                                originalPrice = cancelItemData.originalPrice || unitPrice;
                                                                discountPercentage = cancelItemData.discount || 0;
                                                                console.log('✅ Using cancelItemData pricing:', { unitPrice, originalPrice, discountPercentage });
                                                            } else {
                                                                // Fallback to calculating from item data
                                                                if (item.itemType === 'product') {
                                                                    // Get the original price first
                                                                    originalPrice = item.productId?.price || item.productDetails?.price || 0;
                                                                    
                                                                    // Check for explicit final price (already discounted)
                                                                    if (item.productDetails?.finalPrice) {
                                                                        unitPrice = item.productDetails.finalPrice;
                                                                        // Calculate discount from original vs final price
                                                                        if (originalPrice > unitPrice) {
                                                                            discountPercentage = ((originalPrice - unitPrice) / originalPrice) * 100;
                                                                        }
                                                                    } else if (item.sizeAdjustedPrice) {
                                                                        unitPrice = item.sizeAdjustedPrice;
                                                                        originalPrice = unitPrice;
                                                                    } else if (item.productId?.sizePricing && item.size) {
                                                                        const sizeMultiplier = item.productId.sizePricing[item.size] || 1;
                                                                        const basePriceBeforeSize = originalPrice;
                                                                        
                                                                        // Apply size multiplier first
                                                                        originalPrice = basePriceBeforeSize * sizeMultiplier;
                                                                        unitPrice = originalPrice;
                                                                        
                                                                        // Then apply discount if available
                                                                        discountPercentage = item.productId?.discount || item.discount || 0;
                                                                        if (discountPercentage > 0) {
                                                                            unitPrice = originalPrice * (1 - discountPercentage / 100);
                                                                        }
                                                                    } else {
                                                                        originalPrice = item.productId?.price || item.productDetails?.price || 0;
                                                                        discountPercentage = item.productId?.discount || item.discount || 0;
                                                                        unitPrice = discountPercentage > 0 ? originalPrice * (1 - discountPercentage / 100) : originalPrice;
                                                                    }
                                                                } else if (item.itemType === 'bundle') {
                                                                    unitPrice = item.bundleId?.bundlePrice || item.bundleDetails?.bundlePrice || 0;
                                                                    originalPrice = item.bundleId?.originalPrice || item.bundleDetails?.originalPrice || unitPrice;
                                                                    if (originalPrice > unitPrice && originalPrice > 0) {
                                                                        discountPercentage = ((originalPrice - unitPrice) / originalPrice) * 100;
                                                                    }
                                                                }
                                                            }
                                                            
                                                            return {
                                                                unitPrice: unitPrice,
                                                                originalPrice: originalPrice,
                                                                discount: discountPercentage,
                                                                totalPrice: unitPrice * item.quantity
                                                            };
                                                        };

                                                        const itemName = fullItem?.productDetails?.name || 
                                                                       fullItem?.bundleDetails?.title || 
                                                                       cancelItem?.productName ||
                                                                       'Unknown Item';
                                                        
                                                        const pricingData = calculateItemPricing(fullItem, cancelItem);
                                                        console.log("Price Data", fullItem);
                                                        const hasDiscount = pricingData.discount > 0 && pricingData.originalPrice > pricingData.unitPrice;
                                                        
                                                        return (
                                                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                {/* Item Image */}
                                                                <div className="flex-shrink-0">
                                                                    <img
                                                                        src={fullItem?.productDetails?.image?.[0] || fullItem?.bundleDetails?.image || '/placeholder-image.jpg'}
                                                                        alt={itemName}
                                                                        className="w-16 h-16 object-cover rounded-md border"
                                                                    />
                                                                </div>
                                                                
                                                                {/* Item Details */}
                                                                <div className="flex-grow">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <h5 className="font-medium text-gray-900 mb-1">{itemName}</h5>
                                                                            <div className="text-sm text-gray-600">
                                                                                {fullItem.itemType === 'product' && fullItem.size && (
                                                                                    <span className="inline-block mr-3">Size: {fullItem.size}</span>
                                                                                )}
                                                                                <span>Qty: {fullItem.quantity}</span>
                                                                            </div>
                                                                            
                                                                            {/* Price Information */}
                                                                            <div className="mt-2">
                                                                                <div className="text-sm">
                                                                                    <span className="text-gray-600">Unit Price: </span>
                                                                                    {hasDiscount ? (
                                                                                        <span className="space-x-2">
                                                                                            <span className="line-through text-gray-500">₹{pricingData.originalPrice.toFixed(2)}</span>
                                                                                            <span className="text-green-600 font-semibold">₹{pricingData.unitPrice.toFixed(2)}</span>
                                                                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                                                                                {pricingData.discount.toFixed(0)}% OFF
                                                                                            </span>
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="font-semibold">₹{pricingData.unitPrice.toFixed(2)}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* Refund Amount */}
                                                                        <div className="text-right">
                                                                            <div className="text-sm text-gray-600 mb-1">
                                                                                Refund Amount ({(() => {
                                                                                    // Use consistent priority logic for individual item display
                                                                                    const dynamicPercentage = getTimeBasedRefundPercentage(selectedRequest);
                                                                                    const storedPercentage = selectedRequest?.pricingInformation?.refundPercentage || 
                                                                                        selectedRequest?.adminResponse?.refundPercentage || 
                                                                                        selectedRequest?.refundPercentage;
                                                                                    
                                                                                    // For pending requests, use dynamic calculation to ensure real-time accuracy
                                                                                    // For processed requests, prefer stored values to maintain consistency
                                                                                    if (selectedRequest?.status === 'PENDING') {
                                                                                        return Math.round(dynamicPercentage);
                                                                                    } else {
                                                                                        return Math.round(storedPercentage || dynamicPercentage);
                                                                                    }
                                                                                })()}%)
                                                                            </div>
                                                                            <div className="font-bold text-orange-600 text-lg">
                                                                                ₹{(() => {
                                                                                    // Priority 1: Use refund amount from cancellation request
                                                                                    if (cancelItem.refundAmount !== undefined) {
                                                                                        return cancelItem.refundAmount.toFixed(2);
                                                                                    }
                                                                                    // Priority 2: Use pricingBreakdown refund amount
                                                                                    if (cancelItem.pricingBreakdown?.refundAmount !== undefined) {
                                                                                        return cancelItem.pricingBreakdown.refundAmount.toFixed(2);
                                                                                    }
                                                                                    // Priority 3: Calculate from customer paid amount using dynamic refund percentage
                                                                                    if (cancelItem.pricingBreakdown?.totalCustomerPaid !== undefined) {
                                                                                        // Calculate refund percentage based on order timing
                                                                                        const orderDate = selectedRequest?.orderId?.orderDate || selectedRequest?.orderId?.createdAt;
                                                                                        let refundMultiplier = 0.75; // Default
                                                                                        
                                                                                        if (orderDate) {
                                                                                            const hoursSinceOrder = (new Date() - new Date(orderDate)) / (1000 * 60 * 60);
                                                                                            refundMultiplier = hoursSinceOrder <= 24 ? 0.9 : 0.75;
                                                                                        }
                                                                                        
                                                                                        return (cancelItem.pricingBreakdown.totalCustomerPaid * refundMultiplier).toFixed(2);
                                                                                    }
                                                                                    // Fallback: Use calculated pricing
                                                                                    // Use dynamic refund percentage
                                                                                    const orderDate = selectedRequest?.orderId?.orderDate || selectedRequest?.orderId?.createdAt;
                                                                                    let refundMultiplier = 0.75; // Default
                                                                                    
                                                                                    if (orderDate) {
                                                                                        const hoursSinceOrder = (new Date() - new Date(orderDate)) / (1000 * 60 * 60);
                                                                                        refundMultiplier = hoursSinceOrder <= 24 ? 0.9 : 0.75;
                                                                                    }
                                                                                    
                                                                                    return (pricingData.totalPrice * refundMultiplier).toFixed(2);
                                                                                })()}
                                                                            </div>
                                                                            {hasDiscount && (
                                                                                <div className="text-xs text-green-600">
                                                                                    (Save ₹{((pricingData.originalPrice - pricingData.unitPrice) * fullItem.quantity).toFixed(2)})
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-orange-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold text-gray-800 text-lg">
                                                            Total Expected Refund ({(() => {
                                                                // Use consistent priority logic with all other displays
                                                                const dynamicPercentage = getTimeBasedRefundPercentage(selectedRequest);
                                                                const storedPercentage = selectedRequest?.pricingInformation?.refundPercentage || 
                                                                    selectedRequest?.adminResponse?.refundPercentage || 
                                                                    selectedRequest?.refundPercentage;
                                                                
                                                                // For pending requests, use dynamic calculation to ensure real-time accuracy
                                                                // For processed requests, prefer stored values to maintain consistency
                                                                if (selectedRequest?.status === 'PENDING') {
                                                                    return Math.round(dynamicPercentage);
                                                                } else {
                                                                    return Math.round(storedPercentage || dynamicPercentage);
                                                                }
                                                            })()}%):
                                                        </span>
                                                        <span className="font-bold text-orange-600 text-xl">
                                                            ₹{getPartialCancellationRefundAmount(selectedRequest)?.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="font-semibold text-red-700 text-lg">Full Order Cancellation</span>
                                        </div>
                                        <p className="text-gray-700">
                                            The customer requested to cancel the entire order.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 tracking-tight">
                                {selectedRequest.cancellationType === 'PARTIAL_ITEMS' ? 'Items Being Cancelled' : 'Product Details'}
                            </h3>
                            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                {selectedRequest.cancellationType === 'PARTIAL_ITEMS' ? (
                                    // For partial cancellations, only show the items being cancelled
                                    selectedRequest.itemsToCancel && selectedRequest.itemsToCancel.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedRequest.itemsToCancel.map((cancelItem, index) => {
                                                // Find the full item details from the order
                                                const fullItem = selectedRequest.orderId?.items?.find(
                                                    orderItem => orderItem._id?.toString() === cancelItem.itemId?.toString()
                                                );
                                                
                                                if (!fullItem) {
                                                    return (
                                                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                            <span className="text-gray-600">Item details not found</span>
                                                        </div>
                                                    );
                                                }

                                                // Enhanced pricing calculation with discount
                                                const calculateItemPricingDetailed = (item, cancelItemData = null) => {
                                                    let unitPrice = 0;
                                                    let originalPrice = 0;
                                                    let discountPercentage = 0;
                                                    
                                                    // First, check if we have pricing data from the cancellation request
                                                    if (cancelItemData && cancelItemData.itemPrice !== undefined) {
                                                        unitPrice = cancelItemData.itemPrice || 0;
                                                        originalPrice = cancelItemData.originalPrice || unitPrice;
                                                        discountPercentage = cancelItemData.discount || 0;
                                                    } else {
                                                        // Fallback to calculating from item data
                                                        if (item.itemType === 'product') {
                                                            // Get the original price first
                                                            originalPrice = item.productId?.price || item.productDetails?.price || 0;
                                                            
                                                            // Check for explicit final price (already discounted)
                                                            if (item.productDetails?.finalPrice) {
                                                                unitPrice = item.productDetails.finalPrice;
                                                                // Calculate discount from original vs final price
                                                                if (originalPrice > unitPrice) {
                                                                    discountPercentage = ((originalPrice - unitPrice) / originalPrice) * 100;
                                                                }
                                                            } else if (item.sizeAdjustedPrice) {
                                                                // Use size-adjusted price as base
                                                                unitPrice = item.sizeAdjustedPrice;
                                                                originalPrice = unitPrice; // For size-adjusted, show as no additional discount
                                                            } else if (item.productId?.sizePricing && item.size) {
                                                                // Calculate size-adjusted price from populated product data
                                                                const sizeMultiplier = item.productId.sizePricing[item.size] || 1;
                                                                const basePriceBeforeSize = originalPrice;
                                                                
                                                                // Apply size multiplier first
                                                                originalPrice = basePriceBeforeSize * sizeMultiplier;
                                                                unitPrice = originalPrice;
                                                                
                                                                // Then apply discount if available
                                                                discountPercentage = item.productId?.discount || item.discount || 0;
                                                                if (discountPercentage > 0) {
                                                                    unitPrice = originalPrice * (1 - discountPercentage / 100);
                                                                }
                                                            } else {
                                                                // Regular price with discount
                                                                discountPercentage = item.productId?.discount || item.discount || 0;
                                                                if (discountPercentage > 0) {
                                                                    unitPrice = originalPrice * (1 - discountPercentage / 100);
                                                                } else {
                                                                    unitPrice = originalPrice;
                                                                }
                                                            }
                                                        } else if (item.itemType === 'bundle') {
                                                            // For bundles
                                                            unitPrice = item.bundleId?.bundlePrice || item.bundleDetails?.bundlePrice || 0;
                                                            originalPrice = item.bundleId?.originalPrice || item.bundleDetails?.originalPrice || unitPrice;
                                                            
                                                            // Calculate discount percentage for display
                                                            if (originalPrice > unitPrice && originalPrice > 0) {
                                                                discountPercentage = ((originalPrice - unitPrice) / originalPrice) * 100;
                                                            }
                                                        }
                                                    }
                                                    
                                                    return {
                                                        unitPrice: unitPrice,
                                                        originalPrice: originalPrice,
                                                        discount: discountPercentage,
                                                        totalPrice: unitPrice * item.quantity
                                                    };
                                                };

                                                const getProductName = () => {
                                                    if (fullItem.productId && typeof fullItem.productId === 'object') {
                                                        return fullItem.productId.name || fullItem.productId.title;
                                                    }
                                                    if (fullItem.productDetails) {
                                                        return fullItem.productDetails.name || fullItem.productDetails.title;
                                                    }
                                                    if (fullItem.bundleId && typeof fullItem.bundleId === 'object') {
                                                        return fullItem.bundleId.title || fullItem.bundleId.name;
                                                    }
                                                    if (fullItem.bundleDetails) {
                                                        return fullItem.bundleDetails.title || fullItem.bundleDetails.name;
                                                    }
                                                    return 'Product Item';
                                                };

                                                const getProductImage = () => {
                                                    // Try multiple image sources
                                                    if (fullItem.productDetails?.image?.[0]) return fullItem.productDetails.image[0];
                                                    if (fullItem.productId?.image?.[0]) return fullItem.productId.image[0];
                                                    if (fullItem.bundleDetails?.image) return fullItem.bundleDetails.image;
                                                    if (fullItem.bundleId?.image) return fullItem.bundleId.image;
                                                    return null;
                                                };

                                                const pricingData = calculateItemPricingDetailed(fullItem, cancelItem);
                                                const hasDiscount = pricingData.discount > 0 && pricingData.originalPrice > pricingData.unitPrice;
                                                const isBundle = fullItem.itemType === 'bundle' || 
                                                               (fullItem.bundleId && typeof fullItem.bundleId === 'object') ||
                                                               (fullItem.bundleDetails && typeof fullItem.bundleDetails === 'object');

                                                return (
                                                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                                {getProductImage() ? (
                                                                    <img 
                                                                        src={getProductImage()} 
                                                                        alt={getProductName()}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-grow">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h4 className="font-semibold text-gray-900">{getProductName()}</h4>
                                                                    {isBundle && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            Bundle
                                                                        </span>
                                                                    )}
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        CANCELLED
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                                                    <div>
                                                                        <span className="text-gray-600">Quantity:</span>
                                                                        <span className="font-medium text-gray-800 ml-2">{fullItem.quantity}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Unit Price:</span>
                                                                        <span className="font-medium text-gray-800 ml-2">
                                                                            {hasDiscount ? (
                                                                                <span className="space-x-2">
                                                                                    <span className="line-through text-gray-500">₹{pricingData.originalPrice.toFixed(2)}</span>
                                                                                    <span className="text-green-600 font-semibold">₹{pricingData.unitPrice.toFixed(2)}</span>
                                                                                    <span className="text-xs text-white bg-green-500 px-2 py-1 rounded-full">
                                                                                        {pricingData.discount.toFixed(0)}% OFF
                                                                                    </span>
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-blue-600 font-semibold">₹{pricingData.unitPrice.toFixed(2)}</span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Item Total:</span>
                                                                        <span className="font-medium text-gray-800 ml-2">₹{pricingData.totalPrice.toFixed(2)}</span>
                                                                        {hasDiscount && (
                                                                            <div className="text-xs text-green-600 mt-1">
                                                                                Save ₹{((pricingData.originalPrice - pricingData.unitPrice) * fullItem.quantity).toFixed(2)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Size:</span>
                                                                        <span className="font-medium text-gray-800 ml-2">
                                                                            {fullItem.size ? (
                                                                                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-semibold">
                                                                                    {fullItem.size}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-500 text-xs">N/A</span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center text-gray-500">
                                            No items found for cancellation
                                        </div>
                                    )
                                ) : (
                                    // For full order cancellations, show all items
                                    selectedRequest.orderId?.items && selectedRequest.orderId.items.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedRequest.orderId.items.map((item, index) => {
                                                // Enhanced product name resolution
                                                const getProductName = () => {
                                                    if (item.productId && typeof item.productId === 'object') {
                                                        return item.productId.name || item.productId.title;
                                                    }
                                                    if (item.productDetails) {
                                                        return item.productDetails.name || item.productDetails.title;
                                                    }
                                                    if (item.bundleId && typeof item.bundleId === 'object') {
                                                        return item.bundleId.title || item.bundleId.name;
                                                    }
                                                    if (item.bundleDetails) {
                                                        return item.bundleDetails.title || item.bundleDetails.name;
                                                    }
                                                    return 'Product Item';
                                                };

                                                const getProductImage = () => {
                                                    // Try multiple image sources
                                                    if (item.productDetails?.image?.[0]) return item.productDetails.image[0];
                                                    if (item.productId?.image?.[0]) return item.productId.image[0];
                                                    if (item.bundleDetails?.image) return item.bundleDetails.image;
                                                    if (item.bundleId?.image) return item.bundleId.image;
                                                    return null;
                                                };

                                                const getUnitPrice = () => {
                                                    // Enhanced pricing calculation with discount support
                                                    if (item.itemType === 'product') {
                                                        // Try to get the actual unit price first
                                                        if (item.productDetails?.finalPrice) {
                                                            return item.productDetails.finalPrice;
                                                        } else if (item.productDetails?.sellingPrice) {
                                                            return item.productDetails.sellingPrice;
                                                        } else if (item.sizeAdjustedPrice) {
                                                            return item.sizeAdjustedPrice;
                                                        } else if (item.productId?.price) {
                                                            // Apply discount if available
                                                            const discount = item.productId.discount || item.discount || 0;
                                                            const basePrice = item.productId.price;
                                                            return discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
                                                        } else if (item.productDetails?.price) {
                                                            // Apply discount if available
                                                            const discount = item.productDetails.discount || item.discount || 0;
                                                            const basePrice = item.productDetails.price;
                                                            return discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
                                                        }
                                                    } else if (item.itemType === 'bundle') {
                                                        // For bundles, use bundle price
                                                        return item.bundleId?.bundlePrice || item.bundleDetails?.bundlePrice || 0;
                                                    }
                                                    
                                                    // Fallback to item total divided by quantity
                                                    return (item.itemTotal || 0) / (item.quantity || 1);
                                                };

                                                // Enhanced pricing details for display
                                                const getPricingDetails = () => {
                                                    let originalPrice = 0;
                                                    let finalPrice = getUnitPrice();
                                                    let discount = 0;
                                                    
                                                    if (item.itemType === 'product') {
                                                        originalPrice = item.productId?.price || item.productDetails?.price || finalPrice;
                                                        discount = item.productId?.discount || item.productDetails?.discount || item.discount || 0;
                                                        
                                                        // If we have explicit final price, calculate discount from difference
                                                        if ((item.productDetails?.finalPrice || item.productDetails?.sellingPrice) && originalPrice > finalPrice) {
                                                            discount = ((originalPrice - finalPrice) / originalPrice) * 100;
                                                        }
                                                    } else if (item.itemType === 'bundle') {
                                                        originalPrice = item.bundleId?.originalPrice || item.bundleDetails?.originalPrice || finalPrice;
                                                        if (originalPrice > finalPrice && originalPrice > 0) {
                                                            discount = ((originalPrice - finalPrice) / originalPrice) * 100;
                                                        }
                                                    }
                                                    
                                                    return {
                                                        originalPrice,
                                                        finalPrice,
                                                        discount,
                                                        hasDiscount: discount > 0 && originalPrice > finalPrice
                                                    };
                                                };

                                                // Enhanced bundle detection - check multiple sources
                                                const isBundle = item.itemType === 'bundle' || 
                                                               (item.bundleId && typeof item.bundleId === 'object') ||
                                                               (item.bundleDetails && typeof item.bundleDetails === 'object') ||
                                                               (item.type === 'Bundle') ||
                                                               (item.productType === 'bundle');

                                                return (
                                                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                                {getProductImage() ? (
                                                                    <img 
                                                                        src={getProductImage()} 
                                                                        alt={getProductName()}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-grow">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h4 className="font-semibold text-gray-900">{getProductName()}</h4>
                                                                    {isBundle && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            Bundle
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                                                    <div>
                                                                        <span className="text-gray-600">Quantity:</span>
                                                                        <span className="font-medium text-gray-800 ml-2">{item.quantity}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Unit Price:</span>
                                                                        <span className="font-medium text-gray-800 ml-2">
                                                                            {(() => {
                                                                                const pricingDetails = getPricingDetails();
                                                                                if (pricingDetails.hasDiscount) {
                                                                                    return (
                                                                                        <span className="space-x-2">
                                                                                            <span className="line-through text-gray-500">₹{pricingDetails.originalPrice.toFixed(2)}</span>
                                                                                            <span className="text-green-600 font-semibold">₹{pricingDetails.finalPrice.toFixed(2)}</span>
                                                                                            <span className="text-xs text-white bg-green-500 px-2 py-1 rounded-full">
                                                                                                {pricingDetails.discount.toFixed(0)}% OFF
                                                                                            </span>
                                                                                        </span>
                                                                                    );
                                                                                } else {
                                                                                    return <span className="text-blue-600 font-semibold">₹{pricingDetails.finalPrice.toFixed(2)}</span>;
                                                                                }
                                                                            })()}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Item Total:</span>
                                                                        <span className="font-medium text-gray-800 ml-2">₹{(getUnitPrice() * item.quantity).toFixed(2)}</span>
                                                                        {(() => {
                                                                            const pricingDetails = getPricingDetails();
                                                                            if (pricingDetails.hasDiscount) {
                                                                                const totalSavings = (pricingDetails.originalPrice - pricingDetails.finalPrice) * item.quantity;
                                                                                return (
                                                                                    <div className="text-xs text-green-600 mt-1">
                                                                                        Save ₹{totalSavings.toFixed(2)}
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Size:</span>
                                                                        <span className="font-medium text-gray-800 ml-2">
                                                                            {item.size ? (
                                                                                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-semibold">
                                                                                    {item.size}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-500 text-xs">N/A</span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Type:</span>
                                                                        <span className="font-medium text-gray-800 ml-2">{isBundle ? 'Bundle' : 'Product'}</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Bundle Items Display */}
                                                                {isBundle && (
                                                                    <div className="border-t pt-3 mt-3">
                                                                        {(() => {
                                                                            // Get bundle items from multiple possible sources
                                                                            let bundleItems = [];
                                                                            
                                                                            if (item.bundleDetails?.items) {
                                                                                bundleItems = item.bundleDetails.items;
                                                                            } else if (item.bundleId?.items) {
                                                                                bundleItems = item.bundleId.items;
                                                                            } else if (item.items) {
                                                                                bundleItems = item.items;
                                                                            }
                                                                            
                                                                            return bundleItems.length > 0 ? (
                                                                                <>
                                                                                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                                                        Bundle includes ({bundleItems.length} items):
                                                                                    </h5>
                                                                                    <div className="grid grid-cols-1 gap-3">
                                                                                        {bundleItems.map((bundleItem, bundleIndex) => (
                                                                                            <div key={bundleIndex} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                                                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-300">
                                                                                                    {bundleItem.image?.[0] || bundleItem.images?.[0] ? (
                                                                                                        <img 
                                                                                                            src={bundleItem.image?.[0] || bundleItem.images?.[0]}
                                                                                                            alt={bundleItem.name || bundleItem.title || 'Bundle Item'}
                                                                                                            className="w-full h-full object-cover"
                                                                                                            onError={(e) => {
                                                                                                                e.target.style.display = 'none';
                                                                                                            }}
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                                            </svg>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="flex-grow">
                                                                                                    <div className="text-sm font-medium text-gray-800 mb-1">
                                                                                                        {bundleItem.name || bundleItem.title || 'Bundle Item'}
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                                                                                        <span className="flex items-center gap-1">
                                                                                                            <span className="font-medium">Qty:</span>
                                                                                                            <span className="bg-white px-2 py-1 rounded border">{bundleItem.quantity || 1}</span>
                                                                                                        </span>
                                                                                                        <span className="flex items-center gap-1">
                                                                                                            <span className="font-medium">Price:</span>
                                                                                                            <span className="bg-white px-2 py-1 rounded border text-green-700 font-semibold">₹{(bundleItem.price || 0).toFixed(2)}</span>
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                                                                    <div className="flex items-start gap-2">
                                                                                        <span className="text-amber-600 mt-0.5">⚠️</span>
                                                                                        <div>
                                                                                            <p className="font-medium">Bundle items not available</p>
                                                                                            <p className="text-xs text-amber-600 mt-1">
                                                                                                Unable to load individual items for this bundle.
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        // Fallback for legacy order structure
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                    {selectedRequest.orderId?.productDetails?.image?.[0] ? (
                                                        <img 
                                                            src={selectedRequest.orderId.productDetails.image[0]} 
                                                            alt={selectedRequest.orderId.productDetails.name || 'Product'}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-grow">
                                                    <h4 className="font-semibold text-gray-900 mb-2">
                                                        {selectedRequest.orderId?.productDetails?.name || 
                                                         selectedRequest.orderId?.productDetails?.title || 
                                                         'Product Item'}
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Quantity:</span>
                                                            <span className="font-medium text-gray-800 ml-2">{selectedRequest.orderId?.orderQuantity || selectedRequest.orderId?.totalQuantity || 1}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Unit Price:</span>
                                                            <span className="font-medium text-gray-800 ml-2">
                                                                {(() => {
                                                                    // Calculate pricing with discount display
                                                                    const originalPrice = selectedRequest.orderId?.productDetails?.price || 0;
                                                                    const finalPrice = selectedRequest.orderId?.productDetails?.finalPrice || 
                                                                                     selectedRequest.orderId?.productDetails?.sellingPrice || 
                                                                                     originalPrice;
                                                                    const discount = selectedRequest.orderId?.productDetails?.discount || 0;
                                                                    
                                                                    // Check if there's a discount
                                                                    const hasDiscount = (discount > 0 && originalPrice > finalPrice) || 
                                                                                       (originalPrice > finalPrice && finalPrice > 0);
                                                                    
                                                                    if (hasDiscount) {
                                                                        const discountPercentage = originalPrice > 0 ? 
                                                                            ((originalPrice - finalPrice) / originalPrice) * 100 : 0;
                                                                        
                                                                        return (
                                                                            <span className="space-x-2">
                                                                                <span className="line-through text-gray-500">₹{originalPrice.toFixed(2)}</span>
                                                                                <span className="text-green-600 font-semibold">₹{finalPrice.toFixed(2)}</span>
                                                                                <span className="text-xs text-white bg-green-500 px-2 py-1 rounded-full">
                                                                                    {discountPercentage.toFixed(0)}% OFF
                                                                                </span>
                                                                            </span>
                                                                        );
                                                                    } else {
                                                                        return <span className="text-blue-600 font-semibold">₹{finalPrice.toFixed(2)}</span>;
                                                                    }
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Total:</span>
                                                            <span className="font-medium text-gray-800 ml-2">₹{(selectedRequest.orderId?.subTotalAmt || selectedRequest.orderId?.totalAmt || 0).toFixed(2)}</span>
                                                            {(() => {
                                                                // Show total savings if there's a discount
                                                                const originalPrice = selectedRequest.orderId?.productDetails?.price || 0;
                                                                const finalPrice = selectedRequest.orderId?.productDetails?.finalPrice || 
                                                                                 selectedRequest.orderId?.productDetails?.sellingPrice || 
                                                                                 originalPrice;
                                                                const quantity = selectedRequest.orderId?.orderQuantity || selectedRequest.orderId?.totalQuantity || 1;
                                                                const hasDiscount = originalPrice > finalPrice && finalPrice > 0;
                                                                
                                                                if (hasDiscount) {
                                                                    const totalSavings = (originalPrice - finalPrice) * quantity;
                                                                    return (
                                                                        <div className="text-xs text-green-600 mt-1">
                                                                            Save ₹{totalSavings.toFixed(2)}
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Type:</span>
                                                            <span className="font-medium text-gray-800 ml-2">Product</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Cancellation Reason */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 tracking-tight">Cancellation Reason</h3>
                            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="mb-4 pb-3 border-b border-gray-200">
                                    <span className="font-semibold text-gray-700 block mb-2">Primary Reason: </span>
                                    <span className="text-gray-800 bg-white py-2 px-3 rounded-lg block border border-gray-100 shadow-sm font-medium">
                                        {selectedRequest.reason}
                                    </span>
                                </div>
                                {selectedRequest.additionalReason && (
                                    <div>
                                        <span className="font-semibold text-gray-700 block mb-2">Additional Details: </span>
                                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-gray-800 whitespace-pre-wrap">
                                            {selectedRequest.additionalReason}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Refund Calculation */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 tracking-tight">Refund Information</h3>
                            <div className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                    <div className="bg-white p-4 sm:p-5 rounded-lg text-center shadow-sm border border-blue-100 hover:shadow transition-all duration-300 transform hover:-translate-y-0.5">
                                        <div className="text-sm font-medium text-gray-600 mb-2">
                                            {(() => {
                                                const orderItems = selectedRequest.orderId?.items || [];
                                                const cancelledItems = selectedRequest.itemsToCancel || [];
                                                const isEffectivelyFullCancellation = orderItems.length === 1 || 
                                                                                    (orderItems.length > 0 && cancelledItems.length === orderItems.length);
                                                
                                                if (selectedRequest.cancellationType === 'PARTIAL_ITEMS' && isEffectivelyFullCancellation) {
                                                    return 'Total Order Amount (Including Delivery)';
                                                } else if (selectedRequest.cancellationType === 'PARTIAL_ITEMS') {
                                                    return 'Cancelled Items Amount (With Discounts)';
                                                } else {
                                                    return selectedRequest.orderId?.deliveryCharge > 0 
                                                        ? 'Total Order Amount (Including Delivery)'
                                                        : 'Total Order Amount';
                                                }
                                            })()}
                                        </div>
                                        <div className="text-lg sm:text-2xl font-bold text-gray-800 tracking-tight">
                                            ₹{(() => {
                                                const orderItems = selectedRequest.orderId?.items || [];
                                                const cancelledItems = selectedRequest.itemsToCancel || [];
                                                const isEffectivelyFullCancellation = orderItems.length === 1 || 
                                                                                    (orderItems.length > 0 && cancelledItems.length === orderItems.length);
                                                
                                                if (selectedRequest.cancellationType === 'PARTIAL_ITEMS' && isEffectivelyFullCancellation) {
                                                    // For single item or all items cancelled, show total order amount with delivery noted
                                                    return (
                                                        <>
                                                            {selectedRequest.orderId?.totalAmt?.toFixed(2)}
                                                            {getDeliveryCharge(selectedRequest) > 0 && 
                                                                <span className="block text-xs text-blue-600 mt-1">(Includes delivery: ₹{getDeliveryCharge(selectedRequest).toFixed(2)})</span>
                                                            }
                                                        </>
                                                    );
                                                } else if (selectedRequest.cancellationType === 'PARTIAL_ITEMS') {
                                                    // For partial cancellation, show cancelled items total and note about proportional delivery charge
                                                    const itemsValue = selectedRequest.totalItemValue || calculatePartialCancellationTotal(selectedRequest);
                                                    const deliveryCharge = getDeliveryCharge(selectedRequest);
                                                    
                                                    return (
                                                        <>
                                                            {itemsValue?.toFixed(2)}
                                                            {deliveryCharge > 0 && 
                                                                <span className="block text-xs text-blue-600 mt-1">(+ proportional delivery charge)</span>
                                                            }
                                                        </>
                                                    );
                                                } else {
                                                    // For full cancellation, show total order amount
                                                    return selectedRequest.orderId?.totalAmt?.toFixed(2);
                                                }
                                            })()}
                                        </div>
                                        {(() => {
                                            // Use helper function to get delivery charge
                                            const deliveryCharge = getDeliveryCharge(selectedRequest);
                                            return (deliveryCharge > 0 && selectedRequest.cancellationType !== 'PARTIAL_ITEMS') ? (
                                                <div className="text-xs text-blue-600 mt-2">
                                                    (Items: ₹{(selectedRequest.orderId.totalAmt - deliveryCharge).toFixed(2)} + Delivery: ₹{deliveryCharge.toFixed(2)})
                                                </div>
                                            ) : null;
                                        })()}
                                        {(() => {
                                            const orderItems = selectedRequest.orderId?.items || [];
                                            const cancelledItems = selectedRequest.itemsToCancel || [];
                                            const isEffectivelyFullCancellation = orderItems.length === 1 || 
                                                                                (orderItems.length > 0 && cancelledItems.length === orderItems.length);
                                            
                                            if (selectedRequest.cancellationType === 'PARTIAL_ITEMS' && isEffectivelyFullCancellation) {
                                                return (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {orderItems.length === 1 ? 'Single item order - includes delivery' : 'All items cancelled - includes delivery'}
                                                    </div>
                                                );
                                            } else if (selectedRequest.cancellationType === 'PARTIAL_ITEMS') {
                                                return (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Only cancelled items total
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Including delivery charges
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                    <div className="bg-white p-4 sm:p-5 rounded-lg text-center shadow-sm border border-blue-100 hover:shadow transition-all duration-300 transform hover:-translate-y-0.5">
                                        <div className="text-sm font-medium text-gray-600 mb-2">Refund Percentage</div>
                                        <div className="text-lg sm:text-2xl font-bold text-blue-600 tracking-tight flex items-center justify-center">
                                            {(() => {
                                                // Get order date for debugging
                                                const orderDate = selectedRequest?.orderId?.orderDate || selectedRequest?.orderId?.createdAt;
                                                const currentTime = new Date();
                                                const hoursDifference = orderDate ? (currentTime - new Date(orderDate)) / (1000 * 60 * 60) : null;
                                                
                                                console.log("🕒 Date calculation debug:", {
                                                    currentTime: currentTime.toISOString(),
                                                    orderDate: orderDate,
                                                    orderDateParsed: orderDate ? new Date(orderDate).toISOString() : null,
                                                    hoursDifference: hoursDifference,
                                                    daysDifference: hoursDifference ? Math.floor(hoursDifference / 24) : null,
                                                    orderStatus: selectedRequest?.orderId?.orderStatus,
                                                    actualDeliveryDate: selectedRequest?.orderId?.actualDeliveryDate
                                                });
                                                
                                                // Use comprehensive refund percentage calculation for both partial and full cancellation
                                                // For pending requests, prioritize dynamic calculation over stored values
                                                const dynamicPercentage = getTimeBasedRefundPercentage(selectedRequest);
                                                const storedPercentage = selectedRequest?.pricingInformation?.refundPercentage || 
                                                    selectedRequest?.adminResponse?.refundPercentage || 
                                                    selectedRequest?.refundPercentage;
                                                
                                                console.log("🔢 Refund percentage debug:", {
                                                    status: selectedRequest?.status,
                                                    dynamicPercentage: dynamicPercentage,
                                                    storedPercentage: storedPercentage,
                                                    pricingInfoPercentage: selectedRequest?.pricingInformation?.refundPercentage,
                                                    adminResponsePercentage: selectedRequest?.adminResponse?.refundPercentage,
                                                    directRefundPercentage: selectedRequest?.refundPercentage,
                                                    finalPercentage: selectedRequest?.status === 'PENDING' ? dynamicPercentage : (storedPercentage || dynamicPercentage)
                                                });
                                                
                                                // For pending requests, use dynamic calculation to ensure real-time accuracy
                                                // For processed requests, prefer stored values to maintain consistency
                                                if (selectedRequest?.status === 'PENDING') {
                                                    console.log("🔄 Using dynamic percentage for pending request:", dynamicPercentage);
                                                    return dynamicPercentage;
                                                } else {
                                                    console.log("📋 Using stored percentage for processed request:", storedPercentage || dynamicPercentage);
                                                    return storedPercentage || dynamicPercentage;
                                                }
                                            })()}%
                                            {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8l3 5m0 0l3-5m-3 5v4" />
                                            </svg> */}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 sm:p-5 rounded-lg text-center shadow-sm border border-blue-100 hover:shadow transition-all duration-300 transform hover:-translate-y-0.5">
                                        <div className="text-sm font-medium text-gray-600 mb-2">Refund Amount</div>
                                        <div className="text-lg sm:text-2xl font-bold text-green-600 tracking-tight">
                                            ₹{(() => {
                                                const orderItems = selectedRequest.orderId?.items || [];
                                                const cancelledItems = selectedRequest.itemsToCancel || [];
                                                const isEffectivelyFullCancellation = orderItems.length === 1 || 
                                                                                    (orderItems.length > 0 && cancelledItems.length === orderItems.length);
                                                
                                                if (selectedRequest.cancellationType === 'PARTIAL_ITEMS' && isEffectivelyFullCancellation) {
                                                    // For single item or all items cancelled, use full order refund
                                                    return getFullOrderRefundAmount(selectedRequest)?.toFixed(2);
                                                } else if (selectedRequest.cancellationType === 'PARTIAL_ITEMS') {
                                                    // For partial cancellation, use partial refund
                                                    return getPartialCancellationRefundAmount(selectedRequest)?.toFixed(2);
                                                } else {
                                                    // For full cancellation, use full order refund
                                                    return getFullOrderRefundAmount(selectedRequest)?.toFixed(2);
                                                }
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Calculation Breakdown */}
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 7h6m0 10v-3m-3 3h.01M9 17h.01" />
                                        </svg>
                                        Refund Calculation Breakdown
                                    </h4>
                                    {selectedRequest.cancellationType === 'PARTIAL_ITEMS' ? (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center py-1">
                                                <span className="text-gray-600">Cancelled Items Total:</span>
                                                <span className="font-medium">₹{(selectedRequest.totalItemValue || calculatePartialCancellationTotal(selectedRequest))?.toFixed(2)}</span>
                                            </div>
                                            {(() => {
                                                // Check if this is effectively a full cancellation (all items cancelled)
                                                const orderItems = selectedRequest.orderId?.items || [];
                                                const cancelledItems = selectedRequest.itemsToCancel || [];
                                                const deliveryCharge = selectedRequest.orderId?.deliveryCharge || 0;
                                                
                                                // Always show delivery charge if it exists for partial cancellations
                                                // This covers single-item orders and when all items are being cancelled
                                                if (deliveryCharge > 0) {
                                                    const isEffectivelyFullCancellation = orderItems.length > 0 && cancelledItems.length === orderItems.length;
                                                    
                                                    return (
                                                        <div className="flex justify-between items-center py-1">
                                                            <span className="text-gray-600">
                                                                {isEffectivelyFullCancellation ? 'Delivery Charges (Full):' : 'Delivery Charges (Proportional):'}
                                                            </span>
                                                            <span className="font-medium">₹{deliveryCharge.toFixed(2)}</span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                            <div className="flex justify-between items-center py-1 border-t border-gray-200 pt-2">
                                                <span className="text-gray-600">Refund Percentage:</span>
                                                <span className="font-medium text-blue-600">
                                                    {(() => {
                                                        // Use consistent logic with main percentage display
                                                        const dynamicPercentage = getTimeBasedRefundPercentage(selectedRequest);
                                                        const storedPercentage = selectedRequest?.pricingInformation?.refundPercentage || 
                                                            selectedRequest?.adminResponse?.refundPercentage || 
                                                            selectedRequest?.refundPercentage;
                                                        
                                                        // For pending requests, use dynamic calculation to ensure real-time accuracy
                                                        if (selectedRequest?.status === 'PENDING') {
                                                            return dynamicPercentage;
                                                        } else {
                                                            return storedPercentage || dynamicPercentage;
                                                        }
                                                    })()}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded border-t-2 border-green-300">
                                                <span className="font-semibold text-gray-800">Final Refund Amount:</span>
                                                <span className="font-bold text-green-600 text-lg">₹{getPartialCancellationRefundAmount(selectedRequest)?.toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2 italic">
                                                {(() => {
                                                    const orderItems = selectedRequest.orderId?.items || [];
                                                    const cancelledItems = selectedRequest.itemsToCancel || [];
                                                    const isEffectivelyFullCancellation = orderItems.length > 0 && cancelledItems.length === orderItems.length;
                                                    const deliveryCharge = selectedRequest.orderId?.deliveryCharge || 0;
                                                    const itemsTotal = selectedRequest.totalItemValue || calculatePartialCancellationTotal(selectedRequest);
                                                    
                                                    // Use consistent priority logic
                                                    const dynamicPercentage = getTimeBasedRefundPercentage(selectedRequest);
                                                    const storedPercentage = selectedRequest?.pricingInformation?.refundPercentage || 
                                                        selectedRequest?.adminResponse?.refundPercentage || 
                                                        selectedRequest?.refundPercentage;
                                                    
                                                    const refundPct = selectedRequest?.status === 'PENDING' ? dynamicPercentage : (storedPercentage || dynamicPercentage);
                                                      
                                                    if (isEffectivelyFullCancellation && deliveryCharge > 0) {
                                                        const itemRefund = (itemsTotal * refundPct / 100).toFixed(2);
                                                        const deliveryRefund = (deliveryCharge * refundPct / 100).toFixed(2);
                                                        return `Calculation: (Items: ₹${itemsTotal?.toFixed(2)} × ${refundPct}% = ₹${itemRefund}) + (Delivery: ₹${deliveryCharge.toFixed(2)} × ${refundPct}% = ₹${deliveryRefund}) = Total Refund: ₹${getPartialCancellationRefundAmount(selectedRequest)?.toFixed(2)}`;
                                                    } else {
                                                        return `Calculation: ₹${itemsTotal?.toFixed(2)} × ${refundPct}% = ₹${getPartialCancellationRefundAmount(selectedRequest)?.toFixed(2)}`;
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center py-1">
                                                <span className="text-gray-600">Customer Paid Amount (Discounted):</span>
                                                <span className="font-medium">₹{calculateOrderDiscountedTotal(selectedRequest.orderId, selectedRequest)?.toFixed(2)}</span>
                                            </div>
                                            {selectedRequest.pricingInformation?.totalOriginalRetailPrice && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-gray-600 text-xs">• Original Retail Price:</span>
                                                    <span className="text-xs line-through text-gray-400">₹{selectedRequest.pricingInformation.totalOriginalRetailPrice?.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {selectedRequest.pricingInformation?.totalCustomerSavings && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-xs text-green-600">• Customer Savings:</span>
                                                    <span className="text-xs text-green-600">₹{selectedRequest.pricingInformation.totalCustomerSavings?.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center py-1">
                                                {(() => {
                                                    // Use our helper function to get delivery charge
                                                    const deliveryCharge = getDeliveryCharge(selectedRequest);
                                                    const hasDeliveryCharge = deliveryCharge > 0;
                                                    
                                                    return (
                                                        <>
                                                            <span className={`${hasDeliveryCharge ? "text-blue-600 font-medium" : "text-gray-600"} text-sm`}>
                                                                • Delivery Charges:
                                                            </span>
                                                            <span className={`${hasDeliveryCharge ? "text-blue-600 font-medium" : "text-gray-500"} text-sm`}>
                                                                ₹{deliveryCharge.toFixed(2)}
                                                            </span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex justify-between items-center py-1 border-t border-gray-200 pt-2">
                                                <span className="text-gray-600">Refund Percentage:</span>
                                                <span className="font-medium text-blue-600">
                                                    {(() => {
                                                        // Use consistent priority logic
                                                        const dynamicPercentage = getTimeBasedRefundPercentage(selectedRequest);
                                                        const storedPercentage = selectedRequest?.pricingInformation?.refundPercentage || 
                                                            selectedRequest?.adminResponse?.refundPercentage || 
                                                            selectedRequest?.refundPercentage;
                                                        
                                                        // For pending requests, use dynamic calculation to ensure real-time accuracy
                                                        if (selectedRequest?.status === 'PENDING') {
                                                            return dynamicPercentage;
                                                        } else {
                                                            return storedPercentage || dynamicPercentage;
                                                        }
                                                    })()}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded border-t-2 border-green-300">
                                                <span className="font-semibold text-gray-800">Final Refund Amount:</span>
                                                <span className="font-bold text-green-600 text-lg">₹{getFullOrderRefundAmount(selectedRequest)?.toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2 italic">
                                                {selectedRequest.pricingInformation?.note || 
                                                 "Refund calculated based on discounted prices customer actually paid (including delivery charges) and not original retail prices"}
                                            </div>
                                            {(() => {
                                                // Use our helper function to check for delivery charge
                                                const deliveryCharge = getDeliveryCharge(selectedRequest);
                                                return deliveryCharge > 0 ? (
                                                    <div className="text-xs text-blue-600 mt-1 font-medium">
                                                        💲 Delivery charge of ₹{deliveryCharge.toFixed(2)} is included in the refund calculation
                                                    </div>
                                                ) : null;
                                            })()}
                                            {/* Detailed Calculation */}
                                            <div className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                                                {(() => {
                                                    // Use consistent priority logic for detailed calculation
                                                    const dynamicPercentage = getTimeBasedRefundPercentage(selectedRequest);
                                                    const storedPercentage = selectedRequest?.pricingInformation?.refundPercentage || 
                                                        selectedRequest?.adminResponse?.refundPercentage || 
                                                        selectedRequest?.refundPercentage;
                                                    
                                                    const refundPct = selectedRequest?.status === 'PENDING' ? 
                                                        dynamicPercentage : (storedPercentage || dynamicPercentage);
                                                        
                                                    const itemsTotal = calculateOrderDiscountedTotal(selectedRequest.orderId, selectedRequest);
                                                    // Use our helper function to get delivery charge consistently
                                                    const deliveryCharge = getDeliveryCharge(selectedRequest);
                                                    const itemRefund = (itemsTotal * refundPct / 100).toFixed(2);
                                                    const deliveryRefund = deliveryCharge > 0 ? (deliveryCharge * refundPct / 100).toFixed(2) : 0;
                                                    const totalRefund = getFullOrderRefundAmount(selectedRequest)?.toFixed(2);
                                                    
                                                    if (deliveryCharge > 0) {
                                                        return `Detailed calculation: (Items: ₹${itemsTotal.toFixed(2)} × ${refundPct}% = ₹${itemRefund}) + (Delivery: ₹${deliveryCharge.toFixed(2)} × ${refundPct}% = ₹${deliveryRefund}) = Total Refund: ₹${totalRefund}`;
                                                    } else {
                                                        return `Detailed calculation: Items: ₹${itemsTotal.toFixed(2)} × ${refundPct}% = Total Refund: ₹${totalRefund}`;
                                                    }
                                                })()}
                                            </div>
                                            <div className="text-xs text-green-600 mt-1 font-medium">
                                                ✅ Fair refund: Based on actual amount paid by customer
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Delivery Context Information */}
                                {selectedRequest.orderId && (
                                    <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
                                        <h4 className="font-medium text-gray-700 mb-2">Delivery Context</h4>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            {(() => {
                                                const orderDate = new Date(selectedRequest.orderId.orderDate);
                                                const cancellationDate = new Date(selectedRequest.createdAt);
                                                const daysBetween = Math.floor((cancellationDate - orderDate) / (1000 * 60 * 60 * 24));
                                                
                                                let deliveryStatus = "No delivery date set";
                                                let statusColor = "text-gray-600";
                                                
                                                if (selectedRequest.orderId.actualDeliveryDate) {
                                                    const actualDelivery = new Date(selectedRequest.orderId.actualDeliveryDate);
                                                    const daysSinceDelivery = Math.floor((cancellationDate - actualDelivery) / (1000 * 60 * 60 * 24));
                                                    deliveryStatus = `Cancelled ${daysSinceDelivery} days after delivery`;
                                                    statusColor = "text-red-600 font-medium";
                                                } else if (selectedRequest.orderId.estimatedDeliveryDate) {
                                                    const estimatedDelivery = new Date(selectedRequest.orderId.estimatedDeliveryDate);
                                                    const isOverdue = new Date() > estimatedDelivery;
                                                    
                                                    if (isOverdue) {
                                                        deliveryStatus = "Cancelled after estimated delivery date (overdue)";
                                                        statusColor = "text-orange-600 font-medium";
                                                    } else {
                                                        deliveryStatus = "Cancelled before estimated delivery date";
                                                        statusColor = "text-green-600";
                                                    }
                                                }
                                                
                                                return (
                                                    <>
                                                        <div>• Cancellation requested {daysBetween} days after order placement</div>
                                                        <div className={statusColor}>• {deliveryStatus}</div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Response Section */}
                        {selectedRequest.status === 'PENDING' && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 tracking-tight">Admin Response</h3>
                                <div className="space-y-5">
                                    <div className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <FaInfo className="text-blue-500 flex-shrink-0 h-5 w-5" />
                                            <span className="font-semibold text-lg tracking-tight">
                                                Refund Policy: {(() => {
                                                    // Use consistent logic with main percentage display
                                                    const dynamicPercentage = getTimeBasedRefundPercentage(selectedRequest);
                                                    const storedPercentage = selectedRequest?.pricingInformation?.refundPercentage || 
                                                        selectedRequest?.adminResponse?.refundPercentage || 
                                                        selectedRequest?.refundPercentage;
                                                    
                                                    // For pending requests, use dynamic calculation
                                                    if (selectedRequest?.status === 'PENDING') {
                                                        return dynamicPercentage;
                                                    } else {
                                                        return storedPercentage || dynamicPercentage;
                                                    }
                                                })()}% of order amount will be refunded
                                            </span>
                                        </div>
                                        <p className="text-sm text-blue-600 mt-3 sm:ml-7 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                            Upon approval, the customer will receive a refund 
                                            {(() => {
                                                const orderItems = selectedRequest.orderId?.items || [];
                                                const cancelledItems = selectedRequest.itemsToCancel || [];
                                                const isEffectivelyFullCancellation = orderItems.length === 1 || 
                                                                                    (orderItems.length > 0 && cancelledItems.length === orderItems.length);
                                                
                                                if (selectedRequest.cancellationType === 'PARTIAL_ITEMS' && isEffectivelyFullCancellation) {
                                                    return (
                                                        <>
                                                            for the entire order including delivery charges 
                                                            <span className="font-semibold"> (₹{getFullOrderRefundAmount(selectedRequest)?.toFixed(2)})</span>
                                                            {orderItems.length === 1 && (
                                                                <span className="text-xs block mt-1 text-blue-500">
                                                                    * Single item order - treated as full cancellation
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                } else if (selectedRequest.cancellationType === 'PARTIAL_ITEMS') {
                                                    return (
                                                        <>
                                                            of the cancelled items amount 
                                                            <span className="font-semibold"> (₹{getPartialCancellationRefundAmount(selectedRequest)?.toFixed(2)})</span>
                                                        </>
                                                    );
                                                } else {
                                                    return (
                                                        <>
                                                            based on the discounted amount they actually paid 
                                                            <span className="font-semibold"> (₹{getFullOrderRefundAmount(selectedRequest)?.toFixed(2)})</span>
                                                        </>
                                                    );
                                                }
                                            })()}.
                                            This information will be sent to the customer's email automatically.
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <label className="block text-sm font-medium text-gray-700 mb-3 tracking-tight">
                                            Admin Notes (Optional)
                                        </label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all font-sans resize-y"
                                            rows="3"
                                            placeholder="Add any notes or comments for this decision..."
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                        <button
                                            onClick={() => handleProcessRequest(selectedRequest._id, 'APPROVED', adminNotes)}
                                            disabled={actionLoading}
                                            className="flex-1 bg-green-600 text-white py-3 px-5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2 font-medium tracking-wide"
                                        >
                                            <FaCheck className="h-4 w-4" />
                                            {actionLoading ? 'Processing...' : 'Approve Cancellation'}
                                        </button>
                                        <button
                                            onClick={() => handleProcessRequest(selectedRequest._id, 'REJECTED', adminNotes)}
                                            disabled={actionLoading}
                                            className="flex-1 bg-red-600 text-white py-3 px-5 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2 font-medium tracking-wide"
                                        >
                                            <FaTimes className="h-4 w-4" />
                                            {actionLoading ? 'Processing...' : 'Reject Cancellation'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Previous Admin Response */}
                        {selectedRequest.adminResponse && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 tracking-tight">Admin Response</h3>
                                <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="mb-3 flex flex-wrap justify-between items-center">
                                        <span className="font-semibold text-gray-700">Decision: </span>
                                        <span className={getStatusBadge(selectedRequest.status) + " ml-2"}>
                                            {selectedRequest.status}
                                        </span>
                                    </div>
                                    <div className="mb-3 flex flex-wrap justify-between items-center">
                                        <span className="font-semibold text-gray-700">Response Date: </span>
                                        <span className="text-gray-800 font-medium">
                                            {selectedRequest.adminResponse?.respondedAt 
                                                ? formatDate(selectedRequest.adminResponse.respondedAt)
                                                : selectedRequest.adminResponse?.createdAt 
                                                    ? formatDate(selectedRequest.adminResponse.createdAt)
                                                    : selectedRequest.updatedAt 
                                                        ? formatDate(selectedRequest.updatedAt)
                                                        : 'Invalid Date'}
                                        </span>
                                    </div>
                                    <div className="mb-3 flex flex-wrap justify-between items-center">
                                        <span className="font-semibold text-gray-700">Refund Percentage: </span>
                                        <span className="text-blue-600 font-semibold">
                                            {(() => {
                                                // For processed requests, prefer stored values to maintain consistency
                                                const storedPercentage = selectedRequest?.pricingInformation?.refundPercentage || 
                                                    selectedRequest?.adminResponse?.refundPercentage || 
                                                    selectedRequest?.refundPercentage;
                                                
                                                // Only fallback to dynamic calculation if no stored value exists
                                                return storedPercentage || getTimeBasedRefundPercentage(selectedRequest);
                                            })()}%
                                        </span>
                                    </div>
                                    {selectedRequest.status === 'APPROVED' && (
                                        <div className="mb-3 flex flex-wrap justify-between items-center">
                                            <span className="font-semibold text-gray-700">Email Sent: </span>
                                            <span className="text-green-600 font-medium">Refund information sent to customer</span>
                                        </div>
                                    )}
                                    {selectedRequest.adminResponse.notes && (
                                        <div className="border-t border-gray-200 pt-3 mt-3">
                                            <span className="font-semibold text-gray-700 block mb-1">Admin Notes: </span>
                                            <span className="text-gray-800 bg-white p-3 rounded-lg block border border-gray-100 shadow-sm">
                                                {selectedRequest.adminResponse.notes}
                                            </span>
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
        <div className="p-4 sm:p-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight relative">
                        Cancellation Management
                        <span className="absolute bottom-0 left-0 h-1 w-12 bg-blue-600 rounded-full"></span>
                    </h1>
                    <p className="text-gray-600 mt-2 tracking-wide hidden sm:block">Manage customer order cancellation requests</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full shadow-sm hover:shadow-md transition-shadow duration-300 font-sans"
                        />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <FaFilter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white w-full shadow-sm hover:shadow-md transition-shadow duration-300 font-sans"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="PROCESSED">Processed</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                <div className="bg-yellow-50 p-4 md:p-5 rounded-xl border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-600 text-sm font-medium tracking-wide">Pending</p>
                            <p className="text-2xl font-bold text-yellow-800 mt-1">
                                {Array.isArray(cancellationRequests) ? cancellationRequests.filter(r => r.status === 'PENDING').length : 0}
                            </p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <FaClock className="text-yellow-600 text-xl" />
                        </div>
                    </div>
                </div>
                <div className="bg-green-50 p-4 md:p-5 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium tracking-wide">Approved</p>
                            <p className="text-2xl font-bold text-green-800 mt-1">
                                {Array.isArray(cancellationRequests) ? cancellationRequests.filter(r => r.status === 'APPROVED').length : 0}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <FaCheck className="text-green-600 text-xl" />
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 p-4 md:p-5 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-600 text-sm font-medium tracking-wide">Rejected</p>
                            <p className="text-2xl font-bold text-red-800 mt-1">
                                {Array.isArray(cancellationRequests) ? cancellationRequests.filter(r => r.status === 'REJECTED').length : 0}
                            </p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full">
                            <FaTimes className="text-red-600 text-xl" />
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 p-4 md:p-5 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium tracking-wide">Processed</p>
                            <p className="text-2xl font-bold text-blue-800 mt-1">
                                {Array.isArray(cancellationRequests) ? cancellationRequests.filter(r => r.status === 'PROCESSED').length : 0}
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <FaRupeeSign className="text-blue-600 text-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <FaClock className="hidden sm:block text-blue-500" />
                                        Request Details
                                    </div>
                                </th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                                    <div className="flex items-center gap-2">
                                        <FaInfo className="hidden sm:block text-blue-500" />
                                        Type
                                    </div>
                                </th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                                    <div className="flex items-center gap-2">
                                        <FaUser className="hidden sm:block text-blue-500" />
                                        Customer
                                    </div>
                                </th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="hidden sm:block text-blue-500" />
                                        Order Info
                                    </div>
                                </th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                                    <div className="flex items-center gap-2">
                                        <FaRupeeSign className="hidden sm:block text-blue-500" />
                                        Refund Amount
                                    </div>
                                </th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <div className="hidden sm:flex h-4 w-4 rounded-full bg-yellow-100 border border-yellow-300"></div>
                                        Status
                                    </div>
                                </th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <FaEye className="hidden sm:block text-blue-500" />
                                        Actions
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center">
                                        <div className="flex flex-col justify-center items-center gap-2">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 shadow-md"></div>
                                            <p className="text-blue-600 font-medium tracking-wide mt-2">Loading requests...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-gray-600 font-medium tracking-wide">No cancellation requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request) => (
                                    <tr key={request._id} className="hover:bg-blue-50/30 transition-colors duration-200 border-b border-gray-100 group">
                                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 tracking-wide group-hover:text-blue-700 transition-colors duration-200">
                                                    #{request._id.slice(-8)}
                                                </div>
                                                <div className={`text-sm ${getPriorityColor(request.createdAt)} mt-1 flex items-center gap-1.5`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {formatDate(request.createdAt)}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1.5 line-clamp-1 md:hidden font-medium">
                                                    {request.userId?.name}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 bg-gray-50 px-1.5 py-0.5 rounded line-clamp-1 group-hover:bg-blue-50 transition-colors duration-200">
                                                    {request.reason}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-5 hidden lg:table-cell">
                                            <div className="flex items-center">
                                                {request.cancellationType === 'PARTIAL_ITEMS' ? (
                                                    <div className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-xs font-medium border border-orange-200">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                            Partial Items
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                            Full Order
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-5 hidden md:table-cell">
                                            <div className="flex items-center">
                                                <div className="hidden sm:flex h-9 w-9 rounded-full bg-blue-100 text-blue-600 items-center justify-center font-bold mr-3 border border-blue-200">
                                                    {request.userId?.name?.charAt(0)?.toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 tracking-wide group-hover:text-blue-700 transition-colors duration-200">
                                                        {request.userId?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="truncate max-w-[150px]">{request.userId?.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 tracking-wide group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                    </svg>
                                                    #{request.orderId?.orderId}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1 font-medium flex items-center gap-1.5">
                                                    <FaRupeeSign className="text-xs" />
                                                    {request.orderId?.totalAmt?.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1.5 bg-gray-50 px-1.5 py-0.5 rounded inline-block group-hover:bg-blue-50 transition-colors duration-200">
                                                    {request.orderId?.orderStatus}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-5 hidden sm:table-cell">
                                            <div className="bg-green-50 py-1.5 px-3 rounded-lg border border-green-100 shadow-sm inline-block">
                                                <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1">
                                                    <FaRupeeSign className="text-xs" />
                                                    {request.cancellationType === 'PARTIAL_ITEMS' 
                                                        ? getPartialCancellationRefundAmount(request)?.toFixed(2)
                                                        : getFullOrderRefundAmount(request)?.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01" />
                                                </svg>
                                                {(() => {
                                                    // Use consistent priority logic for table display
                                                    const dynamicPercentage = getTimeBasedRefundPercentage(request);
                                                    const storedPercentage = request?.pricingInformation?.refundPercentage || 
                                                        request?.adminResponse?.refundPercentage || 
                                                        request?.refundPercentage;
                                                    
                                                    // For pending requests, use dynamic calculation; for processed, use stored
                                                    if (request?.status === 'PENDING') {
                                                        return dynamicPercentage;
                                                    } else {
                                                        return storedPercentage || dynamicPercentage;
                                                    }
                                                })()}% refund
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={getStatusBadge(request.status)}>
                                                    {request.status}
                                                </span>
                                                {request.status === 'PENDING' && (
                                                    <span className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Needs action
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    console.log('🔍 Selected cancellation request:', request);
                                                    console.log('📊 Pricing information:', request.pricingInformation);
                                                    console.log('📦 Items to cancel:', request.itemsToCancel);
                                                    setSelectedRequest(request)
                                                    setShowDetailsModal(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors shadow-sm hover:shadow-md hover:-translate-y-0.5 transform duration-200"
                                            >
                                                <FaEye className="h-4 w-4" />
                                                <span className="hidden sm:inline">View Details</span>
                                                <span className="sm:hidden">View</span>
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
