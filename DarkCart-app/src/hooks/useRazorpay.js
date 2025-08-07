import { useState, useEffect } from 'react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { toast } from 'react-hot-toast';

// Utility function to load Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const useRazorpay = () => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(null);

    // Load payment settings
    useEffect(() => {
        fetchPaymentSettings();
    }, []);

    const fetchPaymentSettings = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getPaymentStatus
            });

            if (response.data.success) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching payment settings:', error);
        }
    };

    const createRazorpayOrder = async (orderData) => {
        try {
            setLoading(true);
            
            const response = await Axios({
                ...SummaryApi.createRazorpayOrder,
                data: orderData
            });

            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to create Razorpay order');
            }
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const verifyPayment = async (paymentData) => {
        try {
            const response = await Axios({
                ...SummaryApi.verifyRazorpayPayment,
                data: paymentData
            });

            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Payment verification failed');
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    };

    const processPayment = async ({
        amount,
        orderId,
        onSuccess,
        onFailure,
        customerDetails,
        notes = {}
    }) => {
        try {
            // Check if Razorpay is enabled
            if (!settings?.razorpay?.enabled) {
                throw new Error('Razorpay payments are not enabled');
            }

            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Failed to load Razorpay SDK');
            }

            // Create Razorpay order
            const razorpayOrder = await createRazorpayOrder({
                amount,
                orderId,
                notes
            });

            // Razorpay configuration
            const options = {
                key: settings.razorpay.keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Casual Clothings',
                description: `Order #${orderId}`,
                image: '/logo.png', // Your company logo
                order_id: razorpayOrder.orderId,
                handler: async function (response) {
                    try {
                        // Verify payment on backend
                        const verificationData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            order_id: orderId
                        };

                        const verificationResult = await verifyPayment(verificationData);
                        
                        toast.success('Payment successful!');
                        
                        if (onSuccess) {
                            onSuccess({
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                signature: response.razorpay_signature,
                                verificationResult
                            });
                        }
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        toast.error('Payment verification failed');
                        
                        if (onFailure) {
                            onFailure(error);
                        }
                    }
                },
                prefill: {
                    name: customerDetails?.name || '',
                    email: customerDetails?.email || '',
                    contact: customerDetails?.mobile || ''
                },
                notes: notes,
                theme: {
                    color: '#000000' // Your brand color
                },
                modal: {
                    ondismiss: function() {
                        toast.error('Payment cancelled');
                        if (onFailure) {
                            onFailure(new Error('Payment cancelled by user'));
                        }
                    }
                }
            };

            // Open Razorpay checkout
            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error(error.message || 'Payment failed');
            
            if (onFailure) {
                onFailure(error);
            }
        }
    };

    return {
        processPayment,
        loading,
        settings,
        isRazorpayEnabled: settings?.razorpay?.enabled || false
    };
};

export default useRazorpay;
