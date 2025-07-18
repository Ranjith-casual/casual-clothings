import React, { useState, useEffect } from 'react'
import { FaSave, FaPlus, FaTrash, FaCog, FaInfoCircle } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'

function CancellationPolicySettings() {
    const [policy, setPolicy] = useState({
        refundPercentage: 75,
        responseTimeHours: 48,
        isActive: true,
        timeBasedRules: [],
        paymentMethodRules: {},
        orderStatusRestrictions: ['DELIVERED', 'CANCELLED']
    })
    const [loading, setLoading] = useState(false)
    const [saveLoading, setSaveLoading] = useState(false)

    useEffect(() => {
        fetchPolicy()
    }, [])

    const fetchPolicy = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            const response = await Axios({
                ...SummaryApi.getCancellationPolicy,
                headers: {
                    authorization: `Bearer ${token}`
                }
            })
            if (response.data.success && response.data.data) {
                setPolicy(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching policy:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSavePolicy = async () => {
        setSaveLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            const response = await Axios({
                ...SummaryApi.updateCancellationPolicy,
                headers: {
                    authorization: `Bearer ${token}`
                },
                data: policy
            })
            if (response.data.success) {
                toast.success('Cancellation policy updated successfully!')
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setSaveLoading(false)
        }
    }

    const addTimeBasedRule = () => {
        setPolicy(prev => ({
            ...prev,
            timeBasedRules: [
                ...prev.timeBasedRules,
                { timeFrameHours: 24, refundPercentage: 10, description: '' }
            ]
        }))
    }

    const updateTimeBasedRule = (index, field, value) => {
        setPolicy(prev => ({
            ...prev,
            timeBasedRules: prev.timeBasedRules.map((rule, i) =>
                i === index ? { ...rule, [field]: value } : rule
            )
        }))
    }

    const removeTimeBasedRule = (index) => {
        setPolicy(prev => ({
            ...prev,
            timeBasedRules: prev.timeBasedRules.filter((_, i) => i !== index)
        }))
    }

    const updatePaymentMethodRule = (method, percentage) => {
        setPolicy(prev => ({
            ...prev,
            paymentMethodRules: {
                ...prev.paymentMethodRules,
                [method]: percentage
            }
        }))
    }

    const paymentMethods = ['COD', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'RAZORPAY_WALLET']
    const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

    if (loading) {
        return (
            <div className="p-6 flex flex-col justify-center items-center min-h-[400px] font-sans">
                <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 shadow-md mb-4"></div>
                <p className="text-blue-600 font-medium tracking-wide mt-2">Loading cancellation policy...</p>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight relative mb-2">
                        Cancellation Policy Settings
                        <span className="absolute bottom-0 left-0 h-1 w-12 bg-blue-600 rounded-full"></span>
                    </h1>
                    <p className="text-gray-600 mt-2.5 font-light tracking-wide text-sm sm:text-base">
                        Configure order cancellation rules and refund policies
                    </p>
                </div>
                <button
                    onClick={handleSavePolicy}
                    disabled={saveLoading}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 tracking-wide font-medium w-full sm:w-auto justify-center sm:justify-start"
                >
                    <FaSave className="text-sm" />
                    {saveLoading ? 'Saving...' : 'Save Policy'}
                </button>
            </div>

            <div className="space-y-6 sm:space-y-8">
                {/* Basic Settings */}
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                    <h2 className="text-lg sm:text-xl font-medium mb-5 flex items-center gap-2.5 text-gray-800 tracking-tight">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <FaCog className="text-lg" />
                        </div>
                        Basic Settings
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide">
                                Default Refund Percentage (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={policy.refundPercentage}
                                onChange={(e) => setPolicy(prev => ({
                                    ...prev,
                                    refundPercentage: parseFloat(e.target.value) || 0
                                }))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow transition-shadow font-sans"
                            />
                            <p className="text-xs text-gray-500 mt-1.5 font-light tracking-wide">
                                Default percentage of order amount to refund
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide">
                                Response Time (Hours)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="168"
                                value={policy.responseTimeHours}
                                onChange={(e) => setPolicy(prev => ({
                                    ...prev,
                                    responseTimeHours: parseInt(e.target.value) || 48
                                }))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow transition-shadow font-sans"
                            />
                            <p className="text-xs text-gray-500 mt-1.5 font-light tracking-wide">
                                Maximum time to respond to cancellation requests
                            </p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <label className="flex items-center hover:bg-blue-50 p-2.5 rounded-lg transition-colors cursor-pointer w-fit">
                            <input
                                type="checkbox"
                                checked={policy.isActive}
                                onChange={(e) => setPolicy(prev => ({
                                    ...prev,
                                    isActive: e.target.checked
                                }))}
                                className="mr-2.5 rounded text-blue-600 w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-700 tracking-wide">
                                Enable cancellation policy
                            </span>
                        </label>
                    </div>
                </div>

                {/* Time-Based Rules */}
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
                        <h2 className="text-lg sm:text-xl font-medium flex items-center gap-2.5 text-gray-800 tracking-tight">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                <FaInfoCircle className="text-lg" />
                            </div>
                            Time-Based Refund Rules
                        </h2>
                        <button
                            onClick={addTimeBasedRule}
                            className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 tracking-wide font-medium sm:w-auto w-full"
                        >
                            <FaPlus className="text-xs" />
                            Add Rule
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-5 font-light tracking-wide leading-relaxed">
                        Configure different refund percentages based on how long after order placement the cancellation is requested.
                    </p>
                    
                    {policy.timeBasedRules.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            <FaInfoCircle className="mx-auto text-3xl mb-3 text-blue-500" />
                            <p className="font-medium tracking-wide text-gray-700 mb-1">No time-based rules configured</p>
                            <p className="text-sm font-light tracking-wide">Add rules to offer different refund rates based on timing</p>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-5">
                            {policy.timeBasedRules.map((rule, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all duration-300 hover:border-blue-200 group">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5 tracking-wide">
                                                Within Hours
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={rule.timeFrameHours}
                                                onChange={(e) => updateTimeBasedRule(index, 'timeFrameHours', parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow transition-all font-sans"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5 tracking-wide">
                                                Refund %
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={rule.refundPercentage}
                                                onChange={(e) => updateTimeBasedRule(index, 'refundPercentage', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow transition-all font-sans"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5 tracking-wide">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                value={rule.description}
                                                onChange={(e) => updateTimeBasedRule(index, 'description', e.target.value)}
                                                placeholder="e.g., Within 1 day"
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow transition-all font-sans"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeTimeBasedRule(index)}
                                        className="text-red-600 hover:text-red-800 p-2.5 rounded-full hover:bg-red-50 transition-all duration-200 mt-2 sm:mt-0 self-end sm:self-center"
                                        aria-label="Remove rule"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payment Method Rules */}
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                    <h2 className="text-lg sm:text-xl font-medium mb-5 flex items-center gap-2.5 text-gray-800 tracking-tight">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <FaCog className="text-lg" />
                        </div>
                        Payment Method Specific Rules
                    </h2>
                    <p className="text-sm text-gray-600 mb-5 font-light tracking-wide leading-relaxed">
                        Set different refund percentages based on payment method. Leave empty to use default percentage.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {paymentMethods.map(method => (
                            <div key={method} className="group">
                                <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide group-hover:text-blue-700 transition-colors">
                                    {method.replace('_', ' ')} Refund %
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={policy.paymentMethodRules[method] || ''}
                                        onChange={(e) => updatePaymentMethodRule(method, parseFloat(e.target.value) || null)}
                                        placeholder={`Default (${policy.refundPercentage}%)`}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow transition-all font-sans pr-10"
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Status Restrictions */}
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                    <h2 className="text-lg sm:text-xl font-medium mb-5 flex items-center gap-2.5 text-gray-800 tracking-tight">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <FaCog className="text-lg" />
                        </div>
                        Order Status Restrictions
                    </h2>
                    <p className="text-sm text-gray-600 mb-5 font-light tracking-wide leading-relaxed">
                        Select order statuses that should NOT allow cancellation requests.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {orderStatuses.map(status => (
                            <label key={status} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                                <input
                                    type="checkbox"
                                    checked={policy.orderStatusRestrictions.includes(status)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setPolicy(prev => ({
                                                ...prev,
                                                orderStatusRestrictions: [...prev.orderStatusRestrictions, status]
                                            }))
                                        } else {
                                            setPolicy(prev => ({
                                                ...prev,
                                                orderStatusRestrictions: prev.orderStatusRestrictions.filter(s => s !== status)
                                            }))
                                        }
                                    }}
                                    className="mr-2.5 rounded text-blue-600 w-4 h-4"
                                />
                                <span className="text-sm font-medium text-gray-700 tracking-wide">{status}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Policy Preview */}
                <div className="bg-blue-50 p-5 sm:p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow transition-all duration-300">
                    <h2 className="text-lg sm:text-xl font-medium mb-5 text-blue-800 tracking-tight flex items-center gap-2.5">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        Policy Summary
                    </h2>
                    <div className="space-y-3 sm:space-y-3.5 text-sm sm:text-base text-blue-700 font-light tracking-wide">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <p>Default refund percentage: <span className="font-medium">{policy.refundPercentage}%</span> of order amount</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <p>Admin response time: <span className="font-medium">{policy.responseTimeHours} hours</span></p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <p>Policy status: <span className={`font-medium ${policy.isActive ? 'text-green-600' : 'text-red-600'}`}>{policy.isActive ? 'Active' : 'Inactive'}</span></p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <p>Time-based rules: <span className="font-medium">{policy.timeBasedRules.length} configured</span></p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <p>Restricted statuses: <span className="font-medium">{policy.orderStatusRestrictions.length > 0 ? policy.orderStatusRestrictions.join(', ') : 'None'}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CancellationPolicySettings
