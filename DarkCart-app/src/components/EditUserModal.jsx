import React, { useState } from 'react'
import { FaTimes, FaUserShield, FaUser, FaStore } from 'react-icons/fa'
import toast from 'react-hot-toast'

function EditUserModal({ user, onClose, onUpdate, onRoleUpdate }) {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-black text-white p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                <FaUser className="text-white" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold">Edit User</h2>
                            <p className="text-gray-300 text-sm">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-white transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[75vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mobile
                                    </label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                                    >
                                        <option value="active">Active</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Role Assignment */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Assignment</h3>
                            <div className="space-y-3">
                                {['ADMIN', 'SELLER', 'BUYER'].map((role) => (
                                    <div
                                        key={role}
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                            formData.role === role
                                                ? 'border-black bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => handleRoleChange(role)}
                                    >
                                        <div className="flex items-center space-x-3">
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
                                                        className="text-black focus:ring-black"
                                                    />
                                                    <label className="font-medium text-gray-900">{role}</label>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {getRoleDescription(role)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Current Status Display */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Current User Status</h4>
                            <div className="flex items-center space-x-4">
                                <div>
                                    <span className="text-sm text-gray-600">Role: </span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        formData.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                        formData.role === 'SELLER' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {formData.role}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Status: </span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        formData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {formData.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Email Verified: </span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.verify_email ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {user.verify_email ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
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
