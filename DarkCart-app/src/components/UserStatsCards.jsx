import React, { useState, useEffect } from 'react'
import { FaUsers, FaUserCheck, FaBan, FaUserShield, FaStore, FaShoppingCart, FaCalendarAlt } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosTostError from '../utils/AxiosTostError'

// CSS for animation
const cardStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
`;

function UserStatsCards() {
    // Add the styles to the document
    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.innerHTML = cardStyles;
        document.head.appendChild(styleEl);
        return () => {
            document.head.removeChild(styleEl);
        };
    }, []);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        blockedUsers: 0,
        roleDistribution: {
            admins: 0,
            sellers: 0,
            buyers: 0
        },
        recentRegistrations: 0
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchUserStats()
    }, [])

    const fetchUserStats = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getUserStats
            })

            if (response.data.success) {
                setStats(response.data.data)
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setLoading(false)
        }
    }

    const statsCards = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            icon: <FaUsers className="theme-text-primary" />,
            bgColor: "theme-bg-secondary-light",
            textColor: "theme-text-primary"
        },
        {
            title: "Active Users",
            value: stats.activeUsers,
            icon: <FaUserCheck className="text-green-500" />,
            bgColor: "bg-green-50",
            textColor: "text-green-600"
        },
        {
            title: "Blocked Users",
            value: stats.blockedUsers,
            icon: <FaBan className="text-red-500" />,
            bgColor: "bg-red-50",
            textColor: "text-red-600"
        },
        {
            title: "Admins",
            value: stats.roleDistribution.admins,
            icon: <FaUserShield className="theme-text-secondary" />,
            bgColor: "theme-bg-secondary-light",
            textColor: "theme-text-primary"
        },
        {
            title: "Sellers",
            value: stats.roleDistribution.sellers,
            icon: <FaStore className="text-orange-500" />,
            bgColor: "bg-orange-50",
            textColor: "text-orange-600"
        },
        {
            title: "Buyers",
            value: stats.roleDistribution.buyers,
            icon: <FaShoppingCart className="text-teal-500" />,
            bgColor: "bg-teal-50",
            textColor: "text-teal-600"
        },
        {
            title: "New This Month",
            value: stats.recentRegistrations,
            icon: <FaCalendarAlt className="theme-text-secondary" />,
            bgColor: "theme-bg-gray",
            textColor: "theme-text-primary"
        }
    ]

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 font-sans">
                {[...Array(7)].map((_, index) => (
                    <div key={index} className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mb-2"></div>
                                <div className="h-5 sm:h-6 bg-gray-200 rounded w-10 sm:w-12"></div>
                            </div>
                            <div className="h-7 w-7 sm:h-8 sm:w-8 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 font-sans">
            {statsCards.map((card, index) => (
                <div 
                    key={index} 
                    className={`${card.bgColor} p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all`}
                    style={{ animation: `scaleIn 0.4s ease-out ${index * 0.05}s both` }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 tracking-wide">{card.title}</p>
                            <p className={`text-xl sm:text-2xl font-bold ${card.textColor} tracking-wide`}>
                                {card.value.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-xl sm:text-2xl">
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default UserStatsCards
