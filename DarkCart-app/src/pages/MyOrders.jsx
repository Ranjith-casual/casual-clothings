import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaMapMarkerAlt, FaCity, FaFlag, FaMailBulk, FaBox, FaUser, FaEnvelope, FaCalendar, FaTimes, FaExclamationTriangle, FaBan, FaRedo, FaInfoCircle, FaCheck, FaSpinner, FaCreditCard, FaCog, FaTruck, FaDownload, FaFilePdf, FaUndo, FaListAlt, FaMoneyBill, FaClock, FaRegClock } from 'react-icons/fa'
import AnimatedImage from '../components/NoData';
import toast from 'react-hot-toast';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import OrderTimeline from '../components/OrderTimeline';
import OrderCancellationModal from '../components/OrderCancellationModal';
import PartialCancellationModal from '../components/PartialCancellationModal';
import ProductDetailsModal from '../components/ProductDetailsModal';
import BundleItemsModal from '../components/BundleItemsModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { useGlobalContext } from '../provider/GlobalProvider';
import { setOrders } from '../store/orderSlice';
import noCart from '../assets/Empty-cuate.png'; // Import fallback image
import ProductImageLink from '../components/ProductImageLink'; // Import the ProductImageLink component
import { PricingService } from '../utils/PricingService'; // Import PricingService for consistent price calculations

function MyOrders() {
  // Get all orders from Redux store
  const allOrders = useSelector((state) => state.order.orders);
  // Get current user information
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [orderCancellationRequests, setOrderCancellationRequests] = useState([]);
  
  // Return Requests State
  const [userReturnRequests, setUserReturnRequests] = useState([]);
  
  // Partial Cancellation Modal States
  const [showPartialCancellationModal, setShowPartialCancellationModal] = useState(false);
  const [orderForPartialCancel, setOrderForPartialCancel] = useState(null);
  
  // Product Details Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState('product');
  const [orderContext, setOrderContext] = useState(null);
  
  // Bundle Items Modal States
  const [showBundleItemsModal, setShowBundleItemsModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  
  // Invoice Download States
  const [downloadingInvoices, setDownloadingInvoices] = useState(new Set());
  
  const { fetchOrders, refreshingOrders } = useGlobalContext();
  
  // Size-based price calculation utility function - calculates base price with size adjustment, then applies discount
  const calculateSizeBasedPrice = (item, productInfo = null) => {
    try {
      const size = item?.size;
      const product = productInfo || item?.productId || item?.bundleId || item?.productDetails || item?.bundleDetails;
      
      // For bundles, use bundle pricing without size adjustments
      if (item?.itemType === 'bundle') {
        const bundlePrice = product?.bundlePrice || product?.price || 0;
        const discount = product?.discount || 0;
        const finalPrice = discount > 0 ? bundlePrice * (1 - discount/100) : bundlePrice;
        return finalPrice * (item?.quantity || 1);
      }

      // Check if product has size-based pricing (direct size-price mapping)
      if (product && product.sizePricing && typeof product.sizePricing === 'object') {
        const sizePrice = product.sizePricing[size] || product.sizePricing[size?.toUpperCase()] || product.sizePricing[size?.toLowerCase()];
        if (sizePrice) {
          // Apply discount to size-specific price if available
          const discount = product?.discount || 0;
          const finalSizePrice = discount > 0 ? sizePrice * (1 - discount/100) : sizePrice;
          return finalSizePrice * (item?.quantity || 1);
        }
      }

      // Check for size variants array
      if (product && product.variants && Array.isArray(product.variants)) {
        const sizeVariant = product.variants.find(variant => 
          variant.size === size || 
          variant.size === size?.toUpperCase() || 
          variant.size === size?.toLowerCase()
        );
        if (sizeVariant && sizeVariant.price) {
          // Apply discount to variant price if available
          const discount = product?.discount || 0;
          const finalVariantPrice = discount > 0 ? sizeVariant.price * (1 - discount/100) : sizeVariant.price;
          return finalVariantPrice * (item?.quantity || 1);
        }
      }

      // Use size multipliers to adjust base price, then apply discount
      const sizeMultipliers = {
        'XS': 0.9, 'S': 1.0, 'M': 1.1, 'L': 1.2, 'XL': 1.3, 'XXL': 1.4,
        '28': 0.9, '30': 1.0, '32': 1.1, '34': 1.2, '36': 1.3, '38': 1.4, '40': 1.5, '42': 1.6
      };

      const basePrice = product?.price || 0;
      const multiplier = size ? (sizeMultipliers[size] || sizeMultipliers[size?.toUpperCase()] || 1.0) : 1.0;
      const discount = product?.discount || 0;
      
      // Step 1: Apply size multiplier to base price
      const sizeAdjustedPrice = basePrice * multiplier;
      
      // Step 2: Apply discount to size-adjusted price
      const finalPrice = discount > 0 ? sizeAdjustedPrice * (1 - discount/100) : sizeAdjustedPrice;
      
      return finalPrice * (item?.quantity || 1);

    } catch (error) {
      console.error('Error calculating size-based price:', error);
      // Fallback to original pricing
      return item?.itemTotal || 
             (productInfo?.price || productInfo?.bundlePrice || 0) * (item?.quantity || 1);
    }
  };

  // Get size-based unit price with proper discount application
  const getSizeBasedUnitPrice = (item, productInfo = null) => {
    // First priority: Use stored sizeAdjustedPrice if available (this is the actual charged price)
    if (item?.sizeAdjustedPrice && item.sizeAdjustedPrice > 0) {
      return item.sizeAdjustedPrice;
    }
    
    // Second priority: Use stored unit price if available
    if (item?.unitPrice && item.unitPrice > 0) {
      return item.unitPrice;
    }
    
    // Third priority: Use stored itemTotal divided by quantity
    if (item?.itemTotal && item.itemTotal > 0 && item?.quantity && item.quantity > 0) {
      return item.itemTotal / item.quantity;
    }
    
    // Fallback: Calculate based on total price (only if no stored prices available)
    const totalPrice = calculateSizeBasedPrice(item, productInfo);
    return totalPrice / (item?.quantity || 1);
  };
  
  // Function to fetch current user's orders specifically (not all orders for admin)
  const fetchCurrentUserOrders = async () => {
    try {
      // Debug current user info
      const currentUserId = localStorage.getItem('userId');
      console.log('fetchCurrentUserOrders - Current user ID from localStorage:', currentUserId);
      console.log('fetchCurrentUserOrders - Redux user state:', user);
      
      const response = await Axios({
        url: SummaryApi.getOrderList.url,
        method: SummaryApi.getOrderList.method
      });
      
      if (response.data.success) {
        console.log('fetchCurrentUserOrders - Fetched orders count:', response.data.data.length);
        console.log('fetchCurrentUserOrders - First order details:', response.data.data[0]);
        if (response.data.data.length > 0) {
          console.log('fetchCurrentUserOrders - First order user ID:', response.data.data[0]?.userId?._id || response.data.data[0]?.userId);
          console.log('fetchCurrentUserOrders - Does order belong to current user?', 
            (response.data.data[0]?.userId?._id || response.data.data[0]?.userId) === currentUserId);
        }
        dispatch(setOrders(response.data.data));
      }
    } catch (error) {
      console.error("Error fetching current user orders:", error);
    }
  };
  
  // Function to fetch user's cancellation requests
  const fetchUserCancellationRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await Axios({
        ...SummaryApi.getUserCancellationRequests,
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setOrderCancellationRequests(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching cancellation requests:", error);
    }
  };

  // Function to fetch user's return requests
  const fetchUserReturnRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await Axios({
        ...SummaryApi.getUserReturnRequests,
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log('fetchUserReturnRequests - Response data:', response.data.data);
        console.log('fetchUserReturnRequests - Returns array:', response.data.data.returns);
        console.log('fetchUserReturnRequests - Is returns array?:', Array.isArray(response.data.data.returns));
        // The server returns { returns: [...], pagination: {...} }
        const returnRequests = Array.isArray(response.data.data.returns) ? response.data.data.returns : [];
        setUserReturnRequests(returnRequests);
      } else {
        console.log('fetchUserReturnRequests - Failed response:', response.data);
        setUserReturnRequests([]);
      }
    } catch (error) {
      console.error("Error fetching return requests:", error);
      setUserReturnRequests([]);
    }
  };

  // Check if an order has a pending cancellation request
  const hasPendingCancellationRequest = (orderId) => {
    return orderCancellationRequests.some(request => 
      (request.orderId === orderId || request.orderId?._id === orderId) && 
      request.status === 'PENDING'
    );
  };

  // Check if a specific item has a pending cancellation request
  const hasItemPendingCancellationRequest = (orderId, itemId) => {
    return orderCancellationRequests.some(request => {
      if ((request.orderId === orderId || request.orderId?._id === orderId) && 
          request.status === 'PENDING' && 
          request.cancellationType === 'PARTIAL_ITEMS') {
        
        // Check if this specific item is in the cancellation request
        return request.itemsToCancel?.some(cancelItem => 
          cancelItem.itemId?.toString() === itemId?.toString()
        );
      }
      return false;
    });
  };

  // Check if an entire order has a pending full cancellation request
  const hasFullOrderPendingCancellationRequest = (orderId) => {
    return orderCancellationRequests.some(request => 
      (request.orderId === orderId || request.orderId?._id === orderId) && 
      request.status === 'PENDING' && 
      request.cancellationType !== 'PARTIAL_ITEMS'
    );
  };

  // Check if a specific item has a pending return request
  const hasItemPendingReturnRequest = (orderId, itemId) => {
    if (!Array.isArray(userReturnRequests)) {
      console.warn('hasItemPendingReturnRequest - userReturnRequests is not an array:', userReturnRequests);
      return false;
    }
    return userReturnRequests.some(request => {
      return (request.orderId === orderId || request.orderId?._id === orderId) && 
             request.itemId === itemId && 
             request.status === 'REQUESTED';
    });
  };

  // Check if a specific item has an approved return request
  const hasItemApprovedReturn = (orderId, itemId) => {
    if (!Array.isArray(userReturnRequests)) {
      console.warn('hasItemApprovedReturn - userReturnRequests is not an array:', userReturnRequests);
      return false;
    }
    return userReturnRequests.some(request => {
      return (request.orderId === orderId || request.orderId?._id === orderId) && 
             request.itemId === itemId && 
             request.status === 'APPROVED';
    });
  };

  // Check if a specific item has a rejected return request
  const hasItemRejectedReturn = (orderId, itemId) => {
    if (!Array.isArray(userReturnRequests)) {
      console.warn('hasItemRejectedReturn - userReturnRequests is not an array:', userReturnRequests);
      return false;
    }
    return userReturnRequests.some(request => {
      return (request.orderId === orderId || request.orderId?._id === orderId) && 
             request.itemId === itemId && 
             request.status === 'REJECTED';
    });
  };

  // Filter orders to only show the current user's orders, even for admin
  useEffect(() => {
    if (allOrders && allOrders.length > 0 && user && user._id) {
      const filteredOrders = allOrders.filter(order => {
        // Get user IDs in both string and object form
        const orderUserId = order.userId?._id || order.userId;
        const currentUserId = user._id;
        
        // More flexible comparison - compare as strings if types don't match
        let isMatch = false;
        
        if (orderUserId && currentUserId) {
          // First try direct comparison
          isMatch = orderUserId === currentUserId;
          
          // If no match, try string comparison
          if (!isMatch) {
            isMatch = orderUserId.toString() === currentUserId.toString();
          }
        }
        
        // More detailed debugging
        if (!isMatch) {
          console.log('Order does not match user:', {
            orderUserId,
            currentUserId,
            orderUserIdType: typeof orderUserId,
            currentUserIdType: typeof currentUserId,
            order: order
          });
        }
        
        return isMatch;
      });
      
      console.log('Filtered orders for user:', {
        userId: user._id,
        totalOrders: allOrders.length,
        userOrders: filteredOrders.length,
        isAdmin: user.role?.toUpperCase() === 'ADMIN',
        firstOrderUserId: allOrders[0]?.userId?._id || allOrders[0]?.userId,
        currentUserId: user._id
      });
      
      setUserOrders(filteredOrders);
    } else {
      console.log('No orders or user data:', {
        allOrdersLength: allOrders?.length || 0,
        userId: user?._id,
        hasUser: !!user
      });
      setUserOrders([]);
    }
  }, [allOrders, user]);
  
  const handleCancelOrder = (orderData) => {
    setOrderToCancel(orderData);
    setShowCancellationModal(true);
  };

  const handlePartialCancelOrder = (orderData) => {
    setOrderForPartialCancel(orderData);
    setShowPartialCancellationModal(true);
  };

  const handleCancellationRequested = () => {
    // Refresh orders and cancellation requests after cancellation request is submitted
    fetchCurrentUserOrders();
    fetchUserCancellationRequests();
    setOrderToCancel(null);
  };

  const handlePartialCancellationSuccess = () => {
    // Refresh orders and cancellation requests after partial cancellation request is submitted
    fetchCurrentUserOrders();
    fetchUserCancellationRequests();
    setOrderForPartialCancel(null);
  };

  // Product Details Modal Handlers
  const handleShowProductDetails = (product, type = 'product', order = null, item = null) => {
    // If this is a product (not a bundle) and we have the original item with size info
    if (type === 'product' && item && (item.size || item.productDetails?.size)) {
      // Create a new product object with size information added
      const productWithSize = {
        ...product,
        orderSize: item.size || item.productDetails?.size,
        orderQuantity: item.quantity || 1
      };
      setSelectedProduct(productWithSize);
    } else {
      setSelectedProduct(product);
    }
    setSelectedProductType(type);
    setOrderContext(order);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
    setSelectedProductType('product');
    setOrderContext(null);
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
  
  // Detailed order modal states
  const [detailedOrder, setDetailedOrder] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);

  const fetchComprehensiveOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      setActiveOrderId(orderId);
      
      const response = await Axios({
        url: `${SummaryApi.getComprehensiveOrderDetails.url}/${orderId}`,
        method: SummaryApi.getComprehensiveOrderDetails.method
      });
      
      if (response.data.success) {
        console.log('Fetched detailed order information:', response.data.data);
        setDetailedOrder(response.data.data);
        setShowOrderDetailsModal(true);
        return response.data.data;
      } else {
        toast.error('Failed to fetch order details');
        return null;
      }
    } catch (error) {
      console.error('Error fetching comprehensive order details:', error);
      toast.error('Failed to load order details. Please try again.');
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const handleCloseOrderDetailsModal = () => {
    setShowOrderDetailsModal(false);
    // Keep the detailedOrder data in case user reopens the same order
  };

  // Invoice Download Function
  const handleDownloadInvoice = async (order) => {
    try {
      // Add this order to downloading set
      setDownloadingInvoices(prev => new Set([...prev, order.orderId]));
      
      const response = await Axios({
        url: `/api/payment/invoice/download-user`,
        method: 'POST',
        data: {
          orderId: order.orderId,
          orderData: order
        },
        responseType: 'blob' // Important for file download
      });
      
      // Create blob URL and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on order status
      let filename = `invoice-${order.orderId}`;
      if (order.orderStatus === 'DELIVERED') {
        filename = `delivery-invoice-${order.orderId}`;
      } else if (order.orderStatus === 'CANCELLED') {
        filename = `cancelled-order-invoice-${order.orderId}`;
      }
      filename += '.pdf';
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      // Remove this order from downloading set
      setDownloadingInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.orderId);
        return newSet;
      });
    }
  };

  // Use the fetchOrders from GlobalContext instead of local implementation
  const refreshOrders = () => {
    // For MyOrders page, always fetch only current user's orders (not all orders even for admin)
    fetchCurrentUserOrders();
    toast.success('Refreshing order status...');
  };
  
  // Fetch orders when component mounts - always user's own orders
  useEffect(() => {
    fetchCurrentUserOrders();
    if (user && user._id) {
      fetchUserCancellationRequests();
      fetchUserReturnRequests();
    }
  }, [user]);

  const { updateOrderStatus } = useGlobalContext();

  const canCancelOrder = (orderData) => {
    // Check if order can be cancelled (not delivered, not already cancelled, not out for delivery)
    const nonCancellableStatuses = ['DELIVERED', 'CANCELLED', 'OUT FOR DELIVERY'];
    
    // Don't show cancel button if order status doesn't allow cancellation
    if (nonCancellableStatuses.includes(orderData?.orderStatus)) {
      return false;
    }
    
    // Don't show cancel button if there's already a pending cancellation request
    if (hasPendingCancellationRequest(orderData._id)) {
      return false;
    }
    
    return true;
  };

  const isOrderCancelled = (orderData) => {
    return orderData?.orderStatus === 'CANCELLED';
  };
  
  // Check if a specific item has been cancelled
  const isItemCancelled = (item) => {
    return item?.status === 'Cancelled' || item?.cancelApproved === true;
  };

  // Helper function to determine payment status display
  const getPaymentStatus = (orderData) => {
    // Check if there's a pending cancellation request first
    if (hasPendingCancellationRequest(orderData._id)) {
      return "CANCELLATION_REQUESTED";
    }
    
    // If payment is explicitly set to PAID (highest priority)
    if (orderData?.paymentStatus === "PAID") {
      return "PAID";
    }
    
    // For online payments - if payment method is online and order is placed successfully
    if ((orderData?.paymentMethod === "ONLINE" || 
         orderData?.paymentMethod === "Online Payment" ||
         orderData?.paymentMethod === "Razorpay") && 
        orderData?.orderStatus !== "CANCELLED") {
      return "PAID";
    }
    
    // If order is delivered, should be paid (cash on delivery)
    if (orderData?.orderStatus === "DELIVERED") {
      return "PAID";
    }
    
    // For processing and out for delivery orders (likely already paid)
    if (orderData?.orderStatus === "PROCESSING" || orderData?.orderStatus === "OUT FOR DELIVERY") {
      return "PAID";
    }
    
    // For cancelled orders
    if (orderData?.orderStatus === "CANCELLED") {
      return "CANCELLED";
    }
    
    // For all other cases (ORDER PLACED with COD)
    return "PENDING";
  };

  // Helper function to get image source with proper fallbacks (based on BagPage logic)
  const getImageSource = (item) => {
    if (!item) return noCart;
    
    // Initialize with fallback
    let imageSrc = noCart;
    
    if (item?.itemType === 'bundle') {
      // For bundles, try multiple possible image sources in order of preference
      // First try populated bundleId (after backend fix)
      if (item?.bundleId && item?.bundleId._id) {
        imageSrc = item?.bundleId?.images?.[0] || item?.bundleId?.image || noCart;
      } 
      // Then try bundleDetails from the order (legacy)
      else if (item?.bundleDetails) {
        imageSrc = item?.bundleDetails?.images?.[0] || item?.bundleDetails?.image || noCart;
      } 
      // Finally try other possible sources
      else {
        imageSrc = item?.image?.[0] || item?.images?.[0] || item?.image || noCart;
      }
    } else {
      // For products, try multiple possible image sources in order of preference
      // First try populated productId (this should work)
      if (item?.productId && item?.productId._id) {
        imageSrc = item?.productId?.image?.[0] || item?.productId?.primaryImage || noCart;
      } 
      // Then try productDetails from the order
      else if (item?.productDetails) {
        imageSrc = item?.productDetails?.image?.[0] || item?.productDetails?.images?.[0] || item?.productDetails?.primaryImage || noCart;
      } 
      // Finally try other possible sources
      else {
        imageSrc = item?.image?.[0] || item?.images?.[0] || item?.primaryImage || item?.image || noCart;
      }
    }
    
    return imageSrc;
  };

  // Helper function to handle image load errors (based on BagPage logic)
  const handleImageError = (e, item) => {
    console.warn('Image failed to load for item:', {
      originalSrc: e.target.src,
      item: item,
      itemType: item?.itemType,
      bundleDetails: item?.bundleDetails,
      productDetails: item?.productDetails
    });
    e.target.onerror = null; // Prevent infinite error loops
    e.target.src = noCart;
  };

  // Function to get refund status from existing cancellation requests data
  const getRefundStatusFromRequests = (orderId) => {
    const cancellationRequest = orderCancellationRequests.find(request => 
      (request.orderId === orderId || request.orderId?._id === orderId || request.orderId?.orderId === orderId)
    );
    
    if (!cancellationRequest) {
      return 'NOT_APPLICABLE';
    }
    
    // Get refund status from the nested structure
    let refundStatus = cancellationRequest.refundDetails?.refundStatus || 
                      cancellationRequest.status || 
                      'PENDING';
    
    // Map the status from the model enum to our display format
    switch (refundStatus.toUpperCase()) {
      case 'COMPLETED':
        return 'COMPLETED';
      case 'PROCESSING':
        return 'PROCESSING';
      case 'FAILED':
        return 'FAILED';
      case 'APPROVED':
        // If cancellation is approved but refund not started yet
        return 'PENDING';
      case 'REJECTED':
        return 'FAILED';
      case 'PENDING':
      default:
        return 'PENDING';
    }
  };

  // Function to display refund status badge
  const getRefundStatusDisplay = (orderId, orderStatus) => {
    if (orderStatus !== 'CANCELLED') {
      return null; // Don't show refund status for non-cancelled orders
    }

    // Get refund status from existing cancellation requests data
    const refundStatus = getRefundStatusFromRequests(orderId);

    // Handle the four main status cases from the model
    switch (refundStatus.toUpperCase()) {
      case 'COMPLETED':
        return (
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white text-black border border-gray-300 shadow-md whitespace-nowrap transition-all">
            <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black text-white mr-2">
              <FaCheck className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            </div>
            <span className="truncate">Refund Completed</span>
          </div>
        );
      case 'PROCESSING':
        return (
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white text-black border border-gray-300 shadow-md whitespace-nowrap transition-all">
            <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black text-white mr-2">
              <FaSpinner className="animate-spin w-2 h-2 sm:w-2.5 sm:h-2.5" />
            </div>
            <span className="truncate">Processing Refund</span>
          </div>
        );
      case 'FAILED':
        return (
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white text-black border border-gray-300 shadow-md whitespace-nowrap transition-all">
            <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black text-white mr-2">
              <FaTimes className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            </div>
            <span className="truncate">Refund Failed</span>
          </div>
        );
      case 'PENDING':
        return (
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white text-black border border-gray-300 shadow-md whitespace-nowrap transition-all">
            <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black text-white mr-2">
              <FaRegClock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            </div>
            <span className="truncate">Refund Pending</span>
          </div>
        );
      case 'NOT_APPLICABLE':
        return (
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white text-black border border-gray-300 shadow-md whitespace-nowrap transition-all">
            <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black text-white mr-2">
              <FaInfoCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            </div>
            <span className="truncate">No Refund Required</span>
          </div>
        );
      default:
        // Default to pending for any unknown status
        return (
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-white text-black border border-gray-300 shadow-md whitespace-nowrap transition-all">
            <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black text-white mr-2">
              <FaRegClock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            </div>
            <span className="truncate">Processing Refund</span>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-white min-h-screen">
      {/* Header - Responsive */}
      <div className='bg-white shadow-md p-4 sm:p-5 md:p-6 mb-5 sm:mb-7 flex items-center justify-between border-b border-gray-200'>
        <div className='flex items-center gap-3 sm:gap-4'>
          <FaBox className='text-xl sm:text-2xl text-black' />
          <div>
            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-black tracking-tight'>My Orders</h1>
            {user && user.role?.toUpperCase() === 'ADMIN' && (
              <p className="text-xs text-gray-600 mt-1.5 font-medium">
                Only showing orders you have placed personally
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 mr-2 hidden sm:inline">
            {userOrders.length} {userOrders.length === 1 ? 'order' : 'orders'}
          </span>
          <button 
            onClick={refreshOrders}
            disabled={refreshingOrders}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaRedo className={`w-3 h-3 ${refreshingOrders ? 'animate-spin' : ''}`} />
            {refreshingOrders ? 'Refreshing...' : 'Refresh Orders'}
          </button>
        </div>
      </div>

      {
        userOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <AnimatedImage/>
            <p className="text-gray-500 text-center mt-4">
              {user && user.role?.toUpperCase() === 'ADMIN'
                ? "You haven't placed any orders yet. Orders you place will appear here."
                : "You haven't placed any orders yet."
              }
            </p>
          </div>
        )
      }
      
      {
        userOrders.map((order,index)=>{
          const isCancelled = isOrderCancelled(order);
          
          return(
            <div key={order?._id+index+"order"} className={`relative transition-all duration-300 p-4 sm:p-5 md:p-6 mb-5 sm:mb-6 md:mb-7 rounded-lg mx-2 sm:mx-4 md:mx-6 lg:mx-8 ${
              isCancelled 
                ? 'bg-red-50 border-2 border-red-200 shadow-md opacity-80' 
                : 'bg-white shadow-md hover:shadow-lg border border-gray-200'
            }`}>
              
              {/* Cancelled Order Overlay */}
              {isCancelled && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-30">
                  <div className="bg-white text-red-700 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-extrabold shadow-md border-2 border-red-600">
                    <FaBan className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>CANCELLED</span>
                  </div>
                </div>
              )}

              {/* Refund Status Display for Cancelled Orders */}
              {isCancelled && (
                <div className="absolute top-11 right-2 sm:top-14 sm:right-3 md:top-16 md:right-4 z-20">
                  <div className="bg-white shadow-md border border-gray-300 rounded-md px-2 sm:px-2.5 py-0.5 sm:py-1">
                    {getRefundStatusDisplay(order._id, order.orderStatus)}
                  </div>
                </div>
              )}

              {/* Partial Cancellation Badge for orders with some cancelled items or pending requests */}
              {/* {!isCancelled && (() => {
                const hasPartialCancellations = order?.items?.some(item => 
                  item?.status === 'Cancelled' || item?.cancelApproved === true
                );
                
                const hasPendingPartialRequests = order?.items?.some(item => 
                  hasItemPendingCancellationRequest(order._id, item._id)
                );
                
                const hasFullOrderPendingRequest = hasFullOrderPendingCancellationRequest(order._id);
                
                if (hasPartialCancellations) {
                  const cancelledCount = order?.items?.filter(item => 
                    item?.status === 'Cancelled' || item?.cancelApproved === true
                  ).length;
                  
                  return (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
                      <div className="bg-orange-500 text-white px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 text-xs sm:text-sm font-bold shadow-lg animate-pulse">
                        <FaBan className="w-3 h-3" />
                        <span>{cancelledCount} ITEM{cancelledCount > 1 ? 'S' : ''} CANCELLED</span>
                      </div>
                    </div>
                  );
                } else if (hasPendingPartialRequests) {
                  const pendingCount = order?.items?.filter(item => 
                    hasItemPendingCancellationRequest(order._id, item._id)
                  ).length;
                  
                  return (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
                      <div className="bg-yellow-500 text-white px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 text-xs sm:text-sm font-bold shadow-lg animate-pulse">
                        <FaClock className="w-3 h-3" />
                        <span>{pendingCount} ITEM{pendingCount > 1 ? 'S' : ''} CANCELLATION REQUESTED</span>
                      </div>
                    </div>
                  );
                } else if (hasFullOrderPendingRequest) {
                  return (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
                      <div className="bg-yellow-500 text-white px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 text-xs sm:text-sm font-bold shadow-lg animate-pulse">
                        <FaClock className="w-3 h-3" />
                        <span>FULL ORDER CANCELLATION REQUESTED</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()} */}

              {/* Cancelled Order Visual Indicators */}
              {isCancelled && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-50/50 via-white/80 to-red-50/50 opacity-90 rounded-lg"></div>
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #f87171 0, #f87171 8px, transparent 8px, transparent 16px)',
                    backgroundSize: '22px 22px'
                  }}></div>
                </div>
              )}

              <div className='flex flex-col xl:flex-row gap-3 sm:gap-4 md:gap-6 items-start relative z-10'>
                
                {/* Product/Bundle Image - Responsive */}
                <div className='flex-shrink-0 order-1 xl:order-2 w-full xl:w-auto flex justify-center xl:justify-start'>
                  <div 
                    className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-lg overflow-hidden border-2 relative ${isCancelled ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                  >
                    {/* Get product ID or bundle ID from the first item */}
                    {(() => {
                      const firstItem = order?.items?.[0];
                      if (!firstItem) return null;
                      
                      const isBundle = firstItem.itemType === 'bundle';
                      const imageSrc = getImageSource(firstItem);
                      const itemTitle = isBundle 
                        ? firstItem?.bundleDetails?.title 
                        : firstItem?.productDetails?.name;
                      
                      // Get the proper ID based on item type
                      let itemId;
                      if (isBundle) {
                        itemId = firstItem?.bundleId?._id || firstItem?.bundleDetails?._id;
                      } else {
                        itemId = firstItem?.productId?._id || firstItem?.productDetails?._id;
                      }
                      
                      return (
                        <>
                          {itemId ? (
                            <ProductImageLink 
                              imageUrl={imageSrc}
                              productId={itemId}
                              alt={itemTitle}
                              className="w-full h-full"
                              imageClassName={`transition-all duration-300 ${isCancelled ? 'grayscale opacity-60' : ''}`}
                              height="100%"
                              width="100%"
                              disableNavigation={isBundle}
                              onClick={() => handleShowProductDetails(
                                isBundle ? firstItem?.bundleDetails : firstItem?.productDetails,
                                isBundle ? 'bundle' : 'product',
                                order
                              )}
                            />
                          ) : (
                            <img
                              src={imageSrc}
                              alt={itemTitle}
                              className={`w-full h-full object-cover transition-all duration-300 ${isCancelled ? 'grayscale opacity-60' : ''}`}
                              onError={(e) => handleImageError(e, firstItem)}
                              onClick={() => handleShowProductDetails(
                                isBundle ? firstItem?.bundleDetails : firstItem?.productDetails,
                                isBundle ? 'bundle' : 'product',
                                order
                              )}
                            />
                          )}
                          {isCancelled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <FaBan className="text-red-500 text-2xl sm:text-3xl md:text-4xl drop-shadow-lg" />
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                  </div>
                </div>

                {/* Order Details - Responsive */}
                <div className='flex-1 space-y-3 sm:space-y-4 md:space-y-5 order-2 xl:order-1 w-full'>
                  
                  {/* Order Header - Responsive */}
                  <div className={`rounded-lg p-3 sm:p-4 md:p-5 border ${
                    isCancelled 
                      ? 'bg-red-100 border-red-300 shadow-sm' 
                      : 'bg-white border-gray-300 shadow-sm'
                  }`}>
                    <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-between'>
                      <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                        <div className='flex items-center gap-2'>
                          <FaBox className={`text-sm sm:text-base ${isCancelled ? 'text-red-600' : 'text-black'}`} />
                          <span className={`text-sm sm:text-base font-semibold ${isCancelled ? 'text-red-700' : 'text-gray-800'}`}>Order No:</span>
                        </div>
                        <span className={`text-sm sm:text-base font-bold break-all tracking-wide ${isCancelled ? 'text-red-800' : 'text-black'}`}>
                          {order?.orderId}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 mt-2 sm:mt-0'>
                        {/* Order Status Badge - Conditionally show payment status based on helper function */}
                        {getPaymentStatus(order) === "PAID" ? (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black border border-gray-300 shadow-sm">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-black text-white mr-1.5">
                              <FaCheck className="w-2 h-2" />
                            </div>
                            <span>Paid</span>
                          </div>
                        ) : getPaymentStatus(order) === "CANCELLED" ? (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black border border-gray-300 shadow-sm">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-black text-white mr-1.5">
                              <FaBan className="w-2 h-2" />
                            </div>
                            <span>Cancelled</span>
                          </div>
                        ) : getPaymentStatus(order) === "CANCELLATION_REQUESTED" ? (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black border border-gray-300 shadow-sm">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-black text-white mr-1.5">
                              <FaExclamationTriangle className="w-2 h-2" />
                            </div>
                            <span>Cancellation Requested</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black border border-gray-300 shadow-sm">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-black text-white mr-1.5">
                              <FaRegClock className="w-2 h-2" />
                            </div>
                            <span>Payment Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Product/Bundle Name and Items - Responsive */}
                  <div>
                    {/* Display all items in the order */}
                    <div className="space-y-2 sm:space-y-3">
                      {order?.items?.map((item, itemIndex) => {
                        // Check if this specific item is cancelled
                        const isItemCancelled = item?.status === 'Cancelled' || item?.cancelApproved === true;
                        
                        // Check if this specific item has a pending cancellation request
                        const isItemCancellationRequested = hasItemPendingCancellationRequest(order._id, item._id);
                        
                        // Check return status for this item
                        const isItemReturnRequested = hasItemPendingReturnRequest(order._id, item._id);
                        const isItemReturnApproved = hasItemApprovedReturn(order._id, item._id);
                        const isItemReturnRejected = hasItemRejectedReturn(order._id, item._id);
                        
                        return (
                        <div key={`${order._id}-item-${itemIndex}`} className={`rounded-lg p-2 sm:p-3 border transition-all duration-300 ${
                          isCancelled ? 'bg-red-50 border-red-200' : 
                          isItemCancelled ? 'bg-red-100 border-red-300 shadow-md ring-2 ring-red-200 ring-opacity-50' : 
                          isItemReturnApproved ? 'bg-red-100 border-red-300 shadow-md ring-2 ring-red-200 ring-opacity-50' :
                          isItemCancellationRequested ? 'bg-yellow-100 border-yellow-300 shadow-md ring-2 ring-yellow-200 ring-opacity-50' :
                          isItemReturnRequested ? 'bg-blue-100 border-blue-300 shadow-md ring-2 ring-blue-200 ring-opacity-50' :
                          isItemReturnRejected ? 'bg-gray-100 border-gray-300 shadow-md ring-2 ring-gray-200 ring-opacity-50' :
                          'bg-gray-50 border-gray-200'
                        } relative`}>
                          {/* Enhanced Item cancellation and request indicators */}
                          {isItemCancelled && !isCancelled && (
                            <>
                              {/* <div className="absolute top-0 right-0 transform -translate-y-1/3 translate-x-1/3 z-10">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white border-2 border-white shadow-lg">
                                  <FaBan className="w-3 h-3 mr-1" />
                                  CANCELLED
                                </span>
                              </div> */}
                              {/* Red stripe overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-red-200/30 via-transparent to-red-200/30 rounded-lg pointer-events-none"></div>
                              {/* Diagonal cancelled pattern */}
                              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 10px, transparent 10px, transparent 20px)'
                              }}></div>
                            </>
                          )}
                          
                          {/* Pending cancellation request indicator */}
                          {isItemCancellationRequested && !isItemCancelled && !isCancelled && (
                            <>
                              {/* <div className="absolute top-0 right-0 transform -translate-y-1/3 translate-x-1/3 z-10">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white border-2 border-white shadow-lg animate-pulse">
                                  <FaClock className="w-3 h-3 mr-1" />
                                  CANCELLATION REQUESTED
                                </span>
                              </div> */}
                              {/* Orange stripe overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-orange-200/30 via-transparent to-orange-200/30 rounded-lg pointer-events-none"></div>
                              {/* Diagonal pending pattern */}
                              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, #f97316 0, #f97316 10px, transparent 10px, transparent 20px)'
                              }}></div>
                            </>
                          )}

                          {/* Return status indicators */}
                          {isItemReturnApproved && !isItemCancelled && !isCancelled && (
                            <>
                              {/* <div className="absolute top-0 right-0 transform -translate-y-1/3 translate-x-1/3 z-10">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white border-2 border-white shadow-lg">
                                  <FaUndo className="w-3 h-3 mr-1" />
                                  RETURN APPROVED
                                </span>
                              </div> */}
                              {/* Red stripe overlay for approved returns */}
                              <div className="absolute inset-0 bg-gradient-to-r from-red-200/30 via-transparent to-red-200/30 rounded-lg pointer-events-none"></div>
                              {/* Diagonal return pattern */}
                              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, #dc2626 0, #dc2626 10px, transparent 10px, transparent 20px)'
                              }}></div>
                            </>
                          )}

                          {isItemReturnRequested && !isItemReturnApproved && !isItemCancelled && !isCancelled && (
                            <>
                              {/* <div className="absolute top-0 right-0 transform -translate-y-1/3 translate-x-1/3 z-10">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white border-2 border-white shadow-lg animate-pulse">
                                  <FaUndo className="w-3 h-3 mr-1" />
                                  RETURN REQUESTED
                                </span>
                              </div> */}
                              {/* Blue stripe overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 via-transparent to-blue-200/30 rounded-lg pointer-events-none"></div>
                              {/* Diagonal return pattern */}
                              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, #2563eb 0, #2563eb 10px, transparent 10px, transparent 20px)'
                              }}></div>
                            </>
                          )}

                          {isItemReturnRejected && !isItemReturnApproved && !isItemCancelled && !isCancelled && (
                            <>
                              {/* <div className="absolute top-0 right-0 transform -translate-y-1/3 translate-x-1/3 z-10">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-500 text-white border-2 border-white shadow-lg">
                                  <FaTimes className="w-3 h-3 mr-1" />
                                  RETURN REJECTED
                                </span>
                              </div> */}
                              {/* Gray stripe overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-200/30 via-transparent to-gray-200/30 rounded-lg pointer-events-none"></div>
                            </>
                          )}
                          <div className="flex items-start gap-2 sm:gap-3">
                            {/* Item image */}
                            <div 
                              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden border flex-shrink-0 relative ${
                                isCancelled || isItemCancelled || isItemReturnApproved ? 'border-red-400 border-2' : 
                                isItemCancellationRequested ? 'border-orange-400 border-2' :
                                isItemReturnRequested ? 'border-blue-400 border-2' :
                                isItemReturnRejected ? 'border-gray-400 border-2' :
                                'border-gray-200'
                              }`}
                            >
                              {(() => {
                                const isBundle = item?.itemType === 'bundle';
                                const imageSrc = getImageSource(item);
                                const itemTitle = isBundle 
                                  ? item?.bundleDetails?.title 
                                  : item?.productDetails?.name;
                                
                                // Get the proper ID based on item type
                                let itemId;
                                if (isBundle) {
                                  itemId = item?.bundleId?._id || item?.bundleDetails?._id;
                                } else {
                                  itemId = item?.productId?._id || item?.productDetails?._id;
                                }
                                
                                return (
                                  <>
                                    {itemId ? (
                                      <ProductImageLink 
                                        imageUrl={imageSrc}
                                        productId={itemId}
                                        alt={itemTitle}
                                        className="w-full h-full"
                                        imageClassName={`transition-all duration-300 ${
                                          isCancelled || isItemCancelled || isItemReturnApproved ? 'grayscale opacity-50 blur-sm' : 
                                          isItemCancellationRequested || isItemReturnRequested ? 'opacity-75 saturate-50' : 
                                          isItemReturnRejected ? 'opacity-60 saturate-25' : ''
                                        }`}
                                        height="100%"
                                        width="100%"
                                    disableNavigation={isBundle}
                                    onClick={() => handleShowProductDetails(
                                      isBundle ? item?.bundleDetails : item?.productDetails,
                                      isBundle ? 'bundle' : 'product',
                                      order,
                                      item
                                    )}
                                  />
                                ) : (
                                  <img
                                    src={imageSrc}
                                    alt={itemTitle}
                                    className={`w-full h-full object-cover transition-all duration-300 ${
                                      isCancelled || isItemCancelled || isItemReturnApproved ? 'grayscale opacity-50 blur-sm' : 
                                      isItemCancellationRequested || isItemReturnRequested ? 'opacity-75 saturate-50' : 
                                      isItemReturnRejected ? 'opacity-60 saturate-25' : ''
                                    }`}
                                    onError={(e) => handleImageError(e, item)}
                                    onClick={() => handleShowProductDetails(
                                      isBundle ? item?.bundleDetails : item?.productDetails,
                                      isBundle ? 'bundle' : 'product',
                                      order,
                                      item
                                    )}
                                  />
                                )}
                                {/* Enhanced cancelled/pending overlay for individual items */}
                                {(isCancelled || isItemCancelled || isItemCancellationRequested || isItemReturnRequested || isItemReturnApproved || isItemReturnRejected) && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                                    {isItemCancelled || isCancelled ? (
                                      <FaBan className={`drop-shadow-lg ${
                                        isItemCancelled && !isCancelled 
                                          ? 'text-red-500 text-lg animate-pulse' 
                                          : 'text-red-500 text-lg'
                                      }`} />
                                    ) : isItemReturnApproved ? (
                                      <FaUndo className="text-red-500 text-lg animate-pulse drop-shadow-lg" />
                                    ) : isItemCancellationRequested ? (
                                      <FaClock className="text-orange-500 text-lg animate-pulse drop-shadow-lg" />
                                    ) : isItemReturnRequested ? (
                                      <FaUndo className="text-blue-500 text-lg animate-pulse drop-shadow-lg" />
                                    ) : isItemReturnRejected ? (
                                      <FaTimes className="text-gray-500 text-lg drop-shadow-lg" />
                                    ) : null}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                            
                            {/* Item details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 
                                    className={`font-bold text-sm sm:text-base leading-tight truncate cursor-pointer hover:underline transition-all duration-200 ${
                                      isCancelled || isItemCancelled || isItemReturnApproved ? 'text-red-800 line-through' : 
                                      isItemCancellationRequested || isItemReturnRequested ? 'text-orange-800' : 
                                      isItemReturnRejected ? 'text-gray-600' :
                                      'text-black hover:text-blue-600'
                                    }`}
                                    onClick={() => handleShowProductDetails(
                                      item?.itemType === 'bundle' ? item?.bundleDetails : item?.productDetails,
                                      item?.itemType === 'bundle' ? 'bundle' : 'product',
                                      order,
                                      item
                                    )}
                                  >
                                    {item?.itemType === 'bundle' ? item?.bundleDetails?.title : item?.productDetails?.name}
                                  </h4>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {/* Enhanced cancelled status badge with refund info */}
                                    {isItemCancelled && !isCancelled && (
                                      <>
                                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-white text-red-700 border-2 border-red-500 shadow-sm">
                                          <FaBan className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5 sm:mr-1" />
                                          CANCELLED
                                        </span>
                                        {(() => {
                                          // Find the cancellation requests for this order to get refund percentages
                                          const orderCancelRequest = orderCancellationRequests.find(
                                            req => req.orderId === order._id || req.orderId?._id === order._id
                                          );
                                          
                                          const defaultRefundPercentage = 90;
                                          let refundPercentage = defaultRefundPercentage;
                                          
                                          // Try to find the refund percentage
                                          if (orderCancelRequest?.adminResponse?.refundPercentage) {
                                            refundPercentage = orderCancelRequest.adminResponse.refundPercentage;
                                          } else if (orderCancelRequest?.adminResponse?.calculatedRefundPercentage) {
                                            refundPercentage = orderCancelRequest.adminResponse.calculatedRefundPercentage;
                                          } else if (item.refundPercentage) {
                                            refundPercentage = item.refundPercentage;
                                          }
                                          
                                          return (
                                            <span className="inline-flex items-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                              {refundPercentage}% Refunded
                                            </span>
                                          );
                                        })()}
                                      </>
                                    )}
                                    
                                    {/* Pending cancellation request badge */}
                                    {isItemCancellationRequested && !isItemCancelled && !isCancelled && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white border border-orange-600 animate-pulse">
                                        <FaClock className="w-3 h-3 mr-1" />
                                        CANCELLATION REQUESTED
                                      </span>
                                    )}

                                    {/* Return status badges */}
                                    {isItemReturnApproved && !isItemCancelled && !isCancelled && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white border border-red-700 animate-pulse">
                                        <FaUndo className="w-3 h-3 mr-1" />
                                        RETURN APPROVED
                                      </span>
                                    )}

                                    {isItemReturnRequested && !isItemReturnApproved && !isItemCancelled && !isCancelled && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white border border-blue-600 animate-pulse">
                                        <FaUndo className="w-3 h-3 mr-1" />
                                        RETURN REQUESTED
                                      </span>
                                    )}

                                    {isItemReturnRejected && !isItemReturnApproved && !isItemCancelled && !isCancelled && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-500 text-white border border-gray-600">
                                        <FaTimes className="w-3 h-3 mr-1" />
                                        RETURN REJECTED
                                      </span>
                                    )}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      item?.itemType === 'bundle' 
                                        ? (isCancelled || isItemCancelled || isItemReturnApproved ? 'bg-red-100 text-red-700' : 
                                           isItemCancellationRequested || isItemReturnRequested ? 'bg-orange-100 text-orange-700' : 
                                           isItemReturnRejected ? 'bg-gray-100 text-gray-700' :
                                           'bg-blue-100 text-blue-800')
                                        : (isCancelled || isItemCancelled || isItemReturnApproved ? 'bg-red-100 text-red-700' : 
                                           isItemCancellationRequested || isItemReturnRequested ? 'bg-orange-100 text-orange-700' : 
                                           isItemReturnRejected ? 'bg-gray-100 text-gray-700' :
                                           'bg-green-100 text-green-800')
                                    }`}>
                                      {item?.itemType === 'bundle' ? '📦 Bundle' : '🏷️ Product'}
                                    </span>
                                    {item?.itemType === 'bundle' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Enhanced bundle data collection
                                          const bundleData = {
                                            // Include the entire item
                                            ...item,
                                            // Merge bundleDetails if available
                                            ...(item?.bundleDetails || {}),
                                            // Merge bundleId if it's an object
                                            ...(item?.bundleId && typeof item?.bundleId === 'object' ? item.bundleId : {}),
                                            // Ensure we have a title
                                            title: item?.bundleDetails?.title || 
                                                   (item?.bundleId && typeof item?.bundleId === 'object' && item?.bundleId?.title) ||
                                                   item?.title ||
                                                   'Bundle',
                                            // Debug info
                                            _debug: {
                                              originalItem: item,
                                              itemType: item?.itemType,
                                              hasBundleDetails: !!item?.bundleDetails,
                                              hasBundleId: !!item?.bundleId,
                                              bundleIdType: typeof item?.bundleId
                                            }
                                          };
                                          console.log('Bundle button clicked - sending data:', bundleData);
                                          handleShowBundleItems(bundleData, order);
                                        }}
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                                          isCancelled || isItemCancelled
                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-not-allowed opacity-60' 
                                            : isItemCancellationRequested 
                                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 cursor-not-allowed opacity-75'
                                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                                        }`}
                                        title={
                                          isItemCancelled ? "Item cancelled - cannot view details" : 
                                          isItemCancellationRequested ? "Cancellation requested - please wait for admin decision" :
                                          "View all items in this bundle"
                                        }
                                        disabled={isItemCancelled || isItemCancellationRequested}
                                      >
                                        <FaBox className="w-3 h-3 mr-1" />
                                        View Items
                                      </button>
                                    )}
                                    {/* Display product size if available and item is not a bundle */}
                                    {item?.itemType !== 'bundle' && (item?.size || item?.productDetails?.size) && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                        isCancelled || isItemCancelled ? 'bg-red-50 text-red-700 line-through' : 
                                        isItemCancellationRequested ? 'bg-orange-50 text-orange-700' :
                                        'bg-purple-50 text-purple-700'
                                      }`}>
                                        Size: {item?.size || item?.productDetails?.size}
                                      </span>
                                    )}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                      isCancelled || isItemCancelled ? 'bg-red-50 text-red-700 line-through' : 
                                      isItemCancellationRequested ? 'bg-orange-50 text-orange-700' :
                                      'bg-blue-50 text-blue-700'
                                    }`}>
                                      Qty: {item?.quantity}
                                    </span>
                                    {/* Size-based price per unit display */}
                                    {(() => {
                                      const isBundle = item?.itemType === 'bundle';
                                      let unitPrice = 0;
                                      let priceLabel = '/unit';
                                      
                                      if (isBundle) {
                                        unitPrice = item?.bundleId?.bundlePrice || item?.bundleDetails?.bundlePrice || 0;
                                        priceLabel = '/bundle';
                                      } else {
                                        // Use size-based pricing for products
                                        const productInfo = item?.productId || item?.productDetails;
                                        unitPrice = getSizeBasedUnitPrice(item, productInfo);
                                        
                                        // Add size info to label if size exists
                                        if (item?.size) {
                                          priceLabel = `/unit (${item.size})`;
                                        }
                                      }
                                      
                                      return (
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                          isCancelled || isItemCancelled
                                            ? 'bg-red-100 text-red-700 line-through' 
                                            : isItemCancellationRequested
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          ₹{unitPrice?.toFixed(2)}{priceLabel}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {/* Enhanced pricing display with size-based pricing - Following PaymentPage logic */}
                                  <div className="space-y-1">
                                    {(() => {
                                      const isBundle = item?.itemType === 'bundle';
                                      let originalPrice = 0;
                                      let finalPrice = 0;
                                      let hasDiscount = false;
                                      
                                      if (isBundle) {
                                        // For bundles, use original bundle pricing
                                        originalPrice = item?.bundleId?.originalPrice || item?.bundleDetails?.originalPrice || 0;
                                        finalPrice = item?.bundleId?.bundlePrice || item?.bundleDetails?.bundlePrice || 0;
                                        hasDiscount = originalPrice > finalPrice && originalPrice > 0;
                                      } else {
                                        // For products, follow PaymentPage logic: Calculate both original and final prices correctly
                                        const productInfo = item?.productId || item?.productDetails;
                                        const basePrice = productInfo?.price || 0;
                                        const discount = productInfo?.discount || 0;
                                        const size = item?.size;
                                        
                                        // Step 1: Calculate original price with size adjustments (this should be the higher price)
                                        const sizeMultipliers = {
                                          'XS': 0.9, 'S': 1.0, 'M': 1.1, 'L': 1.2, 'XL': 1.3, 'XXL': 1.4,
                                          '28': 0.9, '30': 1.0, '32': 1.1, '34': 1.2, '36': 1.3, '38': 1.4, '40': 1.5, '42': 1.6
                                        };
                                        const multiplier = size ? (sizeMultipliers[size] || sizeMultipliers[size.toUpperCase()] || 1.0) : 1.0;
                                        
                                        // Use stored sizeAdjustedPrice as original if available, otherwise calculate
                                        if (item?.sizeAdjustedPrice && item.sizeAdjustedPrice > 0) {
                                          originalPrice = item.sizeAdjustedPrice;
                                          // Apply discount to get final price
                                          finalPrice = discount > 0 ? originalPrice * (1 - discount/100) : originalPrice;
                                        } else {
                                          // Calculate original price (before discount)
                                          originalPrice = basePrice * multiplier;
                                          // Apply discount to get final price
                                          finalPrice = discount > 0 ? originalPrice * (1 - discount/100) : originalPrice;
                                        }
                                        
                                        hasDiscount = discount > 0 && originalPrice > finalPrice;
                                      }
                                      
                                      return (
                                        <>
                                          {/* Show original price per unit if there's a discount (this should be the higher price) */}
                                          {hasDiscount && (
                                            <div className={`text-xs ${
                                              isCancelled || isItemCancelled ? 'text-red-500 line-through opacity-60' : 
                                              isItemCancellationRequested ? 'text-orange-500 opacity-75' :
                                              'text-gray-500 line-through'
                                            }`}>
                                              Original: ₹{originalPrice?.toFixed(2)}
                                              {!isBundle && item?.productId?.discount && (
                                                <span className={`ml-1 ${isItemCancelled ? 'text-red-600' : 'text-orange-600'}`}>({item.productId.discount}% off)</span>
                                              )}
                                              {!isBundle && item?.size && (
                                                <span className={`ml-1 ${isItemCancelled ? 'text-red-600' : 'text-purple-600'}`}>(Size: {item.size})</span>
                                              )}
                                              {isBundle && (
                                                <span className={`ml-1 ${isItemCancelled ? 'text-red-600' : 'text-blue-600'}`}>(Bundle Savings)</span>
                                              )}
                                            </div>
                                          )}
                                          
                                          {/* Final/Discounted Price per unit (this should be the lower price after discount) */}
                                          <div className={`font-bold text-sm sm:text-base ${
                                            isCancelled || isItemCancelled ? 'text-red-800 line-through opacity-75' : 
                                            isItemCancellationRequested ? 'text-orange-800 opacity-90' :
                                            'text-black'
                                          }`}>
                                            {hasDiscount ? 'Discounted' : 'Unit'} Price: ₹{finalPrice?.toFixed(2)}
                                            {!isBundle && item?.size && (() => {
                                              const sizeMultipliers = {
                                                'XS': 0.9, 'S': 1.0, 'M': 1.1, 'L': 1.2, 'XL': 1.3, 'XXL': 1.4,
                                                '28': 0.9, '30': 1.0, '32': 1.1, '34': 1.2, '36': 1.3, '38': 1.4, '40': 1.5, '42': 1.6
                                              };
                                              const multiplier = sizeMultipliers[item.size] || sizeMultipliers[item.size.toUpperCase()] || 1.0;
                                              const hasDiscount = item?.productId?.discount && item.productId.discount > 0;
                                              
                                              if (hasDiscount && multiplier !== 1.0) {
                                                return (
                                                  <span className={`ml-1 text-xs font-normal ${
                                                    isCancelled || isItemCancelled ? 'text-red-600' : 'text-green-600'
                                                  }`}>
                                                    (Size {item.size} + {item.productId.discount}% Off)
                                                  </span>
                                                );
                                              } else if (hasDiscount) {
                                                return (
                                                  <span className={`ml-1 text-xs font-normal ${
                                                    isCancelled || isItemCancelled ? 'text-red-600' : 'text-green-600'
                                                  }`}>
                                                    ({item.productId.discount}% Off)
                                                  </span>
                                                );
                                              } else if (multiplier !== 1.0) {
                                                return (
                                                  <span className={`ml-1 text-xs font-normal ${
                                                    isCancelled || isItemCancelled ? 'text-red-600' : 'text-purple-600'
                                                  }`}>
                                                    (Size {item.size})
                                                  </span>
                                                );
                                              }
                                              return null;
                                            })()}
                                            {isBundle && hasDiscount && (
                                              <span className={`ml-1 text-xs font-normal ${
                                                isCancelled || isItemCancelled ? 'text-red-600' : 'text-green-600'
                                              }`}>
                                                (Bundle Discount)
                                              </span>
                                            )}
                                          </div>
                                          
                                          {/* Add refund breakdown for cancelled items */}
                                          {(isItemCancelled && !isCancelled) && (() => {
                                            // Get item price and calculate refund details
                                            const itemPrice = finalPrice * (item?.quantity || 1);
                                            
                                            // Find refund percentage
                                            const orderCancelRequest = orderCancellationRequests.find(
                                              req => req.orderId === order._id || req.orderId?._id === order._id
                                            );
                                            
                                            const defaultRefundPercentage = 90;
                                            let refundPercentage = defaultRefundPercentage;
                                            
                                            if (orderCancelRequest?.adminResponse?.refundPercentage) {
                                              refundPercentage = orderCancelRequest.adminResponse.refundPercentage;
                                            } else if (orderCancelRequest?.adminResponse?.calculatedRefundPercentage) {
                                              refundPercentage = orderCancelRequest.adminResponse.calculatedRefundPercentage;
                                            } else if (item.refundPercentage) {
                                              refundPercentage = item.refundPercentage;
                                            }
                                            
                                            const refundAmount = (itemPrice * refundPercentage) / 100;
                                            const retainedAmount = itemPrice - refundAmount;
                                            
                                            return (
                                              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-md p-1.5">
                                                <div className="text-xs text-blue-700">
                                                  <div className="font-medium mb-0.5">Refund Details:</div>
                                                  <div className="grid grid-cols-2 gap-x-2 text-[11px]">
                                                    <div>Item Price:</div>
                                                    <div className="text-right">₹{itemPrice.toFixed(2)}</div>
                                                    
                                                    <div>Refund Rate:</div>
                                                    <div className="text-right">{refundPercentage}%</div>
                                                    
                                                    <div>Refund Amount:</div>
                                                    <div className="text-right text-green-600 font-medium">₹{refundAmount.toFixed(2)}</div>
                                                    
                                                    <div>Retained Fee:</div>
                                                    <div className="text-right text-red-600">₹{retainedAmount.toFixed(2)}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                    
                    {/* Price Details */}
                    <div className={`mt-4 p-3 sm:p-4 rounded-lg border ${
                      isCancelled ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-gray-300 shadow-sm'
                    }`}>
                      <div className="p-2 sm:p-3">
                        <div className="space-y-3">
                          {/* Delivery Charge */}
                          <div className="flex justify-between items-center">
                            <span className={`text-sm sm:text-base ${
                              isCancelled ? 'text-red-700' : 'text-gray-800'
                            } font-medium`}>
                              Delivery Charge
                            </span>
                            <span className={`font-semibold text-sm sm:text-base ${
                              isCancelled ? 'text-red-800' : 'text-black'
                            }`}>
                              {(() => {
                                // Use PricingService to get the delivery charge consistently
                                const deliveryCharge = order?.deliveryCharge || 0;
                                
                                // If we need to recalculate (only if deliveryCharge is missing from order)
                                if (!order?.deliveryCharge && order?.subTotalAmt) {
                                  const calculatedCharge = PricingService.calculateDeliveryCharge(
                                    order.subTotalAmt,
                                    order.deliveryDistance || 0
                                  );
                                  return calculatedCharge > 0 ? `₹${calculatedCharge.toFixed(2)}` : 'FREE';
                                }
                                
                                return deliveryCharge > 0 ? `₹${deliveryCharge.toFixed(2)}` : 'FREE';
                              })()}
                            </span>
                          </div>
                          
                          {/* Total Amount - with size-based pricing calculation */}
                          <div className="border-t border-gray-300 pt-4 mt-4">
                            <div className="flex justify-between items-center">
                              <span className={`font-bold text-base sm:text-lg ${
                                isCancelled ? 'text-red-800' : 'text-black'
                              }`}>
                                Total Amount
                              </span>
                              <span className={`font-extrabold text-lg ${
                                isCancelled ? 'text-red-800 line-through' : 'text-black'
                              }`}>
                                {(() => {
                                  // Use order.totalAmt as the primary source since it's what was actually charged
                                  const originalOrderTotal = order?.totalAmt || 0;
                                  
                                  // If order is fully cancelled, show original amount with strikethrough
                                  if (isCancelled) {
                                    return `₹${originalOrderTotal.toFixed(2)}`;
                                  }
                                  
                                  // Check if any items are cancelled
                                  const hasCancelledItems = order?.items?.some(item => 
                                    item?.status === 'Cancelled' || item?.cancelApproved === true
                                  );
                                  
                                  if (hasCancelledItems) {
                                    // Calculate current total properly accounting for cancelled items with refund percentages
                                    // This ensures the display matches the actual refund calculation
                                    let currentTotal = 0;
                                    const debugData = {
                                      orderId: order?._id,
                                      originalTotal: originalOrderTotal,
                                      items: []
                                    };
                                    
                                    // Find the cancellation requests for this order to get refund percentages
                                    const orderCancelRequest = orderCancellationRequests.find(
                                      req => req.orderId === order._id || req.orderId?._id === order._id
                                    );
                                    
                                    const defaultRefundPercentage = 90; // Default fallback if we can't find specific percentage
                                    
                                    order?.items?.forEach((item, index) => {
                                      const isItemCancelled = item?.status === 'Cancelled' || item?.cancelApproved === true;
                                      
                                      if (!isItemCancelled) {
                                        // Normal item - add full price
                                        const itemTotal = item?.itemTotal || calculateSizeBasedPrice(item);
                                        currentTotal += itemTotal;
                                        
                                        debugData.items.push({
                                          index,
                                          name: item?.itemType === 'bundle' ? item?.bundleDetails?.title : item?.productDetails?.name,
                                          itemType: item?.itemType,
                                          quantity: item?.quantity,
                                          calculatedTotal: itemTotal,
                                          storedItemTotal: item?.itemTotal,
                                          calculatedPrice: calculateSizeBasedPrice(item),
                                          priceSource: item?.itemTotal ? 'stored' : 'calculated',
                                          unitPrice: item?.unitPrice,
                                          sizeAdjustedPrice: item?.sizeAdjustedPrice,
                                          size: item?.size,
                                          isCancelled: isItemCancelled
                                        });
                                      } else {
                                        // Cancelled item - add the retained amount (non-refunded portion)
                                        const itemTotal = item?.itemTotal || calculateSizeBasedPrice(item);
                                        
                                        // Try to find the refund percentage from the cancellation request
                                        let refundPercentage = defaultRefundPercentage; // Default 90%
                                        
                                        // If we have refund information, use it
                                        if (orderCancelRequest?.adminResponse?.refundPercentage) {
                                          refundPercentage = orderCancelRequest.adminResponse.refundPercentage;
                                        } else if (item.refundPercentage) {
                                          refundPercentage = item.refundPercentage;
                                        }
                                        
                                        // Calculate the retained amount (what's not refunded)
                                        const retainedPercentage = 100 - refundPercentage;
                                        const retainedAmount = (itemTotal * retainedPercentage) / 100;
                                        
                                        // Add the retained amount to the current total
                                        currentTotal += retainedAmount;
                                        
                                        debugData.items.push({
                                          index,
                                          name: item?.itemType === 'bundle' ? item?.bundleDetails?.title : item?.productDetails?.name,
                                          itemType: item?.itemType,
                                          quantity: item?.quantity,
                                          isCancelled: isItemCancelled,
                                          itemTotal: itemTotal,
                                          refundPercentage: refundPercentage,
                                          retainedPercentage: retainedPercentage,
                                          retainedAmount: retainedAmount,
                                          status: 'PARTIALLY_REFUNDED'
                                        });
                                      }
                                    });
                                    
                                    // Add delivery charge to current total (only if there are remaining items)
                                    let deliveryCharge = order?.deliveryCharge || 0;
                                    const remainingItemsCount = order?.items?.filter(item => 
                                      !(item?.status === 'Cancelled' || item?.cancelApproved === true)
                                    ).length || 0;
                                    
                                    // Recalculate delivery charge if needed
                                    if (!order?.deliveryCharge && order?.subTotalAmt) {
                                      deliveryCharge = PricingService.calculateDeliveryCharge(
                                        order.subTotalAmt,
                                        order.deliveryDistance || 0
                                      );
                                    }
                                    
                                    // Only add delivery charge if there are remaining items to deliver
                                    if (remainingItemsCount > 0) {
                                      currentTotal += deliveryCharge;
                                    }
                                    
                                    debugData.deliveryCharge = deliveryCharge;
                                    debugData.remainingItemsCount = remainingItemsCount;
                                    debugData.deliveryChargeApplied = remainingItemsCount > 0;
                                    debugData.finalCurrentTotal = currentTotal;
                                    
                                    console.log('💰 Price Calculation Debug:', debugData);
                                    
                                    // Calculate total refunded amount
                                    const totalRefunded = originalOrderTotal - currentTotal;
                                    
                                    return (
                                      <>
                                        <div className="flex items-center">
                                          <span className="line-through text-gray-500 text-sm mr-2">
                                            ₹{originalOrderTotal.toFixed(2)}
                                          </span>
                                          <span className="text-green-700 font-bold">
                                            ₹{currentTotal.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex flex-col mt-1">
                                          <div className="text-xs text-green-600">
                                            Order amount has been partially refunded
                                          </div>
                                        
                                        </div>
                                      </>
                                    );
                                  }
                                  
                                  // No cancelled items, show original total
                                  return `₹${originalOrderTotal.toFixed(2)}`;
                                })()}
                              </span>
                            </div>
                            
                            {/* Enhanced cancelled items and pending requests info */}
                            {(() => {
                              // Check if any items are cancelled but the order is not fully cancelled
                              const hasCancelledItems = order?.items?.some(item => 
                                (item?.status === 'Cancelled' || item?.cancelApproved === true)
                              );
                              
                              // Check if any items have pending cancellation requests
                              const hasPendingItemRequests = order?.items?.some(item => 
                                hasItemPendingCancellationRequest(order._id, item._id)
                              );
                              
                              // Check if full order has pending cancellation request
                              const hasFullOrderPendingRequest = hasFullOrderPendingCancellationRequest(order._id);
                              
                              if ((hasCancelledItems || hasPendingItemRequests || hasFullOrderPendingRequest) && !isCancelled) {
                                const cancelledItems = order?.items?.filter(item => 
                                  item?.status === 'Cancelled' || item?.cancelApproved === true
                                );
                                
                                const pendingItems = order?.items?.filter(item => 
                                  hasItemPendingCancellationRequest(order._id, item._id)
                                );
                                
                                return (
                                  <div className="mt-3 p-3 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center text-gray-800 font-semibold text-sm mb-2">
                                      {hasCancelledItems && <FaBan className="mr-2 text-red-500" />}
                                      {(hasPendingItemRequests || hasFullOrderPendingRequest) && <FaClock className="mr-2 text-orange-500 animate-pulse" />}
                                      <span>Order Status Updates</span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {/* Cancelled items info */}
                                      {hasCancelledItems && (
                                        <div className="text-xs text-red-600 flex flex-wrap items-center gap-2">
                                          {(() => {
                                            // Find the cancellation request to display refund percentage info
                                            const orderCancelRequest = orderCancellationRequests.find(
                                              req => req.orderId === order._id || req.orderId?._id === order._id
                                            );
                                            const refundPercentage = orderCancelRequest?.adminResponse?.refundPercentage || 90;
                                            
                                            return (
                                              <span className="font-medium">
                                                Refund at {refundPercentage}% of item value applied
                                              </span>
                                            );
                                          })()}
                                          <span className="bg-red-100 px-2 py-1 rounded-full font-medium">
                                            {cancelledItems.length} of {order?.items?.length} item(s) cancelled
                                          </span>
                                          <span className="text-red-500">• Order amount has been partially refunded</span>
                                        </div>
                                      )}
                                      
                                      {/* Pending item requests info */}
                                      {hasPendingItemRequests && (
                                        <div className="text-xs text-orange-600 flex flex-wrap items-center gap-2">
                                          <span className="bg-orange-100 px-2 py-1 rounded-full font-medium animate-pulse">
                                            {pendingItems.length} of {order?.items?.length} item(s) cancellation requested
                                          </span>
                                          <span className="text-orange-500">• Awaiting admin approval</span>
                                        </div>
                                      )}
                                      
                                      {/* Full order pending request info */}
                                      {hasFullOrderPendingRequest && (
                                        <div className="text-xs text-yellow-600 flex flex-wrap items-center gap-2">
                                          <span className="bg-yellow-100 px-2 py-1 rounded-full font-medium animate-pulse">
                                            Full order cancellation requested
                                          </span>
                                          <span className="text-yellow-600">• Awaiting admin approval</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Show refund percentage info for cancelled items */}
                                    {hasCancelledItems && (
                                      <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2">
                                        <div className="text-xs text-blue-700 font-medium mb-1 flex items-center">
                                          <FaInfoCircle className="mr-1.5 text-blue-500" />
                                          Refund Information
                                        </div>
                                        <div className="text-xs text-blue-600">
                                          {(() => {
                                            // Find the cancellation requests for this order to get refund percentages
                                            const orderCancelRequest = orderCancellationRequests.find(
                                              req => req.orderId === order._id || req.orderId?._id === order._id
                                            );
                                            
                                            // Default refund percentage if we can't find the specific one
                                            const defaultRefundPercentage = 90;
                                            
                                            // Get the actual refund percentage
                                            let refundPercentage = defaultRefundPercentage;
                                            if (orderCancelRequest?.adminResponse?.refundPercentage) {
                                              refundPercentage = orderCancelRequest.adminResponse.refundPercentage;
                                            } else if (orderCancelRequest?.adminResponse?.calculatedRefundPercentage) {
                                              refundPercentage = orderCancelRequest.adminResponse.calculatedRefundPercentage;
                                            }
                                            
                                            return (
                                              <>
                                                <p>
                                                  For cancelled items, a {refundPercentage}% refund has been approved.
                                                  The remaining {100 - refundPercentage}% is retained as cancellation fee.
                                                </p>
                                                <p className="mt-1">
                                                  Original price of cancelled items: ₹{cancelledItems.reduce((total, item) => {
                                                    const itemPrice = item?.itemTotal || calculateSizeBasedPrice(item);
                                                    return total + itemPrice;
                                                  }, 0).toFixed(2)}
                                                </p>
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="mt-2 text-xs text-gray-600">
                                      {hasCancelledItems && "Cancelled items are highlighted above with red borders and crossed-out styling. "}
                                      {(hasPendingItemRequests || hasFullOrderPendingRequest) && "Items with pending cancellation requests are highlighted with orange borders and clock icons."}
                                    </div>
                                  </div>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`h-0.5 w-12 sm:w-16 md:w-20 rounded-full mt-2 ${
                      isCancelled ? 'bg-red-400' : 'bg-black'
                    }`}></div>
                  </div>
                  
                  {/* Order Timeline */}
                  <div className={`rounded-lg p-3 sm:p-4 md:p-5 border ${
                    isCancelled 
                      ? 'bg-red-50 border-red-200 shadow-sm' 
                      : 'bg-white border-gray-300 shadow-sm'
                  }`}>
                    <h4 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg ${
                      isCancelled ? 'text-red-800' : 'text-black'
                    } tracking-tight`}>
                      <FaBox className={`text-sm sm:text-base ${isCancelled ? 'text-red-600' : 'text-black'}`} />
                      Order Status
                    </h4>
                    <OrderTimeline status={order?.orderStatus} />
                  </div>
                  
                  {/* Refund Status Section - Only for Cancelled Orders */}
                  {isCancelled && (
                    <div className="rounded-lg p-3 sm:p-4 md:p-5 border bg-white border-gray-300 shadow-sm">
                      <h4 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg text-black tracking-tight">
                        <FaCreditCard className="text-sm sm:text-base text-gray-800" />
                        Refund Status
                      </h4>
                      <div className="rounded-lg border border-gray-300 p-3 sm:p-4 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-black text-white p-1.5 sm:p-2 rounded-full flex items-center justify-center">
                              <FaMoneyBill className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </div>
                            <span className="font-semibold text-black text-sm sm:text-base">Current Status:</span>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            {getRefundStatusDisplay(order._id, order.orderStatus)}
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 text-xs sm:text-sm text-gray-700 flex items-start gap-2 sm:gap-3">
                          <FaInfoCircle className="text-black mt-0.5 flex-shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <p className="leading-relaxed">
                            {(() => {
                              const status = getRefundStatusFromRequests(order._id)?.toUpperCase();
                              switch (status) {
                                case 'COMPLETED':
                                  return "Your refund has been processed successfully. It may take 3-5 business days to reflect in your account.";
                                case 'PROCESSING':
                                  return "Your refund is currently being processed. You will receive an update soon.";
                                case 'FAILED':
                                  return "There was an issue processing your refund. Please contact support for assistance.";
                                case 'PENDING':
                                  return "Your refund request is pending. Our team will process it shortly.";
                                case 'NOT_APPLICABLE':
                                  return "This order does not require a refund or has already been handled.";
                                default:
                                  return "We are processing your refund. Please check back for updates.";
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Customer Info - Responsive */}
                  {/* <div className={`rounded-lg p-2 sm:p-3 md:p-4 border ${
                    isCancelled 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}> */}
                    {/* <h4 className={`font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base ${
                      isCancelled ? 'text-red-800' : 'text-black'
                    }`}>
                      <FaUser className={`text-xs sm:text-sm ${isCancelled ? 'text-red-600' : 'text-black'}`} />
                      Customer Information
                    </h4> */}
                    <div className='space-y-1 sm:space-y-2 ml-4 sm:ml-6'>
                      {/* <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                        <span className={`font-medium text-xs sm:text-sm ${isCancelled ? 'text-red-700' : 'text-gray-700'}`}>Name:</span>
                        <span className={`font-semibold text-xs sm:text-sm break-words ${isCancelled ? 'text-red-800' : 'text-black'}`}>
                          {order?.userId?.name}
                        </span>
                      </div> */}
                      {/* <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                        <div className='flex items-center gap-1 sm:gap-2'>
                          <FaEnvelope className={`text-xs ${isCancelled ? 'text-red-600' : 'text-black'}`} />
                          <span className={`font-medium text-xs sm:text-sm ${isCancelled ? 'text-red-700' : 'text-gray-700'}`}>Email:</span>
                        </div>
                        <span className={`text-xs sm:text-sm break-all ${isCancelled ? 'text-red-600' : 'text-gray-600'}`}>
                          {order?.userId?.email}
                        </span>
                      </div> */}
                      {/* <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                        <div className='flex items-center gap-1 sm:gap-2'>
                          <FaCalendar className={`text-xs ${isCancelled ? 'text-red-600' : 'text-black'}`} />
                          <span className={`font-medium text-xs sm:text-sm ${isCancelled ? 'text-red-700' : 'text-gray-700'}`}>Order Date:</span>
                        </div>
                        <span className={`font-semibold text-xs sm:text-sm break-words ${isCancelled ? 'text-red-800' : 'text-black'}`}>
                          {new Date(order?.orderDate).toLocaleString()}
                        </span>
                      </div> */}
                      
                      {/* Delivery Date Information */}
                      {/* {order?.estimatedDeliveryDate && (
                        <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                          <div className='flex items-center gap-1 sm:gap-2'>
                            <FaTruck className={`text-xs ${isCancelled ? 'text-red-600' : 'text-green-600'}`} />
                            <span className={`font-medium text-xs sm:text-sm ${isCancelled ? 'text-red-700' : 'text-gray-700'}`}>
                              {order?.actualDeliveryDate ? 'Delivered On:' : 'Est. Delivery:'}
                            </span>
                          </div>
                          <span className={`font-semibold text-xs sm:text-sm break-words ${
                            isCancelled ? 'text-red-800' : 
                            order?.actualDeliveryDate ? 'text-green-800' : 'text-blue-800'
                          }`}>
                            {order?.actualDeliveryDate 
                              ? new Date(order.actualDeliveryDate).toLocaleDateString()
                              : new Date(order.estimatedDeliveryDate).toLocaleDateString()
                            }
                          </span>
                        </div>
                      )} */}
                      
                      {/* Delivery Notes */}
                      {/* {order?.deliveryNotes && (
                        <div className='flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2'>
                          <div className='flex items-center gap-1 sm:gap-2'>
                            <FaInfoCircle className={`text-xs ${isCancelled ? 'text-red-600' : 'text-blue-600'}`} />
                            <span className={`font-medium text-xs sm:text-sm ${isCancelled ? 'text-red-700' : 'text-gray-700'}`}>Delivery Notes:</span>
                          </div>
                          <span className={`font-medium text-xs sm:text-sm break-words ${isCancelled ? 'text-red-800' : 'text-gray-800'}`}>
                            {order.deliveryNotes}
                          </span>
                        </div>
                      )} */}
                    </div>
                  {/* </div> */}
                  
                  {/* Delivery Address - Enhanced Responsive */}
                  <div className={`rounded-lg p-3 sm:p-4 md:p-5 border ${
                    isCancelled 
                      ? 'bg-red-50 border-red-200 shadow-sm' 
                      : 'bg-white border-gray-300 shadow-sm'
                  }`}>
                    <div className='flex items-center gap-2 mb-3 sm:mb-4'>
                      <FaMapMarkerAlt className={`text-sm sm:text-base ${isCancelled ? 'text-red-600' : 'text-black'}`} />
                      <span className={`font-bold text-base sm:text-lg ${isCancelled ? 'text-red-800' : 'text-black'} tracking-tight`}>
                        Delivery Address
                      </span>
                      {isCancelled && (
                        <span className="text-xs text-red-600 font-semibold ml-2">(Order Cancelled)</span>
                      )}
                    </div>
                    <div className='space-y-2 sm:space-y-3 ml-4 sm:ml-6'>
                      {/* Street Address */}
                      <div className={`rounded-md p-3 sm:p-4 border ${
                        isCancelled 
                          ? 'bg-red-25 border-red-200' 
                          : 'bg-white border-gray-300'
                      } shadow-sm`}>
                        <div className='flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3'>
                          <span className={`font-semibold text-sm sm:text-base min-w-fit ${isCancelled ? 'text-red-700' : 'text-gray-800'}`}>Street:</span>
                          <span className={`font-medium text-sm sm:text-base break-words ${isCancelled ? 'text-red-800' : 'text-black'}`}>
                            {order?.deliveryAddress?.address_line}
                          </span>
                        </div>
                      </div>
                      
                      {/* City & State - Responsive Grid */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3'>
                        <div className={`rounded-md p-3 sm:p-4 border ${
                          isCancelled 
                            ? 'bg-red-25 border-red-200' 
                            : 'bg-white border-gray-300'
                        } shadow-sm`}>
                          <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                            <div className='flex items-center gap-2 sm:gap-3'>
                              <FaCity className={`text-sm ${isCancelled ? 'text-red-600' : 'text-black'}`} />
                              <span className={`font-semibold text-sm sm:text-base ${isCancelled ? 'text-red-700' : 'text-gray-800'}`}>City:</span>
                            </div>
                            <span className={`font-medium text-sm sm:text-base break-words ${isCancelled ? 'text-red-800' : 'text-black'}`}>
                              {order?.deliveryAddress?.city}
                            </span>
                          </div>
                        </div>
                        
                        <div className={`rounded-md p-2 sm:p-3 border ${
                          isCancelled 
                            ? 'bg-red-25 border-red-200' 
                            : 'bg-white border-gray-200'
                        }`}>
                          <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                            <span className={`font-medium text-xs sm:text-sm ${isCancelled ? 'text-red-700' : 'text-gray-700'}`}>State:</span>
                            <span className={`font-medium text-xs sm:text-sm break-words ${isCancelled ? 'text-red-800' : 'text-black'}`}>
                              {order?.deliveryAddress?.state}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* PIN & Country - Responsive Grid */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3'>
                        <div className={`rounded-md p-3 sm:p-4 border ${
                          isCancelled 
                            ? 'bg-red-25 border-red-200' 
                            : 'bg-white border-gray-300'
                        } shadow-sm`}>
                          <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                            <div className='flex items-center gap-1 sm:gap-2'>
                              <FaMailBulk className={`text-xs ${isCancelled ? 'text-red-600' : 'text-black'}`} />
                              <span className={`font-medium text-xs sm:text-sm ${isCancelled ? 'text-red-700' : 'text-gray-700'}`}>PIN:</span>
                            </div>
                            <span className={`font-medium text-xs sm:text-sm ${isCancelled ? 'text-red-800' : 'text-black'}`}>
                              {order?.deliveryAddress?.pincode}
                            </span>
                          </div>
                        </div>
                        
                        <div className={`rounded-md p-2 sm:p-3 border ${
                          isCancelled 
                            ? 'bg-red-25 border-red-200' 
                            : 'bg-white border-gray-200'
                        }`}>
                          <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                            <div className='flex items-center gap-1 sm:gap-2'>
                              <FaFlag className={`text-xs ${isCancelled ? 'text-red-600' : 'text-black'}`} />
                              <span className={`font-medium text-xs sm:text-sm ${isCancelled ? 'text-red-700' : 'text-gray-700'}`}>Country:</span>
                            </div>
                            <span className={`font-medium text-xs sm:text-sm break-words ${isCancelled ? 'text-red-800' : 'text-black'}`}>
                              {order?.deliveryAddress?.country}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 gap-4">
                    {/* Action Buttons - Download Invoice & View Details */}
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Download Invoice Button */}
                
                      
                      {/* View Comprehensive Details Button */}
                      <button
                        onClick={() => fetchComprehensiveOrderDetails(order._id)}
                        disabled={loadingDetails && activeOrderId === order._id}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-colors ${
                          loadingDetails && activeOrderId === order._id
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 text-white border border-gray-800 hover:bg-black'
                        }`}
                      >
                        {loadingDetails && activeOrderId === order._id ? (
                          <>
                            <div className='w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin'></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <FaInfoCircle className='w-4 h-4' />
                            <span>View All Details</span>
                          </>
                        )}
                      </button>
                      
                      {/* Return Product Button - Only show for delivered orders */}
                      {order.orderStatus === 'DELIVERED' && (
                        <button
                          onClick={() => navigate(`/return-product?orderId=${order._id}`)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-colors bg-white text-gray-900 border-2 border-gray-800 hover:bg-gray-100"
                        >
                          <FaUndo className='w-4 h-4' />
                          <span>Return Products</span>
                        </button>
                      )}
                      
                      {/* Invoice Type Indicator */}
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                 
                        <span>
                          {order.orderStatus === 'DELIVERED' 
                            ? '' 
                            : order.orderStatus === 'CANCELLED' 
                            ? 'Cancelled Order Invoice' 
                            : 'Order Invoice'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Right side controls for non-cancelled orders */}
                    {!isCancelled && (
                      <div className="flex flex-col items-end">
                        {/* Cancellation restriction message */}
                        {order.orderStatus === 'OUT FOR DELIVERY' && (
                          <div className="mb-2 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 text-sm text-yellow-800 flex items-center">
                            <FaExclamationTriangle className="text-yellow-600 mr-2 flex-shrink-0" />
                            <span>Order is out for delivery and cannot be cancelled</span>
                          </div>
                        )}
                        
                        {order.orderStatus === 'DELIVERED' && (
                          <div className="mb-2 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm text-green-800 flex items-center">
                            <FaCheck className="text-green-600 mr-2 flex-shrink-0" />
                            <span>Order has been successfully delivered</span>
                          </div>
                        )}
                        
                        {hasPendingCancellationRequest(order._id) && (
                          <div className="mb-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-800 flex items-center">
                            <FaInfoCircle className="text-blue-600 mr-2 flex-shrink-0" />
                            <span>Cancellation request is pending admin approval</span>
                          </div>
                        )}
                        
                        {/* Cancel buttons */}
                        {canCancelOrder(order) && (
                          <div className="flex gap-2 flex-wrap">
                            {/* Full Order Cancellation */}
                            <button
                              onClick={() => handleCancelOrder(order)}
                              disabled={cancellingOrderId === order.orderId}
                              className={`px-5 py-2.5 rounded-md text-sm font-bold transition-colors ${
                                cancellingOrderId === order.orderId
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-red-700 border-2 border-red-600 hover:bg-red-50'
                              }`}
                            >
                              {cancellingOrderId === order.orderId ? (
                                <div className='flex items-center gap-2'>
                                  <div className='w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin'></div>
                                  <span>Processing...</span>
                                </div>
                              ) : (
                                <>
                                  <FaTimes className='inline w-4 h-4 mr-2' />
                                  Cancel Order
                                </>
                              )}
                            </button>

                            {/* Partial Item Cancellation - only show if order has multiple items */}
                            {/* {order.items && order.items.length > 1 && (
                              <button
                                onClick={() => handlePartialCancelOrder(order)}
                                disabled={cancellingOrderId === order.orderId}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                  cancellingOrderId === order.orderId
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                                }`}
                              >
                                <FaListAlt className='inline w-4 h-4 mr-2' />
                                Cancel Items
                              </button>
                            )} */}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Download button for cancelled orders - positioned on the right */}
                    {isCancelled && (
                      <div className="flex justify-end w-full">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <FaFilePdf className="text-red-500" />
                          <span>Download Cancelled Order Invoice</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      }

      {/* Cancel Order Confirmation Modal */}
      {/* Order Cancellation Modal */}
      {showCancellationModal && orderToCancel && (
        <OrderCancellationModal
          order={orderToCancel}
          onClose={() => {
            setShowCancellationModal(false);
            setOrderToCancel(null);
          }}
          onCancellationRequested={handleCancellationRequested}
        />
      )}

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          productType={selectedProductType}
          onClose={handleCloseProductModal}
          orderContext={orderContext}
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
      
      {/* Comprehensive Order Details Modal */}
      {showOrderDetailsModal && (
        <OrderDetailsModal
          order={detailedOrder}
          isLoading={loadingDetails}
          onClose={handleCloseOrderDetailsModal}
        />
      )}

      {/* Partial Cancellation Modal */}
      {showPartialCancellationModal && orderForPartialCancel && (
        <PartialCancellationModal
          isOpen={showPartialCancellationModal}
          onClose={() => setShowPartialCancellationModal(false)}
          order={orderForPartialCancel}
          onCancellationSuccess={handlePartialCancellationSuccess}
        />
      )}
    </div>
  )
}

export default MyOrders