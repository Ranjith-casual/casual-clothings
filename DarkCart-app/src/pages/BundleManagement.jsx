import React, { useState, useEffect } from 'react'
import { 
    FaEye, 
    FaEdit, 
    FaTrash, 
    FaSearch, 
    FaFilter, 
    FaRupeeSign, 
    FaBox, 
    FaPlus, 
    FaToggleOn, 
    FaToggleOff,
    FaStar,
    FaImage,
    FaTimes,
    FaCheck,
    FaExclamationTriangle
} from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi, { baseURL } from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'
import BundleItemsModal from '../components/BundleItemsModal'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'

function BundleManagement() {
    const [bundles, setBundles] = useState([])
    const [filteredBundles, setFilteredBundles] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [selectedBundle, setSelectedBundle] = useState(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showBundleItemsModal, setShowBundleItemsModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [bundleToDelete, setBundleToDelete] = useState(null)

    useEffect(() => {
        fetchBundles()
    }, [])

    useEffect(() => {
        filterBundles()
    }, [bundles, searchTerm, statusFilter])

    const fetchBundles = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            const response = await Axios({
                ...SummaryApi.getBundles,
                headers: {
                    authorization: `Bearer ${token}`
                }
            })
            if (response.data.success) {
                setBundles(response.data.data || [])
            }
        } catch (error) {
            AxiosTostError(error)
            setBundles([])
        } finally {
            setLoading(false)
        }
    }

    const filterBundles = () => {
        let filtered = Array.isArray(bundles) ? bundles : []

        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(bundle => 
                bundle.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bundle.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bundle._id?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filter by status
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(bundle => {
                if (statusFilter === 'ACTIVE') return bundle.status !== false
                if (statusFilter === 'INACTIVE') return bundle.status === false
                return true
            })
        }

        // Sort by creation date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        setFilteredBundles(filtered)
    }

    const handleToggleStatus = async (bundleId, currentStatus) => {
        setActionLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            const response = await Axios({
                ...SummaryApi.toggleBundleStatus,
                headers: {
                    authorization: `Bearer ${token}`
                },
                data: { bundleId }
            })

            if (response.data.success) {
                toast.success(`Bundle ${currentStatus ? 'deactivated' : 'activated'} successfully!`)
                fetchBundles()
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteBundle = async () => {
        if (!bundleToDelete) return
        
        setActionLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            const response = await Axios({
                ...SummaryApi.deleteBundle,
                headers: {
                    authorization: `Bearer ${token}`
                },
                data: { bundleId: bundleToDelete._id }
            })

            if (response.data.success) {
                toast.success('Bundle deleted successfully!')
                fetchBundles()
                setShowDeleteModal(false)
                setBundleToDelete(null)
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleViewDetails = (bundle) => {
        setSelectedBundle(bundle)
        setShowDetailsModal(true)
    }

    const handleShowBundleItems = (bundle) => {
        setSelectedBundle(bundle)
        setShowBundleItemsModal(true)
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (status) => {
        if (status === false) {
            return 'px-3 py-1 rounded-full text-xs bg-red-100 text-red-800'
        }
        return 'px-3 py-1 rounded-full text-xs bg-green-100 text-green-800'
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FaBox className="text-blue-600 text-xl" />
                            </div>
                            Bundle Management
                        </h1>
                        <p className="text-gray-600 mt-2">Manage product bundles, pricing, and availability</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200">
                        <FaPlus className="text-sm" />
                        Add New Bundle
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by bundle name, description, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bundles Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Bundle</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Items</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-2 text-gray-600">Loading bundles...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBundles.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <FaBox className="text-4xl mb-2 opacity-50" />
                                            <p className="text-lg font-medium">No bundles found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBundles.map((bundle) => (
                                    <tr key={bundle._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                    {bundle.images && bundle.images.length > 0 ? (
                                                        <img
                                                            src={bundle.images[0]}
                                                            alt={bundle.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none'
                                                                e.target.nextSibling.style.display = 'flex'
                                                            }}
                                                        />
                                                    ) : null}
                                                    <FaImage className="text-gray-400 text-lg" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900 truncate max-w-xs">
                                                        {bundle.title || 'Untitled Bundle'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 truncate max-w-xs">
                                                        {bundle.description || 'No description'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-medium text-gray-900">
                                                {bundle.items?.length || 0} items
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">
                                                    {DisplayPriceInRupees(bundle.bundlePrice || 0)}
                                                </span>
                                                {bundle.originalPrice && bundle.originalPrice > bundle.bundlePrice && (
                                                    <span className="text-sm text-gray-500 line-through">
                                                        {DisplayPriceInRupees(bundle.originalPrice)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={getStatusBadge(bundle.status)}>
                                                {bundle.status === false ? 'Inactive' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm text-gray-600">
                                                {formatDate(bundle.createdAt)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(bundle)}
                                                    className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button
                                                    onClick={() => handleShowBundleItems(bundle)}
                                                    className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors"
                                                    title="View Bundle Items"
                                                >
                                                    <FaBox className="text-sm" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(bundle._id, bundle.status)}
                                                    disabled={actionLoading}
                                                    className={`p-1 rounded transition-colors ${
                                                        bundle.status === false
                                                            ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                                            : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                                                    }`}
                                                    title={bundle.status === false ? 'Activate' : 'Deactivate'}
                                                >
                                                    {bundle.status === false ? <FaToggleOff className="text-sm" /> : <FaToggleOn className="text-sm" />}
                                                </button>
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit Bundle"
                                                >
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setBundleToDelete(bundle)
                                                        setShowDeleteModal(true)
                                                    }}
                                                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Bundle"
                                                >
                                                    <FaTrash className="text-sm" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bundle Details Modal */}
            {showDetailsModal && selectedBundle && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <FaBox className="text-lg" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Bundle Details</h2>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-400 hover:text-gray-800 transition-all p-2"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6">
                            {/* Bundle Information */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4 bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100">
                                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Bundle Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-gray-600 font-medium">Title:</span>
                                            <span className="font-semibold text-gray-800 text-right">{selectedBundle.title}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-gray-600 font-medium">Description:</span>
                                            <span className="font-semibold text-gray-800 text-right max-w-xs">{selectedBundle.description || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-gray-600 font-medium">Bundle ID:</span>
                                            <span className="font-semibold text-gray-800">{selectedBundle._id}</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-gray-600 font-medium">Status:</span>
                                            <span className={getStatusBadge(selectedBundle.status)}>
                                                {selectedBundle.status === false ? 'Inactive' : 'Active'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-gray-600 font-medium">Created:</span>
                                            <span className="font-semibold text-gray-800">{formatDate(selectedBundle.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100">
                                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Pricing Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-gray-600 font-medium">Bundle Price:</span>
                                            <span className="font-semibold text-gray-800">{DisplayPriceInRupees(selectedBundle.bundlePrice || 0)}</span>
                                        </div>
                                        {selectedBundle.originalPrice && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="text-gray-600 font-medium">Original Price:</span>
                                                <span className="font-semibold text-gray-500 line-through">{DisplayPriceInRupees(selectedBundle.originalPrice)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-gray-600 font-medium">Items Count:</span>
                                            <span className="font-semibold text-gray-800">{selectedBundle.items?.length || 0}</span>
                                        </div>
                                        {selectedBundle.originalPrice && selectedBundle.bundlePrice && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="text-gray-600 font-medium">Discount:</span>
                                                <span className="font-semibold text-green-600">
                                                    {(((selectedBundle.originalPrice - selectedBundle.bundlePrice) / selectedBundle.originalPrice) * 100).toFixed(1)}% OFF
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bundle Images */}
                            {selectedBundle.images && selectedBundle.images.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Bundle Images</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {selectedBundle.images.map((image, index) => (
                                            <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                                <img
                                                    src={image}
                                                    alt={`Bundle ${index + 1}`}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bundle Items */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-lg text-gray-800">Bundle Items ({selectedBundle.items?.length || 0})</h3>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false)
                                            handleShowBundleItems(selectedBundle)
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                                    >
                                        <FaEye className="text-xs" />
                                        View Items
                                    </button>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {selectedBundle.items && selectedBundle.items.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedBundle.items.slice(0, 3).map((item, index) => {
                                                // Enhanced image resolution for bundle items
                                                const getBundleItemImage = (item) => {
                                                    console.log('Bundle Management - Bundle item image debug:', item);
                                                    
                                                    // Try all possible image sources
                                                    let imageUrl = null;
                                                    
                                                    // Check image as array
                                                    if (Array.isArray(item.image) && item.image.length > 0) {
                                                        imageUrl = item.image[0];
                                                    }
                                                    // Check image as string
                                                    else if (typeof item.image === 'string' && item.image.trim() !== '') {
                                                        imageUrl = item.image;
                                                    }
                                                    // Check images array
                                                    else if (Array.isArray(item.images) && item.images.length > 0) {
                                                        imageUrl = item.images[0];
                                                    }
                                                    // Check productId.image (if populated)
                                                    else if (item.productId && typeof item.productId === 'object') {
                                                        if (Array.isArray(item.productId.image) && item.productId.image.length > 0) {
                                                            imageUrl = item.productId.image[0];
                                                        } else if (typeof item.productId.image === 'string') {
                                                            imageUrl = item.productId.image;
                                                        } else if (Array.isArray(item.productId.images) && item.productId.images.length > 0) {
                                                            imageUrl = item.productId.images[0];
                                                        }
                                                    }
                                                    
                                                    // If we have an image URL, make sure it's absolute
                                                    if (imageUrl) {
                                                        // If it's a relative URL, prepend the base URL
                                                        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
                                                            imageUrl = `${baseURL}${imageUrl}`;
                                                        }
                                                    }
                                                    
                                                    console.log('Bundle Management - Final image URL:', imageUrl);
                                                    return imageUrl;
                                                };
                                                
                                                const itemImage = getBundleItemImage(item);
                                                
                                                return (
                                                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                            {itemImage ? (
                                                                <img 
                                                                    src={itemImage}
                                                                    alt={item.name || item.title || 'Bundle Item'}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        console.error('Bundle Management - Image failed to load:', itemImage);
                                                                        e.target.style.display = 'none';
                                                                        e.target.parentElement.innerHTML = `
                                                                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                        `;
                                                                    }}
                                                                    onLoad={() => {
                                                                        console.log('Bundle Management - Image loaded successfully:', itemImage);
                                                                    }}
                                                                />
                                                            ) : (
                                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800">{item.name || item.title || 'Bundle Item'}</p>
                                                            <p className="text-sm text-gray-500">Qty: {item.quantity || 1}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold text-gray-800">
                                                        {DisplayPriceInRupees(item.price || 0)}
                                                    </span>
                                                </div>
                                                );
                                            })}
                                            {selectedBundle.items.length > 3 && (
                                                <div className="text-center text-gray-500 text-sm">
                                                    And {selectedBundle.items.length - 3} more items...
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-4">
                                            <FaBox className="mx-auto text-2xl mb-2 opacity-50" />
                                            <p>No items found in this bundle</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bundle Items Modal */}
            {showBundleItemsModal && selectedBundle && (
                <BundleItemsModal
                    bundleData={selectedBundle}
                    isOpen={showBundleItemsModal}
                    onClose={() => setShowBundleItemsModal(false)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && bundleToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Bundle</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete "<strong>{bundleToDelete.title}</strong>"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setBundleToDelete(null)
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteBundle}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BundleManagement
