import React from 'react'
import { FaUsers, FaShield, FaEdit, FaHistory } from 'react-icons/fa'

function UserManagementFeatures() {
    const features = [
        {
            icon: <FaUsers className="text-blue-500" />,
            title: "View All Users",
            description: "Browse and search through all registered users with advanced filtering options",
            capabilities: [
                "Search by name or email",
                "Filter by role (Admin, Seller, Buyer)",
                "Filter by status (Active, Blocked)",
                "Pagination support"
            ]
        },
        {
            icon: <FaShield className="text-green-500" />,
            title: "User Status Management",
            description: "Control user access and manage account status",
            capabilities: [
                "Block/Unblock users",
                "View user verification status",
                "Manage user permissions",
                "Soft delete users"
            ]
        },
        {
            icon: <FaEdit className="text-orange-500" />,
            title: "Role Assignment",
            description: "Assign and modify user roles with different permission levels",
            capabilities: [
                "Admin role - Full system access",
                "Seller role - Product and order management",
                "Buyer role - Standard customer access",
                "Role-based feature access"
            ]
        },
        {
            icon: <FaHistory className="text-purple-500" />,
            title: "Order History Tracking",
            description: "View complete order history and purchase patterns",
            capabilities: [
                "Complete order timeline",
                "Purchase behavior analysis",
                "Order status tracking",
                "Payment method preferences"
            ]
        }
    ]

    return (
        <div className="bg-gray-50 p-6 rounded-lg">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">User Management System</h3>
                <p className="text-gray-600">
                    Complete user administration with role-based access control and comprehensive user analytics
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <div className="text-2xl mr-3">{feature.icon}</div>
                            <h4 className="text-lg font-semibold text-gray-900">{feature.title}</h4>
                        </div>
                        <p className="text-gray-600 mb-4">{feature.description}</p>
                        <ul className="space-y-2">
                            {feature.capabilities.map((capability, capIndex) => (
                                <li key={capIndex} className="flex items-center text-sm text-gray-700">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                    {capability}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-2">Quick Actions Available:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
                    <span>• User Search & Filter</span>
                    <span>• Role Management</span>
                    <span>• Status Control</span>
                    <span>• Order History View</span>
                    <span>• User Statistics</span>
                    <span>• Bulk Operations</span>
                    <span>• Data Export</span>
                    <span>• Activity Monitoring</span>
                </div>
            </div>
        </div>
    )
}

export default UserManagementFeatures
