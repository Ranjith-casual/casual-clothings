import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:8080/api/payment';
const ADMIN_TOKEN = 'your_admin_jwt_token_here'; // Replace with actual admin token

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
};

// Test functions
class RefundTester {
    constructor(baseUrl = BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async testCompleteRefund() {
        console.log('\n🧪 Testing Complete Refund...');
        
        try {
            const response = await axios.post(`${this.baseUrl}/refund/complete`, {
                orderId: 'ORD-test123456789',
                reason: 'Customer cancellation request',
                adminNotes: 'Approved by admin - valid reason'
            }, { headers });

            console.log('✅ Complete Refund Success:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ Complete Refund Error:', error.response?.data || error.message);
            return null;
        }
    }

    async testPartialRefund() {
        console.log('\n🧪 Testing Partial Refund...');
        
        try {
            const response = await axios.post(`${this.baseUrl}/refund/partial`, {
                orderId: 'ORD-test123456789',
                items: [
                    {
                        itemId: 'item1',
                        refundAmount: 500
                    },
                    {
                        itemId: 'item2',
                        refundAmount: 300
                    }
                ],
                reason: 'Damaged items'
            }, { headers });

            console.log('✅ Partial Refund Success:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ Partial Refund Error:', error.response?.data || error.message);
            return null;
        }
    }

    async testRefundStatus(orderId) {
        console.log(`\n🧪 Testing Refund Status for ${orderId}...`);
        
        try {
            const response = await axios.get(`${this.baseUrl}/refund/status/${orderId}`, { headers });
            console.log('✅ Refund Status Success:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ Refund Status Error:', error.response?.data || error.message);
            return null;
        }
    }

    async testRefundHistory(orderId) {
        console.log(`\n🧪 Testing Refund History for ${orderId}...`);
        
        try {
            const response = await axios.get(`${this.baseUrl}/refund/history/${orderId}`, { headers });
            console.log('✅ Refund History Success:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ Refund History Error:', error.response?.data || error.message);
            return null;
        }
    }

    async testRefundAnalytics() {
        console.log('\n🧪 Testing Refund Analytics...');
        
        try {
            const response = await axios.get(`${this.baseUrl}/refund/analytics`, { 
                headers,
                params: {
                    startDate: '2025-08-01',
                    endDate: '2025-08-31'
                }
            });
            console.log('✅ Refund Analytics Success:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ Refund Analytics Error:', error.response?.data || error.message);
            return null;
        }
    }

    async testBulkRefunds() {
        console.log('\n🧪 Testing Bulk Refunds...');
        
        try {
            const response = await axios.post(`${this.baseUrl}/refund/bulk`, {
                orders: [
                    { orderId: 'ORD-bulk1', refundAmount: 1000 },
                    { orderId: 'ORD-bulk2', refundAmount: 1500 },
                    { orderId: 'ORD-bulk3', refundAmount: 800 }
                ],
                reason: 'Bulk processing for cancelled orders'
            }, { headers });

            console.log('✅ Bulk Refunds Success:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ Bulk Refunds Error:', error.response?.data || error.message);
            return null;
        }
    }

    async testRazorpayRefund() {
        console.log('\n🧪 Testing Direct Razorpay Refund...');
        
        try {
            const response = await axios.post(`${this.baseUrl}/razorpay/refund`, {
                paymentId: 'pay_test_payment_id',
                amount: 1500,
                notes: {
                    reason: 'Quality issue',
                    orderId: 'ORD-test123'
                }
            }, { headers });

            console.log('✅ Razorpay Refund Success:', response.data);
            return response.data;
        } catch (error) {
            console.log('❌ Razorpay Refund Error:', error.response?.data || error.message);
            return null;
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Refund System Tests...');
        console.log('=' * 50);

        const testResults = {
            completeRefund: await this.testCompleteRefund(),
            partialRefund: await this.testPartialRefund(),
            refundStatus: await this.testRefundStatus('ORD-test123456789'),
            refundHistory: await this.testRefundHistory('ORD-test123456789'),
            refundAnalytics: await this.testRefundAnalytics(),
            bulkRefunds: await this.testBulkRefunds(),
            razorpayRefund: await this.testRazorpayRefund()
        };

        console.log('\n📊 Test Summary:');
        console.log('=' * 50);
        
        Object.entries(testResults).forEach(([test, result]) => {
            const status = result ? '✅ PASS' : '❌ FAIL';
            console.log(`${test.padEnd(20)} : ${status}`);
        });

        const passedTests = Object.values(testResults).filter(result => result !== null).length;
        const totalTests = Object.keys(testResults).length;
        
        console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
        
        return testResults;
    }
}

// Example webhook payload for testing
const exampleWebhookPayloads = {
    refundCreated: {
        event: 'refund.created',
        payload: {
            refund: {
                entity: {
                    id: 'rfnd_test123456',
                    amount: 150000, // 1500 INR in paisa
                    currency: 'INR',
                    payment_id: 'pay_test123456',
                    status: 'pending',
                    created_at: Date.now()
                }
            }
        }
    },
    refundProcessed: {
        event: 'refund.processed',
        payload: {
            refund: {
                entity: {
                    id: 'rfnd_test123456',
                    amount: 150000,
                    currency: 'INR',
                    payment_id: 'pay_test123456',
                    status: 'processed',
                    created_at: Date.now()
                }
            }
        }
    }
};

// Usage instructions
console.log(`
🎯 Razorpay Refund Testing Guide
==============================

1. Setup:
   - Update ADMIN_TOKEN with your actual admin JWT token
   - Ensure your server is running on localhost:8080
   - Create test orders in your database

2. Run Tests:
   node test-refunds.js

3. Test Individual Endpoints:
   - Complete Refund: POST /api/payment/refund/complete
   - Partial Refund: POST /api/payment/refund/partial
   - Refund Status: GET /api/payment/refund/status/:orderId
   - Refund History: GET /api/payment/refund/history/:orderId
   - Refund Analytics: GET /api/payment/refund/analytics
   - Bulk Refunds: POST /api/payment/refund/bulk

4. Test Webhooks:
   - Use the example payloads above
   - Send POST to /api/payment/razorpay/webhook

5. Monitor Logs:
   - Check server console for refund processing logs
   - Verify database updates for order statuses
`);

// Export for use
export default RefundTester;

// Run tests if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    const tester = new RefundTester();
    tester.runAllTests();
}
