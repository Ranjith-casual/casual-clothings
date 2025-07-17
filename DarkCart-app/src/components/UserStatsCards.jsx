import React, { useState, useEffect } from 'react'
import { FaUsers, FaUserCheck, FaBan, FaUserShield, FaStore, FaShoppingCart, FaCalendarAlt } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosTostError from '../utils/AxiosTostError'

function UserStatsCards() {
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
            icon: <FaUsers className="text-blue-500" />,
            bgColor: "bg-blue-50",
            textColor: "text-blue-600"
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
            icon: <FaUserShield className="text-purple-500" />,
            bgColor: "bg-purple-50",
            textColor: "text-purple-600"
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
            icon: <FaCalendarAlt className="text-indigo-500" />,
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600"
        }
    ]

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(7)].map((_, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                <div className="h-6 bg-gray-200 rounded w-12"></div>
                            </div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsCards.map((card, index) => (
                <div key={index} className={`${card.bgColor} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{card.title}</p>
                            <p className={`text-2xl font-bold ${card.textColor}`}>
                                {card.value.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-2xl">
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default UserStatsCards
