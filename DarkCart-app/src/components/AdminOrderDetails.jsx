import React, { useState, useEffect } from 'react';  
import { FaMapMarkerAlt, FaCity, FaFlag, FaTimes, FaUser, FaCalendarAlt, FaBox, FaMoneyBillWave, FaTruck, FaCheck, FaCog, FaBan, FaBoxOpen, FaInfoCircle, FaExclamationCircle, FaEnvelope, FaUndo, FaCreditCard, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
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

  // Filter out cancelled items and calculate remaining totals
  const getActiveOrderInfo = (order) => {
    try {
      // Check all sources of cancellation data
      const hasOrderCancellation = order.cancellationData && order.cancellationData.itemsToCancel && order.cancellationData.itemsToCancel.length > 0;
      const hasApprovedCancellation = modificationPermission.approvedCancellation && modificationPermission.approvedCancellation.itemsToCancel && modificationPermission.approvedCancellation.itemsToCancel.length > 0;
      const hasRefundSummary = order.refundSummary && order.refundSummary.length > 0;
      
      // If no cancellation data, return original order
      if (!hasOrderCancellation && !hasApprovedCancellation && !hasRefundSummary) {
        return {
          activeItems: order.items || [],
          activeItemCount: order.totalQuantity || order.items?.length || 0,
          remainingTotal: order.totalAmt || 0,
          remainingSubtotal: order.subTotalAmt || 0,
          hasCancelledItems: false
        };
      }

      // Get cancelled item IDs for quick lookup from all sources
      const cancelledItemIds = new Set();
      
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
          if (refundItem.status === 'Completed') {
            const itemId = refundItem.itemId?.toString();
            if (itemId) cancelledItemIds.add(itemId);
          }
        });
      }

      // Filter out cancelled items
      const activeItems = (order.items || []).filter(item => {
        const itemId = item._id?.toString() || item.id?.toString();
        return !cancelledItemIds.has(itemId);
      });

      // Calculate remaining totals
      let remainingSubtotal = 0;
      let activeItemCount = 0;

      activeItems.forEach(item => {
        const itemTotal = calculateSizeBasedPrice(item);
        remainingSubtotal += itemTotal;
        activeItemCount += item.quantity || 1;
      });

      // Add delivery charge if any
      const deliveryCharge = order.deliveryCharge || 0;
      const remainingTotal = remainingSubtotal + deliveryCharge;

      return {
        activeItems,
        activeItemCount,
        remainingTotal,
        remainingSubtotal,
        deliveryCharge,
        hasCancelledItems: cancelledItemIds.size > 0
      };

    } catch (error) {
      console.error('Error calculating active order info:', error);
      // Fallback to original order data
      return {
        activeItems: order.items || [],
        activeItemCount: order.totalQuantity || order.items?.length || 0,
        remainingTotal: order.totalAmt || 0,
        remainingSubtotal: order.subTotalAmt || 0,
        hasCancelledItems: false
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

  // Fetch cancellation details when component mounts if order is cancelled
  useEffect(() => {
    if ((localOrderStatus === 'CANCELLED' || order?.orderStatus === 'CANCELLED')) {
      fetchCancellationDetails();
    }
    
    // Check modification permission for all orders
    checkModificationPermission();
  }, [order?.orderId, localOrderStatus]);

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
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 focus:outline-none transition-all hover:scale-110 hover:rotate-90 duration-300"
            aria-label="Close"
          >
            <FaTimes size={24} />
          </button>
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
                  <span className="font-medium text-gray-800 tracking-wide">{order.userId?.name}</span>
                </div>
                <div className="mb-1">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Email</span>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800 tracking-wide">{order.userId?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center tracking-tight">
                <FaMoneyBillWave className="text-gray-600 mr-2.5" />
                Payment Information
              </h3>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow">
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Payment Method</span>
                  <span className="font-medium text-gray-800 tracking-wide">
                    {order.paymentMethod || order.paymentStatus === 'Online Payment'}
                  </span>
                </div>
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Payment Status</span>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-medium text-gray-800 tracking-wide">{order.paymentStatus}</span>
                    
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
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Total Quantity</span>
                  {(() => {
                    const activeOrderInfo = getActiveOrderInfo(order);
                    return (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 tracking-wide">{activeOrderInfo.activeItemCount} items</span>
                        {activeOrderInfo.hasCancelledItems && (
                          <span className="text-xs text-amber-600">
                            (was {order.totalQuantity} items)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Subtotal</span>
                  {(() => {
                    const activeOrderInfo = getActiveOrderInfo(order);
                    return (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 tracking-wide">₹{activeOrderInfo.remainingSubtotal?.toFixed(2)}</span>
                        {activeOrderInfo.hasCancelledItems && (
                          <span className="text-xs text-amber-600">
                            <span className="line-through">₹{order.subTotalAmt?.toFixed(2)}</span> (adjusted)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div>
                  {(() => {
                    const activeOrderInfo = getActiveOrderInfo(order);
                    return (
                      <>
                        <span className="block text-sm font-medium text-gray-500 mb-1.5">
                          Remaining Amount
                        </span>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg text-gray-800 tracking-wide">₹{activeOrderInfo.remainingTotal?.toFixed(2)}</span>
                          {activeOrderInfo.hasCancelledItems && (
                            <span className="text-xs text-amber-600">
                              <span className="line-through">₹{order.totalAmt?.toFixed(2)}</span> (original total)
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

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
                  
                  return (
                    <div key={index} className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isCancelled ? 'opacity-60 bg-gray-50' : ''}`}>
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
                              className={`w-full h-full object-cover ${isCancelled ? 'grayscale' : ''}`}
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
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className={`font-semibold tracking-tight text-base sm:text-lg ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {productInfo?.name || productInfo?.title || (isBundle ? 'Bundle Product' : 'Product Name')}
                            </h4>
                            {isBundle && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                              <span className="text-gray-500 font-medium block mb-1">Quantity</span>
                              <p className={`font-semibold ${isCancelled ? 'text-gray-500' : 'text-gray-800'}`}>{item.quantity}</p>
                            </div>
                  
                            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                              <span className="text-gray-500 font-medium block mb-1">Size</span>
                              <p className={`font-semibold ${isCancelled ? 'text-gray-500' : 'text-gray-800'}`}>
                                {item.size ? (
                                  <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${isCancelled ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>
                                    {item.size}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-xs">N/A</span>
                                )}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                              <span className="text-gray-500 font-medium block mb-1">Unit Price</span>
                              <p className={`font-semibold ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                ₹{unitPrice?.toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                              <span className="text-gray-500 font-medium block mb-1">Total Price</span>
                              <p className={`font-semibold ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                ₹{itemTotal?.toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                              <span className="text-gray-500 font-medium block mb-1">{isBundle ? 'Bundle ID' : 'Product ID'}</span>
                              <p className={`font-medium text-xs break-all ${isCancelled ? 'text-gray-500' : 'text-gray-800'}`}>
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
