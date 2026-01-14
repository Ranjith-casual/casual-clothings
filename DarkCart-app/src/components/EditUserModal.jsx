import React, { useState } from 'react'
import { FaTimes, FaUserShield, FaUser, FaStore } from 'react-icons/fa'
import toast from 'react-hot-toast'

function EditUserModal({ user, onClose, onUpdate, onRoleUpdate }) {
    // Add animation styles
    React.useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideIn {
                from {
                    transform: translateY(-10px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styleEl);
        return () => {
            document.head.removeChild(styleEl);
        };
    }, []);
    
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        mobile: user.mobile || '',
        role: user.role,
        status: user.status
    })
    const [loading, setLoading] = useState(false)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleRoleChange = async (newRole) => {
        if (newRole === user.role) return

        try {
            setLoading(true)
            await onRoleUpdate(user._id, newRole)
            setFormData(prev => ({ ...prev, role: newRole }))
            toast.success('Role updated successfully')
        } catch (error) {
            toast.error('Failed to update role')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            // Here you would make API call to update user details
            // For now, just call onUpdate
            onUpdate()
            toast.success('User updated successfully')
        } catch (error) {
            toast.error('Failed to update user')
        } finally {
            setLoading(false)
        }
    }

    const getRoleIcon = (role) => {
        switch (role) {
            case 'ADMIN': return <FaUserShield className="text-red-500" />
            case 'SELLER': return <FaStore className="text-blue-500" />
            case 'BUYER': return <FaUser className="text-green-500" />
            default: return <FaUser className="text-gray-500" />
        }
    }

    const getRoleDescription = (role) => {
        switch (role) {
            case 'ADMIN': return 'Full access to all admin features and user management'
            case 'SELLER': return 'Can add and manage products, view orders for their products'
            case 'BUYER': return 'Can browse products, place orders, and manage their account'
            default: return ''
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 font-sans" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="bg-white rounded-lg shadow-xl max-w-xl sm:max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100" style={{ animation: 'slideIn 0.3s ease-out' }}>
                {/* Header */}
                <div className="bg-black text-white p-4 sm:p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                <FaUser className="text-white text-sm sm:text-base" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-base sm:text-xl font-bold tracking-wide">Edit User</h2>
                            <p className="text-gray-300 text-xs sm:text-sm tracking-wide">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <FaTimes size={18} className="sm:hidden" />
                        <FaTimes size={20} className="hidden sm:block" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-6 max-h-[75vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 tracking-wide">Basic Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 tracking-wide">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black shadow-sm tracking-wide"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 tracking-wide">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black shadow-sm tracking-wide"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 tracking-wide">
                                        Mobile
                                    </label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black shadow-sm tracking-wide"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 tracking-wide">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black shadow-sm tracking-wide"
                                    >
                                        <option value="active">Active</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Role Assignment */}
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 tracking-wide">Role Assignment</h3>
                            <div className="space-y-2.5 sm:space-y-3">
                                {['ADMIN', 'SELLER', 'BUYER'].map((role) => (
                                    <div
                                        key={role}
                                        className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-all shadow-sm ${
                                            formData.role === role
                                                ? 'border-black bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => handleRoleChange(role)}
                                    >
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            <div className="flex-shrink-0">
                                                {getRoleIcon(role)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value={role}
                                                        checked={formData.role === role}
                                                        onChange={() => handleRoleChange(role)}
                                                        className="text-black focus:ring-black w-3 h-3 sm:w-4 sm:h-4"
                                                    />
                                                    <label className="font-medium text-gray-900 text-xs sm:text-sm tracking-wide">{role}</label>
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 tracking-wide">
                                                    {getRoleDescription(role)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Current Status Display */}
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2 tracking-wide">Current User Status</h4>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <div>
                                    <span className="text-xs sm:text-sm text-gray-600 tracking-wide">Role: </span>
                                    <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
                                        formData.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                        formData.role === 'SELLER' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {formData.role}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs sm:text-sm text-gray-600 tracking-wide">Status: </span>
                                    <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
                                        formData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {formData.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs sm:text-sm text-gray-600 tracking-wide">Email Verified: </span>
                                    <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
                                        user.verify_email ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {user.verify_email ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 sm:gap-3 pt-4 mt-2 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all tracking-wide font-medium focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50 shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-all tracking-wider font-semibold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 shadow-sm"
                            >
                                {loading ? 'Updating...' : 'Update User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default EditUserModal
