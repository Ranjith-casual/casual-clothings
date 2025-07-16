import React, { useState, useEffect } from 'react'
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaShoppingBag, FaCreditCard } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosTostError from '../utils/AxiosTostError'

function UserDetailsModal({ user, onClose }) {
    const [userDetails, setUserDetails] = useState(null)
    const [orderHistory, setOrderHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')

    useEffect(() => {
        if (user) {
            fetchUserDetails()
            fetchOrderHistory()
        }
    }, [user])

    const fetchUserDetails = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getUserDetails,
                data: { userId: user._id }
            })

            if (response.data.success) {
                setUserDetails(response.data.data)
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchOrderHistory = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getUserOrderHistory,
                data: { userId: user._id }
            })

            if (response.data.success) {
                setOrderHistory(response.data.data)
            }
        } catch (error) {
            AxiosTostError(error)
        }
    }

    const getOrderStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800'
        
        switch (status.toLowerCase()) {
            case 'pending':
            case 'order placed': return 'bg-yellow-100 text-yellow-800'
            case 'confirmed': return 'bg-blue-100 text-blue-800'
            case 'processing': return 'bg-orange-100 text-orange-800'
            case 'shipped': return 'bg-purple-100 text-purple-800'
            case 'delivered': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-black text-white p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                                <FaUser className="text-white" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold">{user.name}</h2>
                            <p className="text-gray-300">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-white transition-colors"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'profile'
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Profile Details
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'orders'
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Order History
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                                            
                                            <div className="flex items-center space-x-3">
                                                <FaUser className="text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Full Name</p>
                                                    <p className="font-medium">{user.name}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <FaEnvelope className="text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Email</p>
                                                    <p className="font-medium">{user.email}</p>
                                                </div>
                                            </div>

                                            {user.mobile && (
                                                <div className="flex items-center space-x-3">
                                                    <FaPhone className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-500">Phone</p>
                                                        <p className="font-medium">{user.mobile}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-3">
                                                <FaCalendarAlt className="text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Joined</p>
                                                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
                                            
                                            <div>
                                                <p className="text-sm text-gray-500">Role</p>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                                    user.role === 'SELLER' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500">Status</p>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {user.status}
                                                </span>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500">Email Verified</p>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.verify_email ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {user.verify_email ? 'Verified' : 'Not Verified'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Information */}
                                    {userDetails?.addresses && userDetails.addresses.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Addresses</h3>
                                            <div className="space-y-3">
                                                {userDetails.addresses.map((address, index) => (
                                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                                        <div className="flex items-start space-x-3">
                                                            <FaMapMarkerAlt className="text-gray-400 mt-1" />
                                                            <div>
                                                                <p className="font-medium">{address.address_line}</p>
                                                                <p className="text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                                                                <p className="text-gray-600">{address.country}</p>
                                                                {address.mobile && <p className="text-gray-600">Mobile: {address.mobile}</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                                    
                                    {orderHistory.length === 0 ? (
                                        <div className="text-center py-8">
                                            <FaShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                                            <p className="mt-1 text-sm text-gray-500">This user hasn't placed any orders yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orderHistory.map((order) => (
                                                <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-3">                                        <div>
                                            <p className="font-semibold">Order #{order.orderId}</p>
                                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.orderStatus)}`}>
                                                {order.orderStatus}
                                            </span>
                                            <p className="text-sm font-medium mt-1">₹{order.totalAmt}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {order.items && order.items.map((item, index) => (
                                            <div key={index} className="flex items-center space-x-3 text-sm">
                                                {item.itemType === 'product' && item.productId && (
                                                    <>
                                                        {item.productId.image && item.productId.image[0] && (
                                                            <img 
                                                                src={item.productId.image[0]} 
                                                                alt={item.productId.name}
                                                                className="w-10 h-10 object-cover rounded"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-medium">{item.productId.name}</p>
                                                            <p className="text-gray-500">Qty: {item.quantity} × ₹{item.productId.price}</p>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                {item.itemType === 'bundle' && item.bundleId && (
                                                    <>
                                                        {item.bundleId.image && (
                                                            <img 
                                                                src={item.bundleId.image} 
                                                                alt={item.bundleId.title}
                                                                className="w-10 h-10 object-cover rounded"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-medium">{item.bundleId.title}</p>
                                                            <p className="text-gray-500">Bundle Qty: {item.quantity} × ₹{item.bundleId.bundlePrice}</p>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Fallback for items without populated data */}
                                                {!item.productId && !item.bundleId && (
                                                    <div className="flex-1">
                                                        <p className="font-medium">
                                                            {item.productDetails?.name || item.bundleDetails?.title || 'Product/Bundle'}
                                                        </p>
                                                        <p className="text-gray-500">
                                                            Qty: {item.quantity} × ₹{item.productDetails?.price || item.bundleDetails?.bundlePrice || 0}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex justify-between text-sm">
                                            <span>Payment Method:</span>
                                            <span className="font-medium">{order.paymentMethod || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Payment Status:</span>
                                            <span className={`font-medium ${order.paymentStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                {order.paymentStatus || 'Pending'}
                                            </span>
                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserDetailsModal
