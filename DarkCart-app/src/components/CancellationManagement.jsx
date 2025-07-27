import React, { useState, useEffect } from 'react'
import { FaEye, FaCheck, FaTimes, FaSearch, FaFilter, FaRupeeSign, FaClock, FaUser, FaCalendarAlt, FaInfo } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi, { baseURL } from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'

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

    const handleProcessRequest = async (requestId, action, adminComments = '', refundPercentage = 75) => {
        setActionLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            
            // Determine if this is a partial cancellation or full order cancellation
            const isPartialCancellation = selectedRequest?.cancellationType === 'PARTIAL_ITEMS';
            
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
                        refundPercentage
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
                        customRefundPercentage: refundPercentage
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
                        refundAmount = response.data.data?.refundAmount || 0;
                    } else {
                        refundAmount = (selectedRequest.orderId.totalAmt * refundPercentage / 100).toFixed(2);
                    }
                    
                    // Create notification
                    const notification = {
                        id: `cancel-${orderId}-${Date.now()}`,
                        type: 'refund',
                        title: `Refund Processed for Order #${orderNumber}`,
                        message: isPartialCancellation 
                            ? `Your partial cancellation request has been approved. A refund of ₹${refundAmount} for selected items will be processed to your original payment method within 5-7 business days.`
                            : `Your cancellation request has been approved. A refund of ₹${refundAmount} (${refundPercentage}% of order amount) will be processed to your original payment method within 5-7 business days.`,
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
                    toast.success(`Refund amount: ₹${refundAmount} (75% of total)`, {
                        duration: 5000,
                        style: {
                            background: '#F0FFF4',
                            color: '#22543D',
                            fontWeight: 'bold',
                            border: '1px solid #C6F6D5'
                        },
                        icon: '💰'
                    });
                    
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
                                    refundPercentage: 75,
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
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                            <span className="font-semibold text-orange-700 text-lg">Partial Item Cancellation</span>
                                        </div>
                                        <p className="text-gray-700 mb-3">
                                            The customer requested to cancel specific items from their order:
                                        </p>
                                        {selectedRequest.itemsToCancel && selectedRequest.itemsToCancel.length > 0 && (
                                            <div className="bg-white p-3 rounded-lg border border-orange-200">
                                                <h4 className="font-medium text-gray-900 mb-2">Items to Cancel:</h4>
                                                <ul className="space-y-2">
                                                    {selectedRequest.itemsToCancel.map((cancelItem, index) => {
                                                        // Find the full item details from the order
                                                        const fullItem = selectedRequest.orderId?.items?.find(
                                                            orderItem => orderItem._id?.toString() === cancelItem.itemId?.toString()
                                                        );
                                                        
                                                        const itemName = fullItem?.productDetails?.name || 
                                                                       fullItem?.bundleDetails?.title || 
                                                                       'Unknown Item';
                                                        
                                                        return (
                                                            <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                                <span className="font-medium text-gray-800">
                                                                    {itemName}
                                                                    {cancelItem.size && ` (Size: ${cancelItem.size})`}
                                                                    {cancelItem.quantity && ` - Qty: ${cancelItem.quantity}`}
                                                                </span>
                                                                <span className="font-semibold text-orange-600">
                                                                    ₹{cancelItem.refundAmount || cancelItem.itemTotal || 0}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                                <div className="mt-3 pt-2 border-t border-orange-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold text-gray-800">Total Expected Refund:</span>
                                                        <span className="font-bold text-orange-600 text-lg">
                                                            ₹{selectedRequest.itemsToCancel.reduce((sum, item) => 
                                                                sum + (item.refundAmount || item.itemTotal || 0), 0
                                                            )}
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
                                {selectedRequest.cancellationType === 'PARTIAL_ITEMS' ? 'All Items in Order' : 'Product Details'}
                            </h3>
                            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                {selectedRequest.orderId?.items && selectedRequest.orderId.items.length > 0 ? (
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
                                                // Try all possible image sources in order of preference
                                                let imageUrl = null;
                                                
                                                // First try bundleId (most specific for bundles)
                                                if (item.bundleId && typeof item.bundleId === 'object') {
                                                    // Check if image is a string (URL) or array
                                                    if (typeof item.bundleId.image === 'string') {
                                                        imageUrl = item.bundleId.image;
                                                    } else if (Array.isArray(item.bundleId.image) && item.bundleId.image.length > 0) {
                                                        imageUrl = item.bundleId.image[0];
                                                    } else if (Array.isArray(item.bundleId.images) && item.bundleId.images.length > 0) {
                                                        imageUrl = item.bundleId.images[0];
                                                    } else if (item.bundleId.bundleImage) {
                                                        imageUrl = item.bundleId.bundleImage;
                                                    }
                                                    
                                                    if (imageUrl) {
                                                        return imageUrl;
                                                    }
                                                    
                                                    // Try to get image from first bundle item if main bundle doesn't have image
                                                    if (item.bundleId.items && item.bundleId.items.length > 0) {
                                                        const firstItem = item.bundleId.items[0];
                                                        imageUrl = firstItem.images?.[0] || firstItem.image?.[0];
                                                        if (imageUrl) {
                                                            return imageUrl;
                                                        }
                                                    }
                                                }
                                                
                                                // Then try bundleDetails
                                                if (item.bundleDetails) {
                                                    // Check if image is a string (URL) or array
                                                    if (typeof item.bundleDetails.image === 'string') {
                                                        imageUrl = item.bundleDetails.image;
                                                    } else if (Array.isArray(item.bundleDetails.image) && item.bundleDetails.image.length > 0) {
                                                        imageUrl = item.bundleDetails.image[0];
                                                    } else if (Array.isArray(item.bundleDetails.images) && item.bundleDetails.images.length > 0) {
                                                        imageUrl = item.bundleDetails.images[0];
                                                    } else if (item.bundleDetails.bundleImage) {
                                                        imageUrl = item.bundleDetails.bundleImage;
                                                    }
                                                    
                                                    if (imageUrl) {
                                                        return imageUrl;
                                                    }
                                                    
                                                    // Try to get image from first bundle item if main bundle doesn't have image
                                                    if (item.bundleDetails.items && item.bundleDetails.items.length > 0) {
                                                        const firstItem = item.bundleDetails.items[0];
                                                        imageUrl = firstItem.images?.[0] || firstItem.image?.[0];
                                                        if (imageUrl) {
                                                            return imageUrl;
                                                        }
                                                    }
                                                }
                                                
                                                // Then try productId
                                                if (item.productId && typeof item.productId === 'object') {
                                                    // Check if image is a string (URL) or array
                                                    if (typeof item.productId.image === 'string') {
                                                        imageUrl = item.productId.image;
                                                    } else if (Array.isArray(item.productId.image) && item.productId.image.length > 0) {
                                                        imageUrl = item.productId.image[0];
                                                    } else if (Array.isArray(item.productId.images) && item.productId.images.length > 0) {
                                                        imageUrl = item.productId.images[0];
                                                    }
                                                    
                                                    if (imageUrl) {
                                                        return imageUrl;
                                                    }
                                                }
                                                
                                                // Finally try productDetails
                                                if (item.productDetails) {
                                                    // Check if image is a string (URL) or array
                                                    if (typeof item.productDetails.image === 'string') {
                                                        imageUrl = item.productDetails.image;
                                                    } else if (Array.isArray(item.productDetails.image) && item.productDetails.image.length > 0) {
                                                        imageUrl = item.productDetails.image[0];
                                                    } else if (Array.isArray(item.productDetails.images) && item.productDetails.images.length > 0) {
                                                        imageUrl = item.productDetails.images[0];
                                                    }
                                                    
                                                    if (imageUrl) {
                                                        return imageUrl;
                                                    }
                                                }
                                                
                                                return null;
                                            };

                                            const getUnitPrice = () => {
                                                // For your requirement: unit price should equal total price
                                                return item.itemTotal || 0;
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
                                                                        e.target.parentElement.innerHTML = `
                                                                            <div class="w-full h-full flex items-center justify-center">
                                                                                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                                </svg>
                                                                            </div>
                                                                        `;
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
                                                                    <span className="font-medium text-gray-800 ml-2">₹{getUnitPrice().toFixed(2)}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-600">Item Total:</span>
                                                                    <span className="font-medium text-gray-800 ml-2">₹{getUnitPrice().toFixed(2)}</span>
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
                                                            
                                                            {/* Enhanced Bundle Items Display */}
                                                            {isBundle && (() => {
                                                                const BundleItemsDisplay = ({ item }) => {
                                                                    const [bundleItems, setBundleItems] = useState([]);
                                                                    const [loadingBundle, setLoadingBundle] = useState(false);
                                                                    const [bundleMainImage, setBundleMainImage] = useState(null);
                                                                    
                                                                    useEffect(() => {
                                                                        const loadBundleItems = async () => {
                                                                            setLoadingBundle(true);
                                                                            
                                                                            console.log('=== ENHANCED BUNDLE ITEMS LOADING ===');
                                                                            console.log('Item data:', item);
                                                                            
                                                                            // Get bundle main image for fallback
                                                                            let mainImage = null;
                                                                            if (item.bundleId?.image) {
                                                                                mainImage = Array.isArray(item.bundleId.image) ? item.bundleId.image[0] : item.bundleId.image;
                                                                            } else if (item.bundleId?.images && item.bundleId.images.length > 0) {
                                                                                mainImage = item.bundleId.images[0];
                                                                            } else if (item.bundleDetails?.image) {
                                                                                mainImage = Array.isArray(item.bundleDetails.image) ? item.bundleDetails.image[0] : item.bundleDetails.image;
                                                                            } else if (item.bundleDetails?.images && item.bundleDetails.images.length > 0) {
                                                                                mainImage = item.bundleDetails.images[0];
                                                                            }
                                                                            setBundleMainImage(mainImage);
                                                                            console.log('Bundle main image for fallback:', mainImage);
                                                                            
                                                                            // First try to get items from existing data
                                                                            let items = [];
                                                                            
                                                                            // Check existing bundle data structure
                                                                            if (item.bundleDetails?.items) {
                                                                                console.log('Found items in bundleDetails.items:', item.bundleDetails.items);
                                                                                items = item.bundleDetails.items;
                                                                            } else if (item.bundleId?.items) {
                                                                                console.log('Found items in bundleId.items:', item.bundleId.items);
                                                                                items = item.bundleId.items;
                                                                            } else if (item.items) {
                                                                                console.log('Found items in item.items:', item.items);
                                                                                items = item.items;
                                                                            }
                                                                            
                                                                            // If no items found locally, check cache or fetch from API
                                                                            if (items.length === 0) {
                                                                                const bundleId = getBundleId(item);
                                                                                console.log('No items found locally, checking cache/API with bundleId:', bundleId);
                                                                                
                                                                                if (bundleId) {
                                                                                    // Check cache first
                                                                                    if (bundleItemsCache[bundleId]) {
                                                                                        console.log('Found items in cache:', bundleItemsCache[bundleId]);
                                                                                        items = bundleItemsCache[bundleId].items || [];
                                                                                    } else {
                                                                                        // Fetch from API
                                                                                        const bundleData = await fetchBundleDetails(bundleId);
                                                                                        console.log('Fetched bundle data from API:', bundleData);
                                                                                        if (bundleData?.items) {
                                                                                            console.log('Found items in API response:', bundleData.items);
                                                                                            items = bundleData.items;
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                            
                                                                            console.log('Final items to display:', items);
                                                                            setBundleItems(items || []);
                                                                            setLoadingBundle(false);
                                                                        };
                                                                        
                                                                        loadBundleItems();
                                                                    }, [item]);
                                                                    
                                                                    if (loadingBundle || fetchingBundles) {
                                                                        return (
                                                                            <div className="border-t pt-3 mt-3">
                                                                                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                                                                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                                                                    Loading bundle items...
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    
                                                                    return (
                                                                        <div className="border-t pt-3 mt-3">
                                                                            {bundleItems.length > 0 ? (
                                                                                <>
                                                                                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                                                        Bundle includes ({bundleItems.length} items):
                                                                                    </h5>
                                                                                    <div className="grid grid-cols-1 gap-3">
                                                                                        {bundleItems.map((bundleItem, bundleIndex) => {
                                                                                            // Enhanced image resolution for bundle items
                                                                                            const getBundleItemImage = (item) => {
                                                                                                console.log('Bundle item image debug:', item);
                                                                                                
                                                                                                // Try all possible image sources
                                                                                                let imageUrl = null;
                                                                                                
                                                                                                // Check bundle item image (string field as per schema)
                                                                                                if (typeof item.image === 'string' && item.image.trim() !== '') {
                                                                                                    imageUrl = item.image;
                                                                                                    console.log('Found image in item.image (string):', imageUrl);
                                                                                                }
                                                                                                // Check image as array
                                                                                                else if (Array.isArray(item.image) && item.image.length > 0) {
                                                                                                    imageUrl = item.image[0]?.url || item.image[0];
                                                                                                    console.log('Found image in item.image (array):', imageUrl);
                                                                                                }
                                                                                                // Check images array
                                                                                                else if (Array.isArray(item.images) && item.images.length > 0) {
                                                                                                    imageUrl = item.images[0]?.url || item.images[0];
                                                                                                    console.log('Found image in item.images:', imageUrl);
                                                                                                }
                                                                                                // Check productId.image (if populated)
                                                                                                else if (item.productId && typeof item.productId === 'object') {
                                                                                                    if (Array.isArray(item.productId.image) && item.productId.image.length > 0) {
                                                                                                        imageUrl = item.productId.image[0]?.url || item.productId.image[0];
                                                                                                        console.log('Found image in productId.image (array):', imageUrl);
                                                                                                    } else if (typeof item.productId.image === 'string') {
                                                                                                        imageUrl = item.productId.image;
                                                                                                        console.log('Found image in productId.image (string):', imageUrl);
                                                                                                    } else if (Array.isArray(item.productId.images) && item.productId.images.length > 0) {
                                                                                                        imageUrl = item.productId.images[0]?.url || item.productId.images[0];
                                                                                                        console.log('Found image in productId.images:', imageUrl);
                                                                                                    }
                                                                                                }
                                                                                                
                                                                                                // Fallback to bundle main image if no item-specific image
                                                                                                if (!imageUrl && bundleMainImage) {
                                                                                                    imageUrl = bundleMainImage;
                                                                                                    console.log('Using bundle main image as fallback:', imageUrl);
                                                                                                }
                                                                                                
                                                                                                // If we have an image URL, make sure it's absolute
                                                                                                if (imageUrl) {
                                                                                                    // If it's a relative URL, prepend the base URL
                                                                                                    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
                                                                                                        const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
                                                                                                        imageUrl = `${baseURL}${cleanImageUrl}`;
                                                                                                    }
                                                                                                }
                                                                                                
                                                                                                console.log('Final image URL:', imageUrl);
                                                                                                return imageUrl;
                                                                                            };
                                                                                            
                                                                                            const itemImage = getBundleItemImage(bundleItem);
                                                                                            
                                                                                            return (
                                                                                            <div key={bundleIndex} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                                                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-300">
                                                                                                    {itemImage ? (
                                                                                                        <img 
                                                                                                            src={itemImage}
                                                                                                            alt={bundleItem.name || bundleItem.title || 'Bundle Item'}
                                                                                                            className="w-full h-full object-cover"
                                                                                                            onError={(e) => {
                                                                                                                console.error('Image failed to load:', itemImage);
                                                                                                                e.target.style.display = 'none';
                                                                                                                e.target.parentElement.innerHTML = `
                                                                                                                    <div class="w-full h-full flex items-center justify-center">
                                                                                                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                                                        </svg>
                                                                                                                    </div>
                                                                                                                `;
                                                                                                            }}
                                                                                                            onLoad={() => {
                                                                                                                console.log('Image loaded successfully:', itemImage);
                                                                                                            }}
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                                                            );
                                                                                        })}
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
                                                                            )}
                                                                        </div>
                                                                    );
                                                                };
                                                                
                                                                return <BundleItemsDisplay item={item} />;
                                                            })()}
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
                                                        <span className="font-medium text-gray-800 ml-2">₹{(selectedRequest.orderId?.productDetails?.price || selectedRequest.orderId?.subTotalAmt || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Total:</span>
                                                        <span className="font-medium text-gray-800 ml-2">₹{(selectedRequest.orderId?.subTotalAmt || selectedRequest.orderId?.totalAmt || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Type:</span>
                                                        <span className="font-medium text-gray-800 ml-2">Product</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                                        <div className="text-sm font-medium text-gray-600 mb-2">Original Amount</div>
                                        <div className="text-lg sm:text-2xl font-bold text-gray-800 tracking-tight">₹{selectedRequest.orderId?.totalAmt?.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-white p-4 sm:p-5 rounded-lg text-center shadow-sm border border-blue-100 hover:shadow transition-all duration-300 transform hover:-translate-y-0.5">
                                        <div className="text-sm font-medium text-gray-600 mb-2">Refund Percentage</div>
                                        <div className="text-lg sm:text-2xl font-bold text-blue-600 tracking-tight flex items-center justify-center">
                                            75%
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8l3 5m0 0l3-5m-3 5v4" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 sm:p-5 rounded-lg text-center shadow-sm border border-blue-100 hover:shadow transition-all duration-300 transform hover:-translate-y-0.5">
                                        <div className="text-sm font-medium text-gray-600 mb-2">Refund Amount</div>
                                        <div className="text-lg sm:text-2xl font-bold text-green-600 tracking-tight">₹{(selectedRequest.orderId?.totalAmt * 0.75)?.toFixed(2)}</div>
                                    </div>
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
                                            <span className="font-semibold text-lg tracking-tight">Refund Policy: 75% of order amount will be refunded</span>
                                        </div>
                                        <p className="text-sm text-blue-600 mt-3 sm:ml-7 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                            Upon approval, the customer will receive a 75% refund of the total order amount 
                                            <span className="font-semibold"> (₹{(selectedRequest.orderId?.totalAmt * 0.75)?.toFixed(2)})</span>.
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
                                        <span className="text-blue-600 font-semibold">75%</span>
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
                                                    {(request.orderId?.totalAmt * 0.75)?.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01" />
                                                </svg>
                                                75% refund
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
