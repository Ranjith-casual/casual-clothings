import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaSearch, FaFilter, FaCheck, FaSpinner, FaTimes, FaMoneyBillWave, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi, { baseURL } from '../common/SummaryApi';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import noCart from '../assets/Empty-cuate.png'; // Import fallback image

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
    const [bundleItemsCache, setBundleItemsCache] = useState({}); // Cache for bundle items
    const [fetchingBundles, setFetchingBundles] = useState(false); // Track bundle fetching state

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

            if (response.data && response.data.success) {
                console.log("Full response data:", response.data);
                const refundsData = response.data.data.refunds || [];
                setRefunds(refundsData);
                setCurrentPage(response.data.data.currentPage || 1);
                setTotalPages(response.data.data.totalPages || 1);
                
                // Auto-fetch bundle items for all bundles in the refunds if there are any
                if (refundsData && refundsData.length > 0) {
                    await fetchBundleItemsForRefunds(refundsData);
                    
                    // Log detailed information about the first refund for debugging
                    const firstRefund = refundsData[0];
                    console.log("Sample refund data:", firstRefund);
                    
                    if (firstRefund?.orderId) {
                        console.log("Order data:", firstRefund.orderId);
                        
                        // Log product/bundle data if available
                        if (firstRefund.orderId.items && firstRefund.orderId.items.length > 0) {
                            console.log("First order item:", firstRefund.orderId.items[0]);
                            const firstItem = firstRefund.orderId.items[0];
                            if (firstItem.itemType === 'product') {
                                console.log("Product data:", firstItem.productId);
                                console.log("Product details:", firstItem.productDetails);
                            } else if (firstItem.bundleId) {
                                console.log("Bundle data:", firstItem.bundleId);
                                console.log("Bundle details:", firstItem.bundleDetails);
                            }
                        }
                    }
                } else {
                    console.log("No refunds data returned or empty array");
                }
            } else {
                toast.error(response.data?.message || "Failed to fetch refunds");
            }
        } catch (error) {
            console.error("Error fetching refunds:", error);
            // Show a more user-friendly error message
            if (error.response?.status === 500) {
                toast.error("Server error while fetching refunds. Please try again later.");
            } else {
                toast.error(error.response?.data?.message || "Error fetching refunds. Please refresh the page.");
            }
            
            // Set empty refunds to avoid UI issues
            setRefunds([]);
            setCurrentPage(1);
            setTotalPages(1);
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
    
    // Function to fetch bundle details from API if missing
    const fetchBundleDetails = async (bundleId) => {
        if (!bundleId || bundleItemsCache[bundleId]) {
            return bundleItemsCache[bundleId] || [];
        }

        try {
            console.log('Fetching bundle details for ID:', bundleId);
            const response = await Axios({
                ...SummaryApi.getBundleById,
                url: SummaryApi.getBundleById.url.replace(':id', bundleId)
            });

            if (response.data && response.data.success && response.data.data) {
                const bundleItems = response.data.data.items || [];
                console.log('Fetched bundle items:', bundleItems);
                
                // Cache the results
                setBundleItemsCache(prev => ({
                    ...prev,
                    [bundleId]: bundleItems
                }));
                
                return bundleItems;
            }
        } catch (error) {
            console.error('Error fetching bundle details:', error);
        }

        return [];
    };
    
    // Function to fetch bundle items for all bundles in refunds
    const fetchBundleItemsForRefunds = async (refundsData) => {
        if (!refundsData || !Array.isArray(refundsData)) {
            console.log("No refund data to process for bundle items");
            return;
        }

        try {
            const bundleIdsToFetch = new Set();
            
            // Collect all bundle IDs that need fetching
            refundsData.forEach(refund => {
                if (refund?.orderId?.items && Array.isArray(refund.orderId.items)) {
                    refund.orderId.items.forEach(item => {
                        // Enhanced bundle detection with null checks
                        const isBundle = 
                            (item.itemType === 'bundle') || 
                            (item.bundleId && typeof item.bundleId === 'object') ||
                            (item.bundleDetails && typeof item.bundleDetails === 'object') ||
                            (item.bundle && typeof item.bundle === 'object') ||
                            (item.productId && typeof item.productId === 'object' && item.productId?.type === 'bundle') ||
                            (item.type === 'bundle') ||
                            (item.isBundle === true);

                        if (isBundle) {
                            // Check if bundle items are already available
                            const hasExistingItems = 
                                (item.bundleId?.items && Array.isArray(item.bundleId.items) && item.bundleId.items.length > 0) ||
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
                console.log('Fetching bundle items for IDs:', Array.from(bundleIdsToFetch));
                setFetchingBundles(true);
                
                const fetchPromises = Array.from(bundleIdsToFetch).map(bundleId => 
                    fetchBundleDetails(bundleId).catch(error => {
                        console.error(`Error fetching bundle ${bundleId}:`, error);
                        return [];
                    })
                );

                try {
                    await Promise.all(fetchPromises);
                    console.log('Finished fetching all bundle items');
                } catch (error) {
                    console.error('Error fetching bundle items:', error);
                } finally {
                    setFetchingBundles(false);
                }
            }
        } catch (error) {
            console.error("Error in fetchBundleItemsForRefunds:", error);
            setFetchingBundles(false);
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
                
                // Update delivery status to cancelled for the order
                try {
                    await Axios({
                        ...SummaryApi.updateOrderStatus,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        },
                        data: {
                            orderId: selectedRefund.orderId._id || selectedRefund.orderId,
                            orderStatus: 'CANCELLED',
                            deliveryStatus: 'CANCELLED',
                            deliveryNotes: 'Order cancelled due to refund completion'
                        }
                    });
                    
                    toast.success("Delivery status updated to cancelled");
                } catch (deliveryUpdateError) {
                    console.error("Error updating delivery status:", deliveryUpdateError);
                    // Don't show error toast for this as the main refund was successful
                }
                
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
                                <p><span className="font-medium">Total Amount:</span> {DisplayPriceInRupees(order.totalAmt)}</p>
                                
                                {/* Delivery Information */}
                                {order.estimatedDeliveryDate && (
                                    <p><span className="font-medium">Estimated Delivery:</span> {formatDate(order.estimatedDeliveryDate)}</p>
                                )}
                                {order.actualDeliveryDate && (
                                    <p><span className="font-medium">Actual Delivery:</span> {formatDate(order.actualDeliveryDate)}</p>
                                )}
                                {order.deliveryNotes && (
                                    <p><span className="font-medium">Delivery Notes:</span> {order.deliveryNotes}</p>
                                )}
                                
                                {/* Delivery Context from Refund */}
                                {refund.deliveryContext && (
                                    <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                        <h4 className="font-medium text-blue-800 mb-1">Delivery Context</h4>
                                        <p className="text-sm text-blue-700">
                                            Days between order and cancellation: {refund.deliveryContext.daysBetweenOrderAndCancellation}
                                        </p>
                                        {refund.deliveryContext.daysBetweenDeliveryAndCancellation !== undefined && (
                                            <p className="text-sm text-blue-700">
                                                Days between delivery and cancellation: {refund.deliveryContext.daysBetweenDeliveryAndCancellation}
                                            </p>
                                        )}
                                        {refund.deliveryContext.isOverdue && (
                                            <p className="text-sm text-red-600 font-medium">
                                                ⚠️ Delivery was overdue when cancelled
                                            </p>
                                        )}
                                    </div>
                                )}
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
                                <p><span className="font-medium">Refund Status:</span> {refundDetails.refundStatus || 'PROCESSING'}</p>
                                <p><span className="font-medium">Refund Percentage:</span> {adminResponse.refundPercentage}%</p>
                                <p><span className="font-medium">Refund Amount:</span> {DisplayPriceInRupees(adminResponse.refundAmount)}</p>
                                
                                {refundDetails.refundId && (
                                    <>
                                        <p><span className="font-medium">Refund ID:</span> {refundDetails.refundId}</p>
                                        <p><span className="font-medium">Refund Date:</span> {formatDate(refundDetails.refundDate)}</p>
                                    </>
                                )}

                                {adminResponse.adminComments && (
                                    <p><span className="font-medium">Admin Comments:</span> {adminResponse.adminComments}</p>
                                )}
                            </div>
                            
                            {/* Products Details */}
                            <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                                <h3 className="font-semibold text-lg mb-3">Product Details</h3>
                                {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 mt-2">
                                        {order.items.map((item, index) => {
                                            // Debug: Log item structure to console
                                            console.log(`Item ${index}:`, item);
                                            
                                            // Enhanced bundle detection with multiple fallback strategies
                                            const isBundle = item.itemType === 'bundle' || 
                                                            (item.bundleId && typeof item.bundleId === 'object') ||
                                                            (item.bundleDetails && typeof item.bundleDetails === 'object') ||
                                                            (item.bundle && typeof item.bundle === 'object') ||
                                                            (item.productId && typeof item.productId === 'object' && item.productId.type === 'bundle') ||
                                                            (item.type === 'bundle') ||
                                                            item.isBundle;
                                            
                                            // Get item name with enhanced fallback logic
                                            let itemName = 'Product';
                                            if (isBundle) {
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
                                            if (isBundle) {
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
                                            
                                            // Enhanced function to get bundle items with comprehensive detection and cache support
                                            const getBundleItems = () => {
                                                if (!isBundle) return [];
                                                
                                                console.log('Getting bundle items for item:', item);
                                                
                                                // Check all possible locations for bundle items
                                                const bundleSources = [
                                                    item.bundleId,
                                                    item.bundleDetails,
                                                    item.bundle,
                                                    item.productId,
                                                    item.productDetails
                                                ];

                                                for (const source of bundleSources) {
                                                    if (source && typeof source === 'object') {
                                                        // Check for items array in various properties
                                                        const itemsArrays = [
                                                            source.items,
                                                            source.bundleItems,
                                                            source.products,
                                                            source.productDetails
                                                        ];

                                                        for (const itemsArray of itemsArrays) {
                                                            if (Array.isArray(itemsArray) && itemsArray.length > 0) {
                                                                console.log('Found bundle items in source:', itemsArray);
                                                                return itemsArray;
                                                            }
                                                        }

                                                        // Also check if the source itself is an array
                                                        if (Array.isArray(source) && source.length > 0) {
                                                            console.log('Found bundle items in source array:', source);
                                                            return source;
                                                        }
                                                    }
                                                }

                                                // Check if the item itself has bundleItems property
                                                if (item.bundleItems && Array.isArray(item.bundleItems)) {
                                                    return item.bundleItems;
                                                }

                                                // Check the cache for bundle items
                                                let bundleId = null;
                                                if (item.bundleId) {
                                                    bundleId = typeof item.bundleId === 'object' ? item.bundleId._id : item.bundleId;
                                                } else if (item.productId) {
                                                    bundleId = typeof item.productId === 'object' ? item.productId._id : item.productId;
                                                }

                                                if (bundleId && bundleItemsCache[bundleId]) {
                                                    console.log('Found bundle items in cache:', bundleItemsCache[bundleId]);
                                                    return bundleItemsCache[bundleId];
                                                }

                                                console.log('No bundle items found');
                                                return [];
                                            };

                                            // Enhanced function to get bundle item image with comprehensive URL resolution
                                            const getBundleItemImage = (bundleItem) => {
                                                console.log('Getting bundle item image for:', bundleItem);
                                                
                                                // Priority order for image sources
                                                const imageSources = [
                                                    bundleItem?.image?.[0]?.url,
                                                    bundleItem?.image?.[0],
                                                    bundleItem?.images?.[0]?.url,
                                                    bundleItem?.images?.[0],
                                                    bundleItem?.productDetails?.image?.[0]?.url,
                                                    bundleItem?.productDetails?.image?.[0],
                                                    bundleItem?.thumbnail,
                                                    bundleItem?.picture,
                                                    bundleItem?.img,
                                                ];

                                                for (const imageSource of imageSources) {
                                                    if (imageSource) {
                                                        console.log('Found image source:', imageSource);
                                                        
                                                        // Check if it's already a complete URL
                                                        if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
                                                            return imageSource;
                                                        }
                                                        
                                                        // If it's a relative URL, prepend the base URL
                                                        const fullUrl = `${baseURL}${imageSource.startsWith('/') ? '' : '/'}${imageSource}`;
                                                        console.log('Generated full URL:', fullUrl);
                                                        return fullUrl;
                                                    }
                                                }

                                                console.log('No valid image found, using fallback');
                                                return noCart;
                                            };

                                            const bundleItems = getBundleItems();

                                            // Simple Bundle Items Display Component
                                            const BundleItemsDisplay = ({ item, isBundle }) => {
                                                const [items, setItems] = useState([]);
                                                const [loading, setLoading] = useState(false);
                                                const [bundleMainImage, setBundleMainImage] = useState(null);

                                                useEffect(() => {
                                                    const loadItems = async () => {
                                                        if (!isBundle) return;
                                                        
                                                        console.log('=== LOADING BUNDLE ITEMS ===');
                                                        console.log('Item data:', item);
                                                        
                                                        setLoading(true);
                                                        
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
                                                        
                                                        // First check local data
                                                        let foundItems = [];
                                                        
                                                        // Check various bundle data locations
                                                        if (item.bundleDetails?.items) {
                                                            foundItems = item.bundleDetails.items;
                                                            console.log('Found items in bundleDetails.items:', foundItems);
                                                        } else if (item.bundleId?.items) {
                                                            foundItems = item.bundleId.items;
                                                            console.log('Found items in bundleId.items:', foundItems);
                                                        } else if (item.items) {
                                                            foundItems = item.items;
                                                            console.log('Found items in item.items:', foundItems);
                                                        }
                                                        
                                                        // If no items found locally, try API
                                                        if (foundItems.length === 0) {
                                                            let bundleId = null;
                                                            if (typeof item.bundleId === 'string') {
                                                                bundleId = item.bundleId;
                                                            } else if (item.bundleId?._id) {
                                                                bundleId = item.bundleId._id;
                                                            } else if (item.productId?._id) {
                                                                bundleId = item.productId._id;
                                                            }
                                                            
                                                            if (bundleId) {
                                                                console.log('Fetching from API with ID:', bundleId);
                                                                try {
                                                                    const response = await Axios({
                                                                        ...SummaryApi.getBundleById,
                                                                        url: SummaryApi.getBundleById.url.replace(':id', bundleId)
                                                                    });
                                                                    
                                                                    if (response.data?.success && response.data?.data?.items) {
                                                                        foundItems = response.data.data.items;
                                                                        console.log('Found items from API:', foundItems);
                                                                    } else {
                                                                        console.log('API response:', response.data);
                                                                    }
                                                                } catch (error) {
                                                                    console.error('API fetch error:', error);
                                                                }
                                                            }
                                                        }
                                                        
                                                        setItems(foundItems);
                                                        setLoading(false);
                                                        console.log('Final items set:', foundItems);
                                                    };
                                                    
                                                    loadItems();
                                                }, [item, isBundle]);

                                                if (!isBundle) return null;

                                                if (loading) {
                                                    return (
                                                        <div className="border-t pt-3 mt-3">
                                                            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200 flex items-center gap-2">
                                                                <FaSpinner className="animate-spin" />
                                                                Loading bundle items...
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (items.length > 0) {
                                                    return (
                                                        <div className="border-t pt-3 mt-3">
                                                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Bundle Items ({items.length}):</h5>
                                                            <div className="space-y-2">
                                                                {items.map((bundleItem, bundleIndex) => (
                                                                    <div key={bundleIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded border text-sm">
                                                                        <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                                                                            {(() => {
                                                                                console.log('Bundle item for image:', bundleItem);
                                                                                console.log('BaseURL:', baseURL);
                                                                                
                                                                                // Enhanced image source detection
                                                                                let imageUrl = null;
                                                                                
                                                                                // Check bundle item image (string field)
                                                                                if (bundleItem.image && typeof bundleItem.image === 'string') {
                                                                                    imageUrl = bundleItem.image;
                                                                                    console.log('Found image in bundleItem.image:', imageUrl);
                                                                                }
                                                                                
                                                                                // Check if image is array format
                                                                                if (!imageUrl && bundleItem.image && Array.isArray(bundleItem.image)) {
                                                                                    imageUrl = bundleItem.image[0]?.url || bundleItem.image[0];
                                                                                    console.log('Found image in bundleItem.image array:', imageUrl);
                                                                                }
                                                                                
                                                                                // Check images array
                                                                                if (!imageUrl && bundleItem.images && Array.isArray(bundleItem.images)) {
                                                                                    imageUrl = bundleItem.images[0]?.url || bundleItem.images[0];
                                                                                    console.log('Found image in bundleItem.images:', imageUrl);
                                                                                }
                                                                                
                                                                                // Check productId for images (if bundle item has productId populated)
                                                                                if (!imageUrl && bundleItem.productId) {
                                                                                    if (typeof bundleItem.productId === 'object') {
                                                                                        // ProductId is populated
                                                                                        if (bundleItem.productId.image) {
                                                                                            if (Array.isArray(bundleItem.productId.image)) {
                                                                                                imageUrl = bundleItem.productId.image[0]?.url || bundleItem.productId.image[0];
                                                                                            } else {
                                                                                                imageUrl = bundleItem.productId.image;
                                                                                            }
                                                                                            console.log('Found image in bundleItem.productId.image:', imageUrl);
                                                                                        } else if (bundleItem.productId.images && Array.isArray(bundleItem.productId.images)) {
                                                                                            imageUrl = bundleItem.productId.images[0]?.url || bundleItem.productId.images[0];
                                                                                            console.log('Found image in bundleItem.productId.images:', imageUrl);
                                                                                        }
                                                                                    }
                                                                                }
                                                                                
                                                                                // Fallback to bundle main image if no item-specific image
                                                                                if (!imageUrl && bundleMainImage) {
                                                                                    imageUrl = bundleMainImage;
                                                                                    console.log('Using bundle main image as fallback:', imageUrl);
                                                                                }
                                                                                
                                                                                console.log('Resolved image URL:', imageUrl);
                                                                                
                                                                                if (imageUrl && imageUrl.trim() !== '') {
                                                                                    // Build final URL with proper base URL handling
                                                                                    let finalUrl;
                                                                                    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                                                                                        finalUrl = imageUrl;
                                                                                    } else {
                                                                                        // Handle relative URLs
                                                                                        const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
                                                                                        finalUrl = `${baseURL}${cleanImageUrl}`;
                                                                                    }
                                                                                    
                                                                                    console.log('Final image URL:', finalUrl);
                                                                                    
                                                                                    return (
                                                                                        <img 
                                                                                            src={finalUrl}
                                                                                            alt={bundleItem.name || bundleItem.title || 'Bundle Item'}
                                                                                            className="w-full h-full object-cover"
                                                                                            onLoad={() => {
                                                                                                console.log('Image loaded successfully:', finalUrl);
                                                                                            }}
                                                                                            onError={(e) => {
                                                                                                console.error('Image failed to load:', finalUrl);
                                                                                                console.error('Original bundle item:', bundleItem);
                                                                                                console.error('Error event:', e);
                                                                                                // Hide the broken image
                                                                                                e.target.style.display = 'none';
                                                                                                // Show the placeholder instead
                                                                                                const placeholder = e.target.nextElementSibling;
                                                                                                if (placeholder) {
                                                                                                    placeholder.style.display = 'flex';
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    );
                                                                                }
                                                                                
                                                                                console.log('No valid image found, showing placeholder');
                                                                                return (
                                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                                        </svg>
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                        <div className="flex-grow">
                                                                            <div className="font-medium text-gray-800">
                                                                                {bundleItem.name || bundleItem.title || 'Bundle Item'}
                                                                            </div>
                                                                            <div className="text-xs text-gray-600">
                                                                                Qty: {bundleItem.quantity || 1} • Price: {DisplayPriceInRupees(bundleItem.price || 0)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="border-t pt-3 mt-3">
                                                        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                                            ⚠️ Bundle items details are not available in this view
                                                        </div>
                                                    </div>
                                                );
                                            };
                                            
                                            console.log(`Extracted name: ${itemName}, price: ${itemPrice}, isBundle: ${isBundle}, bundleItems: ${bundleItems.length}`);
                                            
                                            return (
                                                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                                                    <div className="flex items-start">
                                                        <div className="flex-shrink-0 w-16 h-16 mr-4">
                                                            <img 
                                                                src={getImageSource(item)}
                                                                alt={itemName}
                                                                className="w-full h-full object-cover rounded"
                                                                onError={(e) => {
                                                                    console.log("Image error, falling back to noCart");
                                                                    e.target.onerror = null; 
                                                                    e.target.src = noCart;
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h4 className="font-medium">{itemName}</h4>
                                                                {isBundle && (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                        Bundle
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-600 mb-2">
                                                                <span>Quantity: {item.quantity || 1}</span>
                                                                <span className="mx-2">•</span>
                                                                <span>Price: {DisplayPriceInRupees(itemPrice)}</span>
                                                                <span className="mx-2">•</span>
                                                                <span className="font-medium">Subtotal: {DisplayPriceInRupees(item.itemTotal || (itemPrice * (item.quantity || 1)))}</span>
                                                            </div>
                                                            
                                                            {/* Bundle Items Display Component */}
                                                            <BundleItemsDisplay item={item} isBundle={isBundle} />
                                                        </div>
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
                            
                            {refundDetails.refundStatus === 'PROCESSING' && (
                                <button 
                                    onClick={() => {
                                        setSelectedRefund(refund);
                                        setShowCompleteModal(true);
                                        onClose();
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                                >
                                    <FaCheck className="mr-2" /> Complete Refund
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
                            <p className="mb-2">
                                <span className="font-medium">Refund Amount:</span> {DisplayPriceInRupees(selectedRefund.adminResponse?.refundAmount)}
                            </p>
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
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Delivery Status
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
                                refunds.map((refund) => {
                                    // Helper function to get delivery status
                                    const getDeliveryStatus = (refund) => {
                                        const order = refund.orderId;
                                        if (!order) return { status: 'No Info', color: 'bg-gray-100 text-gray-800' };
                                        
                                        // Check if order is cancelled or refund is completed
                                        if (order.orderStatus === 'CANCELLED' || refund.refundDetails?.refundStatus === 'COMPLETED') {
                                            return { status: 'Cancelled', color: 'bg-red-100 text-red-800' };
                                        }
                                        
                                        if (order.actualDeliveryDate) {
                                            return { status: 'Delivered', color: 'bg-green-100 text-green-800' };
                                        }
                                        
                                        if (order.estimatedDeliveryDate) {
                                            const isOverdue = new Date() > new Date(order.estimatedDeliveryDate);
                                            if (isOverdue) {
                                                return { status: 'Overdue', color: 'bg-red-100 text-red-800' };
                                            } else {
                                                return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
                                            }
                                        }
                                        
                                        return { status: 'No Date', color: 'bg-gray-100 text-gray-800' };
                                    };
                                    
                                    const deliveryStatus = getDeliveryStatus(refund);
                                    
                                    return (
                                        <tr key={refund._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">
                                                    {refund.orderId?.orderId || 'N/A'}
                                                </div>
                                                {refund.deliveryContext && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {refund.deliveryContext.daysBetweenOrderAndCancellation} days after order
                                                    </div>
                                                )}
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
                                                <div className="text-gray-900 font-medium">
                                                    {DisplayPriceInRupees(refund.adminResponse?.refundAmount || 0)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-gray-900">
                                                    {formatDate(refund.requestDate)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deliveryStatus.color}`}>
                                                    {deliveryStatus.status}
                                                </span>
                                                {refund.deliveryContext?.isOverdue && (
                                                    <div className="text-xs text-red-600 mt-1">⚠️ Overdue</div>
                                                )}
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
                                                    
                                                    {refund.refundDetails?.refundStatus === 'PROCESSING' && (
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
                                    );
                                })
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
