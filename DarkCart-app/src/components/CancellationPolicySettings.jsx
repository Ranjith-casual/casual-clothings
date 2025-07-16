import React, { useState, useEffect } from 'react'
import { FaSave, FaPlus, FaTrash, FaCog, FaInfoCircle } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'

function CancellationPolicySettings() {
    const [policy, setPolicy] = useState({
        refundPercentage: 7,
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
            <div className="p-6 flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Cancellation Policy Settings</h1>
                    <p className="text-gray-600 mt-1">Configure order cancellation rules and refund policies</p>
                </div>
                <button
                    onClick={handleSavePolicy}
                    disabled={saveLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                    <FaSave />
                    {saveLoading ? 'Saving...' : 'Save Policy'}
                </button>
            </div>

            <div className="space-y-6">
                {/* Basic Settings */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaCog className="text-gray-600" />
                        Basic Settings
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Default percentage of order amount to refund
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum time to respond to cancellation requests
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={policy.isActive}
                                onChange={(e) => setPolicy(prev => ({
                                    ...prev,
                                    isActive: e.target.checked
                                }))}
                                className="mr-2 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Enable cancellation policy
                            </span>
                        </label>
                    </div>
                </div>

                {/* Time-Based Rules */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <FaInfoCircle className="text-gray-600" />
                            Time-Based Refund Rules
                        </h2>
                        <button
                            onClick={addTimeBasedRule}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
                        >
                            <FaPlus />
                            Add Rule
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Configure different refund percentages based on how long after order placement the cancellation is requested.
                    </p>
                    
                    {policy.timeBasedRules.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FaInfoCircle className="mx-auto text-3xl mb-2" />
                            <p>No time-based rules configured</p>
                            <p className="text-sm">Add rules to offer different refund rates based on timing</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {policy.timeBasedRules.map((rule, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Within Hours
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={rule.timeFrameHours}
                                                onChange={(e) => updateTimeBasedRule(index, 'timeFrameHours', parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Refund %
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={rule.refundPercentage}
                                                onChange={(e) => updateTimeBasedRule(index, 'refundPercentage', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                value={rule.description}
                                                onChange={(e) => updateTimeBasedRule(index, 'description', e.target.value)}
                                                placeholder="e.g., Within 1 day"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeTimeBasedRule(index)}
                                        className="text-red-600 hover:text-red-800 p-2"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payment Method Rules */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaCog className="text-gray-600" />
                        Payment Method Specific Rules
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Set different refund percentages based on payment method. Leave empty to use default percentage.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paymentMethods.map(method => (
                            <div key={method}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {method.replace('_', ' ')} Refund %
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={policy.paymentMethodRules[method] || ''}
                                    onChange={(e) => updatePaymentMethodRule(method, parseFloat(e.target.value) || null)}
                                    placeholder={`Default (${policy.refundPercentage}%)`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Status Restrictions */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaCog className="text-gray-600" />
                        Order Status Restrictions
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Select order statuses that should NOT allow cancellation requests.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {orderStatuses.map(status => (
                            <label key={status} className="flex items-center">
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
                                    className="mr-2 rounded"
                                />
                                <span className="text-sm text-gray-700">{status}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Policy Preview */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h2 className="text-lg font-semibold mb-4 text-blue-800">Policy Summary</h2>
                    <div className="space-y-2 text-sm text-blue-700">
                        <p>• Default refund percentage: <strong>{policy.refundPercentage}%</strong> of order amount</p>
                        <p>• Admin response time: <strong>{policy.responseTimeHours} hours</strong></p>
                        <p>• Policy status: <strong>{policy.isActive ? 'Active' : 'Inactive'}</strong></p>
                        <p>• Time-based rules: <strong>{policy.timeBasedRules.length} configured</strong></p>
                        <p>• Restricted statuses: <strong>{policy.orderStatusRestrictions.join(', ')}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CancellationPolicySettings
