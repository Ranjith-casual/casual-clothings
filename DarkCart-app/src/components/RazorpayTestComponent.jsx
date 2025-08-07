import React from 'react';
import useRazorpay from '../hooks/useRazorpay';
import { toast } from 'react-hot-toast';

const RazorpayTestComponent = () => {
    const { processPayment, loading, isRazorpayEnabled, settings } = useRazorpay();

    const handleTestPayment = () => {
        if (!isRazorpayEnabled) {
            toast.error('Razorpay is not enabled. Please configure it in admin settings.');
            return;
        }

        const testPaymentData = {
            amount: 100, // ₹100 for testing
            orderId: `test_${Date.now()}`,
            customerDetails: {
                name: 'Test Customer',
                email: 'test@example.com',
                mobile: '9999999999'
            },
            notes: {
                test: true,
                description: 'Test payment for Razorpay integration'
            },
            onSuccess: (paymentData) => {
                console.log('Payment successful:', paymentData);
                toast.success('Test payment successful!');
            },
            onFailure: (error) => {
                console.error('Payment failed:', error);
                toast.error('Test payment failed!');
            }
        };

        processPayment(testPaymentData);
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Razorpay Integration Test</h2>
            
            <div className="mb-4">
                <h3 className="font-semibold">Status:</h3>
                <p className={`text-sm ${isRazorpayEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {isRazorpayEnabled ? '✅ Razorpay Enabled' : '❌ Razorpay Disabled'}
                </p>
            </div>

            {isRazorpayEnabled && settings && (
                <div className="mb-4">
                    <h3 className="font-semibold">Configuration:</h3>
                    <p className="text-sm text-gray-600">
                        Key ID: {settings.razorpay.keyId ? 
                            `${settings.razorpay.keyId.substring(0, 12)}...` : 
                            'Not configured'
                        }
                    </p>
                </div>
            )}

            <button
                onClick={handleTestPayment}
                disabled={!isRazorpayEnabled || loading}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                    isRazorpayEnabled && !loading
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
                {loading ? 'Processing...' : 'Test Payment (₹100)'}
            </button>

            <div className="mt-4 text-xs text-gray-500">
                <p>This is a test component to verify Razorpay integration.</p>
                <p>Use test card: 4111 1111 1111 1111</p>
            </div>
        </div>
    );
};

export default RazorpayTestComponent;
