import React, { useState, useEffect } from 'react'
import { FaTimes, FaExclamationTriangle, FaInfoCircle, FaRupeeSign } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'

function OrderCancellationModal({ order, onClose, onCancellationRequested }) {
    const [reason, setReason] = useState('')
    const [additionalReason, setAdditionalReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [policy, setPolicy] = useState(null)
    const [estimatedRefund, setEstimatedRefund] = useState(0)

    const cancellationReasons = [
        'Changed mind',
        'Found better price',
        'Wrong item ordered',
        'Delivery delay',
        'Product defect expected',
        'Financial constraints',
        'Duplicate order',
        'Other'
    ]

    useEffect(() => {
        fetchCancellationPolicy()
    }, [])

    useEffect(() => {
        if (policy && order) {
            const refundPercentage = policy.refundPercentage || 7
            setEstimatedRefund((order.totalAmt * refundPercentage) / 100)
        }
    }, [policy, order])

    const fetchCancellationPolicy = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getCancellationPolicy
            })
            if (response.data.success) {
                setPolicy(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching cancellation policy:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!reason) {
            toast.error('Please select a reason for cancellation')
            return
        }

        if (reason === 'Other' && !additionalReason.trim()) {
            toast.error('Please provide additional details for other reason')
            return
        }

        setLoading(true)

        try {
            const token = localStorage.getItem('accessToken')
            const response = await Axios({
                ...SummaryApi.requestOrderCancellation,
                headers: {
                    authorization: `Bearer ${token}`
                },
                data: {
                    orderId: order._id,
                    reason,
                    additionalReason: additionalReason.trim()
                }
            })

            if (response.data.success) {
                toast.success('Cancellation request submitted successfully!')
                onCancellationRequested && onCancellationRequested()
                onClose()
            }
        } catch (error) {
            AxiosTostError(error)
        } finally {
            setLoading(false)
        }
    }

    const getTimeBasedRefund = () => {
        if (!policy || !order) return 7
        
        const orderDate = new Date(order.orderDate)
        const now = new Date()
        const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60)
        
        const timeRule = policy.timeBasedRules?.find(rule => 
            hoursSinceOrder <= rule.timeFrameHours
        )
        
        return timeRule?.refundPercentage || policy.refundPercentage || 7
    }

    const canCancelOrder = () => {
        const nonCancellableStatuses = ['DELIVERED', 'CANCELLED']
        return !nonCancellableStatuses.includes(order?.orderStatus)
    }

    if (!canCancelOrder()) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-6">
                        <div className="flex items-center justify-center mb-4">
                            <FaExclamationTriangle className="text-red-500 text-4xl" />
                        </div>
                        <h2 className="text-xl font-bold text-center mb-4">Cannot Cancel Order</h2>
                        <p className="text-gray-600 text-center mb-6">
                            This order cannot be cancelled as it has been {order?.orderStatus?.toLowerCase()}.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold">Cancel Order</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Order Details */}
                <div className="p-6 border-b bg-gray-50">
                    <h3 className="font-semibold mb-2">Order Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Order ID:</span>
                            <span className="ml-2 font-medium">#{order?.orderId}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Order Amount:</span>
                            <span className="ml-2 font-medium">₹{order?.totalAmt?.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Order Date:</span>
                            <span className="ml-2 font-medium">
                                {new Date(order?.orderDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Status:</span>
                            <span className="ml-2 font-medium">{order?.orderStatus}</span>
                        </div>
                    </div>
                </div>

                {/* Refund Information */}
                <div className="p-6 border-b bg-blue-50">
                    <div className="flex items-center mb-3">
                        <FaInfoCircle className="text-blue-600 mr-2" />
                        <h3 className="font-semibold text-blue-800">Refund Information</h3>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700">Estimated Refund Amount:</span>
                            <span className="font-bold text-green-600 text-lg">
                                <FaRupeeSign className="inline text-sm" />
                                {estimatedRefund.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Refund Percentage:</span>
                            <span>{getTimeBasedRefund()}% of order value</span>
                        </div>
                        <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <p className="text-sm text-yellow-800">
                                <strong>Processing Time:</strong> Admin will review your request within {policy?.responseTimeHours || 48} hours. 
                                If approved, refund will be processed within 5-7 business days.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cancellation Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Reason for Cancellation *
                        </label>
                        <div className="space-y-2">
                            {cancellationReasons.map((reasonOption) => (
                                <label key={reasonOption} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={reasonOption}
                                        checked={reason === reasonOption}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="mr-3 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm">{reasonOption}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {reason === 'Other' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Please specify the reason *
                            </label>
                            <textarea
                                value={additionalReason}
                                onChange={(e) => setAdditionalReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows="3"
                                placeholder="Please provide details about your cancellation reason..."
                                maxLength="500"
                            />
                            <div className="text-right text-xs text-gray-500 mt-1">
                                {additionalReason.length}/500 characters
                            </div>
                        </div>
                    )}

                    {reason && reason !== 'Other' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Comments (Optional)
                            </label>
                            <textarea
                                value={additionalReason}
                                onChange={(e) => setAdditionalReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows="2"
                                placeholder="Any additional information you'd like to share..."
                                maxLength="500"
                            />
                        </div>
                    )}

                    {/* Terms */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-medium text-gray-800 mb-2">Cancellation Terms:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Admin will review your request within {policy?.responseTimeHours || 48} hours</li>
                            <li>• Refund amount is {getTimeBasedRefund()}% of the order value</li>
                            <li>• Approved refunds will be processed within 5-7 business days</li>
                            <li>• Refund will be credited to your original payment method</li>
                            <li>• This action cannot be undone once submitted</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Keep Order
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Submitting...' : 'Submit Cancellation Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default OrderCancellationModal
