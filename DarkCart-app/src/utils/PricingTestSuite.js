// Test suite for pricing calculations
import PricingService from '../utils/PricingService.js';

export class PricingTestSuite {
    
    static runAllTests() {
        console.log('🧪 Starting Pricing Calculation Tests...\n');
        
        let passed = 0;
        let failed = 0;
        
        const tests = [
            this.testBasicDiscount,
            this.testSizeAdjustedPricing,
            this.testBundlePricing,
            this.testDeliveryChargeCalculation,
            this.testRefundCalculation,
            this.testEdgeCases,
            this.testPricingValidation
        ];
        
        tests.forEach(test => {
            try {
                const result = test.call(this);
                if (result.passed) {
                    console.log(`✅ ${result.testName}: PASSED`);
                    passed++;
                } else {
                    console.log(`❌ ${result.testName}: FAILED - ${result.error}`);
                    failed++;
                }
            } catch (error) {
                console.log(`💥 ${test.name}: CRASHED - ${error.message}`);
                failed++;
            }
        });
        
        console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
        return { passed, failed, total: tests.length };
    }
    
    static testBasicDiscount() {
        const testCases = [
            { price: 100, discount: 10, expected: 90 },
            { price: 100, discount: 25, expected: 75 },
            { price: 199.99, discount: 15, expected: 170 }, // Should round properly
            { price: 100, discount: 0, expected: 100 },
            { price: 100, discount: 100, expected: 0 }
        ];
        
        for (const testCase of testCases) {
            const result = PricingService.applyDiscount(testCase.price, testCase.discount);
            const tolerance = 0.01; // Allow 1 cent tolerance for rounding
            
            if (Math.abs(result - testCase.expected) > tolerance) {
                return {
                    testName: 'Basic Discount Test',
                    passed: false,
                    error: `Expected ${testCase.expected}, got ${result} for price ${testCase.price} with ${testCase.discount}% discount`
                };
            }
        }
        
        return { testName: 'Basic Discount Test', passed: true };
    }
    
    static testSizeAdjustedPricing() {
        const mockItem = {
            itemType: 'product',
            size: 'L',
            quantity: 2,
            productId: {
                price: 100,
                discount: 10,
                sizePricing: {
                    'S': 90,
                    'M': 100,
                    'L': 110,
                    'XL': 120
                }
            }
        };
        
        const pricing = PricingService.calculateItemPricing(mockItem);
        
        // Expected: size price 110 with 10% discount = 99, total = 99 * 2 = 198
        const expectedUnitPrice = 99; // 110 - 10% = 99
        const expectedTotalPrice = 198;
        
        if (Math.abs(pricing.unitPrice - expectedUnitPrice) > 0.01 || 
            Math.abs(pricing.totalPrice - expectedTotalPrice) > 0.01) {
            return {
                testName: 'Size Adjusted Pricing Test',
                passed: false,
                error: `Expected unit: ${expectedUnitPrice}, total: ${expectedTotalPrice}, got unit: ${pricing.unitPrice}, total: ${pricing.totalPrice}`
            };
        }
        
        return { testName: 'Size Adjusted Pricing Test', passed: true };
    }
    
    static testBundlePricing() {
        const mockBundle = {
            itemType: 'bundle',
            quantity: 1,
            bundleId: {
                originalPrice: 500,
                bundlePrice: 400
            }
        };
        
        const pricing = PricingService.calculateItemPricing(mockBundle);
        
        if (pricing.unitPrice !== 400 || 
            pricing.originalPrice !== 500 || 
            pricing.discount !== 20 ||
            !pricing.isBundle) {
            return {
                testName: 'Bundle Pricing Test',
                passed: false,
                error: `Bundle pricing calculation failed. Got: ${JSON.stringify(pricing)}`
            };
        }
        
        return { testName: 'Bundle Pricing Test', passed: true };
    }
    
    static testDeliveryChargeCalculation() {
        const testCases = [
            { total: 600, distance: 5, expected: 0 }, // Free delivery above 500
            { total: 400, distance: 0, expected: 50 }, // Base charge only
            { total: 400, distance: 10, expected: 100 }, // Base + distance
            { total: 100, distance: 50, expected: 200 } // Capped at max
        ];
        
        for (const testCase of testCases) {
            const result = PricingService.calculateDeliveryCharge(testCase.total, testCase.distance);
            
            if (result !== testCase.expected) {
                return {
                    testName: 'Delivery Charge Test',
                    passed: false,
                    error: `Expected ${testCase.expected}, got ${result} for total ${testCase.total} and distance ${testCase.distance}`
                };
            }
        }
        
        return { testName: 'Delivery Charge Test', passed: true };
    }
    
    static testRefundCalculation() {
        const mockOrder = {
            totalAmt: 1000,
            orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            orderStatus: 'ORDER PLACED'
        };
        
        const refundCalc = PricingService.calculateRefundAmount(mockOrder);
        
        // Should get 75% refund = 750
        if (refundCalc.refundPercentage !== 75 || refundCalc.refundAmount !== 750) {
            return {
                testName: 'Refund Calculation Test',
                passed: false,
                error: `Expected 75% refund (750), got ${refundCalc.refundPercentage}% (${refundCalc.refundAmount})`
            };
        }
        
        return { testName: 'Refund Calculation Test', passed: true };
    }
    
    static testEdgeCases() {
        const edgeCases = [
            // Negative price
            { item: { itemType: 'product', productId: { price: -100 } }, shouldPass: false },
            // Zero quantity
            { item: { itemType: 'product', quantity: 0, productId: { price: 100 } }, shouldPass: true },
            // Missing product data
            { item: { itemType: 'product', quantity: 1 }, shouldPass: true },
            // Invalid discount
            { item: { itemType: 'product', quantity: 1, productId: { price: 100, discount: 150 } }, shouldPass: true }
        ];
        
        for (const testCase of edgeCases) {
            try {
                const pricing = PricingService.calculateItemPricing(testCase.item);
                
                if (!testCase.shouldPass && pricing.unitPrice < 0) {
                    return {
                        testName: 'Edge Cases Test',
                        passed: false,
                        error: 'Negative prices should be handled gracefully'
                    };
                }
            } catch (error) {
                if (testCase.shouldPass) {
                    return {
                        testName: 'Edge Cases Test',
                        passed: false,
                        error: `Edge case should not throw error: ${error.message}`
                    };
                }
            }
        }
        
        return { testName: 'Edge Cases Test', passed: true };
    }
    
    static testPricingValidation() {
        const validPricing = {
            unitPrice: 100,
            totalPrice: 200,
            originalPrice: 120,
            totalOriginalPrice: 240,
            discount: 16.67,
            isBundle: false
        };
        
        const validation = PricingService.validatePricing(validPricing);
        
        if (!validation.isValid) {
            return {
                testName: 'Pricing Validation Test',
                passed: false,
                error: `Valid pricing failed validation: ${validation.errors.join(', ')}`
            };
        }
        
        // Test invalid pricing
        const invalidPricing = {
            unitPrice: -10,
            totalPrice: 200,
            discount: 150 // Invalid discount
        };
        
        const invalidValidation = PricingService.validatePricing(invalidPricing);
        
        if (invalidValidation.isValid) {
            return {
                testName: 'Pricing Validation Test',
                passed: false,
                error: 'Invalid pricing should fail validation'
            };
        }
        
        return { testName: 'Pricing Validation Test', passed: true };
    }
    
    static generateTestReport() {
        const results = this.runAllTests();
        
        const report = {
            timestamp: new Date().toISOString(),
            testResults: results,
            recommendations: []
        };
        
        if (results.failed > 0) {
            report.recommendations.push('❌ Some tests failed - review pricing logic');
        }
        
        if (results.passed === results.total) {
            report.recommendations.push('✅ All tests passed - pricing logic is consistent');
        }
        
        report.recommendations.push('💡 Run these tests after any pricing logic changes');
        report.recommendations.push('📊 Monitor production data for pricing discrepancies');
        
        return report;
    }
}

// Usage example:
// PricingTestSuite.runAllTests();
// const report = PricingTestSuite.generateTestReport();

export default PricingTestSuite;
