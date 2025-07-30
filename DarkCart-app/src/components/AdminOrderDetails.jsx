import React, { useState, useEffect } from 'react';  
import { FaMapMarkerAlt, FaCity, FaFlag, FaTimes, FaUser, FaCalendarAlt, FaBox, FaMoneyBillWave, FaTruck, FaCheck, FaCog, FaBan, FaBoxOpen, FaInfoCircle, FaExclamationCircle, FaEnvelope, FaUndo, FaCreditCard, FaSpinner, FaExclamationTriangle, FaClock, FaFileInvoice, FaRupeeSign, FaReceipt, FaTag, FaPercentage } from 'react-icons/fa';
import OrderTimeline from './OrderTimeline';
import { useGlobalContext } from '../provider/GlobalProvider';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';

const AdminOrderDetails = ({ order, onClose }) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order?.orderStatus || '');
  const [localOrderStatus, setLocalOrderStatus] = useState(order?.orderStatus || '');
  const [cancellationDetails, setCancellationDetails] = useState(null);
  const [loadingCancellation, setLoadingCancellation] = useState(false);
  const [modificationPermission, setModificationPermission] = useState({ canModify: true, reason: '' });
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [orderCancellationRequests, setOrderCancellationRequests] = useState([]);
  
  // Return management states
  const [orderReturnData, setOrderReturnData] = useState(null);
  const [loadingReturnData, setLoadingReturnData] = useState(false);
  const [lastReturnDataUpdate, setLastReturnDataUpdate] = useState(null);
  
  const { updateOrderStatus, checkOrderModificationPermission } = useGlobalContext();

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

      const basePrice = product?.price || product?.bundlePrice || 0;
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
    const totalPrice = calculateSizeBasedPrice(item, productInfo);
    return totalPrice / (item?.quantity || 1);
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

  // Check if a specific item has a pending cancellation request
  const hasItemPendingCancellationRequest = (orderId, itemId) => {
    return orderCancellationRequests.some(request => {
      const matchesOrder = request.orderId === orderId || request.orderId?._id === orderId;
      const isPending = request.status === 'pending';
      const hasItem = request.items && request.items.some(item => item.itemId === itemId || item.itemId?._id === itemId);
      return matchesOrder && isPending && hasItem;
    });
  };

  // Check if the full order has a pending cancellation request
  const hasFullOrderPendingCancellationRequest = (orderId) => {
    return orderCancellationRequests.some(request => 
      (request.orderId === orderId || request.orderId?._id === orderId) && 
      request.status === 'pending' && 
      (!request.items || request.items.length === 0) // Full order cancellation typically has no specific items
    );
  };

  // Filter out cancelled items and calculate remaining totals
  const getActiveOrderInfo = (order) => {
    try {
      // Check all sources of cancellation data
      const hasOrderCancellation = order.cancellationData && order.cancellationData.itemsToCancel && order.cancellationData.itemsToCancel.length > 0;
      const hasApprovedCancellation = modificationPermission.approvedCancellation && modificationPermission.approvedCancellation.itemsToCancel && modificationPermission.approvedCancellation.itemsToCancel.length > 0;
      const hasRefundSummary = order.refundSummary && order.refundSummary.length > 0;
      
      // Get cancelled item IDs for quick lookup from all sources
      const cancelledItemIds = new Set();
      const returnedItemIds = new Set();
      
      // Add from order cancellation data
      if (hasOrderCancellation) {
        order.cancellationData.itemsToCancel.forEach(cancelledItem => {
          const itemId = cancelledItem.itemId?.toString() || cancelledItem._id?.toString();
          if (itemId) cancelledItemIds.add(itemId);
        });
      }
      
      // Add from approved cancellation data
      if (hasApprovedCancellation) {
        modificationPermission.approvedCancellation.itemsToCancel.forEach(cancelledItem => {
          const itemId = cancelledItem.itemId?.toString() || cancelledItem._id?.toString();
          if (itemId) cancelledItemIds.add(itemId);
        });
      }
      
      // Add from refund summary (completed refunds)
      if (hasRefundSummary) {
        order.refundSummary.forEach(refundItem => {
          // Include both completed refunds AND approved refunds
          if (refundItem.status === 'Completed' || refundItem.status === 'Approved') {
            const itemId = refundItem.itemId?.toString();
            if (itemId) cancelledItemIds.add(itemId);
          }
        });
      }
      
      // Check all cancellation requests for approved cancellations that haven't been refunded yet
      orderCancellationRequests.forEach(request => {
        const matchesOrder = request.orderId === order.orderId || request.orderId?._id === order.orderId;
        // Check if the request is APPROVED (not just pending)
        const isApproved = request.status === 'APPROVED';
        
        if (matchesOrder && isApproved && request.items && request.items.length > 0) {
          request.items.forEach(item => {
            const itemId = item.itemId?.toString() || item._id?.toString();
            if (itemId) cancelledItemIds.add(itemId);
          });
        }
      });

      // Check for returned items and add them to returnedItemIds
      if (order.items && orderReturnData?.items) {
        order.items.forEach(item => {
          const itemId = item._id?.toString() || item.id?.toString();
          if (hasItemBeenReturned(itemId)) {
            returnedItemIds.add(itemId);
          }
        });
      }

      // If no cancellation or return data, return original order
      if (cancelledItemIds.size === 0 && returnedItemIds.size === 0) {
        return {
          activeItems: order.items || [],
          activeItemCount: order.totalQuantity || order.items?.length || 0,
          remainingTotal: order.totalAmt || 0,
          remainingSubtotal: order.subTotalAmt || 0,
          deliveryCharge: order.deliveryCharge || 0,
          originalDeliveryCharge: order.deliveryCharge || 0,
          hasCancelledItems: false,
          hasReturnedItems: false,
          isTotallyCancelled: false
        };
      }

      // Filter out cancelled and returned items
      const activeItems = (order.items || []).filter(item => {
        const itemId = item._id?.toString() || item.id?.toString();
        return !cancelledItemIds.has(itemId) && !returnedItemIds.has(itemId);
      });

      // Calculate remaining totals
      let remainingSubtotal = 0;
      let activeItemCount = 0;

      activeItems.forEach(item => {
        const itemTotal = calculateSizeBasedPrice(item);
        remainingSubtotal += itemTotal;
        activeItemCount += item.quantity || 1;
      });

      // Add delivery charge only if there are active items (not fully cancelled)
      const deliveryCharge = order.deliveryCharge || 0;
      const shouldIncludeDeliveryCharge = activeItems.length > 0;
      const remainingTotal = remainingSubtotal + (shouldIncludeDeliveryCharge ? deliveryCharge : 0);

      return {
        activeItems,
        activeItemCount,
        remainingTotal,
        remainingSubtotal,
        deliveryCharge: shouldIncludeDeliveryCharge ? deliveryCharge : 0,
        originalDeliveryCharge: deliveryCharge,
        hasCancelledItems: cancelledItemIds.size > 0,
        hasReturnedItems: returnedItemIds.size > 0,
        isTotallyCancelled: activeItems.length === 0 && (order.items?.length > 0)
      };

    } catch (error) {
      console.error('Error calculating active order info:', error);
      // Fallback to original order data
      return {
        activeItems: order.items || [],
        activeItemCount: order.totalQuantity || order.items?.length || 0,
        remainingTotal: order.totalAmt || 0,
        remainingSubtotal: order.subTotalAmt || 0,
        deliveryCharge: order.deliveryCharge || 0,
        originalDeliveryCharge: order.deliveryCharge || 0,
        hasCancelledItems: false,
        hasReturnedItems: false,
        isTotallyCancelled: false
      };
    }
  };

  // Status options for dropdown
  const statusOptions = [
    { value: 'ORDER PLACED', label: 'Order Placed', icon: <FaBoxOpen className="text-blue-500" /> },
    { value: 'PROCESSING', label: 'Processing', icon: <FaCog className="text-yellow-500" /> },
    { value: 'OUT FOR DELIVERY', label: 'Out for Delivery', icon: <FaTruck className="text-orange-500" /> },
    { value: 'DELIVERED', label: 'Delivered', icon: <FaCheck className="text-green-500" /> },
    { value: 'CANCELLED', label: 'Cancelled', icon: <FaBan className="text-red-500" /> }
  ];

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleUpdateStatus = async () => {
    if (selectedStatus === localOrderStatus) {
      toast.error('Please select a different status');
      return;
    }

    // Check if order can be modified
    if (!modificationPermission.canModify) {
      toast.error(modificationPermission.reason || 'Order cannot be modified due to active cancellation request');
      return;
    }

    setUpdatingStatus(true);
    try {
      const statusLabel = statusOptions.find(option => option.value === selectedStatus)?.label || selectedStatus;
      
      const result = await updateOrderStatus(order.orderId, selectedStatus);
      
      if (result.success) {
        setLocalOrderStatus(selectedStatus);
        toast.success(`Order status updated to ${statusLabel}`);
        
        if (order) {
          order.orderStatus = selectedStatus;
        }
        
        // If status is changed to cancelled, fetch cancellation details
        if (selectedStatus === 'CANCELLED') {
          fetchCancellationDetails();
        }
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Handle specific error messages
        if (result.isBlocked) {
          toast.error(`${result.message}\nCancellation Status: ${result.cancellationStatus}`, {
            duration: 5000
          });
        } else {
          // toast.error(result.message || 'Failed to update order status');
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      // toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Check if order can be modified
  const checkModificationPermission = async () => {
    if (!order?.orderId) return;

    setCheckingPermission(true);
    try {
      const result = await checkOrderModificationPermission(order.orderId);
      if (result.success) {
        setModificationPermission({
          canModify: result.canModify,
          reason: result.reason,
          cancellationRequest: result.cancellationRequest,
          approvedCancellation: result.approvedCancellation
        });
      } else {
        setModificationPermission({
          canModify: false,
          reason: result.reason || 'Error checking modification permission'
        });
      }
    } catch (error) {
      console.error('Error checking modification permission:', error);
      setModificationPermission({
        canModify: false,
        reason: 'Error checking modification permission'
      });
    } finally {
      setCheckingPermission(false);
    }
  };

  // Fetch cancellation details for cancelled orders
  const fetchCancellationDetails = async () => {
    if (!order?.orderId) return;

    setLoadingCancellation(true);
    try {
      const response = await Axios({
        ...SummaryApi.getCancellationByOrderId,
        url: `${SummaryApi.getCancellationByOrderId.url}/${order.orderId}`
      });

      if (response.data.success) {
        setCancellationDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cancellation details:', error);
      // Don't show error toast as this is optional information
    } finally {
      setLoadingCancellation(false);
    }
  };

  // Fetch return data for this order
  const fetchOrderReturnData = async () => {
    if (!order?.orderId) return;
    
    try {
      setLoadingReturnData(true);
      const response = await Axios({
        ...SummaryApi.getOrderWithReturnDetails,
        url: `${SummaryApi.getOrderWithReturnDetails.url}/${order._id}?t=${Date.now()}` // Add timestamp to prevent caching
      });

      if (response.data.success) {
        setOrderReturnData(response.data.data);
        setLastReturnDataUpdate(new Date());
        console.log('Fetched fresh return data:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching return data:', error);
    } finally {
      setLoadingReturnData(false);
    }
  };

  // Fetch cancellation details when component mounts if order is cancelled
  useEffect(() => {
    if ((localOrderStatus === 'CANCELLED' || order?.orderStatus === 'CANCELLED')) {
      fetchCancellationDetails();
    }
    
    // Check modification permission for all orders
    checkModificationPermission();
    
    // Fetch cancellation requests to detect pending items
    fetchUserCancellationRequests();
    
    // Fetch return data if order is delivered - always refresh when modal opens
    if (order?.orderStatus === 'DELIVERED') {
      fetchOrderReturnData();
    }
  }, [order?.orderId, localOrderStatus]);

  // Additional useEffect to refresh return data when the modal is opened
  useEffect(() => {
    if (order && order.orderStatus === 'DELIVERED') {
      // Always fetch fresh return data when order details modal is opened
      fetchOrderReturnData();
    }
  }, [order]); // This will run whenever the order prop changes (i.e., when modal opens)

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Helper function to check if an item has a return request
  const hasItemReturnRequest = (itemId) => {
    if (!orderReturnData?.items) return [];
    const item = orderReturnData.items.find(item => 
      item._id === itemId && item.returnRequests && item.returnRequests.length > 0
    );
    return item ? item.returnRequests : [];
  };

  // Helper function to get return status display info
  const getReturnStatusInfo = (status) => {
    switch (status) {
      case 'REQUESTED':
        return { color: 'text-yellow-700 bg-yellow-100 border-yellow-300', icon: 'FaClock', label: 'Return Requested' };
      case 'APPROVED':
        return { color: 'text-green-700 bg-green-100 border-green-300', icon: 'FaCheck', label: 'Return Approved' };
      case 'REJECTED':
        return { color: 'text-red-700 bg-red-100 border-red-300', icon: 'FaTimes', label: 'Return Rejected' };
      case 'PICKUP_SCHEDULED':
        return { color: 'text-blue-700 bg-blue-100 border-blue-300', icon: 'FaTruck', label: 'Pickup Scheduled' };
      case 'PICKED_UP':
        return { color: 'text-indigo-700 bg-indigo-100 border-indigo-300', icon: 'FaBox', label: 'Item Picked Up' };
      case 'INSPECTED':
        return { color: 'text-purple-700 bg-purple-100 border-purple-300', icon: 'FaEye', label: 'Item Inspected' };
      case 'REFUND_PROCESSED':
        return { color: 'text-teal-700 bg-teal-100 border-teal-300', icon: 'FaRupeeSign', label: 'Refund Processed' };
      case 'COMPLETED':
        return { color: 'text-emerald-700 bg-emerald-100 border-emerald-300', icon: 'FaCheckCircle', label: 'Return Completed' };
      case 'CANCELLED':
        return { color: 'text-gray-700 bg-gray-100 border-gray-300', icon: 'FaTimes', label: 'Return Cancelled' };
      default:
        return { color: 'text-gray-700 bg-gray-100 border-gray-300', icon: 'FaInfoCircle', label: status?.replace('_', ' ') || 'Unknown Status' };
    }
  };

  // Helper function to check if an item has been returned (approved or completed returns)
  const hasItemBeenReturned = (itemId) => {
    const returnRequests = hasItemReturnRequest(itemId);
    return returnRequests.some(req => [
      'APPROVED', 
      'PICKUP_SCHEDULED', 
      'PICKED_UP', 
      'INSPECTED', 
      'REFUND_PROCESSED', 
      'COMPLETED'
    ].includes(req.status));
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
          <div className="flex items-center">
            <FaBox className="text-xl sm:text-2xl mr-2.5 text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Order Details</h2>
          </div>
          <div className="flex items-center gap-3">
            {order?.orderStatus === 'DELIVERED' && (
              <button
                onClick={() => {
                  fetchOrderReturnData();
                  toast.success('Return data refreshed');
                }}
                disabled={loadingReturnData}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Refresh return information"
              >
                <FaUndo className={`w-3 h-3 ${loadingReturnData ? 'animate-spin' : ''}`} />
                {loadingReturnData ? 'Refreshing...' : 'Refresh Returns'}
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-800 focus:outline-none transition-all hover:scale-110 hover:rotate-90 duration-300"
              aria-label="Close"
            >
              <FaTimes size={24} />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {/* Order ID and Date */}
          <div className="flex flex-col md:flex-row justify-between mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="mb-4 md:mb-0">
              <span className="block text-sm font-medium text-gray-500 mb-1">Order ID</span>
              <span className="font-semibold text-gray-800 tracking-wide">{order.orderId}</span>
            </div>
            <div className="mb-4 md:mb-0">
              <span className="block text-sm font-medium text-gray-500 mb-1">Order Date</span>
              <div className="flex items-center">
                <FaCalendarAlt className="text-gray-500 mr-2" />
                <span className="font-semibold text-gray-800">{formatDate(order.orderDate)}</span>
              </div>
            </div>
            {order.estimatedDeliveryDate && (
              <div>
                <span className="block text-sm font-medium text-gray-500 mb-1">
                  {order.actualDeliveryDate ? 'Delivered On' : 'Estimated Delivery'}
                </span>
                <div className="flex items-center">
                  <FaTruck className={`mr-2 ${order.actualDeliveryDate ? 'text-green-500' : 'text-blue-500'}`} />
                  <span className={`font-semibold ${order.actualDeliveryDate ? 'text-green-800' : 'text-blue-800'}`}>
                    {order.actualDeliveryDate 
                      ? formatDate(order.actualDeliveryDate)
                      : formatDate(order.estimatedDeliveryDate)
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Delivery Notes */}
          {order.deliveryNotes && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-sm font-medium text-blue-700 mb-1">Delivery Notes</span>
                  <span className="text-blue-800 text-sm">{order.deliveryNotes}</span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="mb-8">
            <h3 className="font-bold text-lg text-gray-800 mb-3 tracking-tight">Order Status</h3>
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <OrderTimeline status={localOrderStatus || order.orderStatus} />
            </div>
            
            {/* Add special messages for delivered or out for delivery status */}
            {(localOrderStatus === 'DELIVERED' || order.orderStatus === 'DELIVERED') && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <FaCheck className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium">This order has been successfully delivered.</p>
                  <p className="text-green-700 text-sm mt-1">Payment has been marked as complete. Order cannot be cancelled at this stage.</p>
                </div>
              </div>
            )}
            
            {(localOrderStatus === 'OUT FOR DELIVERY' || order.orderStatus === 'OUT FOR DELIVERY') && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                <FaTruck className="text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 font-medium">This order is out for delivery.</p>
                  <p className="text-yellow-700 text-sm mt-1">Customer cannot cancel the order at this stage. If there are any delivery issues, please update the status accordingly.</p>
                </div>
              </div>
            )}

            {(localOrderStatus === 'CANCELLED' || order.orderStatus === 'CANCELLED') && (
              <>
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <FaBan className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">This order has been cancelled.</p>
                    <p className="text-red-700 text-sm mt-1">Refund information is displayed below if applicable.</p>
                  </div>
                </div>

                {/* Refund Information Section */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FaUndo className="text-blue-500 mr-2" />
                    <h4 className="font-semibold text-blue-800">Refund Information</h4>
                    {loadingCancellation && (
                      <FaSpinner className="animate-spin text-blue-500 ml-2" />
                    )}
                  </div>
                  
                  {loadingCancellation ? (
                    <div className="text-blue-700 text-sm">Loading refund details...</div>
                  ) : cancellationDetails ? (
                    <div className="space-y-3">
                      {/* Cancellation Request Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-800">Request Date:</span>
                          <div className="text-blue-700">{formatDate(cancellationDetails.requestDate)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Reason:</span>
                          <div className="text-blue-700">{cancellationDetails.reason}</div>
                        </div>
                        {cancellationDetails.additionalReason && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-blue-800">Additional Details:</span>
                            <div className="text-blue-700">{cancellationDetails.additionalReason}</div>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-800">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cancellationDetails.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          cancellationDetails.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          cancellationDetails.status === 'PROCESSED' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cancellationDetails.status}
                        </span>
                      </div>

                      {/* Admin Response */}
                      {cancellationDetails.adminResponse && (
                        <div className="border-t border-blue-200 pt-3 mt-3">
                          <h5 className="font-medium text-blue-800 mb-2">Admin Response</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {cancellationDetails.adminResponse.processedBy && (
                              <div>
                                <span className="font-medium text-blue-800">Processed By:</span>
                                <div className="text-blue-700">{cancellationDetails.adminResponse.processedBy.name}</div>
                              </div>
                            )}
                            {cancellationDetails.adminResponse.processedDate && (
                              <div>
                                <span className="font-medium text-blue-800">Processed Date:</span>
                                <div className="text-blue-700">{formatDate(cancellationDetails.adminResponse.processedDate)}</div>
                              </div>
                            )}
                            {cancellationDetails.adminResponse.refundAmount > 0 && (
                              <div>
                                <span className="font-medium text-blue-800">Refund Amount:</span>
                                <div className="text-blue-700 font-semibold">{formatCurrency(cancellationDetails.adminResponse.refundAmount)}</div>
                              </div>
                            )}
                            {cancellationDetails.adminResponse.refundPercentage && (
                              <div>
                                <span className="font-medium text-blue-800">Refund Percentage:</span>
                                <div className="text-blue-700">{cancellationDetails.adminResponse.refundPercentage}%</div>
                              </div>
                            )}
                            {cancellationDetails.adminResponse.adminComments && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-blue-800">Admin Comments:</span>
                                <div className="text-blue-700">{cancellationDetails.adminResponse.adminComments}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Refund Details */}
                      {cancellationDetails.refundDetails && (
                        <div className="border-t border-blue-200 pt-3 mt-3">
                          <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                            <FaCreditCard className="mr-2" />
                            Refund Processing Details
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {cancellationDetails.refundDetails.refundId && (
                              <div>
                                <span className="font-medium text-blue-800">Refund ID:</span>
                                <div className="text-blue-700 font-mono">{cancellationDetails.refundDetails.refundId}</div>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-blue-800">Refund Status:</span>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                cancellationDetails.refundDetails.refundStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                cancellationDetails.refundDetails.refundStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                                cancellationDetails.refundDetails.refundStatus === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {cancellationDetails.refundDetails.refundStatus}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">Refund Method:</span>
                              <div className="text-blue-700">{cancellationDetails.refundDetails.refundMethod?.replace(/_/g, ' ')}</div>
                            </div>
                            {cancellationDetails.refundDetails.refundDate && (
                              <div>
                                <span className="font-medium text-blue-800">Refund Date:</span>
                                <div className="text-blue-700">{formatDate(cancellationDetails.refundDetails.refundDate)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-blue-700 text-sm">
                      <FaInfoCircle className="inline mr-1" />
                      No cancellation request found for this order. The order may have been cancelled directly by admin.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Status Update Section */}
          {/* Cancellation Request Warning */}
          {checkingPermission ? (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FaSpinner className="text-blue-500 animate-spin" />
                <span className="text-blue-700 font-medium">Checking order modification permission...</span>
              </div>
            </div>
          ) : !modificationPermission.canModify ? (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Order Modification Restricted</h4>
                  <p className="text-yellow-700 text-sm mb-2">{modificationPermission.reason}</p>
                  {modificationPermission.cancellationRequest && (
                    <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded border">
                      <strong>Cancellation Request Details:</strong>
                      <br />Status: {modificationPermission.cancellationRequest.status}
                      <br />Reason: {modificationPermission.cancellationRequest.reason}
                      <br />Date: {new Date(modificationPermission.cancellationRequest.requestDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : modificationPermission.approvedCancellation && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Partial Cancellation Applied</h4>
                  <p className="text-blue-700 text-sm mb-2">
                    Some items have been cancelled from this order. You can still update the status for the remaining active items.
                  </p>
                  <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded border">
                    <strong>Cancellation Details:</strong>
                    <br />Items Cancelled: {modificationPermission.approvedCancellation.itemsToCancel?.length || 0}
                    <br />Reason: {modificationPermission.approvedCancellation.reason}
                    <br />Date: {new Date(modificationPermission.approvedCancellation.requestDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Status Information Panel */}
          {(() => {
            const pendingCancellationCount = order.items?.filter(item => 
              hasItemPendingCancellationRequest(order.orderId, item._id?.toString() || item.id?.toString())
            ).length || 0;
            
            const cancelledCount = order.items?.filter(item => {
              const activeOrderInfo = getActiveOrderInfo(order);
              const itemId = item._id?.toString() || item.id?.toString();
              
              // Check if the item is in any of the cancelled item sets
              const isCancelled = activeOrderInfo.hasCancelledItems && (
                // Standard cancellation data
                order.cancellationData?.itemsToCancel?.some(cancelledItem => {
                  const cancelledItemId = cancelledItem.itemId?.toString() || cancelledItem._id?.toString();
                  return itemId === cancelledItemId;
                }) ||
                // Approved cancellations from modification permission
                modificationPermission.approvedCancellation?.itemsToCancel?.some(cancelledItem => {
                  const cancelledItemId = cancelledItem.itemId?.toString() || cancelledItem._id?.toString();
                  return itemId === cancelledItemId;
                }) ||
                // Items with completed refunds
                order.refundSummary?.some(refundItem => {
                  const refundItemId = refundItem.itemId?.toString();
                  return itemId === refundItemId && (refundItem.status === 'Completed' || refundItem.status === 'Approved');
                })
              );
              
              // Also check cancellation requests with APPROVED status but not yet refunded
              const isApprovedButNotRefunded = orderCancellationRequests.some(request => {
                const matchesOrder = request.orderId === order.orderId || request.orderId?._id === order.orderId;
                const isApproved = request.status === 'APPROVED';
                
                if (matchesOrder && isApproved && request.items && request.items.length > 0) {
                  return request.items.some(requestItem => {
                    const requestItemId = requestItem.itemId?.toString() || requestItem._id?.toString();
                    return itemId === requestItemId;
                  });
                }
                return false;
              });
              
              return isCancelled || isApprovedButNotRefunded;
            }).length || 0;

            const hasFullOrderPending = hasFullOrderPendingCancellationRequest(order.orderId);
            
            if (pendingCancellationCount > 0 || cancelledCount > 0 || hasFullOrderPending) {
              return (
                <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <FaInfoCircle className="text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-grow">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        Order Status Summary
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        {/* Cancelled Items */}
                        {cancelledCount > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <FaBan className="text-red-600 w-4 h-4" />
                              <span className="font-medium text-red-800">Cancelled Items</span>
                            </div>
                            <p className="text-red-700">{cancelledCount} item{cancelledCount > 1 ? 's' : ''} cancelled</p>
                          </div>
                        )}
                        
                        {/* Pending Cancellation Items */}
                        {pendingCancellationCount > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <FaClock className="text-orange-600 w-4 h-4" />
                              <span className="font-medium text-orange-800">Pending Cancellation</span>
                            </div>
                            <p className="text-orange-700">{pendingCancellationCount} item{pendingCancellationCount > 1 ? 's' : ''} pending</p>
                          </div>
                        )}
                        
                        {/* Full Order Pending */}
                        {hasFullOrderPending && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <FaExclamationTriangle className="text-yellow-600 w-4 h-4" />
                              <span className="font-medium text-yellow-800">Full Order Pending</span>
                            </div>
                            <p className="text-yellow-700">Complete order cancellation requested</p>
                          </div>
                        )}
                        
                        {/* Active Items */}
                        {(() => {
                          const activeOrderInfo = getActiveOrderInfo(order);
                          const activeCount = activeOrderInfo.activeItemCount;
                          if (activeCount > 0) {
                            return (
                              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <FaCheck className="text-green-600 w-4 h-4" />
                                  <span className="font-medium text-green-800">Active Items</span>
                                </div>
                                <p className="text-green-700">{activeCount} item{activeCount > 1 ? 's' : ''} active</p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      
                      {(pendingCancellationCount > 0 || hasFullOrderPending) && (
                        <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
                          <strong>Note:</strong> Items with pending cancellation requests are highlighted in orange/yellow. 
                          Review cancellation requests in the admin cancellation management section.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Order Status Update Section */}
          <div className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 tracking-tight">Update Order Status</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <select
                value={selectedStatus}
                onChange={handleStatusChange}
                disabled={!modificationPermission.canModify}
                className={`w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white appearance-none cursor-pointer font-medium ${
                  !modificationPermission.canModify ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus || selectedStatus === localOrderStatus || !modificationPermission.canModify}
                className="w-full sm:w-auto px-5 py-2.5 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium tracking-wide shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                {updatingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
            {!modificationPermission.canModify && (
              <p className="text-sm text-red-600 mt-2">
                Order status cannot be modified due to pending cancellation request.
              </p>
            )}
          </div>

          {/* Delivery Date Update Section */}
          <div className="mb-8 p-5 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 tracking-tight flex items-center">
              <FaTruck className="text-blue-600 mr-2" />
              Delivery Date Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Estimated Delivery Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0] : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Add delivery instructions or notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={order.deliveryNotes || ''}
                />
              </div>
            </div>
            <div className="mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2">
                <FaTruck className="text-sm" />
                Update Delivery Info
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Customer Information */}
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center tracking-tight">
                <FaUser className="text-gray-600 mr-2.5" />
                Customer Information
              </h3>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow">
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Name</span>
                  <div className="flex items-center">
                    <FaUser className="text-gray-500 mr-2" />
                    <span className="font-medium text-gray-800 tracking-wide">{order.userId?.name || 'Guest User'}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Email</span>
                  <div className="flex items-center">
                    <FaEnvelope className="text-gray-500 mr-2" />
                    <span className="font-medium text-gray-800 tracking-wide">{order.userId?.email || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Phone</span>
                  <div className="flex items-center">
                    <svg className="text-gray-500 mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="font-medium text-gray-800 tracking-wide">
                      {order.userId?.mobile || order.deliveryAddress?.mobile || 'Not provided'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-1">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Customer ID</span>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800 tracking-wide font-mono">
                      {order.userId?._id || 'N/A'}
                    </span>
                  </div>
                </div>
                
                {order.userId?.registeredSince && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="block text-sm text-gray-500">
                      Customer since {new Date(order.userId.registeredSince).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center tracking-tight">
                <FaMoneyBillWave className="text-gray-600 mr-2.5" />
                Payment Information
              </h3>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-2">
                    <span className="block text-sm font-medium text-gray-500 mb-1.5">Payment Method</span>
                    <span className="font-medium text-gray-800 tracking-wide flex items-center">
                      <FaCreditCard className="mr-2 text-gray-600" />
                      {order.paymentMethod || 'Online Payment'}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <span className="block text-sm font-medium text-gray-500 mb-1.5">Payment ID</span>
                    <span className="font-medium text-gray-800 tracking-wide font-mono">
                      {order.paymentId || order.transactionId || 'N/A'}
                    </span>
                  </div>
                
                  <div className="mb-2">
                    <span className="block text-sm font-medium text-gray-500 mb-1.5">Payment Date</span>
                    <span className="font-medium text-gray-800 tracking-wide">
                      {order.paymentDate ? formatDate(order.paymentDate) : formatDate(order.orderDate)}
                    </span>
                  </div>
                
                  <div className="mb-2">
                    <span className="block text-sm font-medium text-gray-500 mb-1.5">Payment Status</span>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold 
                        ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' : 
                          order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'} 
                        border shadow-sm`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 mb-3 border-t border-gray-200 pt-3">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Payment Status</span>
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Payment Status Badge */}
                    {(() => {
                      // Check if there's a successful refund
                      const hasSuccessfulRefund = order.paymentStatus === "REFUND_SUCCESSFUL" || 
                                                  (cancellationDetails?.refundDetails?.refundStatus === 'COMPLETED') ||
                                                  (modificationPermission?.approvedCancellation?.adminResponse?.refundAmount > 0);
                      
                      // Check if refund is processing
                      const isRefundProcessing = order.paymentStatus === "REFUND_PROCESSING" ||
                                                (cancellationDetails?.refundDetails?.refundStatus === 'PROCESSING');
                      
                      // Check if refund failed
                      const isRefundFailed = order.paymentStatus === "REFUND_FAILED" ||
                                            (cancellationDetails?.refundDetails?.refundStatus === 'FAILED');
                      
                      if (hasSuccessfulRefund) {
                        return (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                            ✓ Refunded
                          </span>
                        );
                      } else if (isRefundProcessing) {
                        return (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">
                            🔄 Refund Processing
                          </span>
                        );
                      } else if (isRefundFailed) {
                        return (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 shadow-sm">
                            ✗ Refund Failed
                          </span>
                        );
                      } else if (order.orderStatus === "DELIVERED" && order.paymentStatus === "CASH ON DELIVERY") {
                        return (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                            Will be marked as PAID on delivery
                          </span>
                        );
                      } else if (order.paymentStatus === "PAID") {
                        return (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                            ✓ Paid
                          </span>
                        );
                      } else if (order.paymentStatus === "CANCELLED" || order.orderStatus === "CANCELLED") {
                        return (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 shadow-sm">
                            ✗ Cancelled
                          </span>
                        );
                      } else {
                        return (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">
                            ⏱ Pending
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>
                {/* Invoice-like Payment Breakdown Section */}
                <div className="mt-4 mb-2 border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    <FaFileInvoice className="mr-2 text-gray-600" /> 
                    Invoice Details
                  </h4>
                  
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <span className="font-medium text-gray-700">Payment Summary</span>
                      <span className="text-xs text-gray-500">Order ID: {order.orderId?.substring(0, 8)}</span>
                    </div>
                    
                    <div className="p-4">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">Total Items</td>
                            <td className="py-2 text-right font-medium text-gray-800">
                              {(() => {
                                const activeOrderInfo = getActiveOrderInfo(order);
                                return (
                                  <div className="flex flex-col items-end">
                                    <span>{activeOrderInfo.activeItemCount} items</span>
                                    {(activeOrderInfo.hasCancelledItems || activeOrderInfo.hasReturnedItems) && (
                                      <span className="text-xs text-amber-600">
                                        (was {order.totalQuantity} items
                                        {activeOrderInfo.hasCancelledItems && activeOrderInfo.hasReturnedItems ? ', cancelled & returned' :
                                         activeOrderInfo.hasCancelledItems ? ', cancelled' : ', returned'})
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                          
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">Subtotal</td>
                            <td className="py-2 text-right font-medium text-gray-800">
                              {(() => {
                                const activeOrderInfo = getActiveOrderInfo(order);
                                return (
                                  <div className="flex flex-col items-end">
                                    <span>₹{activeOrderInfo.remainingSubtotal?.toFixed(2)}</span>
                                    {(activeOrderInfo.hasCancelledItems || activeOrderInfo.hasReturnedItems) && (
                                      <span className="text-xs text-amber-600">
                                        <span className="line-through">₹{order.subTotalAmt?.toFixed(2)}</span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                          
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">Delivery Charges</td>
                            <td className="py-2 text-right font-medium text-gray-800">
                              {(() => {
                                const activeOrderInfo = getActiveOrderInfo(order);
                                const originalDeliveryCharge = order.deliveryCharge?.toFixed(2) || '0.00';
                                
                                if (activeOrderInfo.isTotallyCancelled && order.deliveryCharge > 0) {
                                  return (
                                    <div className="flex flex-col items-end">
                                      <span className="text-green-600">₹0.00</span>
                                      <span className="text-xs text-gray-500 line-through">
                                        ₹{originalDeliveryCharge} (waived - order cancelled)
                                      </span>
                                    </div>
                                  );
                                }
                                
                                return `₹${originalDeliveryCharge}`;
                              })()}
                            </td>
                          </tr>
                          
                          {order.discount > 0 && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">Discount</td>
                              <td className="py-2 text-right font-medium text-green-600">-₹{order.discount?.toFixed(2)}</td>
                            </tr>
                          )}
                          
                          {order.coupon && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">Coupon Applied</td>
                              <td className="py-2 text-right font-medium text-blue-600">{order.coupon}</td>
                            </tr>
                          )}
                          
                          {(cancellationDetails?.adminResponse?.refundAmount > 0 || modificationPermission?.approvedCancellation?.adminResponse?.refundAmount > 0) && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">Refunded Amount</td>
                              <td className="py-2 text-right font-medium text-red-600">
                                -₹{(cancellationDetails?.adminResponse?.refundAmount || 
                                   modificationPermission?.approvedCancellation?.adminResponse?.refundAmount || 0).toFixed(2)}
                              </td>
                            </tr>
                          )}
                          
                          <tr className="border-b border-gray-100">
                            <td className="py-3 font-medium">Remaining Amount</td>
                            <td className="py-3 text-right font-bold text-lg text-gray-800">
                              {(() => {
                                const activeOrderInfo = getActiveOrderInfo(order);
                                return (
                                  <div className="flex flex-col items-end">
                                    <span>₹{activeOrderInfo.remainingTotal?.toFixed(2)}</span>
                                    {(activeOrderInfo.hasCancelledItems || activeOrderInfo.hasReturnedItems) && (
                                      <span className="text-xs text-amber-600">
                                        <span className="line-through">₹{order.totalAmt?.toFixed(2)}</span> (original total)
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Return Summary for Delivered Orders */}
          {order?.orderStatus === 'DELIVERED' && orderReturnData && (() => {
            const totalRefundAmount = orderReturnData.items?.reduce((total, item) => {
              return total + (item.returnRequests?.reduce((itemTotal, req) => {
                if (['APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'INSPECTED', 'REFUND_PROCESSED', 'COMPLETED'].includes(req.status)) {
                  return itemTotal + (req.refundDetails?.actualRefundAmount || 0);
                }
                return itemTotal;
              }, 0) || 0);
            }, 0) || 0;

            const totalReturnRequests = orderReturnData.items?.reduce((total, item) => 
              total + (item.returnRequests?.length || 0), 0) || 0;

            if (totalReturnRequests > 0) {
              return (
                <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-3 flex items-center">
                    <FaUndo className="mr-2" />
                    Return Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-orange-200">
                      <span className="text-orange-600 font-medium">Total Return Requests:</span>
                      <span className="ml-2 font-bold text-orange-800">{totalReturnRequests}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-orange-200">
                      <span className="text-orange-600 font-medium">Total Refunded:</span>
                      <span className="ml-2 font-bold text-orange-800">₹{totalRefundAmount.toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-orange-200">
                      <span className="text-orange-600 font-medium">Net Amount:</span>
                      <span className="ml-2 font-bold text-orange-800">₹{(order.totalAmt - totalRefundAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Products Information - Fixed for Multiple Items */}
          <div className="mt-8">
            {(() => {
              const activeOrderInfo = getActiveOrderInfo(order);
              return (
                <>
                  <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center tracking-tight">
                    <FaBox className="text-gray-600 mr-2.5" />
                    Products Information ({activeOrderInfo.activeItems?.length || 0} active items)
                    {activeOrderInfo.hasCancelledItems && (
                      <span className="ml-2 text-sm text-amber-600 font-normal">
                        ({(order.items?.length || 0) - (activeOrderInfo.activeItems?.length || 0)} cancelled)
                      </span>
                    )}
                  </h3>
                  
                  {/* Check if order has items array (new structure) or single product (old structure) */}
                  {order.items && order.items.length > 0 ? (
                    <div className="space-y-4">
                      {order.items.map((item, index) => {
                        // Check if this item is cancelled - check both sources
                        const activeOrderInfo = getActiveOrderInfo(order);
                        
                        // Debug logging for cancellation detection
                        console.log('Checking cancellation for item:', {
                          itemId: item._id?.toString() || item.id?.toString(),
                          orderCancellationData: order.cancellationData?.itemsToCancel,
                          approvedCancellationData: modificationPermission.approvedCancellation?.itemsToCancel,
                          hasCancelledItems: activeOrderInfo.hasCancelledItems
                        });
                        
                        const isCancelled = activeOrderInfo.hasCancelledItems && (
                          order.cancellationData?.itemsToCancel?.some(cancelledItem => {
                            const itemId = item._id?.toString() || item.id?.toString();
                            const cancelledItemId = cancelledItem.itemId?.toString() || cancelledItem._id?.toString();
                            return itemId === cancelledItemId;
                          }) ||
                          modificationPermission.approvedCancellation?.itemsToCancel?.some(cancelledItem => {
                            const itemId = item._id?.toString() || item.id?.toString();
                            const cancelledItemId = cancelledItem.itemId?.toString() || cancelledItem._id?.toString();
                            return itemId === cancelledItemId;
                          }) ||
                          // Check refundSummary for cancelled items
                          order.refundSummary?.some(refundItem => {
                            const itemId = item._id?.toString() || item.id?.toString();
                            const refundItemId = refundItem.itemId?.toString();
                            return itemId === refundItemId && refundItem.status === 'Completed';
                          })
                        );

                        // Check if this item has a pending cancellation request
                        const hasPendingRequest = hasItemPendingCancellationRequest(order.orderId, item._id?.toString() || item.id?.toString());
                        
                        console.log('Item cancellation status:', {
                          itemId: item._id?.toString() || item.id?.toString(),
                          isCancelled: isCancelled,
                          productName: item.productId?.name || item.productDetails?.name
                        });
                  // Determine item type
                  const isBundle = item.itemType === 'bundle';
                  
                  // Handle both populated and non-populated productId/bundleId
                  let productInfo = null;
                  let productId = null;
                  
                  if (isBundle) {
                    productInfo = item.bundleId && typeof item.bundleId === 'object' 
                      ? item.bundleId  // If populated, use the populated data
                      : item.bundleDetails; // Use bundleDetails
                    
                    productId = item.bundleId && typeof item.bundleId === 'object'
                      ? item.bundleId._id  // If populated, get the _id
                      : item.bundleId;     // Otherwise, use the ID string
                  } else {
                    productInfo = item.productId && typeof item.productId === 'object' 
                      ? item.productId  // If populated, use the populated data
                      : item.productDetails; // Use productDetails
                    
                    productId = item.productId && typeof item.productId === 'object'
                      ? item.productId._id  // If populated, get the _id
                      : item.productId;     // Otherwise, use the ID string
                  }
                  
                  // Calculate item total and unit price with size-based pricing
                  const sizeBasedTotalPrice = calculateSizeBasedPrice(item, productInfo);
                  const sizeBasedUnitPrice = getSizeBasedUnitPrice(item, productInfo);
                  
                  // Use size-based pricing for accurate calculations
                  const itemTotal = sizeBasedTotalPrice;
                  const unitPrice = sizeBasedUnitPrice;
                  
                  // Get bundle items if it's a bundle
                  const getBundleItems = () => {
                    if (!isBundle) return [];
                    
                    if (item.bundleId && typeof item.bundleId === 'object' && item.bundleId.items) {
                      return item.bundleId.items;
                    }
                    if (item.bundleDetails && item.bundleDetails.items) {
                      return item.bundleDetails.items;
                    }
                    return [];
                  };

                  const bundleItems = getBundleItems();
                  
                  const isReturned = hasItemBeenReturned(item.productId._id);

                  return (
                    <div key={index} className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative ${
                      isCancelled 
                        ? 'opacity-60 bg-red-50 border-red-200' 
                        : isReturned
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 border-2'
                          : hasPendingRequest 
                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-300 border-2 shadow-lg' 
                            : 'border-gray-200'
                    }`}>
                      {/* Background pattern for cancelled items */}
                      {isCancelled && (
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                          <div className="w-full h-full bg-red-500 bg-opacity-20" 
                               style={{
                                 backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.1) 10px, rgba(239, 68, 68, 0.1) 20px)'
                               }}>
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced background pattern for pending cancellation items */}
                      {hasPendingRequest && !isCancelled && (
                        <div className="absolute inset-0 opacity-15 pointer-events-none">
                          <div className="w-full h-full bg-gradient-to-r from-yellow-500 to-orange-500 bg-opacity-20"
                               style={{
                                 backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(251, 191, 36, 0.2) 8px, rgba(251, 191, 36, 0.2) 16px)'
                               }}>
                          </div>
                        </div>
                      )}
                      
                      {/* Prominent header bar for pending cancellation requests */}
                      {hasPendingRequest && !isCancelled && (
                        <div className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
                          <FaClock className="animate-pulse" />
                          <span>CANCELLATION REQUEST PENDING</span>
                          <div className="ml-auto bg-white text-orange-600 px-2 py-1 rounded-full text-xs font-bold">
                            PENDING REVIEW
                          </div>
                        </div>
                      )}
                      
                      {/* Return status header for delivered items */}
                      {order?.orderStatus === 'DELIVERED' && (() => {
                        const itemId = item._id?.toString() || item.id?.toString();
                        const returnRequests = hasItemReturnRequest(itemId);
                        
                        if (returnRequests.length > 0) {
                          const latestReturn = returnRequests[returnRequests.length - 1];
                          const statusInfo = getReturnStatusInfo(latestReturn.status);
                          
                          return (
                            <div className={`${statusInfo.color} px-4 py-2 text-sm font-bold flex items-center gap-2 border-b`}>
                              <FaUndo className="animate-pulse" />
                              <span>{statusInfo.label}</span>
                              {latestReturn.refundDetails?.actualRefundAmount && (
                                <div className="ml-auto bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-bold">
                                  ₹{latestReturn.refundDetails.actualRefundAmount} Refund
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="flex flex-col md:flex-row items-start p-4 sm:p-5 gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 shadow-sm relative">
                          {((isBundle && (productInfo?.images?.[0] || productInfo?.image?.[0])) || 
                            (!isBundle && productInfo?.image?.[0])) && (
                            <img 
                              src={isBundle 
                                ? (productInfo.images?.[0] || productInfo.image?.[0])
                                : productInfo.image[0]
                              } 
                              alt={productInfo?.name || productInfo?.title} 
                              className={`w-full h-full object-cover ${
                                isCancelled 
                                  ? 'grayscale' 
                                  : hasPendingRequest 
                                    ? 'opacity-75 saturate-75' 
                                    : ''
                              }`}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          {isCancelled && (
                            <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                              <span className="text-red-600 font-bold text-xs bg-white px-2 py-1 rounded">
                                CANCELLED
                              </span>
                            </div>
                          )}
                          {hasPendingRequest && !isCancelled && (
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-yellow-500 bg-opacity-40 flex items-center justify-center">
                              <div className="bg-white rounded-full p-2 shadow-lg">
                                <FaClock className="text-orange-600 text-lg animate-pulse" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className={`font-semibold tracking-tight text-base sm:text-lg ${
                              isCancelled 
                                ? 'text-gray-500 line-through' 
                                : hasPendingRequest 
                                  ? 'text-orange-800 font-bold' 
                                  : 'text-gray-900'
                            }`}>
                              {productInfo?.name || productInfo?.title || (isBundle ? 'Bundle Product' : 'Product Name')}
                              {hasPendingRequest && !isCancelled && (
                                <span className="ml-2 text-orange-600 font-normal text-sm">
                                  (Cancellation Requested)
                                </span>
                              )}
                            </h4>
                            {isBundle && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isCancelled 
                                  ? 'bg-gray-100 text-gray-600' 
                                  : hasPendingRequest 
                                    ? 'bg-orange-100 text-orange-800' 
                                    : 'bg-blue-100 text-blue-800'
                              }`}>
                                Bundle
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                                <FaBan className="mr-1" size={10} />
                                CANCELLED
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-5 text-sm mb-4">
                            <div className={`p-2.5 rounded-md border ${
                              isCancelled 
                                ? 'bg-gray-50 border-gray-100' 
                                : hasPendingRequest 
                                  ? 'bg-yellow-50 border-yellow-200' 
                                  : 'bg-gray-50 border-gray-100'
                            }`}>
                              <span className="text-gray-500 font-medium block mb-1">Quantity</span>
                              <p className={`font-semibold ${
                                isCancelled 
                                  ? 'text-gray-500' 
                                  : hasPendingRequest 
                                    ? 'text-orange-800' 
                                    : 'text-gray-800'
                              }`}>{item.quantity}</p>
                            </div>
                  
                            <div className={`p-2.5 rounded-md border ${
                              isCancelled 
                                ? 'bg-gray-50 border-gray-100' 
                                : hasPendingRequest 
                                  ? 'bg-yellow-50 border-yellow-200' 
                                  : 'bg-gray-50 border-gray-100'
                            }`}>
                              <span className="text-gray-500 font-medium block mb-1">Size</span>
                              <p className={`font-semibold ${
                                isCancelled 
                                  ? 'text-gray-500' 
                                  : hasPendingRequest 
                                    ? 'text-orange-800' 
                                    : 'text-gray-800'
                              }`}>
                                {item.size ? (
                                  <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                                    isCancelled 
                                      ? 'bg-gray-100 text-gray-600' 
                                      : hasPendingRequest 
                                        ? 'bg-orange-100 text-orange-800' 
                                        : 'bg-green-100 text-green-800'
                                  }`}>
                                    {item.size}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-xs">N/A</span>
                                )}
                              </p>
                            </div>
                            <div className={`p-2.5 rounded-md border ${
                              isCancelled 
                                ? 'bg-gray-50 border-gray-100' 
                                : hasPendingRequest 
                                  ? 'bg-yellow-50 border-yellow-200' 
                                  : 'bg-gray-50 border-gray-100'
                            }`}>
                              <span className="text-gray-500 font-medium block mb-1">Unit Price</span>
                              <p className={`font-semibold ${
                                isCancelled 
                                  ? 'text-gray-500 line-through' 
                                  : hasPendingRequest 
                                    ? 'text-orange-800' 
                                    : 'text-gray-800'
                              }`}>
                                ₹{unitPrice?.toFixed(2)}
                              </p>
                            </div>
                            <div className={`p-2.5 rounded-md border ${
                              isCancelled 
                                ? 'bg-gray-50 border-gray-100' 
                                : hasPendingRequest 
                                  ? 'bg-yellow-50 border-yellow-200' 
                                  : 'bg-gray-50 border-gray-100'
                            }`}>
                              <span className="text-gray-500 font-medium block mb-1">Total Price</span>
                              <p className={`font-semibold ${
                                isCancelled 
                                  ? 'text-gray-500 line-through' 
                                  : hasPendingRequest 
                                    ? 'text-orange-800' 
                                    : 'text-gray-800'
                              }`}>
                                ₹{itemTotal?.toFixed(2)}
                              </p>
                            </div>
                            <div className={`p-2.5 rounded-md border ${
                              isCancelled 
                                ? 'bg-gray-50 border-gray-100' 
                                : hasPendingRequest 
                                  ? 'bg-yellow-50 border-yellow-200' 
                                  : 'bg-gray-50 border-gray-100'
                            }`}>
                              <span className="text-gray-500 font-medium block mb-1">{isBundle ? 'Bundle ID' : 'Product ID'}</span>
                              <p className={`font-medium text-xs break-all ${
                                isCancelled 
                                  ? 'text-gray-500' 
                                  : hasPendingRequest 
                                    ? 'text-orange-800' 
                                    : 'text-gray-800'
                              }`}>
                                {typeof productId === 'string' ? productId : productId?.toString()}
                              </p>
                            </div>
                            {isCancelled && (
                              <div className="md:col-span-5 bg-red-50 border border-red-200 rounded-md p-3">
                                <div className="flex items-center text-red-700 text-sm">
                                  <FaBan className="mr-2 text-red-600" />
                                  <span className="font-medium">This item has been cancelled and refunded</span>
                                </div>
                              </div>
                            )}
                            {hasPendingRequest && !isCancelled && (
                              <div className="md:col-span-5 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-md p-4 shadow-lg">
                                <div className="flex items-center text-orange-700 text-sm">
                                  <div className="bg-orange-200 rounded-full p-2 mr-3">
                                    <FaClock className="text-orange-600 animate-pulse" />
                                  </div>
                                  <div>
                                    <span className="font-bold text-orange-800">CANCELLATION REQUEST PENDING</span>
                                    <p className="text-orange-600 text-xs mt-1">
                                      This item has a pending cancellation request that requires admin review and approval.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Bundle Items Details */}
                          {isBundle && bundleItems.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                              <h5 className="text-sm font-semibold text-blue-800 mb-2">Bundle Items ({bundleItems.length}):</h5>
                              <div className="space-y-2">
                                {bundleItems.map((bundleItem, bundleIndex) => (
                                  <div key={bundleIndex} className="flex items-center gap-3 p-2 bg-white rounded border">
                                    <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                                      {(() => {
                                        // Enhanced image handling for bundle items
                                        let imageUrl = null;
                                        
                                        // Check various image properties and formats
                                        if (bundleItem.image) {
                                          if (typeof bundleItem.image === 'string') {
                                            imageUrl = bundleItem.image;
                                          } else if (Array.isArray(bundleItem.image) && bundleItem.image.length > 0) {
                                            imageUrl = bundleItem.image[0];
                                          }
                                        } else if (bundleItem.images) {
                                          if (Array.isArray(bundleItem.images) && bundleItem.images.length > 0) {
                                            imageUrl = bundleItem.images[0];
                                          } else if (typeof bundleItem.images === 'string') {
                                            imageUrl = bundleItem.images;
                                          }
                                        }
                                        
                                        // Check productId if it's populated
                                        if (!imageUrl && bundleItem.productId && typeof bundleItem.productId === 'object') {
                                          if (bundleItem.productId.image) {
                                            if (Array.isArray(bundleItem.productId.image)) {
                                              imageUrl = bundleItem.productId.image[0];
                                            } else {
                                              imageUrl = bundleItem.productId.image;
                                            }
                                          } else if (bundleItem.productId.images && Array.isArray(bundleItem.productId.images)) {
                                            imageUrl = bundleItem.productId.images[0];
                                          }
                                        }
                                        
                                        console.log('Bundle item image debug:', {
                                          bundleItem,
                                          imageUrl,
                                          hasImage: !!bundleItem.image,
                                          hasImages: !!bundleItem.images,
                                          imageType: typeof bundleItem.image,
                                          imagesType: typeof bundleItem.images
                                        });
                                        
                                        return imageUrl ? (
                                          <img 
                                            src={imageUrl} 
                                            alt={bundleItem.name || bundleItem.title || 'Bundle Item'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <FaBox className="w-3 h-3 text-gray-400" />
                                          </div>
                                        );
                                      })()}
                                    </div>
                                    <div className="flex-grow">
                                      <div className="text-sm font-medium text-blue-900">
                                        {bundleItem.name || bundleItem.title || 'Bundle Item'}
                                      </div>
                                      <div className="text-xs text-blue-700">
                                        Qty: {bundleItem.quantity || 1} • Price: ₹{(getSizeBasedUnitPrice(bundleItem, bundleItem) || bundleItem.price || 0).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Bundle Items Placeholder for bundles without items */}
                          {isBundle && bundleItems.length === 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
                              <div className="text-sm text-amber-700 flex items-center">
                                <FaExclamationCircle className="mr-2 text-amber-600" />
                                Bundle items details are not available in this view
                              </div>
                            </div>
                          )}
                          
                          {/* Stock info if available from populated data */}
                          {productInfo?.stock !== undefined && (
                            <div className="text-sm bg-gray-50 p-2.5 rounded-md inline-block border border-gray-100">
                              <span className="text-gray-600 font-medium">Current Stock: </span>
                              <span className={`font-semibold ${productInfo.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {productInfo.stock} units
                              </span>
                            </div>
                          )}
                          
                          {/* Return Information for Delivered Items */}
                          {order?.orderStatus === 'DELIVERED' && (() => {
                            const itemId = item._id?.toString() || item.id?.toString();
                            const returnRequests = hasItemReturnRequest(itemId);
                            
                            if (returnRequests.length > 0) {
                              return (
                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
                                  <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center justify-between">
                                    <div className="flex items-center">
                                      <FaUndo className="mr-2" />
                                      Return History ({returnRequests.length})
                                    </div>
                                    {lastReturnDataUpdate && (
                                      <span className="text-xs text-blue-600 font-normal">
                                        Updated: {lastReturnDataUpdate.toLocaleTimeString()}
                                      </span>
                                    )}
                                  </h5>
                                  <div className="space-y-3">
                                    {returnRequests.map((returnReq, idx) => {
                                      const statusInfo = getReturnStatusInfo(returnReq.status);
                                      const formattedDate = new Date(returnReq.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      });
                                      
                                      return (
                                        <div key={idx} className="bg-white border border-blue-200 rounded-lg p-3">
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                                                  {statusInfo.label}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  {formattedDate}
                                                </span>
                                              </div>
                                              <p className="text-sm text-gray-700">
                                                <span className="font-medium">Reason:</span> {returnReq.returnReason}
                                              </p>
                                              {returnReq.returnDescription && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                  <span className="font-medium">Comment:</span> {returnReq.returnDescription}
                                                </p>
                                              )}
                                              {returnReq.adminResponse?.adminComments && (
                                                <p className="text-xs text-blue-600 mt-1 bg-blue-50 p-2 rounded">
                                                  <span className="font-medium">Admin Notes:</span> {returnReq.adminResponse.adminComments}
                                                </p>
                                              )}
                                            </div>
                                            <div className="text-right ml-3">
                                              <div className="text-sm font-semibold text-gray-900">
                                                Qty: {returnReq.itemDetails?.quantity || 1}
                                              </div>
                                              {returnReq.refundDetails?.actualRefundAmount && (
                                                <div className="text-sm font-semibold text-green-600">
                                                  ₹{returnReq.refundDetails.actualRefundAmount}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Fallback for old order structure with single product
              (() => {
                // Create a mock item object for size-based pricing calculation
                const mockItem = {
                  size: order.size || order.productDetails?.size,
                  quantity: order.orderQuantity || 1,
                  itemType: 'product'
                };
                
                const sizeBasedUnitPrice = getSizeBasedUnitPrice(mockItem, order.productDetails);
                
                return (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start p-4 gap-4">
                      <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        {order.productDetails?.image && order.productDetails.image.length > 0 && (
                          <img 
                            src={order.productDetails.image[0]} 
                            alt={order.productDetails?.name} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium text-gray-900 mb-1">{order.productDetails?.name}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Quantity:</span>
                            <span className="font-medium text-gray-800">{order.orderQuantity}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Unit Price (Size-based):</span>
                            <span className="font-medium text-gray-800">₹{sizeBasedUnitPrice?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Size:</span>
                            <span className="font-medium text-gray-800">
                              {order.size || order.productDetails?.size ? (
                                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-semibold">
                                  {order.size || order.productDetails?.size}
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
              })()
            )}
                </>
              );
            })()}
          </div>

          {/* Shipping Address */}
          {order.deliveryAddress && (
            <div className="mt-10">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center tracking-tight">
                <FaMapMarkerAlt className="text-gray-600 mr-2.5" />
                Shipping Address
              </h3>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow">
                <p className="mb-3 flex items-start">
                  <FaMapMarkerAlt className="text-gray-600 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-800 font-medium tracking-wide">{order.deliveryAddress.address_line}</span>
                </p>
                <p className="mb-3 flex items-start">
                  <FaCity className="text-gray-600 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-800 font-medium tracking-wide">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}
                  </span>
                </p>
                <p className="flex items-start">
                  <FaFlag className="text-gray-600 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-800 font-medium tracking-wide">{order.deliveryAddress.country}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 shadow-inner">
          <div className="flex justify-end">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 text-gray-700 hover:text-white bg-gray-100 hover:bg-black font-medium rounded-md transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 tracking-wide"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
