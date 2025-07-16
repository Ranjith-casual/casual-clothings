import React, { useState } from 'react';
import { FaMapMarkerAlt, FaCity, FaFlag, FaTimes, FaUser, FaEnvelope, FaCalendarAlt, FaBox, FaMoneyBillWave, FaTruck, FaCheck, FaCog, FaBan, FaBoxOpen } from 'react-icons/fa';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <FaBox className="text-xl mr-2 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Order ID and Date */}
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <span className="block text-sm text-gray-500 mb-1">Order ID</span>
              <span className="font-medium text-gray-800">{order.orderId}</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500 mb-1">Order Date</span>
              <div className="flex items-center">
                <FaCalendarAlt className="text-gray-400 mr-1" />
                <span className="font-medium text-gray-800">{formatDate(order.orderDate)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-700 mb-2">Order Status</h3>
            <OrderTimeline status={localOrderStatus || order.orderStatus} />
          </div>

          {/* Status Update Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3">Update Order Status</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <select
                value={selectedStatus}
                onChange={handleStatusChange}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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
                className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Information */}
            <div>
              <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                <FaUser className="text-gray-500 mr-2" />
                Customer Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="mb-3">
                  <span className="block text-sm text-gray-500 mb-1">Name</span>
                  <span className="font-medium text-gray-800">{order.userId?.name}</span>
                </div>
                <div className="mb-3">
                  <span className="block text-sm text-gray-500 mb-1">Email</span>
                  <div className="flex items-center">
                    <FaEnvelope className="text-gray-400 mr-1" />
                    <span className="font-medium text-gray-800">{order.userId?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                <FaMoneyBillWave className="text-gray-500 mr-2" />
                Payment Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="mb-3">
                  <span className="block text-sm text-gray-500 mb-1">Payment Status</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{order.paymentStatus}</span>
                    
                    {/* Payment Status Badge */}
                    {order.orderStatus === "DELIVERED" && order.paymentStatus === "CASH ON DELIVERY" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        Will be marked as PAID on delivery
                      </span>
                    ) : order.paymentStatus === "PAID" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        ✓ Paid
                      </span>
                    ) : order.paymentStatus === "CANCELLED" || order.orderStatus === "CANCELLED" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        ✗ Cancelled
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                        ⏱ Pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <span className="block text-sm text-gray-500 mb-1">Total Quantity</span>
                  <span className="font-medium text-gray-800">{order.totalQuantity} items</span>
                </div>
                <div className="mb-3">
                  <span className="block text-sm text-gray-500 mb-1">Subtotal</span>
                  <span className="font-medium text-gray-800">₹{order.subTotalAmt?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500 mb-1">Total Amount</span>
                  <span className="font-bold text-lg text-gray-800">₹{order.totalAmt?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Information - Fixed for Multiple Items */}
          <div className="mt-8">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center">
              <FaBox className="text-gray-500 mr-2" />
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
                    <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex flex-col md:flex-row items-start p-4 gap-4">
                        <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          {productInfo?.image && productInfo.image.length > 0 && (
                            <img 
                              src={productInfo.image[0]} 
                              alt={productInfo?.name} 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-gray-900 mb-2">{productInfo?.name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Quantity:</span>
                              <p className="font-medium text-gray-800">{item.quantity}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Unit Price:</span>
                              <p className="font-medium text-gray-800">₹{productInfo?.price?.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Item Total:</span>
                              <p className="font-medium text-gray-800">₹{item.itemTotal?.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Product ID:</span>
                              <p className="font-medium text-gray-800 text-xs break-all">
                                {typeof productId === 'string' ? productId : productId?.toString()}
                              </p>
                            </div>
                          </div>
                          {/* Stock info if available from populated data */}
                          {productInfo?.stock !== undefined && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Current Stock:</span>
                              <span className={`ml-1 font-medium ${productInfo.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
            <div className="mt-8">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                <FaMapMarkerAlt className="text-gray-500 mr-2" />
                Shipping Address
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="mb-2 flex items-start">
                  <FaMapMarkerAlt className="text-gray-500 mr-2 mt-1 flex-shrink-0" />
                  <span className="text-gray-800">{order.deliveryAddress.address_line}</span>
                </p>
                <p className="mb-2 flex items-start">
                  <FaCity className="text-gray-500 mr-2 mt-1 flex-shrink-0" />
                  <span className="text-gray-800">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}
                  </span>
                </p>
                <p className="flex items-start">
                  <FaFlag className="text-gray-500 mr-2 mt-1 flex-shrink-0" />
                  <span className="text-gray-800">{order.deliveryAddress.country}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-end">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
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
