import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'
import { FaSearch, FaEdit, FaEye, FaBan, FaCheck, FaUserShield, FaUser } from 'react-icons/fa'
import UserDetailsModal from '../components/UserDetailsModal'
import EditUserModal from '../components/EditUserModal'
import UserStatsCards from '../components/UserStatsCards'

function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [selectedUser, setSelectedUser] = useState(null)
    const [showUserDetails, setShowUserDetails] = useState(false)
    const [showEditUser, setShowEditUser] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const user = useSelector((state) => state?.user)

    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getAllUsers,
                data: {
                    page,
                    limit: 10,
                    search: searchTerm,
                    role: filterRole === 'all' ? undefined : filterRole,
                    status: filterStatus === 'all' ? undefined : filterStatus
                }
            })

            if (response.data.success) {
                setUsers(response.data.data.users)
                setTotalPages(response.data.data.totalPages)
                setCurrentPage(page)
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [searchTerm, filterRole, filterStatus])

    const handleStatusToggle = async (userId, currentStatus) => {
        try {
            const response = await Axios({
                ...SummaryApi.toggleUserStatus,
                data: { userId, status: currentStatus === 'active' ? 'blocked' : 'active' }
            })

            if (response.data.success) {
                toast.success(response.data.message)
                fetchUsers(currentPage)
            }
        } catch (error) {
            AxiosTostError(error)
        }
    }

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            const response = await Axios({
                ...SummaryApi.updateUserRole,
                data: { userId, role: newRole }
            })

            if (response.data.success) {
                toast.success(response.data.message)
                fetchUsers(currentPage)
            }
        } catch (error) {
            AxiosTostError(error)
        }
    }

    const handleViewDetails = (user) => {
        setSelectedUser(user)
        setShowUserDetails(true)
    }

    const handleEditUser = (user) => {
        setSelectedUser(user)
        setShowEditUser(true)
    }

    const getRoleColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-100 text-red-800'
            case 'SELLER': return 'bg-blue-100 text-blue-800'
            case 'BUYER': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusColor = (status) => {
        return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 max-w-7xl">
                {/* Header */}
                <div className="bg-black text-white p-6 rounded-lg shadow-md mb-6">
                    <h1 className="text-2xl font-bold font-serif mb-2">User Management</h1>
                    <p className="text-gray-300 text-sm">
                        Manage registered users, roles, and permissions
                    </p>
                </div>

                {/* User Statistics Cards */}
                <UserStatsCards />

                {/* Filters and Search */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="all">All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SELLER">Seller</option>
                            <option value="BUYER">Buyer</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>

                        {/* Refresh Button */}
                        <button
                            onClick={() => fetchUsers(currentPage)}
                            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {user.avatar ? (
                                                            <img className="h-10 w-10 rounded-full object-cover" src={user.avatar} alt={user.name} />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                                <FaUser className="text-gray-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetails(user)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Edit User"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusToggle(user._id, user.status)}
                                                        className={user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                                                        title={user.status === 'active' ? 'Block User' : 'Unblock User'}
                                                    >
                                                        {user.status === 'active' ? <FaBan /> : <FaCheck />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => fetchUsers(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => fetchUsers(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Page <span className="font-medium">{currentPage}</span> of{' '}
                                        <span className="font-medium">{totalPages}</span>
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => fetchUsers(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    page === currentPage
                                                        ? 'z-10 bg-black border-black text-white'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showUserDetails && (
                <UserDetailsModal
                    user={selectedUser}
                    onClose={() => setShowUserDetails(false)}
                />
            )}

            {showEditUser && (
                <EditUserModal
                    user={selectedUser}
                    onClose={() => setShowEditUser(false)}
                    onUpdate={() => {
                        fetchUsers(currentPage)
                        setShowEditUser(false)
                    }}
                    onRoleUpdate={handleRoleUpdate}
                />
            )}
        </div>
    )
}

export default UserManagement
