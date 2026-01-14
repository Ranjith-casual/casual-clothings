import React from 'react';
import { FaMapMarkerAlt, FaCity, FaFlag, FaUser, FaEnvelope, FaCalendar, FaInfoCircle, FaCreditCard, FaTruck, FaMoneyBillWave, FaBox, FaTimesCircle, FaPhone } from 'react-icons/fa';
import ProductImageLink from './ProductImageLink';
import noCart from '../assets/Empty-cuate.png';

const OrderDetailsModal = ({ order, onClose, isLoading }) => {
  if (!order && !isLoading) return null;

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function for payment status display - Enhanced to handle Online Payment method
  const getPaymentStatusDisplay = (order) => {
    // Check if payment method is Online Payment and status is PAID
    const isOnlinePayment = order?.paymentMethod === "Online Payment" || order?.paymentMethod === "ONLINE";
    const status = order?.paymentStatus;
    
    // Debug log for payment status detection
    console.log('OrderDetailsModal Payment Status Debug:', {
      orderId: order?.orderId,
      paymentMethod: order?.paymentMethod,
      paymentStatus: order?.paymentStatus,
      isOnlinePayment
    });
    
    // If it's online payment and status shows PAID, display as PAID
    if (isOnlinePayment && status === 'PAID') {
      return { text: 'PAID', colorClass: 'bg-green-100 text-green-800 border border-green-200' };
    }
    
    switch (status) {
      case 'PAID':
        return { text: 'PAID', colorClass: 'bg-green-100 text-green-800 border border-green-200' };
      case 'PENDING':
        return { text: 'PENDING', colorClass: 'bg-yellow-100 text-yellow-800 border border-yellow-200' };
      case 'REFUNDED':
        return { text: 'REFUNDED', colorClass: 'bg-blue-100 text-blue-800 border border-blue-200' };
      case 'CANCELLED':
        return { text: 'CANCELLED', colorClass: 'bg-red-100 text-red-800 border border-red-200' };
      default:
        return { text: status || 'UNKNOWN', colorClass: 'bg-gray-100 text-gray-800 border border-gray-200' };
    }
  };

  // Helper function for order status display
  const getOrderStatusDisplay = (status) => {
    switch (status) {
      case 'ORDER PLACED':
        return { text: 'ORDER PLACED', colorClass: 'bg-purple-100 text-purple-800 border border-purple-200' };
      case 'PROCESSING':
        return { text: 'PROCESSING', colorClass: 'bg-blue-100 text-blue-800 border border-blue-200' };
      case 'SHIPPED':
        return { text: 'SHIPPED', colorClass: 'bg-indigo-100 text-indigo-800 border border-indigo-200' };
      case 'OUT FOR DELIVERY':
        return { text: 'OUT FOR DELIVERY', colorClass: 'bg-yellow-100 text-yellow-800 border border-yellow-200' };
      case 'DELIVERED':
        return { text: 'DELIVERED', colorClass: 'bg-green-100 text-green-800 border border-green-200' };
      case 'CANCELLED':
        return { text: 'CANCELLED', colorClass: 'bg-red-100 text-red-800 border border-red-200' };
      default:
        return { text: status || 'UNKNOWN', colorClass: 'bg-gray-100 text-gray-800 border border-gray-200' };
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        {/* Header styled like the invoice */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Casual Clothing Fashion</h1>
          <p className="text-sm text-gray-600">Sivsakthi Nagar, 5th Street, Tirupur, Tamil Nadu - 641604</p>
          <p className="text-sm text-gray-600">Phone: +91 9442955929 | Email: casualclothing787@gmail.com</p>
          <p className="text-sm text-gray-600">GST: 33ABCDE1234F1Z5</p>
          
          <div className="mt-6 border-b border-gray-200 pb-2">
            <h2 className="text-xl font-bold text-gray-800 uppercase">
              {order.orderStatus === 'CANCELLED' ? 'CANCELLED ORDER DETAILS' : 'DELIVERY INVOICE'}
            </h2>
          </div>
        </div>
        
        {/* Close button - positioned at the top right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <FaTimesCircle className="w-6 h-6" />
        </button>
        
        {/* Order ID and Date */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-2 md:mb-0">
              <h3 className="text-lg font-bold">Order ID: {order.orderId}</h3>
              <p className="text-sm text-gray-600">
                Date: {formatDate(order.orderDate || order.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getOrderStatusDisplay(order.orderStatus).colorClass}`}>
                {getOrderStatusDisplay(order.orderStatus).text}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusDisplay(order).colorClass}`}>
                {getPaymentStatusDisplay(order).text}
              </span>
            </div>
          </div>
        </div>
        
        {/* Two column layout for customer and shipping - styled like the invoice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-base">
              Customer Information
            </h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Name:</span> {order.userId?.name || order.user?.name || order.customerInfo?.name || 'N/A'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span> {order.userId?.email || order.user?.email || order.customerInfo?.email || 'N/A'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone:</span> {order.userId?.mobile || order.user?.mobile || order.customerInfo?.mobile || order.deliveryAddress?.mobile || 'N/A'}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-base">
              Shipping Address
            </h3>
            {order.deliveryAddress ? (
              <div className="space-y-2">
                <p className="text-sm">
                  {order.deliveryAddress.address_line || 'N/A'}
                </p>
                <p className="text-sm">
                  {order.deliveryAddress.city || 'N/A'}, {order.deliveryAddress.state || 'N/A'} {order.deliveryAddress.pincode || 'N/A'}
                </p>
                <p className="text-sm">
                  {order.deliveryAddress.country || 'India'}
                </p>
                {order.deliveryAddress.landmark && (
                  <p className="text-sm">
                    <span className="font-medium">Landmark:</span> {order.deliveryAddress.landmark}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No shipping address provided</p>
            )}
          </div>
        </div>

        {/* Delivery Timeline */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <FaTruck className="mr-2 text-blue-600" /> 
            Delivery Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm mb-2">
                <span className="font-medium text-gray-700">Order Date:</span> {formatDate(order.createdAt)}
              </p>
              <p className="text-sm mb-2">
                <span className="font-medium text-gray-700">Estimated Delivery:</span> {formatDate(order.estimatedDeliveryDate)}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Actual Delivery:</span> {formatDate(order.actualDeliveryDate)}
              </p>
            </div>
            <div>
              <p className="text-sm mb-2">
                <span className="font-medium text-gray-700">Delivery Distance:</span> {order.deliveryDistance || 'N/A'} km
              </p>
              <p className="text-sm mb-2">
                <span className="font-medium text-gray-700">Delivery Days:</span> {order.deliveryDays || 'N/A'} days
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Notes:</span> {order.deliveryNotes || 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <FaCreditCard className="mr-2 text-blue-600" /> 
            Payment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm mb-2">
                <span className="font-medium text-gray-700">Method:</span> {order.paymentMethod || 'N/A'}
              </p>
              <p className="text-sm mb-2">
                <span className="font-medium text-gray-700">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getPaymentStatusDisplay(order).colorClass}`}>
                  {getPaymentStatusDisplay(order).text}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Payment ID:</span> {order.paymentId || 'N/A'}
              </p>
            </div>
            {order.refundDetails && (
              <div>
                <p className="text-sm mb-2">
                  <span className="font-medium text-gray-700">Refund ID:</span> {order.refundDetails.refundId || 'N/A'}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium text-gray-700">Refund Amount:</span> ₹{order.refundDetails.refundAmount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Refund Date:</span> {formatDate(order.refundDetails.refundDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Info (if applicable) */}
        {order.cancellation && (
          <div className={`border rounded-lg p-4 mb-6 ${
            order.cancellation.status === 'APPROVED' 
              ? 'bg-red-50 border-red-200' 
              : order.cancellation.status === 'PENDING'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-600" /> 
              Cancellation Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm mb-2">
                  <span className="font-medium text-gray-700">Status:</span> {order.cancellation.status || 'N/A'}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium text-gray-700">Request Date:</span> {formatDate(order.cancellation.requestDate)}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium text-gray-700">Reason:</span> {order.cancellation.reason || 'N/A'}
                </p>
                {order.cancellation.additionalReason && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Additional Info:</span> {order.cancellation.additionalReason}
                  </p>
                )}
              </div>
              {order.cancellation.status === 'APPROVED' && order.cancellation.refundDetails && (
                <div>
                  <p className="text-sm mb-2">
                    <span className="font-medium text-gray-700">Refund Percentage:</span> {order.cancellation.adminResponse?.refundPercentage || 0}%
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium text-gray-700">Expected Refund:</span> ₹{(order.totalAmt * (order.cancellation.adminResponse?.refundPercentage || 0) / 100).toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Admin Comments:</span> {order.cancellation.adminResponse?.comments || 'None'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <FaBox className="mr-2 text-blue-600" /> 
            Order Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Image</th>
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-center p-2">Size</th>
                  <th className="text-center p-2">Quantity</th>
                  <th className="text-right p-2">Price</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.map((item, idx) => {
                  const isBundle = item.itemType === 'bundle';
                  const name = isBundle 
                    ? (item.bundleDetails?.title || item.bundleId?.title || 'Bundle') 
                    : (item.productDetails?.name || item.productId?.name || 'Product');
                  // Determine the correct price to use for this item
                  let price = 0;
                  if (isBundle) {
                    // For bundles: First check unitPrice from order, then bundlePrice from details
                    price = item.unitPrice || 
                            item.bundleDetails?.bundlePrice || 
                            item.bundleId?.bundlePrice ||
                            item.bundleDetails?.price || 0;
                  } else {
                    // For products: Check in priority order
                    
                    // First check unit price set directly on the order item (most accurate)
                    if (item.unitPrice !== undefined && item.unitPrice > 0) {
                      price = Number(item.unitPrice);
                    }
                    // Then check for size-adjusted price stored with the order item
                    else if (item.sizeAdjustedPrice !== undefined && item.sizeAdjustedPrice > 0) {
                      price = Number(item.sizeAdjustedPrice);
                    }
                    // Then check for finalPrice in productDetails
                    else if (item.productDetails?.finalPrice !== undefined && item.productDetails.finalPrice > 0) {
                      price = Number(item.productDetails.finalPrice);
                    }
                    // Then check for size-specific pricing from product data
                    else if (item.size && 
                            (item.productId?.sizePricing?.[item.size] !== undefined || 
                             item.productDetails?.sizePricing?.[item.size] !== undefined)) {
                      const sizePrice = item.productId?.sizePricing?.[item.size] || 
                                       item.productDetails?.sizePricing?.[item.size];
                      if (sizePrice > 0) {
                        price = Number(sizePrice);
                      }
                    }
                    // Try regular product price
                    else if ((item.productDetails?.price !== undefined && item.productDetails.price > 0) ||
                             (item.productId?.price !== undefined && item.productId.price > 0)) {
                      const basePrice = item.productDetails?.price || item.productId?.price;
                      const discount = item.productDetails?.discount || item.productId?.discount || 0;
                      price = discount > 0 ? Number(basePrice) * (1 - discount/100) : Number(basePrice);
                    }
                    // Fallback: try to calculate from total and quantity
                    else if (item.total && item.quantity && Number(item.total) > 0 && Number(item.quantity) > 0) {
                      price = Number(item.total) / Number(item.quantity);
                      console.log('Using total/quantity fallback price:', price);
                    }
                    // Final fallback: try any available price field
                    else {
                      const fallbackPrice = item.price || 
                                          item.itemPrice || 
                                          item.productPrice || 
                                          item.bundlePrice ||
                                          0;
                      if (fallbackPrice > 0) {
                        price = Number(fallbackPrice);
                        console.log('Using fallback price field:', price);
                      }
                    }
                    
                    // Debug log to understand pricing issues
                    if (price === 0) {
                      console.log('OrderDetailsModal Price Debug:', {
                        itemName: name,
                        unitPrice: item.unitPrice,
                        sizeAdjustedPrice: item.sizeAdjustedPrice,
                        finalPrice: item.productDetails?.finalPrice,
                        regularPrice: item.productDetails?.price || item.productId?.price,
                        size: item.size,
                        sizePricing: item.productId?.sizePricing || item.productDetails?.sizePricing,
                        fallbackTotal: item.total,
                        quantity: item.quantity,
                        allPriceFields: {
                          price: item.price,
                          itemPrice: item.itemPrice,
                          productPrice: item.productPrice,
                          bundlePrice: item.bundlePrice
                        },
                        rawItem: item
                      });
                    }
                  }
                  const total = price * (item.quantity || 1);
                  
                  return (
                    <tr key={`item-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {/* Image Cell */}
                      <td className="p-2 w-16">
                        <div className="w-14 h-14">
                          {(() => {
                            // Get image source for the item
                            let imageSrc = null;
                            if (isBundle) {
                              imageSrc = item.bundleDetails?.images?.[0] || 
                                      item.bundleId?.images?.[0] || 
                                      noCart;
                            } else {
                              imageSrc = item.productDetails?.image?.[0] || 
                                      item.productId?.image?.[0] || 
                                      item.image || 
                                      noCart;
                            }
                            
                            // Get the product or bundle ID
                            const itemId = isBundle 
                              ? (item.bundleId?._id || item.bundleDetails?._id) 
                              : (item.productId?._id || item.productDetails?._id);
                            
                            return itemId ? (
                              <ProductImageLink 
                                imageUrl={imageSrc}
                                productId={itemId}
                                alt={name}
                                className="w-full h-full rounded"
                                height="100%"
                                width="100%"
                                disableNavigation={isBundle}
                              />
                            ) : (
                              <img 
                                src={imageSrc} 
                                alt={name}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = noCart;
                                }}
                              />
                            );
                          })()}
                        </div>
                      </td>
                      {/* Other Cells */}
                      <td className="p-2">{name}</td>
                      <td className="p-2">{isBundle ? 'Bundle' : 'Product'}</td>
                      <td className="text-center p-2">
                        {isBundle ? 'N/A' : (
                          <>
                            {item.size || item.productDetails?.size || 'N/A'}
                            {item.sizeAdjustedPrice && (
                              <span className="block text-xs text-green-600">
                                (Price: ₹{item.sizeAdjustedPrice})
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="text-center p-2">{item.quantity || 1}</td>
                      <td className="text-right p-2">
                        {/* Enhanced price display with debug info */}
                        <div>
                          <span className="font-semibold">₹{price.toFixed(2)}</span>
                          {item.sizeAdjustedPrice && (
                            <span className="block text-xs text-green-600">
                              (Size: {item.size})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right p-2">₹{total.toFixed(2)}</td>
                      <td className="text-center p-2">
                        {item.status === 'Cancelled' ? (
                          <div className="flex flex-col items-center">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              Cancelled
                            </span>
                            {item.refundStatus && (
                              <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium 
                                ${item.refundStatus === 'Completed' 
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : item.refundStatus === 'Processing'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                {item.refundStatus === 'Completed' ? 'Refunded' : 'Refund ' + item.refundStatus}
                              </span>
                            )}
                            {item.refundAmount > 0 && (
                              <span className="mt-1 text-xs text-gray-600">
                                ₹{item.refundAmount?.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            {item.status || 'Active'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-300">
                <tr>
                  <td colSpan="5" className="p-2"></td>
                  <td className="text-right p-2 font-semibold">Subtotal:</td>
                  <td className="text-right p-2">₹{order.subTotalAmt?.toFixed(2) || '0.00'}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan="5" className="p-2"></td>
                  <td className="text-right p-2 font-semibold">Delivery:</td>
                  <td className="text-right p-2">
                    ₹{(order.deliveryCharge || 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
                <tr className="bg-gray-100">
                  <td colSpan="5" className="p-2"></td>
                  <td className="text-right p-2 font-bold">Total:</td>
                  <td className="text-right p-2 font-bold">₹{order.totalAmt?.toFixed(2) || '0.00'}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Refund Summary Section */}
        {order.isFullOrderCancelled || (order.refundSummary && order.refundSummary.length > 0) ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FaMoneyBillWave className="mr-2 text-red-600" /> 
              Refund Summary
            </h3>
            
            {order.isFullOrderCancelled && (
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">
                <p className="font-medium">Full Order Cancellation</p>
                <p className="text-sm">All items in this order have been cancelled.</p>
              </div>
            )}
            
            {order.refundDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm mb-2">
                    <span className="font-medium text-gray-700">Refund ID:</span> {order.refundDetails.refundId || 'N/A'}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium text-gray-700">Refund Date:</span> {formatDate(order.refundDetails.refundDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-2">
                    <span className="font-medium text-gray-700">Refund Amount:</span> <span className="font-bold">₹{order.refundDetails.refundAmount?.toFixed(2) || '0.00'}</span>
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium text-gray-700">Refund Percentage:</span> {order.refundDetails.refundPercentage || 0}%
                  </p>
                </div>
              </div>
            )}
            
            {order.refundSummary && order.refundSummary.length > 0 && (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-red-100">
                      <th className="text-left p-2">Item</th>
                      <th className="text-right p-2">Refund Amount</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-right p-2">Processed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.refundSummary.map((refund, idx) => {
                      // Find the matching item for this refund
                      const matchingItem = order.items.find(item => 
                        item._id.toString() === refund.itemId.toString()
                      );
                      
                      const itemName = matchingItem 
                        ? (matchingItem.itemType === 'bundle' 
                            ? (matchingItem.bundleDetails?.title || matchingItem.bundleId?.title || 'Bundle') 
                            : (matchingItem.productDetails?.name || matchingItem.productId?.name || 'Product'))
                        : `Item #${idx + 1}`;
                      
                      // Calculate refund amount with enhanced fallback logic
                      let refundAmount = 0;
                      
                      // Priority 1: Use direct refund amount
                      if (refund.amount !== undefined && refund.amount > 0) {
                        refundAmount = refund.amount;
                      } 
                      // Priority 2: Use item's refund amount
                      else if (matchingItem?.refundAmount !== undefined && matchingItem.refundAmount > 0) {
                        refundAmount = matchingItem.refundAmount;
                      } 
                      // Priority 3: Calculate from item total and refund percentage
                      else if (matchingItem && order.refundDetails?.refundPercentage) {
                        const itemTotal = (matchingItem.unitPrice || 0) * (matchingItem.quantity || 1);
                        refundAmount = (itemTotal * order.refundDetails.refundPercentage) / 100;
                      }
                      // Priority 4: If item is cancelled, try to get item price
                      else if (matchingItem?.status === 'Cancelled') {
                        const itemPrice = matchingItem.unitPrice || 
                                         matchingItem.sizeAdjustedPrice || 
                                         matchingItem.productDetails?.finalPrice || 
                                         matchingItem.productDetails?.price ||
                                         matchingItem.bundleDetails?.bundlePrice || 0;
                        refundAmount = itemPrice * (matchingItem.quantity || 1);
                        
                        // Apply refund percentage if available
                        if (order.refundDetails?.refundPercentage) {
                          refundAmount = (refundAmount * order.refundDetails.refundPercentage) / 100;
                        }
                      }
                      
                      // Get refund status with fallbacks
                      let refundStatus = refund.status || 'Processing';
                      if (matchingItem?.status === 'Cancelled' && matchingItem?.refundStatus) {
                        refundStatus = matchingItem.refundStatus;
                      }
                        
                      return (
                        <tr key={`refund-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-red-50'}>
                          <td className="p-2">{itemName}</td>
                          <td className="text-right p-2">₹{refundAmount.toFixed(2)}</td>
                          <td className="text-center p-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                              ${refundStatus === 'Completed' 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : refundStatus === 'Processing'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                              {refundStatus}
                            </span>
                          </td>
                          <td className="text-right p-2">{formatDate(refund.processedDate) || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
        
        {/* Footer */}
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
