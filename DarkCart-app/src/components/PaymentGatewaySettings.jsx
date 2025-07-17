import React, { useState, useEffect } from 'react'
import { FaTimes, FaCog, FaKey, FaToggleOn, FaToggleOff, FaSave } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

function PaymentGatewaySettings({ onClose }) {
    const [settings, setSettings] = useState({
        razorpay: {
            enabled: false,
            keyId: '',
            keySecret: '',
            webhookSecret: ''
        },
        cod: {
            enabled: true,
            minimumAmount: 0,
            maximumAmount: 50000
        },
        general: {
            defaultPaymentMethod: 'cod',
            autoRefundEnabled: false,
            paymentTimeout: 15 // minutes
        }
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getPaymentSettings
            })

            if (response.data.success) {
                setSettings(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching payment settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSettings = async () => {
        setSaving(true)
        try {
            const response = await Axios({
                ...SummaryApi.updatePaymentSettings,
                data: settings
            })

            if (response.data.success) {
                toast.success('Payment settings updated successfully')
                onClose()
            }
        } catch (error) {
            console.error('Error saving payment settings:', error)
            toast.error('Failed to update payment settings')
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }))
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <FaCog className="mr-2 text-blue-600" />
                        Payment Gateway Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Settings Content */}
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Razorpay Settings */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <FaKey className="mr-2 text-blue-600" />
                                    Razorpay Configuration
                                </h3>
                                
                                <div className="space-y-4">
                                    {/* Enable/Disable Razorpay */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <label className="font-medium text-gray-700">Enable Razorpay</label>
                                            <p className="text-sm text-gray-500">Accept online payments via Razorpay</p>
                                        </div>
                                        <button
                                            onClick={() => handleInputChange('razorpay', 'enabled', !settings.razorpay.enabled)}
                                            className={`text-2xl ${settings.razorpay.enabled ? 'text-green-600' : 'text-gray-400'}`}
                                        >
                                            {settings.razorpay.enabled ? <FaToggleOn /> : <FaToggleOff />}
                                        </button>
                                    </div>

                                    {/* Razorpay Key ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Razorpay Key ID
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.razorpay.keyId}
                                            onChange={(e) => handleInputChange('razorpay', 'keyId', e.target.value)}
                                            placeholder="rzp_test_xxxxxxxxxx"
                                            disabled={!settings.razorpay.enabled}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                    </div>

                                    {/* Razorpay Key Secret */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Razorpay Key Secret
                                        </label>
                                        <input
                                            type="password"
                                            value={settings.razorpay.keySecret}
                                            onChange={(e) => handleInputChange('razorpay', 'keySecret', e.target.value)}
                                            placeholder="••••••••••••••••"
                                            disabled={!settings.razorpay.enabled}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                    </div>

                                    {/* Webhook Secret */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Webhook Secret
                                        </label>
                                        <input
                                            type="password"
                                            value={settings.razorpay.webhookSecret}
                                            onChange={(e) => handleInputChange('razorpay', 'webhookSecret', e.target.value)}
                                            placeholder="whsec_••••••••••••••••"
                                            disabled={!settings.razorpay.enabled}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cash on Delivery Settings */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <FaKey className="mr-2 text-green-600" />
                                    Cash on Delivery (COD)
                                </h3>
                                
                                <div className="space-y-4">
                                    {/* Enable/Disable COD */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <label className="font-medium text-gray-700">Enable COD</label>
                                            <p className="text-sm text-gray-500">Accept cash on delivery orders</p>
                                        </div>
                                        <button
                                            onClick={() => handleInputChange('cod', 'enabled', !settings.cod.enabled)}
                                            className={`text-2xl ${settings.cod.enabled ? 'text-green-600' : 'text-gray-400'}`}
                                        >
                                            {settings.cod.enabled ? <FaToggleOn /> : <FaToggleOff />}
                                        </button>
                                    </div>

                                    {/* Minimum Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Minimum Order Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.cod.minimumAmount}
                                            onChange={(e) => handleInputChange('cod', 'minimumAmount', Number(e.target.value))}
                                            min="0"
                                            disabled={!settings.cod.enabled}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                    </div>

                                    {/* Maximum Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Maximum Order Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.cod.maximumAmount}
                                            onChange={(e) => handleInputChange('cod', 'maximumAmount', Number(e.target.value))}
                                            min="0"
                                            disabled={!settings.cod.enabled}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* General Settings */}
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Default Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Default Payment Method
                                </label>
                                <select
                                    value={settings.general.defaultPaymentMethod}
                                    onChange={(e) => handleInputChange('general', 'defaultPaymentMethod', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cod">Cash on Delivery</option>
                                    <option value="razorpay">Razorpay</option>
                                </select>
                            </div>

                            {/* Payment Timeout */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Timeout (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={settings.general.paymentTimeout}
                                    onChange={(e) => handleInputChange('general', 'paymentTimeout', Number(e.target.value))}
                                    min="5"
                                    max="60"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Auto Refund */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="font-medium text-gray-700">Auto Refund</label>
                                    <p className="text-sm text-gray-500">Automatically process refunds for cancelled orders</p>
                                </div>
                                <button
                                    onClick={() => handleInputChange('general', 'autoRefundEnabled', !settings.general.autoRefundEnabled)}
                                    className={`text-2xl ${settings.general.autoRefundEnabled ? 'text-green-600' : 'text-gray-400'}`}
                                >
                                    {settings.general.autoRefundEnabled ? <FaToggleOn /> : <FaToggleOff />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Notes */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">Configuration Notes:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• For Razorpay, you need to create an account at razorpay.com and get your API keys</li>
                            <li>• Test mode keys start with 'rzp_test_' and live mode keys start with 'rzp_live_'</li>
                            <li>• Webhook URL should be set to: {window.location.origin}/api/payment/razorpay/webhook</li>
                            <li>• COD limits help manage cash handling and delivery logistics</li>
                        </ul>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <FaSave className="mr-2" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PaymentGatewaySettings
