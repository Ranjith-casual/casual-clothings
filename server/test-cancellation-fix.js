// Test script to verify the cancellation fix
import { isOnlinePaymentMethod, canOrderBeCancelled } from '../DarkCart-app/src/utils/paymentUtils.js';

// Test cases for the cancellation fix
const testCases = [
    {
        name: "Razorpay Paid Order - Should be cancellable",
        order: {
            orderId: "ORD-test1",
            paymentMethod: "Razorpay",
            paymentStatus: "PAID",
            orderStatus: "ORDER PLACED"
        },
        expectedCanCancel: true
    },
    {
        name: "Online Payment Paid Order - Should be cancellable", 
        order: {
            orderId: "ORD-test2",
            paymentMethod: "Online Payment",
            paymentStatus: "PAID", 
            orderStatus: "PROCESSING"
        },
        expectedCanCancel: true
    },
    {
        name: "COD Order - Should not be cancellable through online method",
        order: {
            orderId: "ORD-test3", 
            paymentMethod: "Cash on Delivery",
            paymentStatus: "PENDING",
            orderStatus: "ORDER PLACED"
        },
        expectedCanCancel: false
    },
    {
        name: "Delivered Order - Should not be cancellable",
        order: {
            orderId: "ORD-test4",
            paymentMethod: "Razorpay", 
            paymentStatus: "PAID",
            orderStatus: "DELIVERED"
        },
        expectedCanCancel: false
    },
    {
        name: "Pending Payment Razorpay Order - Should not be cancellable",
        order: {
            orderId: "ORD-test5",
            paymentMethod: "Razorpay",
            paymentStatus: "PENDING", 
            orderStatus: "ORDER PLACED"
        },
        expectedCanCancel: false
    }
];

console.log("🧪 Testing Order Cancellation Logic");
console.log("=" * 50);

testCases.forEach((testCase, index) => {
    const result = canOrderBeCancelled(testCase.order);
    const passed = result.canCancel === testCase.expectedCanCancel;
    
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log(`   Order: ${testCase.order.paymentMethod} | ${testCase.order.paymentStatus} | ${testCase.order.orderStatus}`);
    console.log(`   Expected: ${testCase.expectedCanCancel ? 'Can Cancel' : 'Cannot Cancel'}`);
    console.log(`   Result: ${result.canCancel ? 'Can Cancel' : 'Cannot Cancel'}`);
    console.log(`   Reason: ${result.reason || 'Order is eligible for cancellation'}`);
    console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}`);
});

// Test payment method detection
console.log("\n🔍 Testing Payment Method Detection");
console.log("=" * 40);

const paymentMethods = ['Razorpay', 'Online Payment', 'ONLINE', 'Cash on Delivery', 'UPI', 'Card'];
paymentMethods.forEach(method => {
    const isOnline = isOnlinePaymentMethod(method);
    console.log(`${method.padEnd(20)}: ${isOnline ? '🌐 Online' : '💵 Offline'}`);
});

console.log("\n✨ Test completed! The fix should resolve the cancellation issue for Razorpay orders.");
