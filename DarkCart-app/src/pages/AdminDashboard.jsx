import React from 'react'
import { Link } from 'react-router-dom'
import { 
    FaTags, 
    FaBox, 
    FaPlus, 
    FaShoppingCart, 
    FaLayerGroup, 
    FaUsers, 
    FaCreditCard,
    FaTimes,
    FaMoneyBillWave
} from 'react-icons/fa'

function AdminDashboard() {
    const adminMenuItems = [
        {
            title: "Categories",
            description: "Manage product categories",
            path: "/dashboard/category",
            icon: <FaTags className="theme-text-primary" />
        },
        {
            title: "Products",
            description: "Manage all products",
            path: "/dashboard/product",
            icon: <FaBox className="text-green-600" />
        },
        {
            title: "Upload Product",
            description: "Add new products",
            path: "/dashboard/upload-product",
            icon: <FaPlus className="theme-text-secondary" />
        },
        {
            title: "Orders Management",
            description: "Manage customer orders",
            path: "/dashboard/orders-admin",
            icon: <FaShoppingCart className="text-orange-600" />
        },
        {
            title: "Bundle Management",
            description: "Manage product bundles",
            path: "/dashboard/bundle-admin",
            icon: <FaLayerGroup className="theme-text-primary" />
        },
        {
            title: "User Management",
            description: "Manage users, roles, and permissions",
            path: "/dashboard/user-management",
            icon: <FaUsers className="text-teal-600" />
        },
        {
            title: "Payments & Transactions",
            description: "Manage payments, invoices, and transaction history",
            path: "/dashboard/payment-management",
            icon: <FaCreditCard className="text-red-600" />
        },
        {
            title: "Cancellation Management",
            description: "Review and process order cancellation requests",
            path: "/dashboard/cancellation-management",
            icon: <FaTimes className="text-red-500" />
        },
        {
            title: "Bundle Details Management",
            description: "View and manage existing bundle details and configurations",
            path: "/dashboard/bundle-management",
            icon: <FaLayerGroup className="theme-text-secondary" />
        },
        {
            title: "Refund Management",
            description: "Process and track refunds for cancelled orders",
            path: "/dashboard/refund-management",
            icon: <FaMoneyBillWave className="text-green-600" />
        }
    ]

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 max-w-6xl">
                {/* Header */}
                <div className="bg-black text-white p-6 rounded-lg shadow-md mb-6">
                    <h1 className="text-2xl font-bold font-serif mb-2">Admin Dashboard</h1>
                    <p className="text-gray-300 text-sm">
                        Manage your store's categories, products, orders and more
                    </p>
                </div>

                {/* Admin Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminMenuItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 hover:scale-105 border border-gray-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-3xl">{item.icon}</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Stats Section */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Link 
                                to="/dashboard/upload-product"
                                className="bg-black text-white px-4 py-3 rounded-md hover:bg-gray-800 transition-colors text-center font-medium"
                            >
                                Add New Product
                            </Link>
                            <Link 
                                to="/dashboard/orders-admin"
                                className="bg-gray-100 text-gray-800 px-4 py-3 rounded-md hover:bg-gray-200 transition-colors text-center font-medium"
                            >
                                View Orders
                            </Link>
                            <Link 
                                to="/dashboard/category"
                                className="bg-gray-100 text-gray-800 px-4 py-3 rounded-md hover:bg-gray-200 transition-colors text-center font-medium"
                            >
                                Manage Categories
                            </Link>
                            <Link 
                                to="/dashboard/payment-management"
                                className="bg-red-100 text-red-800 px-4 py-3 rounded-md hover:bg-red-200 transition-colors text-center font-medium"
                            >
                                Payment Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
