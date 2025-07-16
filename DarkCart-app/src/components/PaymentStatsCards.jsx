import React, { useState, useEffect } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { 
    FaRupeeSign, 
    FaCreditCard, 
    FaMoneyBillWave, 
    FaCheckCircle, 
    FaTimesCircle,
    FaArrowUp,
    FaArrowDown
} from 'react-icons/fa'

function PaymentStatsCards() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        codOrders: 0,
        onlinePayments: 0,
        refundedAmount: 0,
        pendingPayments: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPaymentStats()
    }, [])

    const fetchPaymentStats = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getPaymentStats
            })

            if (response.data.success) {
                setStats(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching payment stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const statsCards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(stats.totalRevenue),
            icon: <FaRupeeSign className="text-green-600" />,
            bgColor: 'bg-green-50',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            trend: '+12.5%',
            trendUp: true
        },
        {
            title: 'Total Payments',
            value: stats.totalPayments.toLocaleString(),
            icon: <FaCreditCard className="text-blue-600" />,
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            trend: '+8.2%',
            trendUp: true
        },
        {
            title: 'Successful Payments',
            value: stats.successfulPayments.toLocaleString(),
            icon: <FaCheckCircle className="text-emerald-600" />,
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-800',
            borderColor: 'border-emerald-200',
            trend: '+15.3%',
            trendUp: true
        },
        {
            title: 'Failed Payments',
            value: stats.failedPayments.toLocaleString(),
            icon: <FaTimesCircle className="text-red-600" />,
            bgColor: 'bg-red-50',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            trend: '-5.1%',
            trendUp: false
        },
        {
            title: 'COD Orders',
            value: stats.codOrders.toLocaleString(),
            icon: <FaMoneyBillWave className="text-orange-600" />,
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-200',
            trend: '+3.7%',
            trendUp: true
        },
        {
            title: 'Online Payments',
            value: stats.onlinePayments.toLocaleString(),
            icon: <FaCreditCard className="text-purple-600" />,
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-800',
            borderColor: 'border-purple-200',
            trend: '+18.9%',
            trendUp: true
        }
    ]

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                            </div>
                            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {statsCards.map((card, index) => (
                <div 
                    key={index} 
                    className={`${card.bgColor} p-6 rounded-lg shadow-md border ${card.borderColor} hover:shadow-lg transition-shadow`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                            <div className="flex items-center mt-2">
                                {card.trendUp ? (
                                    <FaArrowUp className="text-green-500 mr-1 text-sm" />
                                ) : (
                                    <FaArrowDown className="text-red-500 mr-1 text-sm" />
                                )}
                                <span className={`text-sm font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                    {card.trend}
                                </span>
                                <span className="text-gray-500 text-sm ml-1">vs last month</span>
                            </div>
                        </div>
                        <div className="text-3xl">
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default PaymentStatsCards
