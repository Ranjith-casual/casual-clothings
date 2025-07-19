import React, { useState, useEffect } from 'react';
import { FaSpinner, FaInfoCircle, FaDownload, FaTimes, FaCheck, FaBox } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AnimatedImage from '../components/NoData';
import BundleItemsModal from '../components/BundleItemsModal';
import noCart from '../assets/noCart.jpg';

// Helper function for formatting dates
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper function for displaying prices in Indian Rupees
const DisplayPriceInRupees = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(price || 0);
};

// Helper function to get color based on request or refund status
const getStatusColor = (status, refundStatus) => {
    // First check cancellation request status
    switch (status?.toUpperCase()) {
        case 'PENDING':
            return "bg-yellow-100 text-yellow-800";
        case 'REJECTED':
            return "bg-red-100 text-red-800";
        case 'APPROVED':
            // For approved requests, check refund status
            switch (refundStatus?.toUpperCase()) {
                case 'COMPLETED':
                    return "bg-green-100 text-green-800";
                case 'PROCESSING':
                    return "bg-blue-100 text-blue-800";
                case 'FAILED':
                    return "bg-red-100 text-red-800";
                case 'PENDING':
                default:
                    return "bg-yellow-100 text-yellow-800";
            }
        default:
            return "bg-gray-100 text-gray-800";
    }
};

// Helper function to get display status text
const getDisplayStatus = (status, refundStatus) => {
    if (status === 'PENDING') {
        return 'REQUEST PENDING';
    } else if (status === 'REJECTED') {
        return 'REQUEST REJECTED';
    } else if (status === 'APPROVED') {
        return refundStatus ? `REFUND ${refundStatus}` : 'REFUND PENDING';
    } else {
        return status || 'UNKNOWN';
    }
};

// Get image source with proper fallbacks
const getImageSource = (item) => {
    if (!item) return noCart;
    
    // Initialize with fallback
    let imageSrc = noCart;
    
    if (item.itemType === 'bundle') {
        // Enhanced bundle image handling
        if (item.bundleId && item.bundleId._id) {
            // Check if image is a string (URL) or array
            if (typeof item.bundleId.image === 'string') {
                imageSrc = item.bundleId.image;
            } else if (Array.isArray(item.bundleId.images) && item.bundleId.images.length > 0) {
                imageSrc = item.bundleId.images[0];
            } else if (Array.isArray(item.bundleId.image) && item.bundleId.image.length > 0) {
                imageSrc = item.bundleId.image[0];
            } else if (item.bundleId.bundleImage) {
                imageSrc = item.bundleId.bundleImage;
            }
        } else if (item.bundleDetails) {
            // Check if image is a string (URL) or array
            if (typeof item.bundleDetails.image === 'string') {
                imageSrc = item.bundleDetails.image;
            } else if (Array.isArray(item.bundleDetails.images) && item.bundleDetails.images.length > 0) {
                imageSrc = item.bundleDetails.images[0];
            } else if (Array.isArray(item.bundleDetails.image) && item.bundleDetails.image.length > 0) {
                imageSrc = item.bundleDetails.image[0];
            } else if (item.bundleDetails.bundleImage) {
                imageSrc = item.bundleDetails.bundleImage;
            }
        }
    } else {
        // For products
        if (item.productId && item.productId._id) {
            if (typeof item.productId.image === 'string') {
                imageSrc = item.productId.image;
            } else if (Array.isArray(item.productId.images) && item.productId.images.length > 0) {
                imageSrc = item.productId.images[0];
            } else if (Array.isArray(item.productId.image) && item.productId.image.length > 0) {
                imageSrc = item.productId.image[0];
            }
        } else if (item.productDetails) {
            if (typeof item.productDetails.image === 'string') {
                imageSrc = item.productDetails.image;
            } else if (Array.isArray(item.productDetails.image) && item.productDetails.image.length > 0) {
                imageSrc = item.productDetails.image[0];
            } else if (Array.isArray(item.productDetails.images) && item.productDetails.images.length > 0) {
                imageSrc = item.productDetails.images[0];
            }
        }
    }
    
    return imageSrc || noCart;
};

const RefundDetailsModal = ({ refund, onClose, onShowBundleItems }) => {
    if (!refund) return null;

    const order = refund.orderId || {};
    const user = refund.userId || {};
    const refundDetails = refund.refundDetails || {};
    const adminResponse = refund.adminResponse || {};

    // Download invoice if available
    const downloadInvoice = async () => {
        try {
            if (!refundDetails.refundId) {
                toast.error("No invoice available for this refund");
                return;
            }
            
            toast.loading('Downloading invoice...');
            
            // Make API call to download invoice
            const response = await fetch(`/api/order-cancellation/invoice/${refundDetails.refundId}`, {
                headers: {
                    authorization: `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to download invoice');
            }
            
            // Create blob from response
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary link and trigger download
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `refund-invoice-${refundDetails.refundId}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.dismiss();
            toast.success('Invoice downloaded successfully');
        } catch (error) {
            console.error('Error downloading invoice:', error);
            toast.dismiss();
            toast.error('Failed to download invoice');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">
                            {refund.status === 'APPROVED' ? 'Refund Details' : 'Cancellation Request Details'}
                        </h2>
                        <button 
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    {/* Refund Status Banner */}
                    <div className="flex flex-wrap items-center mb-6">
                        <div className="w-full mb-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(refund.status, refundDetails.refundStatus)}`}>
                                {getDisplayStatus(refund.status, refundDetails.refundStatus)}
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
                        </div>

                        {/* Cancellation Details */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-3">Cancellation Details</h3>
                            <p><span className="font-medium">Reason:</span> {refund.reason}</p>
                            {refund.additionalReason && (
                                <p><span className="font-medium">Additional Information:</span> {refund.additionalReason}</p>
                            )}
                            <p><span className="font-medium">Request Status:</span> {refund.status}</p>
                            {adminResponse.processedDate && (
                                <p><span className="font-medium">Processed Date:</span> {formatDate(adminResponse.processedDate)}</p>
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
                            {order.items && order.items.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 mt-2">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-3 flex items-center bg-white">
                                            <div className="flex-shrink-0 w-16 h-16 mr-4">
                                                <img 
                                                    src={getImageSource(item)}
                                                    alt={item.itemType === 'product' 
                                                        ? (item.productDetails?.name || 'Product') 
                                                        : (item.bundleDetails?.title || 'Bundle')} 
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-medium">
                                                        {item.itemType === 'product' 
                                                            ? item.productDetails?.name || 'Product' 
                                                            : item.bundleDetails?.title || 'Bundle'}
                                                    </h4>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        item.itemType === 'bundle' 
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {item.itemType === 'bundle' ? '📦 Bundle' : '🏷️ Product'}
                                                    </span>
                                                    {item.itemType === 'bundle' && onShowBundleItems && (
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
                                                                console.log('Refunds page - Bundle button clicked - sending data:', bundleData);
                                                                onShowBundleItems(bundleData, order);
                                                            }}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 bg-green-100 text-green-800 hover:bg-green-200"
                                                            title="View all items in this bundle"
                                                        >
                                                            <FaBox className="w-3 h-3 mr-1" />
                                                            View Items
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    <span>Quantity: {item.quantity}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>Price: {DisplayPriceInRupees(
                                                        item.itemType === 'product' 
                                                            ? item.productDetails?.price || 0 
                                                            : item.bundleDetails?.bundlePrice || 0
                                                    )}</span>
                                                </div>
                                                <div className="text-sm font-medium mt-1">
                                                    Subtotal: {DisplayPriceInRupees(item.itemTotal)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No product details available</p>
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
                        
                        {refund.status === 'APPROVED' && refundDetails.refundStatus === 'COMPLETED' && (
                            <button 
                                onClick={downloadInvoice}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                            >
                                <FaDownload className="mr-2" /> Download Invoice
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyRefunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    
    // Bundle Items Modal States
    const [showBundleItemsModal, setShowBundleItemsModal] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [orderContext, setOrderContext] = useState(null);

    // Fetch user's refunds
    const fetchUserRefunds = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.getUserRefunds,
            });

            if (response.data.success) {
                setRefunds(response.data.data);
            } else {
                toast.error("Failed to fetch refunds");
            }
        } catch (error) {
            console.error("Error fetching refunds:", error);
            toast.error(error.response?.data?.message || "Error fetching refunds");
        } finally {
            setLoading(false);
        }
    };

    // Fetch refunds on component mount
    useEffect(() => {
        fetchUserRefunds();
    }, []);

    // View refund details
    const handleViewRefund = (refund) => {
        setSelectedRefund(refund);
        setShowDetailsModal(true);
    };

    // Close refund details modal
    const handleCloseModal = () => {
        setShowDetailsModal(false);
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

    return (
        <div className="py-6">
            <h1 className="text-2xl font-bold mb-6">My Cancellation &amp; Refund Requests</h1>
            
            {/* Refresh Button */}
            <div className="mb-6">
                <button
                    onClick={fetchUserRefunds}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                    <FaSpinner className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Refunds List */}
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <FaSpinner className="animate-spin mr-2 text-2xl" />
                    <span>Loading refunds...</span>
                </div>
            ) : refunds.length === 0 ? (
                <div className="text-center py-8">
                    <AnimatedImage height={200} />
                    <p className="mt-4 text-gray-500 text-lg">No refunds found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Request Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount/Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {refunds.map(refund => (
                                <tr key={refund._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {refund.orderId?.orderId || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(refund.requestDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {refund.reason || 'Not specified'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(refund.status, refund.refundDetails?.refundStatus)}`}>
                                            {getDisplayStatus(refund.status, refund.refundDetails?.refundStatus)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {refund.status === 'APPROVED' ? 
                                          DisplayPriceInRupees(refund.adminResponse?.refundAmount) :
                                          (refund.status === 'REJECTED' ? 
                                            formatDate(refund.adminResponse?.processedDate) : 
                                            'Pending')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleViewRefund(refund)}
                                            className="text-blue-600 hover:text-blue-900 flex items-center ml-auto"
                                        >
                                            <FaInfoCircle className="mr-1" /> Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Refund Details Modal */}
            {showDetailsModal && selectedRefund && (
                <RefundDetailsModal 
                    refund={selectedRefund} 
                    onClose={handleCloseModal}
                    onShowBundleItems={handleShowBundleItems}
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
        </div>
    );
};

export default MyRefunds;
