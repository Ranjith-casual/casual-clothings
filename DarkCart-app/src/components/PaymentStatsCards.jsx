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
        totalRevenue: 0, // Net revenue after refunds
        grossRevenue: 0, // Total revenue before refunds
        netRevenue: 0, // Net revenue after refunds (same as totalRevenue)
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        codOrders: 0,
        onlinePayments: 0,
        refundedAmount: 0, // Actual refunded amount
        retainedAmount: 0, // Amount retained from partial refunds
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
            
            // Log the raw response for debugging
            console.log('Raw API response:', JSON.stringify(response.data));

            if (response.data.success) {
                // Make sure all values are properly normalized before setting state
                const rawData = response.data.data;
                // First ensure retainedAmount is properly parsed as a number
                let retainedAmount = 0;
                if (rawData.retainedAmount !== undefined) {
                    retainedAmount = Number(rawData.retainedAmount);
                    // Handle NaN case
                    if (isNaN(retainedAmount)) {
                        console.error('RetainedAmount is not a valid number:', rawData.retainedAmount);
                        retainedAmount = 0;
                    }
                } else {
                    // If server doesn't provide retainedAmount, try to calculate it 
                    // This is a fallback if the server doesn't include the value
                    console.warn('Server did not provide retained amount, attempting to calculate from other data');
                    
                    // If we have enough information, try to calculate it from other fields
                    if (rawData.totalRevenue && rawData.grossRevenue && rawData.refundedAmount) {
                        // totalRevenue = grossRevenue - refundedAmount + retainedAmount
                        // => retainedAmount = totalRevenue - grossRevenue + refundedAmount
                        const calculatedRetained = Number(rawData.totalRevenue) - Number(rawData.grossRevenue) + Number(rawData.refundedAmount);
                        if (!isNaN(calculatedRetained) && calculatedRetained > 0) {
                            retainedAmount = calculatedRetained;
                            console.log('Calculated missing retained amount:', retainedAmount);
                        }
                    }
                }
                
                const processedData = {
                    totalRevenue: Number(rawData.totalRevenue || 0),
                    grossRevenue: Number(rawData.grossRevenue || 0),
                    netRevenue: Number(rawData.netRevenue || 0),
                    totalPayments: Number(rawData.totalPayments || 0),
                    successfulPayments: Number(rawData.successfulPayments || 0),
                    failedPayments: Number(rawData.failedPayments || 0),
                    codOrders: Number(rawData.codOrders || 0),
                    onlinePayments: Number(rawData.onlinePayments || 0),
                    refundedAmount: Number(rawData.refundedAmount || 0),
                    retainedAmount: retainedAmount, // Use the explicitly checked value
                    pendingPayments: Number(rawData.pendingPayments || 0)
                };
                
                // ALWAYS recalculate the net revenue to ensure consistency
                const calculatedNetRevenue = processedData.grossRevenue - processedData.refundedAmount + processedData.retainedAmount;
                
                // Force the net revenue to be our calculated value
                processedData.netRevenue = calculatedNetRevenue;
                processedData.totalRevenue = calculatedNetRevenue; // Make sure this is consistent too
                
                // Log the processed data for debugging
                console.log('Raw retained amount from API:', rawData.retainedAmount, 'Type:', typeof rawData.retainedAmount);
                console.log('Processed payment stats:', processedData);
                console.log('Retained amount after processing:', processedData.retainedAmount, 'Type:', typeof processedData.retainedAmount);
                console.log('Revenue calculation check:', 
                            'Gross:', processedData.grossRevenue, 
                            'Refunded:', processedData.refundedAmount, 
                            'Retained:', processedData.retainedAmount, 
                            'Net (calculated):', calculatedNetRevenue);
                
                setStats(processedData);
            }
        } catch (error) {
            console.error('Error fetching payment stats:', error);
        } finally {
            setLoading(false);
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

    // Calculate accurate values for display
    const calculateValues = () => {
        // Use the values provided by the API, but recalculate if needed for accuracy
        const gross = stats.grossRevenue || 0;
        const refunded = stats.refundedAmount || 0;
        
        // Ensure retained amount is properly processed - this is the key fix
        // Convert to number explicitly to handle any string values
        const retained = Number(stats.retainedAmount || 0);
        console.log('Using retained amount in calculation:', retained, 'Type:', typeof retained);
        
        // ALWAYS recalculate the net revenue to ensure retained amount is included
        const calculatedNet = gross - refunded + retained;
        console.log('Calculated net revenue:', calculatedNet, '= Gross:', gross, '- Refunded:', refunded, '+ Retained:', retained);
        
        // IMPORTANT: We're going to FORCE use our calculated value instead of the API value
        // This ensures retained amount is ALWAYS factored in correctly
        const net = calculatedNet;
            
        return {
            netRevenue: net,
            grossRevenue: gross,
            refundedAmount: refunded,
            retainedAmount: retained
        };
    }
    
    const values = calculateValues();

    const statsCards = [
        {
            title: 'Net Revenue',
            value: formatCurrency(values.netRevenue),
            icon: <FaRupeeSign className="text-green-600" />,
            bgColor: 'bg-green-50',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            trend: '+12.5%',
            trendUp: true,
            subtitle: `₹${Math.round(values.grossRevenue).toLocaleString()} - ₹${Math.round(values.refundedAmount).toLocaleString()} + ₹${Math.round(values.retainedAmount).toLocaleString()}`
        },
        {
            title: 'Gross Revenue',
            value: formatCurrency(values.grossRevenue),
            icon: <FaRupeeSign className="text-blue-600" />,
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            trend: '+15.2%',
            trendUp: true,
            subtitle: 'Total order value'
        },
        {
            title: 'Refunded Amount',
            value: formatCurrency(values.refundedAmount),
            icon: <FaTimesCircle className="text-red-600" />,
            bgColor: 'bg-red-50',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            trend: '+2.8%',
            trendUp: false,
            subtitle: 'Amount returned to customers'
        },
        {
            title: 'Retained Amount',
            value: formatCurrency(values.retainedAmount),
            icon: <FaMoneyBillWave className="text-teal-600" />,
            bgColor: 'bg-teal-50',
            textColor: 'text-teal-800',
            borderColor: 'border-teal-200',
            trend: '+1.4%',
            trendUp: true,
            subtitle: '+ Added to Net Revenue'
        },
        {
            title: 'Total Payments',
            value: stats.totalPayments.toLocaleString(),
            icon: <FaCreditCard className="text-purple-600" />,
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-800',
            borderColor: 'border-purple-200',
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
            icon: <FaTimesCircle className="text-orange-600" />,
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-200',
            trend: '-5.1%',
            trendUp: false
        },
        {
            title: 'COD Orders',
            value: stats.codOrders.toLocaleString(),
            icon: <FaMoneyBillWave className="text-yellow-600" />,
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            trend: '+3.7%',
            trendUp: true
        },
        {
            title: 'Online Payments',
            value: stats.onlinePayments.toLocaleString(),
            icon: <FaCreditCard className="text-indigo-600" />,
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-800',
            borderColor: 'border-indigo-200',
            trend: '+18.9%',
            trendUp: true
        }
    ]

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
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

    const handleRefresh = () => {
        setLoading(true);
        fetchPaymentStats();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Payment Statistics</h2>
                <button 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                >
                    {loading ? 'Refreshing...' : 'Refresh Stats'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {statsCards.map((card, index) => (
                    <div 
                        key={index} 
                        className={`${card.bgColor} p-6 rounded-lg shadow-md border ${card.borderColor} hover:shadow-lg transition-shadow`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                                {card.subtitle && (
                                    <p className="text-xs text-gray-500 mb-2">{card.subtitle}</p>
                                )}
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
        </div>
    )
}

export default PaymentStatsCards
