import React, { useEffect } from 'react'
import { FaUsers, FaShield, FaEdit, FaHistory } from 'react-icons/fa'

// CSS for animation
const featureStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
`;

function UserManagementFeatures() {
    // Add the styles to the document
    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.innerHTML = featureStyles;
        document.head.appendChild(styleEl);
        return () => {
            document.head.removeChild(styleEl);
        };
    }, []);
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
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm font-sans" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 tracking-wide">User Management System</h3>
                <p className="text-sm text-gray-600 tracking-wide">
                    Complete user administration with role-based access control and comprehensive user analytics
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                {features.map((feature, index) => (
                    <div 
                        key={index} 
                        className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                        style={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s both` }}
                    >
                        <div className="flex items-center mb-3 sm:mb-4">
                            <div className="text-xl sm:text-2xl mr-3">{feature.icon}</div>
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900 tracking-wide">{feature.title}</h4>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 tracking-wide">{feature.description}</p>
                        <ul className="space-y-1 sm:space-y-2">
                            {feature.capabilities.map((capability, capIndex) => (
                                <li key={capIndex} className="flex items-center text-xs sm:text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-2"></div>
                                    <span className="tracking-wide">{capability}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-100">
                <h5 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-xs sm:text-sm tracking-wide">Quick Actions Available:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 text-xs sm:text-sm text-blue-800">
                    <span className="tracking-wide">• User Search & Filter</span>
                    <span className="tracking-wide">• Role Management</span>
                    <span className="tracking-wide">• Status Control</span>
                    <span className="tracking-wide">• Order History View</span>
                    <span className="tracking-wide">• User Statistics</span>
                    <span className="tracking-wide">• Bulk Operations</span>
                    <span className="tracking-wide">• Data Export</span>
                    <span className="tracking-wide">• Activity Monitoring</span>
                </div>
            </div>
        </div>
    )
}

export default UserManagementFeatures
