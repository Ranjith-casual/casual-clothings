import React, { useState } from 'react';  
import { FaMapMarkerAlt, FaCity, FaFlag, FaTimes, FaUser, FaCalendarAlt, FaBox, FaMoneyBillWave, FaTruck, FaCheck, FaCog, FaBan, FaBoxOpen, FaInfoCircle, FaExclamationCircle, FaEnvelope } from 'react-icons/fa';
import OrderTimeline from './OrderTimeline';
import { useGlobalContext } from '../provider/GlobalProvider';
import toast from 'react-hot-toast';

const AdminOrderDetails = ({ order, onClose }) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order?.orderStatus || '');
  const [localOrderStatus, setLocalOrderStatus] = useState(order?.orderStatus || '');
  const { updateOrderStatus } = useGlobalContext();

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

    setUpdatingStatus(true);
    try {
      const statusLabel = statusOptions.find(option => option.value === selectedStatus)?.label || selectedStatus;
      
      const success = await updateOrderStatus(order.orderId, selectedStatus);
      
      if (success) {
        setLocalOrderStatus(selectedStatus);
        toast.success(`Order status updated to ${statusLabel}`);
        
        if (order) {
          order.orderStatus = selectedStatus;
        }
        
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
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
            <div>
              <span className="block text-sm font-medium text-gray-500 mb-1">Order Date</span>
              <div className="flex items-center">
                <FaCalendarAlt className="text-gray-500 mr-2" />
                <span className="font-semibold text-gray-800">{formatDate(order.orderDate)}</span>
              </div>
            </div>
          </div>

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
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <FaBan className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">This order has been cancelled.</p>
                  <p className="text-red-700 text-sm mt-1">Please check the Refund Management section for details on any required refund processing.</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Update Section */}
          <div className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 tracking-tight">Update Order Status</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <select
                value={selectedStatus}
                onChange={handleStatusChange}
                className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white appearance-none cursor-pointer font-medium"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus || selectedStatus === localOrderStatus}
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
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Payment Status</span>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-medium text-gray-800 tracking-wide">{order.paymentStatus}</span>
                    
                    {/* Payment Status Badge */}
                    {order.orderStatus === "DELIVERED" && order.paymentStatus === "CASH ON DELIVERY" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                        Will be marked as PAID on delivery
                      </span>
                    ) : order.paymentStatus === "PAID" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                        ✓ Paid
                      </span>
                    ) : order.paymentStatus === "CANCELLED" || order.orderStatus === "CANCELLED" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 shadow-sm">
                        ✗ Cancelled
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">
                        ⏱ Pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Total Quantity</span>
                  <span className="font-medium text-gray-800 tracking-wide">{order.totalQuantity} items</span>
                </div>
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Subtotal</span>
                  <span className="font-medium text-gray-800 tracking-wide">₹{order.subTotalAmt?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1.5">Total Amount</span>
                  <span className="font-bold text-lg text-gray-800 tracking-wide">₹{order.totalAmt?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Information - Fixed for Multiple Items */}
          <div className="mt-8">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center tracking-tight">
              <FaBox className="text-gray-600 mr-2.5" />
              Products Information ({order.items?.length || 0} items)
            </h3>
            
            {/* Check if order has items array (new structure) or single product (old structure) */}
            {order.items && order.items.length > 0 ? (
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  // Handle both populated and non-populated productId
                  const productInfo = item.productId && typeof item.productId === 'object' 
                    ? item.productId  // If populated, use the populated data
                    : item.productDetails; // Otherwise, use productDetails
                  
                  const productId = item.productId && typeof item.productId === 'object'
                    ? item.productId._id  // If populated, get the _id
                    : item.productId;     // Otherwise, use the ID string
                  
                  return (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row items-start p-4 sm:p-5 gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 shadow-sm">
                          {productInfo?.image && productInfo.image.length > 0 && (
                            <img 
                              src={productInfo.image[0]} 
                              alt={productInfo?.name} 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-semibold text-gray-900 mb-3 tracking-tight text-base sm:text-lg">{productInfo?.name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 text-sm">
                            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                              <span className="text-gray-500 font-medium block mb-1">Quantity</span>
                              <p className="font-semibold text-gray-800">{item.quantity}</p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                              <span className="text-gray-500 font-medium block mb-1">Unit Price</span>
                              <p className="font-semibold text-gray-800">₹{productInfo?.price?.toFixed(2)}</p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                              <span className="text-gray-500 font-medium block mb-1">Item Total</span>
                              <p className="font-semibold text-gray-800">₹{item.itemTotal?.toFixed(2)}</p>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                              <span className="text-gray-500 font-medium block mb-1">Product ID</span>
                              <p className="font-medium text-gray-800 text-xs break-all">
                                {typeof productId === 'string' ? productId : productId?.toString()}
                              </p>
                            </div>
                          </div>
                          {/* Stock info if available from populated data */}
                          {productInfo?.stock !== undefined && (
                            <div className="mt-3 text-sm bg-gray-50 p-2.5 rounded-md inline-block border border-gray-100">
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
                        <span className="text-sm text-gray-500 mr-2">Price:</span>
                        <span className="font-medium text-gray-800">₹{order.productDetails?.price?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
