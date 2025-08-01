import React, { useState, useEffect } from 'react'
import { FaTimes, FaFileInvoice, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaPhone, FaReply } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

function InvoiceModal({ payment: originalPayment, onClose }) {
    const [enhancedPayment, setEnhancedPayment] = useState(null)
    const [loadingBundles, setLoadingBundles] = useState(false)
    
    if (!originalPayment) return null

    // Size-based price calculation utility function
    const calculateSizeBasedPrice = (item, productInfo = null) => {
        try {
            const size = item?.size;
            
            // First check if we already have sizeAdjustedPrice (most reliable)
            if (item?.sizeAdjustedPrice && item?.sizeAdjustedPrice > 0) {
                return item.sizeAdjustedPrice * (item?.quantity || 1);
            }
            
            // If no size, return original price
            if (!size) {
                return item?.itemTotal || 
                       (productInfo?.price || productInfo?.bundlePrice || 0) * (item?.quantity || 1);
            }

            // Check if product has size-based pricing
            const product = productInfo || item?.productId || item?.bundleId || item?.productDetails || item?.bundleDetails;
            
            if (product && product.sizePricing && typeof product.sizePricing === 'object') {
                // Direct size-price mapping
                const sizePrice = product.sizePricing[size] || product.sizePricing[size.toUpperCase()] || product.sizePricing[size.toLowerCase()];
                if (sizePrice) {
                    return sizePrice * (item?.quantity || 1);
                }
            }

            // Check for size variants array
            if (product && product.variants && Array.isArray(product.variants)) {
                const sizeVariant = product.variants.find(variant => 
                    variant.size === size || 
                    variant.size === size.toUpperCase() || 
                    variant.size === size.toLowerCase()
                );
                if (sizeVariant && sizeVariant.price) {
                    return sizeVariant.price * (item?.quantity || 1);
                }
            }

            // Check for size multipliers
            const sizeMultipliers = {
                'XS': 0.9,
                'S': 1.0,
                'M': 1.1,
                'L': 1.2,
                'XL': 1.3,
                'XXL': 1.4,
                '28': 0.9,
                '30': 1.0,
                '32': 1.1,
                '34': 1.2,
                '36': 1.3,
                '38': 1.4,
                '40': 1.5,
                '42': 1.6
            };

            const basePrice = product?.price || product?.bundlePrice || 0;
            const multiplier = sizeMultipliers[size] || sizeMultipliers[size.toUpperCase()] || 1.0;
            
            return (basePrice * multiplier) * (item?.quantity || 1);

        } catch (error) {
            console.error('Error calculating size-based price:', error);
            // Fallback to original pricing with sizeAdjustedPrice check
            return item?.sizeAdjustedPrice * (item?.quantity || 1) || 
                   item?.itemTotal || 
                   (productInfo?.price || productInfo?.bundlePrice || 0) * (item?.quantity || 1);
        }
    };

    // Get size-based unit price with discount applied
    const getSizeBasedUnitPrice = (item, productInfo = null) => {
        // First check if we already have sizeAdjustedPrice (most reliable)
        if (item?.sizeAdjustedPrice && item?.sizeAdjustedPrice > 0) {
            return item.sizeAdjustedPrice;
        }
        
        // Check for itemTotal first (this might already include discounts)
        if (item?.itemTotal && item?.quantity) {
            const unitPriceFromTotal = item.itemTotal / item.quantity;
            if (unitPriceFromTotal > 0) {
                return unitPriceFromTotal;
            }
        }
        
        // Calculate with discount consideration
        const product = productInfo || item?.productId || item?.bundleId || item?.productDetails || item?.bundleDetails;
        
        // Check for stored discounted price first
        if (product?.discountedPrice && product.discountedPrice > 0) {
            console.log('✅ InvoiceModal getSizeBasedUnitPrice: Using stored discountedPrice:', product.discountedPrice);
            return product.discountedPrice;
        }
        
        // Calculate from size-based pricing with discount
        const totalPrice = calculateSizeBasedPrice(item, productInfo);
        let unitPrice = totalPrice / (item?.quantity || 1);
        
        // Apply discount if available
        const discount = product?.discount || 0;
        if (discount > 0) {
            unitPrice = unitPrice * (1 - discount / 100);
            console.log('✅ InvoiceModal getSizeBasedUnitPrice: Applied discount:', discount, '% to get:', unitPrice);
        }
        
        return unitPrice;
    };

    // Calculate pricing details with discount information
    const getPricingDetails = (item, productInfo = null) => {
        try {
            const product = productInfo || item?.productId || item?.bundleId || item?.productDetails || item?.bundleDetails;
            
            // Get original price before any discounts
            let originalPrice = 0;
            let finalPrice = 0;
            let discountPercentage = 0;
            
            if (item?.itemType === 'product' || !item?.itemType) {
                // For products, check for stored discounted price first (priority implementation)
                if (product?.discountedPrice && product.discountedPrice > 0) {
                    finalPrice = product.discountedPrice;
                    originalPrice = product?.price || finalPrice;
                    console.log('✅ InvoiceModal: Using stored discountedPrice:', finalPrice);
                } else if (product?.price) {
                    originalPrice = product.price;
                    // Apply discount if available
                    discountPercentage = product?.discount || 0;
                    finalPrice = discountPercentage > 0 ? originalPrice * (1 - discountPercentage / 100) : originalPrice;
                    console.log('✅ InvoiceModal: Calculated discount price:', finalPrice, 'from original:', originalPrice, 'discount:', discountPercentage);
                } else if (item?.originalPrice) {
                    originalPrice = item.originalPrice;
                    finalPrice = getSizeBasedUnitPrice(item, productInfo);
                } else {
                    // Fallback to calculated size-based price
                    finalPrice = getSizeBasedUnitPrice(item, productInfo);
                    originalPrice = finalPrice;
                }
            } else if (item?.itemType === 'bundle') {
                // For bundles
                finalPrice = product?.bundlePrice || 0;
                originalPrice = product?.originalPrice || finalPrice;
            } else {
                // Legacy fallback logic for backward compatibility
                if (item?.originalPrice) {
                    originalPrice = item.originalPrice;
                } else if (product?.originalPrice) {
                    originalPrice = product.originalPrice;
                } else if (product?.price) {
                    originalPrice = product.price;
                } else if (product?.bundlePrice) {
                    originalPrice = product.bundlePrice;
                } else if (item?.sizeAdjustedPrice) {
                    originalPrice = item.sizeAdjustedPrice;
                }
                
                finalPrice = getSizeBasedUnitPrice(item, productInfo);
            }
            
            // Recalculate discount if we have both prices
            if (originalPrice > finalPrice && originalPrice > 0) {
                discountPercentage = ((originalPrice - finalPrice) / originalPrice) * 100;
            }
            
            const discountAmount = Math.max(0, originalPrice - finalPrice);

            console.log('🏷️ InvoiceModal Pricing Debug:', {
                itemName: product?.name || product?.title || 'Unknown',
                originalPrice,
                finalPrice,
                discountAmount,
                discountPercentage: Math.round(discountPercentage),
                hasDiscount: discountAmount > 0,
                productDiscount: product?.discount,
                storedDiscountedPrice: product?.discountedPrice
            });

            return {
                originalPrice,
                finalPrice,
                discountAmount,
                discountPercentage: Math.round(discountPercentage),
                hasDiscount: discountAmount > 0
            };
        } catch (error) {
            console.error('Error calculating pricing details:', error);
            const fallbackPrice = getSizeBasedUnitPrice(item, productInfo);
            return {
                originalPrice: fallbackPrice,
                finalPrice: fallbackPrice,
                discountAmount: 0,
                discountPercentage: 0,
                hasDiscount: false
            };
        }
    };

    // Calculate total discount savings
    const calculateTotalDiscountSavings = () => {
        try {
            let totalSavings = 0;
            let totalOriginalAmount = 0;
            let totalFinalAmount = 0;

            if (payment.items && payment.items.length > 0) {
                // Calculate for items array
                payment.items.forEach(item => {
                    const productInfo = item?.productDetails || item?.bundleDetails || 
                                      (item?.productId && typeof item.productId === 'object' ? item.productId : null) ||
                                      (item?.bundleId && typeof item.bundleId === 'object' ? item.bundleId : null);
                    
                    const pricingDetails = getPricingDetails(item, productInfo);
                    const quantity = item.quantity || 1;
                    
                    totalOriginalAmount += pricingDetails.originalPrice * quantity;
                    totalFinalAmount += pricingDetails.finalPrice * quantity;
                    totalSavings += pricingDetails.discountAmount * quantity;
                    
                    console.log('🔍 InvoiceModal Discount Calculation Debug:', {
                        itemName: productInfo?.name || productInfo?.title || 'Unknown',
                        originalPrice: pricingDetails.originalPrice,
                        finalPrice: pricingDetails.finalPrice,
                        discountAmount: pricingDetails.discountAmount,
                        quantity,
                        itemSavings: pricingDetails.discountAmount * quantity
                    });
                });
            } else {
                // Calculate for legacy order structure
                const legacyItem = {
                    size: payment.size || payment.productDetails?.size,
                    quantity: payment.orderQuantity || payment.totalQuantity || 1,
                    itemTotal: payment.subTotalAmt,
                    sizeAdjustedPrice: payment.sizeAdjustedPrice,
                    originalPrice: payment.productDetails?.originalPrice || payment.productDetails?.price
                };
                
                const pricingDetails = getPricingDetails(legacyItem, payment.productDetails);
                const quantity = legacyItem.quantity;
                
                totalOriginalAmount = pricingDetails.originalPrice * quantity;
                totalFinalAmount = pricingDetails.finalPrice * quantity;
                totalSavings = pricingDetails.discountAmount * quantity;
            }

            // Additional check: if we have a subtotal that's different from calculated final amount
            // This could indicate a discount that wasn't captured in item-level calculations
            if (payment.subTotalAmt && Math.abs(payment.subTotalAmt - totalFinalAmount) > 0.01) {
                console.log('🔍 Subtotal mismatch detected - might indicate additional discounts');
                console.log('Calculated final amount:', totalFinalAmount, 'vs Subtotal:', payment.subTotalAmt);
                
                // If subtotal is less than calculated amount, use it as the final amount
                if (payment.subTotalAmt < totalFinalAmount) {
                    const additionalSavings = totalFinalAmount - payment.subTotalAmt;
                    totalSavings += additionalSavings;
                    totalFinalAmount = payment.subTotalAmt;
                    console.log('Added additional savings:', additionalSavings);
                }
            }

            console.log('📊 InvoiceModal Total Discount Summary:', {
                totalOriginalAmount,
                totalFinalAmount,
                totalSavings,
                hasSavings: totalSavings > 0,
                savingsPercentage: totalOriginalAmount > 0 ? Math.round((totalSavings / totalOriginalAmount) * 100) : 0
            });

            return {
                totalSavings,
                totalOriginalAmount,
                totalFinalAmount,
                hasSavings: totalSavings > 0,
                savingsPercentage: totalOriginalAmount > 0 ? Math.round((totalSavings / totalOriginalAmount) * 100) : 0
            };
        } catch (error) {
            console.error('Error calculating total discount savings:', error);
            return {
                totalSavings: 0,
                totalOriginalAmount: 0,
                totalFinalAmount: 0,
                hasSavings: false,
                savingsPercentage: 0
            };
        }
    };
    
    // Enhanced bundle fetching logic
    useEffect(() => {
        const enhancePaymentWithBundles = async () => {
            setLoadingBundles(true)
            
            // Create a copy of payment and ensure refundDetails exists
            const payment = {
                ...originalPayment,
                refundDetails: originalPayment.refundDetails || {}
            };
            
            // Calculate refund and retained amounts if not already set
            console.log('Original payment data:', originalPayment);
            console.log('Original refund details:', originalPayment.refundDetails);
            
            if (payment.paymentStatus && (
                payment.paymentStatus.includes('REFUND') || 
                payment.paymentStatus === 'REFUND_SUCCESSFUL' || 
                payment.paymentStatus.toLowerCase().includes('refund')
            )) {
                // Ensure refundDetails exists
                if (!payment.refundDetails) {
                    payment.refundDetails = {};
                }
                
                console.log('Before calculation - refundDetails:', payment.refundDetails);
                
                // If we have a refund percentage but no refund amount, calculate it
                if (typeof payment.refundDetails.refundPercentage !== 'undefined' && !payment.refundDetails.refundAmount) {
                    const percentage = parseFloat(payment.refundDetails.refundPercentage) || 0;
                    payment.refundDetails.refundAmount = (payment.totalAmt || 0) * (percentage / 100);
                }
                
                // If we have refund amount but no percentage, calculate it
                if (payment.refundDetails.refundAmount && typeof payment.refundDetails.refundPercentage === 'undefined') {
                    payment.refundDetails.refundPercentage = ((payment.refundDetails.refundAmount / (payment.totalAmt || 1)) * 100).toFixed(0);
                }
                
                // Calculate retained amount if not set
                if (!payment.refundDetails.retainedAmount) {
                    payment.refundDetails.retainedAmount = (payment.totalAmt || 0) - (payment.refundDetails.refundAmount || 0);
                }
                
                // Calculate refund based on order timing
                if (typeof payment.refundDetails.refundPercentage === 'undefined' || payment.refundDetails.refundPercentage === null) {
                    // Check if we have order date information to determine refund percentage
                    const orderDate = payment.orderDate || payment.createdAt;
                    let refundPercentage = 75; // Default fallback
                    
                    if (orderDate) {
                        const hoursSinceOrder = (new Date() - new Date(orderDate)) / (1000 * 60 * 60);
                        refundPercentage = hoursSinceOrder <= 24 ? 90 : 75;
                    }
                    
                    payment.refundDetails.refundPercentage = refundPercentage;
                    payment.refundDetails.refundAmount = (payment.totalAmt || 0) * (refundPercentage / 100);
                    payment.refundDetails.retainedAmount = (payment.totalAmt || 0) - payment.refundDetails.refundAmount;
                }
                
                console.log('After calculation - refundDetails:', payment.refundDetails);
            }
            
            // Enhanced bundle detection and fetching
            if (payment.items && payment.items.length > 0) {
                const enhancedItems = await Promise.all(
                    payment.items.map(async (item) => {
                        // Check if this is a bundle that needs enhancement
                        const isBundle = item.itemType === 'bundle' || 
                                       (item.bundleId && typeof item.bundleId === 'object') ||
                                       (item.bundleDetails && typeof item.bundleDetails === 'object') ||
                                       (typeof item.bundleId === 'string' && item.bundleId) ||
                                       (item.type === 'Bundle') ||
                                       (item.productType === 'bundle');
                        
                        if (isBundle) {
                            let bundleIdToFetch = null;
                            
                            // Extract bundle ID from various possible sources
                            if (typeof item.bundleId === 'string' && item.bundleId) {
                                bundleIdToFetch = item.bundleId;
                            } else if (typeof item.bundleId === 'object' && item.bundleId && item.bundleId._id) {
                                bundleIdToFetch = item.bundleId._id;
                            } else if (typeof item.bundleId === 'object' && item.bundleId && item.bundleId.id) {
                                bundleIdToFetch = item.bundleId.id;
                            }
                            
                            // Check if we need to fetch bundle details
                            const needsBundleDetails = bundleIdToFetch && (
                                !item.productDetails || 
                                (typeof item.productDetails === 'object' && (!item.productDetails.length || item.productDetails.length === 0)) ||
                                (Array.isArray(item.productDetails) && item.productDetails.length === 0) ||
                                (item.productDetails && typeof item.productDetails === 'object' && Object.keys(item.productDetails).length <= 1)
                            );
                            
                            if (needsBundleDetails) {
                                // Bundle ID exists but bundle details are incomplete, need to fetch bundle details
                                try {
                                    console.log('Fetching bundle details for bundle ID:', bundleIdToFetch);
                                    const response = await Axios({
                                        ...SummaryApi.getBundleById,
                                        url: SummaryApi.getBundleById.url.replace(':id', bundleIdToFetch)
                                    });
                                    
                                    if (response.data.success && response.data.data) {
                                        console.log('Successfully fetched bundle details:', response.data.data);
                                        return {
                                            ...item,
                                            bundleDetails: response.data.data,
                                            bundleId: response.data.data, // Also populate bundleId as object
                                            productDetails: response.data.data.productDetails || response.data.data.items || []
                                        };
                                    } else {
                                        console.log('Failed to fetch bundle details:', response.data);
                                    }
                                } catch (error) {
                                    console.error('Error fetching bundle details:', error);
                                }
                            }
                        }
                        
                        return item; // Return original item if no enhancement needed
                    })
                );
                
                payment.items = enhancedItems;
            }
            
            // Debug: Check payment object structure
            console.log('Enhanced payment object in InvoiceModal:', payment);
            console.log('Payment status:', payment.paymentStatus);
            console.log('Refund details (after calculation):', payment.refundDetails);
            
            setEnhancedPayment(payment);
            setLoadingBundles(false);
        };
        
        enhancePaymentWithBundles();
    }, [originalPayment]);
    
    // Use enhanced payment if available, otherwise use original
    const payment = enhancedPayment || {
        ...originalPayment,
        refundDetails: originalPayment.refundDetails || {}
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount)
    }

    const handlePrint = () => {
        window.print()
    }

    const handleDownload = () => {
        // Convert the invoice to PDF and download
        // This would typically use a library like jsPDF or html2pdf
        const element = document.getElementById('invoice-content')
        
        // For now, we'll just trigger print dialog
        window.print()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <FaFileInvoice className="mr-2 text-blue-600" />
                        Invoice - #{payment.orderId}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Loading State */}
                {loadingBundles && (
                    <div className="p-6 text-center">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Loading bundle details...</span>
                        </div>
                    </div>
                )}

                {/* Invoice Content */}
                {!loadingBundles && (
                <div id="invoice-content" className="p-6">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-black">casualclothings</h1>
                            <p className="text-gray-600 mt-1">Fashion & Lifestyle Store</p>
                            <div className="mt-4 text-sm text-gray-600">
                                <p>Sivsakthi Nagar, 5th Street </p>
                                <p>Tirupur, Tamil Nadu - 641604   </p>
                                <p>Phone: +91  9442955929 </p>
                                <p>Email: casualclothing787@gmail.com</p>
                                <p>GST: 33ABCDE1234F1Z5</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                            <div className="mt-4 text-sm">
                                <p><span className="font-semibold">Invoice No:</span> INV-{payment.orderId}</p>
                                <p><span className="font-semibold">Order ID:</span> {payment.orderId}</p>
                                <p><span className="font-semibold">Date:</span> {new Date(payment.orderDate).toLocaleDateString('en-IN')}</p>
                                <p><span className="font-semibold">Payment Method:</span> {payment.paymentMethod || 'Cash on Delivery'}</p>
                                <p><span className="font-semibold">Status:</span> 
                                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                        payment.paymentStatus?.toLowerCase() === 'paid' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {payment.paymentStatus}
                                    </span>
                                </p>
                                {payment.estimatedDeliveryDate && (
                                    <p><span className="font-semibold">Est. Delivery:</span> {new Date(payment.estimatedDeliveryDate).toLocaleDateString('en-IN')}</p>
                                )}
                                {payment.actualDeliveryDate && (
                                    <p><span className="font-semibold text-green-600">Delivered:</span> 
                                        <span className="text-green-600 ml-1">{new Date(payment.actualDeliveryDate).toLocaleDateString('en-IN')}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Billing Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <FaUser className="mr-2 text-blue-600" />
                                Bill To
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-semibold text-gray-900">{payment.customerName}</p>
                                {payment.deliveryAddress && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p className="flex items-start">
                                            <FaMapMarkerAlt className="mr-2 mt-1 text-gray-400 flex-shrink-0" />
                                            <span>
                                                {payment.deliveryAddress.address_line}<br />
                                                {payment.deliveryAddress.city}, {payment.deliveryAddress.state}<br />
                                                PIN: {payment.deliveryAddress.pincode}
                                            </span>
                                        </p>
                                        <p className="flex items-center mt-2">
                                            <FaPhone className="mr-2 text-gray-400" />
                                            {payment.deliveryAddress.mobile}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <FaCalendarAlt className="mr-2 text-blue-600" />
                                Order Information
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Order Date</p>
                                        <p className="font-semibold">{new Date(payment.orderDate).toLocaleDateString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Order Status</p>
                                        <p className="font-semibold">{payment.orderStatus}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Total Items</p>
                                        <p className="font-semibold">{payment.totalQuantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Payment ID</p>
                                        <p className="font-semibold">{payment.paymentId || 'N/A'}</p>
                                    </div>
                                    {payment.estimatedDeliveryDate && (
                                        <div>
                                            <p className="text-gray-600">Estimated Delivery</p>
                                            <p className="font-semibold text-blue-600">{new Date(payment.estimatedDeliveryDate).toLocaleDateString('en-IN')}</p>
                                        </div>
                                    )}
                                    {payment.actualDeliveryDate && (
                                        <div>
                                            <p className="text-gray-600">Actual Delivery</p>
                                            <p className="font-semibold text-green-600">{new Date(payment.actualDeliveryDate).toLocaleDateString('en-IN')}</p>
                                        </div>
                                    )}
                                    {payment.deliveryNotes && (
                                        <div className="col-span-2">
                                            <p className="text-gray-600">Delivery Notes</p>
                                            <p className="font-semibold">{payment.deliveryNotes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Delivery Status Summary */}
                                {(payment.estimatedDeliveryDate || payment.actualDeliveryDate) && (
                                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                                        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                            🚚 Delivery Status
                                        </h4>
                                        <div className="flex items-center space-x-2">
                                            {(() => {
                                                // Check if order is cancelled
                                                if (payment.orderStatus === 'CANCELLED' || payment.paymentStatus === 'REFUNDED') {
                                                    return (
                                                        <>
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                                ❌ Cancelled
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                Order cancelled due to refund
                                                            </span>
                                                        </>
                                                    );
                                                } else if (payment.actualDeliveryDate) {
                                                    return (
                                                        <>
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                                ✅ Delivered
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                on {new Date(payment.actualDeliveryDate).toLocaleDateString('en-IN')}
                                                            </span>
                                                        </>
                                                    );
                                                } else if (payment.estimatedDeliveryDate) {
                                                    const estimatedDate = new Date(payment.estimatedDeliveryDate);
                                                    const isOverdue = new Date() > estimatedDate;
                                                    
                                                    if (isOverdue) {
                                                        return (
                                                            <>
                                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                                    ⚠️ Overdue
                                                                </span>
                                                                <span className="text-sm text-gray-600">
                                                                    Expected: {estimatedDate.toLocaleDateString('en-IN')}
                                                                </span>
                                                            </>
                                                        );
                                                    } else {
                                                        return (
                                                            <>
                                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                    🚚 In Transit
                                                                </span>
                                                                <span className="text-sm text-gray-600">
                                                                    Expected: {estimatedDate.toLocaleDateString('en-IN')}
                                                                </span>
                                                            </>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Debug payment status */}
                    {console.log('Payment status check:', payment.paymentStatus, 
                       'REFUND_SUCCESSFUL check:', payment.paymentStatus === 'REFUND_SUCCESSFUL', 
                       'includes REFUND check:', payment.paymentStatus && payment.paymentStatus.includes('REFUND'))}
                    
                    {/* Refund Information - Show only if the order was refunded */}
                    {payment.paymentStatus && (
                        payment.paymentStatus.includes('REFUND') || 
                        payment.paymentStatus === 'REFUND_SUCCESSFUL' || 
                        payment.paymentStatus.toLowerCase().includes('refund')
                    ) && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <FaCalendarAlt className="mr-2 text-red-600" />
                                Refund Information & Tracking
                            </h3>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <div className="flex flex-wrap items-center mb-2">
                                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                                                REFUND PROCESSED
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {payment.refundDetails && payment.refundDetails.refundDate ? 
                                                  `Processed on ${new Date(payment.refundDetails.refundDate).toLocaleDateString('en-IN')}` : 
                                                  'Processing date not available'}
                                            </span>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded-lg mt-2 text-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                                <div>
                                                    <p className="font-medium text-gray-700">Order Date:</p>
                                                    <p>{new Date(payment.orderDate).toLocaleDateString('en-IN')}</p>
                                                </div>
                                                
                                                {payment.refundDetails && payment.refundDetails.requestDate && (
                                                    <div>
                                                        <p className="font-medium text-gray-700">Cancellation Request Date:</p>
                                                        <p>{new Date(payment.refundDetails.requestDate).toLocaleDateString('en-IN')}</p>
                                                    </div>
                                                )}
                                                
                                                {payment.refundDetails && payment.refundDetails.approvalDate && (
                                                    <div>
                                                        <p className="font-medium text-gray-700">Admin Approval Date:</p>
                                                        <p>{new Date(payment.refundDetails.approvalDate).toLocaleDateString('en-IN')}</p>
                                                    </div>
                                                )}
                                                
                                                {payment.refundDetails && payment.refundDetails.refundDate && (
                                                    <div>
                                                        <p className="font-medium text-gray-700">Refund Completed Date:</p>
                                                        <p>{new Date(payment.refundDetails.refundDate).toLocaleDateString('en-IN')}</p>
                                                    </div>
                                                )}
                                                
                                                {payment.refundDetails && payment.refundDetails.reason && (
                                                    <div className="col-span-1 md:col-span-2">
                                                        <p className="font-medium text-gray-700">Reason for Cancellation:</p>
                                                        <p>{payment.refundDetails.reason}</p>
                                                    </div>
                                                )}
                                                
                                                {payment.refundDetails && payment.refundDetails.adminComments && (
                                                    <div className="col-span-1 md:col-span-2">
                                                        <p className="font-medium text-gray-700">Admin Comments:</p>
                                                        <p>{payment.refundDetails.adminComments}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-600">Refund ID</p>
                                        <p className="font-semibold">{payment.refundDetails?.refundId || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-600">Refund Date</p>
                                        <p className="font-semibold">
                                            {payment.refundDetails?.refundDate ? 
                                                new Date(payment.refundDetails.refundDate).toLocaleDateString('en-IN') : 'N/A'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-600">Refund Percentage</p>
                                        <p className="font-semibold">{parseFloat(payment.refundDetails?.refundPercentage || 0).toFixed(0)}%</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-600">Refund Method</p>
                                        <p className="font-semibold">Original Payment Method</p>
                                    </div>
                                    
                                    <div className="bg-white p-3 rounded-lg border border-red-100 col-span-1 md:col-span-2">
                                        <h4 className="font-medium text-gray-700 mb-3">Refund Calculation Breakdown</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">ORIGINAL ORDER AMOUNT</p>
                                                <p className="text-xl font-bold text-gray-900">{formatCurrency(payment.totalAmt || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    REFUNDED AMOUNT ({parseFloat(payment.refundDetails?.refundPercentage || 0).toFixed(0)}%)
                                                </p>
                                                <p className="text-xl font-bold text-red-600">
                                                    {formatCurrency(payment.refundDetails?.refundAmount || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    RETAINED AMOUNT ({(100 - parseFloat(payment.refundDetails?.refundPercentage || 0)).toFixed(0)}%)
                                                </p>
                                                <p className="text-xl font-bold text-green-600">
                                                    {formatCurrency(payment.refundDetails?.retainedAmount || 
                                                        (payment.totalAmt - (payment.refundDetails?.refundAmount || 0)))}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Processing Timeline */}
                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Refund Processing Timeline</h5>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">1. Cancellation Requested:</span>
                                                    <span className="text-green-600">✓ Completed</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">2. Admin Review:</span>
                                                    <span className="text-green-600">✓ Approved</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">3. Refund Processing:</span>
                                                    <span className="text-green-600">✓ Completed</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">4. Amount Credited:</span>
                                                    <span className="text-green-600">✓ {payment.refundDetails?.refundDate ? 
                                                        new Date(payment.refundDetails.refundDate).toLocaleDateString('en-IN') : 'Completed'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                        {/* Refund Note */}
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <p className="text-blue-800">
                                <strong>Note:</strong> Refund amount has been credited to your original payment method. 
                                It may take 3-5 business days for the amount to reflect in your account statement.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )}

    {/* Return Tracking - Show only if the payment has returns */}
    {(payment.orderStatus === 'RETURNED' || payment.returnDetails || payment.returnTracking) && (
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaReply className="mr-2 text-orange-600" />
                Return Tracking & Management
            </h3>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex flex-wrap items-center mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium mr-2 ${
                                payment.orderStatus === 'RETURNED' ? 
                                'bg-orange-100 text-orange-800' : 
                                'bg-blue-100 text-blue-800'
                            }`}>
                                {payment.orderStatus === 'RETURNED' ? 'RETURNED' : 'RETURN PROCESSING'}
                            </span>
                            <span className="text-sm text-gray-600">
                                {payment.returnDetails?.initiatedDate ? 
                                  `Initiated on ${new Date(payment.returnDetails.initiatedDate).toLocaleDateString('en-IN')}` : 
                                  'Return processing in progress'}
                            </span>
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg mt-2 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                <div>
                                    <p className="font-medium text-gray-700">Return Request Date:</p>
                                    <p>{payment.returnDetails?.requestDate ? 
                                        new Date(payment.returnDetails.requestDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                                </div>
                                
                                {payment.returnDetails?.pickupDate && (
                                    <div>
                                        <p className="font-medium text-gray-700">Pickup Scheduled:</p>
                                        <p>{new Date(payment.returnDetails.pickupDate).toLocaleDateString('en-IN')}</p>
                                    </div>
                                )}
                                
                                {payment.returnDetails?.receivedDate && (
                                    <div>
                                        <p className="font-medium text-gray-700">Product Received:</p>
                                        <p>{new Date(payment.returnDetails.receivedDate).toLocaleDateString('en-IN')}</p>
                                    </div>
                                )}
                                
                                {payment.returnDetails?.approvalDate && (
                                    <div>
                                        <p className="font-medium text-gray-700">Return Approved:</p>
                                        <p>{new Date(payment.returnDetails.approvalDate).toLocaleDateString('en-IN')}</p>
                                    </div>
                                )}
                                
                                {payment.returnDetails?.reason && (
                                    <div className="col-span-1 md:col-span-2">
                                        <p className="font-medium text-gray-700">Return Reason:</p>
                                        <p>{payment.returnDetails.reason}</p>
                                    </div>
                                )}
                                
                                {payment.returnDetails?.customerComments && (
                                    <div className="col-span-1 md:col-span-2">
                                        <p className="font-medium text-gray-700">Customer Comments:</p>
                                        <p>{payment.returnDetails.customerComments}</p>
                                    </div>
                                )}
                                
                                {payment.returnDetails?.qualityCheckNotes && (
                                    <div className="col-span-1 md:col-span-2">
                                        <p className="font-medium text-gray-700">Quality Check Notes:</p>
                                        <p>{payment.returnDetails.qualityCheckNotes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <p className="text-sm text-gray-600">Return ID</p>
                        <p className="font-semibold">{payment.returnDetails?.returnId || 'N/A'}</p>
                    </div>
                    
                    <div>
                        <p className="text-sm text-gray-600">Return Status</p>
                        <p className="font-semibold capitalize">
                            {payment.returnDetails?.status || payment.orderStatus || 'Processing'}
                        </p>
                    </div>
                    
                    <div>
                        <p className="text-sm text-gray-600">Pickup Partner</p>
                        <p className="font-semibold">{payment.returnDetails?.pickupPartner || 'TBD'}</p>
                    </div>
                    
                    <div>
                        <p className="text-sm text-gray-600">Expected Processing</p>
                        <p className="font-semibold">3-5 business days</p>
                    </div>
                    
                    {/* Return Timeline */}
                    <div className="col-span-1 md:col-span-2 bg-white p-3 rounded-lg border border-orange-100">
                        <h4 className="font-medium text-gray-700 mb-3">Return Processing Timeline</h4>
                        <div className="space-y-3">
                            {/* Step 1: Return Request */}
                            <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-3 ${
                                    payment.returnDetails?.requestDate ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Return Request Submitted</p>
                                    <p className="text-xs text-gray-500">
                                        {payment.returnDetails?.requestDate ? 
                                            new Date(payment.returnDetails.requestDate).toLocaleDateString('en-IN') : 
                                            'Pending'}
                                    </p>
                                </div>
                                {payment.returnDetails?.requestDate && (
                                    <span className="text-green-600 text-xs">✓</span>
                                )}
                            </div>
                            
                            {/* Step 2: Pickup Scheduled */}
                            <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-3 ${
                                    payment.returnDetails?.pickupDate ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Pickup Scheduled</p>
                                    <p className="text-xs text-gray-500">
                                        {payment.returnDetails?.pickupDate ? 
                                            new Date(payment.returnDetails.pickupDate).toLocaleDateString('en-IN') : 
                                            'Will be scheduled within 24 hours'}
                                    </p>
                                </div>
                                {payment.returnDetails?.pickupDate && (
                                    <span className="text-green-600 text-xs">✓</span>
                                )}
                            </div>
                            
                            {/* Step 3: Product Received */}
                            <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-3 ${
                                    payment.returnDetails?.receivedDate ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Product Received & Quality Check</p>
                                    <p className="text-xs text-gray-500">
                                        {payment.returnDetails?.receivedDate ? 
                                            new Date(payment.returnDetails.receivedDate).toLocaleDateString('en-IN') : 
                                            'Awaiting product receipt'}
                                    </p>
                                </div>
                                {payment.returnDetails?.receivedDate && (
                                    <span className="text-green-600 text-xs">✓</span>
                                )}
                            </div>
                            
                            {/* Step 4: Return Approved & Refund */}
                            <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-3 ${
                                    payment.returnDetails?.approvalDate ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Return Approved & Refund Processed</p>
                                    <p className="text-xs text-gray-500">
                                        {payment.returnDetails?.approvalDate ? 
                                            new Date(payment.returnDetails.approvalDate).toLocaleDateString('en-IN') : 
                                            'Pending quality verification'}
                                    </p>
                                </div>
                                {payment.returnDetails?.approvalDate && (
                                    <span className="text-green-600 text-xs">✓</span>
                                )}
                            </div>
                        </div>
                        
                        {/* Return Note */}
                        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                            <p className="text-orange-800">
                                <strong>Note:</strong> Once your return is approved, refund will be processed within 3-5 business days. 
                                You will receive email notifications at each step of the return process.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )}                    {/* Order Items */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Item
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Size
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Original Price
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Discount
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Final Price
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {/* Debug payment data structure with more details */}
                                    {console.log('Payment data structure:', JSON.stringify(payment, null, 2))}
                                    {payment.items && payment.items.length > 0 && console.log('First item details:', JSON.stringify(payment.items[0], null, 2))}
                                    {payment.items && payment.items.length > 0 ? (
                                        payment.items.map((item, index) => {
                                            console.log('Item structure:', item);
                                            // Enhanced product name resolution
                                            const getProductName = () => {
                                                // Check productDetails first (most reliable source)
                                                if (item.productDetails && item.productDetails.name) {
                                                    return item.productDetails.name;
                                                }
                                                // Check bundleDetails first (most reliable source)
                                                if (item.bundleDetails && item.bundleDetails.title) {
                                                    return item.bundleDetails.title;
                                                }
                                                // Check if productId is populated object
                                                if (item.productId && typeof item.productId === 'object') {
                                                    return item.productId.name || item.productId.title;
                                                }
                                                // Check if bundleId is populated object
                                                if (item.bundleId && typeof item.bundleId === 'object') {
                                                    return item.bundleId.title || item.bundleId.name;
                                                }
                                                return isBundle ? 'Bundle Item' : 'Product Item';
                                            };

                                            // Enhanced price calculation with size-based pricing
                                            const getProductInfo = () => {
                                                // Try multiple sources for product information with proper fallbacks
                                                if (item.productDetails && typeof item.productDetails === 'object') {
                                                    return item.productDetails;
                                                }
                                                if (item.bundleDetails && typeof item.bundleDetails === 'object') {
                                                    return item.bundleDetails;
                                                }
                                                if (item.productId && typeof item.productId === 'object') {
                                                    return item.productId;
                                                }
                                                if (item.bundleId && typeof item.bundleId === 'object') {
                                                    return item.bundleId;
                                                }
                                                return null;
                                            };

                                            const productInfo = getProductInfo();
                                            const sizeBasedUnitPrice = getSizeBasedUnitPrice(item, productInfo);
                                            const sizeBasedTotalPrice = calculateSizeBasedPrice(item, productInfo);

                                            // Use enhanced pricing with comprehensive fallbacks
                                            let unitPrice = 0;
                                            let itemTotal = 0;
                                            
                                            // Priority 1: Use sizeAdjustedPrice if available (most accurate)
                                            if (item.sizeAdjustedPrice && item.sizeAdjustedPrice > 0) {
                                                unitPrice = item.sizeAdjustedPrice;
                                                itemTotal = item.sizeAdjustedPrice * (item.quantity || 1);
                                            }
                                            // Priority 2: Use calculated size-based pricing
                                            else if (sizeBasedUnitPrice > 0) {
                                                unitPrice = sizeBasedUnitPrice;
                                                itemTotal = sizeBasedTotalPrice;
                                            }
                                            // Priority 3: Use unitPrice if set correctly in the order
                                            else if (item.unitPrice && item.unitPrice > 0) {
                                                unitPrice = item.unitPrice;
                                                itemTotal = item.unitPrice * (item.quantity || 1);
                                            }
                                            // Priority 4: Use itemTotal and calculate unit price
                                            else if (item.itemTotal && item.itemTotal > 0) {
                                                itemTotal = item.itemTotal;
                                                unitPrice = item.itemTotal / (item.quantity || 1);
                                            }
                                            // Priority 5: Use product price as fallback
                                            else {
                                                const fallbackPrice = item.productId?.price || item.productDetails?.price || 0;
                                                unitPrice = fallbackPrice;
                                                itemTotal = fallbackPrice * (item.quantity || 1);
                                            }
                                            
                                            // Enhanced bundle detection - check multiple sources
                                            const isBundle = item.itemType === 'bundle' || 
                                                           (item.bundleId && typeof item.bundleId === 'object') ||
                                                           (item.bundleDetails && typeof item.bundleDetails === 'object') ||
                                                           (item.type === 'Bundle') ||
                                                           (item.productType === 'bundle');

                                            // Get item-specific status
                                            const getItemStatus = () => {
                                                const itemStatus = item.status || 'Active';
                                                const isCancelled = item.status === 'Cancelled' || item.cancelApproved === true;
                                                const isReturned = item.status === 'Returned' || item.returnStatus === 'Approved';
                                                const hasReturnRequest = item.returnStatus === 'Pending' || item.returnRequested === true;
                                                const hasCancelRequest = item.cancelRequested === true && !item.cancelApproved;
                                                
                                                // Priority order: Returned > Cancelled > Return Pending > Cancel Pending > Active
                                                if (isReturned) {
                                                    return {
                                                        text: 'RETURNED',
                                                        colorClass: 'bg-purple-100 text-purple-800 border border-purple-200',
                                                        icon: '↩️'
                                                    };
                                                } else if (isCancelled) {
                                                    return {
                                                        text: 'CANCELLED',
                                                        colorClass: 'bg-red-100 text-red-800 border border-red-200',
                                                        icon: '❌'
                                                    };
                                                } else if (hasReturnRequest) {
                                                    return {
                                                        text: 'RETURN PENDING',
                                                        colorClass: 'bg-orange-100 text-orange-800 border border-orange-200',
                                                        icon: '⏳'
                                                    };
                                                } else if (hasCancelRequest) {
                                                    return {
                                                        text: 'CANCEL PENDING',
                                                        colorClass: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
                                                        icon: '⏳'
                                                    };
                                                } else {
                                                    return {
                                                        text: 'ACTIVE',
                                                        colorClass: 'bg-green-100 text-green-800 border border-green-200',
                                                        icon: '✅'
                                                    };
                                                }
                                            };

                                            const itemStatusInfo = getItemStatus();
                                            const isCancelled = item.status === 'Cancelled' || item.cancelApproved === true;
                                            const isReturned = item.status === 'Returned' || item.returnStatus === 'Approved';

                                            // Get pricing details
                                            const pricingDetails = getPricingDetails(item, productInfo);

                                            return (
                                                <tr key={index} className={`border-b border-gray-200 ${
                                                    isCancelled ? 'bg-red-50 opacity-75' : 
                                                    isReturned ? 'bg-purple-50 opacity-75' : 
                                                    'bg-white'
                                                }`}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center">
                                            {/* Product Image */}
                                            {(() => {
                                                // Enhanced product image resolution function
                                                const getProductImage = () => {
                                                    // Add debugging
                                                    console.log('Invoice modal image debug - item:', item);
                                                    
                                                    // Try all possible image sources in order of preference
                                                    let imageUrl = null;
                                                    
                                                    // First try bundleId (most specific for bundles)
                                                    if (item.bundleId && typeof item.bundleId === 'object') {
                                                        imageUrl = item.bundleId.images?.[0] || item.bundleId.image?.[0] || item.bundleId.bundleImage;
                                                        if (imageUrl) return imageUrl;
                                                    }
                                                    
                                                    // Then try bundleDetails
                                                    if (item.bundleDetails) {
                                                        imageUrl = item.bundleDetails.images?.[0] || item.bundleDetails.image?.[0] || item.bundleDetails.bundleImage;
                                                        if (imageUrl) return imageUrl;
                                                    }
                                                    
                                                    // Then try productId
                                                    if (item.productId && typeof item.productId === 'object') {
                                                        imageUrl = item.productId.images?.[0] || item.productId.image?.[0];
                                                        if (imageUrl) return imageUrl;
                                                    }
                                                    
                                                    // Finally try productDetails
                                                    if (item.productDetails) {
                                                        imageUrl = item.productDetails.images?.[0] || item.productDetails.image?.[0];
                                                        if (imageUrl) return imageUrl;
                                                    }
                                                    
                                                    return null;
                                                };

                                                const imageUrl = getProductImage();
                                                
                                                return imageUrl ? (
                                                    <div className="w-12 h-12 mr-4 overflow-hidden rounded border border-gray-200 relative">
                                                        <img 
                                                            src={imageUrl} 
                                                            alt={getProductName()}
                                                            className={`w-full h-full object-cover ${
                                                                isCancelled || isReturned ? 'grayscale opacity-60' : ''
                                                            }`}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = `
                                                                    <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                                        </svg>
                                                                    </div>
                                                                `;
                                                            }}
                                                        />
                                                        {(isCancelled || isReturned) && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded">
                                                                <span className="text-white text-xs font-bold">
                                                                    {isCancelled ? 'CANCELLED' : 'RETURNED'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={`w-12 h-12 mr-4 bg-gray-100 rounded flex items-center justify-center relative ${
                                                        isCancelled || isReturned ? 'opacity-60' : ''
                                                    }`}>
                                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                        </svg>
                                                        {(isCancelled || isReturned) && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded">
                                                                <span className="text-white text-xs font-bold">
                                                                    {isCancelled ? 'CANCELLED' : 'RETURNED'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                                            })()}
                                                            
                                                            {/* Product Name and Type */}
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`font-medium ${
                                                                        isCancelled ? 'text-red-600 line-through' : 
                                                                        isReturned ? 'text-purple-600 line-through' : 
                                                                        'text-gray-900'
                                                                    }`}>
                                                                        {getProductName()}
                                                                    </p>
                                                                    {isBundle && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            Bundle
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className={`text-sm ${
                                                                    isCancelled || isReturned ? 'text-gray-400' : 'text-gray-500'
                                                                }`}>
                                                                    Type: {isBundle ? 'Bundle' : 'Product'}
                                                                </p>
                                                                
                                                                {/* Show cancellation/return details if applicable */}
                                                                {isCancelled && item.refundAmount && (
                                                                    <p className="text-xs text-red-600 font-medium mt-1">
                                                                        Refunded: ₹{item.refundAmount}
                                                                    </p>
                                                                )}
                                                                {isReturned && item.returnAmount && (
                                                                    <p className="text-xs text-purple-600 font-medium mt-1">
                                                                        Return Amount: ₹{item.returnAmount}
                                                                    </p>
                                                                )}
                                                                
                                                                {/* Bundle Items Details */}
                                                                {isBundle && (() => {
                                                                    // Enhanced bundle items detection function
                                                                    const getBundleItems = () => {
                                                                        // Use bundle item data
                                                                        const bundleData = item;
                                                                        console.log('=== BUNDLE ITEMS DETECTION START ===');
                                                                        console.log('Debug: Bundle item data received:', bundleData);
                                                                        console.log('Item keys:', Object.keys(bundleData));
                                                                        console.log('bundleId structure:', bundleData.bundleId);
                                                                        console.log('bundleDetails structure:', bundleData.bundleDetails);
                                                                        console.log('productDetails structure:', bundleData.productDetails);
                                                                        
                                                                        // 1. Check for direct bundle items array
                                                                        if (bundleData.items && Array.isArray(bundleData.items) && bundleData.items.length > 0) {
                                                                            console.log('✅ Found items in bundleData.items:', bundleData.items);
                                                                            return bundleData.items;
                                                                        }
                                                                        
                                                                        // 2. Check bundleDetails.items (most common for populated bundles)
                                                                        if (bundleData.bundleDetails && bundleData.bundleDetails.items && Array.isArray(bundleData.bundleDetails.items)) {
                                                                            console.log('✅ Found items in bundleData.bundleDetails.items:', bundleData.bundleDetails.items);
                                                                            return bundleData.bundleDetails.items;
                                                                        }
                                                                        
                                                                        // 2.1. Check bundleDetails.productDetails (newly fetched API structure)
                                                                        if (bundleData.bundleDetails && bundleData.bundleDetails.productDetails && Array.isArray(bundleData.bundleDetails.productDetails) && bundleData.bundleDetails.productDetails.length > 0) {
                                                                            console.log('✅ Found items in bundleData.bundleDetails.productDetails:', bundleData.bundleDetails.productDetails);
                                                                            return bundleData.bundleDetails.productDetails;
                                                                        }
                                                                        
                                                                        // 3. Check productDetails array (alternative structure for bundles)
                                                                        if (bundleData.productDetails && Array.isArray(bundleData.productDetails) && bundleData.productDetails.length > 0) {
                                                                            console.log('✅ Found items in bundleData.productDetails:', bundleData.productDetails);
                                                                            return bundleData.productDetails;
                                                                        }
                                                                        
                                                                        // 2.1. Enhanced bundleDetails check - look deeper into the object
                                                                        if (bundleData.bundleDetails && typeof bundleData.bundleDetails === 'object') {
                                                                            console.log('Detailed bundleDetails analysis:', bundleData.bundleDetails);
                                                                            console.log('bundleDetails keys:', Object.keys(bundleData.bundleDetails));
                                                                            
                                                                            // Check all properties in bundleDetails for arrays
                                                                            for (const [key, value] of Object.entries(bundleData.bundleDetails)) {
                                                                                if (Array.isArray(value) && value.length > 0) {
                                                                                    console.log(`Found array in bundleDetails.${key}:`, value);
                                                                                    // Check if this array contains items that look like products/bundle items
                                                                                    if (value[0] && (value[0].name || value[0].title || value[0].productId || value[0]._id)) {
                                                                                        console.log(`Using bundleDetails.${key} as bundle items`);
                                                                                        return value;
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        
                                                                        // 3. Check bundleId.items (if bundleId is populated object)
                                                                        if (bundleData.bundleId && typeof bundleData.bundleId === 'object' && bundleData.bundleId.items && Array.isArray(bundleData.bundleId.items)) {
                                                                            console.log('Found items in bundleData.bundleId.items:', bundleData.bundleId.items);
                                                                            return bundleData.bundleId.items;
                                                                        }
                                                                        
                                                                        // 3.1. Check bundleId.productDetails (newly fetched bundle structure)
                                                                        if (bundleData.bundleId && typeof bundleData.bundleId === 'object' && bundleData.bundleId.productDetails && Array.isArray(bundleData.bundleId.productDetails) && bundleData.bundleId.productDetails.length > 0) {
                                                                            console.log('✅ Found items in bundleData.bundleId.productDetails:', bundleData.bundleId.productDetails);
                                                                            return bundleData.bundleId.productDetails;
                                                                        }
                                                                        
                                                                        // 3.2. Enhanced bundleId check - look deeper into the object
                                                                        if (bundleData.bundleId && typeof bundleData.bundleId === 'object') {
                                                                            console.log('Detailed bundleId analysis:', bundleData.bundleId);
                                                                            console.log('bundleId keys:', Object.keys(bundleData.bundleId));
                                                                            
                                                                            // Check all properties in bundleId for arrays
                                                                            for (const [key, value] of Object.entries(bundleData.bundleId)) {
                                                                                if (Array.isArray(value) && value.length > 0) {
                                                                                    console.log(`Found array in bundleId.${key}:`, value);
                                                                                    // Check if this array contains items that look like products/bundle items
                                                                                    if (value[0] && (value[0].name || value[0].title || value[0].productId || value[0]._id)) {
                                                                                        console.log(`Using bundleId.${key} as bundle items`);
                                                                                        return value;
                                                                                    }
                                                                                }
                                                                                
                                                                                // Check nested objects for items arrays
                                                                                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                                                                    for (const [nestedKey, nestedValue] of Object.entries(value)) {
                                                                                        if (nestedKey === 'items' && Array.isArray(nestedValue) && nestedValue.length > 0) {
                                                                                            console.log(`✅ Found items in bundleId.${key}.${nestedKey}:`, nestedValue);
                                                                                            return nestedValue;
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        
                                                                        // 4. Deep search in bundleDetails for items (check all properties)
                                                                        if (bundleData.bundleDetails && typeof bundleData.bundleDetails === 'object') {
                                                                            console.log('Searching bundleDetails for items:', Object.keys(bundleData.bundleDetails));
                                                                            
                                                                            // Check for items in different possible locations within bundleDetails
                                                                            const searchForItems = (obj, path = 'bundleDetails') => {
                                                                                if (!obj || typeof obj !== 'object') return null;
                                                                                
                                                                                for (const [key, value] of Object.entries(obj)) {
                                                                                    if (key === 'items' && Array.isArray(value) && value.length > 0) {
                                                                                        console.log(`Found items in ${path}.${key}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                    
                                                                                    // Also check for products, bundleItems, etc.
                                                                                    if ((key === 'products' || key === 'bundleItems') && Array.isArray(value) && value.length > 0) {
                                                                                        console.log(`Found ${key} in ${path}.${key}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                    
                                                                                    // Recursive search in nested objects
                                                                                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                                                                        const found = searchForItems(value, `${path}.${key}`);
                                                                                        if (found) return found;
                                                                                    }
                                                                                }
                                                                                return null;
                                                                            };
                                                                            
                                                                            const foundItems = searchForItems(bundleData.bundleDetails);
                                                                            if (foundItems) return foundItems;
                                                                        }
                                                                        
                                                                        // 5. Deep search in bundleId for items (check all properties)
                                                                        if (bundleData.bundleId && typeof bundleData.bundleId === 'object') {
                                                                            console.log('Searching bundleId for items:', Object.keys(bundleData.bundleId));
                                                                            
                                                                            const searchForItems = (obj, path = 'bundleId') => {
                                                                                if (!obj || typeof obj !== 'object') return null;
                                                                                
                                                                                for (const [key, value] of Object.entries(obj)) {
                                                                                    if (key === 'items' && Array.isArray(value) && value.length > 0) {
                                                                                        console.log(`Found items in ${path}.${key}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                    
                                                                                    // Also check for products, bundleItems, etc.
                                                                                    if ((key === 'products' || key === 'bundleItems') && Array.isArray(value) && value.length > 0) {
                                                                                        console.log(`Found ${key} in ${path}.${key}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                    
                                                                                    // Recursive search in nested objects
                                                                                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                                                                        const found = searchForItems(value, `${path}.${key}`);
                                                                                        if (found) return found;
                                                                                    }
                                                                                }
                                                                                return null;
                                                                            };
                                                                            
                                                                            const foundItems = searchForItems(bundleData.bundleId);
                                                                            if (foundItems) return foundItems;
                                                                        }
                                                                        
                                                                        // 4. If bundle itself looks like bundleId object with items
                                                                        if (bundleData._id && bundleData.title && bundleData.bundlePrice && bundleData.items && Array.isArray(bundleData.items)) {
                                                                            console.log('Bundle looks like a populated bundleId object:', bundleData.items);
                                                                            return bundleData.items;
                                                                        }
                                                                        
                                                                        // 5. Search for nested bundle structures
                                                                        const findBundleItemsRecursively = (obj, path = 'root', maxDepth = 2, currentDepth = 0) => {
                                                                            if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) return null;
                                                                            
                                                                            for (const [key, value] of Object.entries(obj)) {
                                                                                const currentPath = `${path}.${key}`;
                                                                                
                                                                                // Only look for bundle-specific item arrays
                                                                                if (key === 'items' && Array.isArray(value) && value.length > 0) {
                                                                                    // Check if this looks like bundle items
                                                                                    if (path.includes('bundle') || path.includes('Bundle')) {
                                                                                        console.log(`Found bundle items in ${currentPath}:`, value);
                                                                                        return value;
                                                                                    }
                                                                                }
                                                                                
                                                                                // Look for bundleItems arrays (specific to bundles)
                                                                                if (key === 'bundleItems' && Array.isArray(value) && value.length > 0) {
                                                                                    console.log(`Found bundleItems in ${currentPath}:`, value);
                                                                                    return value;
                                                                                }
                                                                                
                                                                                // Continue recursive search only in bundle-related nested objects
                                                                                if (typeof value === 'object' && value !== null) {
                                                                                    if (key.toLowerCase().includes('bundle')) {
                                                                                        const found = findBundleItemsRecursively(value, currentPath, maxDepth, currentDepth + 1);
                                                                                        if (found) return found;
                                                                                    }
                                                                                }
                                                                            }
                                                                            return null;
                                                                        };
                                                                        
                                                                        const foundBundleItems = findBundleItemsRecursively(bundleData);
                                                                        if (foundBundleItems) {
                                                                            return foundBundleItems;
                                                                        }
                                                                        
                                                                        // 7. Check productDetails array (alternative structure for bundles)
                                                                        if (bundleData.productDetails && Array.isArray(bundleData.productDetails) && bundleData.productDetails.length > 0) {
                                                                            console.log('Found items in bundleData.productDetails:', bundleData.productDetails);
                                                                            return bundleData.productDetails;
                                                                        }
                                                                        
                                                                        // 8. Comprehensive recursive search for any array with product-like objects
                                                                        const searchAllProperties = (obj, path = 'root', depth = 0) => {
                                                                            if (!obj || typeof obj !== 'object' || depth > 3) return null;
                                                                            
                                                                            for (const [key, value] of Object.entries(obj)) {
                                                                                const currentPath = `${path}.${key}`;
                                                                                
                                                                                // Look for any array that might contain bundle items
                                                                                if (Array.isArray(value) && value.length > 0) {
                                                                                    // Check if array contains objects that look like products
                                                                                    const firstItem = value[0];
                                                                                    if (typeof firstItem === 'object' && firstItem !== null) {
                                                                                        const hasProductProperties = (
                                                                                            firstItem.name || 
                                                                                            firstItem.title || 
                                                                                            firstItem.productId || 
                                                                                            firstItem._id ||
                                                                                            firstItem.price !== undefined ||
                                                                                            firstItem.quantity !== undefined
                                                                                        );
                                                                                        
                                                                                        if (hasProductProperties) {
                                                                                            console.log(`✅ Found potential bundle items in ${currentPath}:`, value);
                                                                                            return value;
                                                                                        }
                                                                                    }
                                                                                }
                                                                                
                                                                                // Recursively search nested objects
                                                                                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                                                                    const result = searchAllProperties(value, currentPath, depth + 1);
                                                                                    if (result) return result;
                                                                                }
                                                                            }
                                                                            return null;
                                                                        };
                                                                        
                                                                        // Try recursive search on the entire bundle object
                                                                        const recursiveResult = searchAllProperties(bundleData);
                                                                        if (recursiveResult) {
                                                                            return recursiveResult;
                                                                        }
                                                                        
                                                                        console.log('❌ No bundle items found in any expected location');
                                                                        console.log('=== COMPLETE BUNDLE DATA DUMP ===');
                                                                        console.log('Full bundle object:', JSON.stringify(bundleData, null, 2));
                                                                        
                                                                        // Additional detailed logging for debugging
                                                                        console.log('=== DETAILED BUNDLE ANALYSIS ===');
                                                                        console.log('bundleData keys:', Object.keys(bundleData));
                                                                        console.log('bundleData._id:', bundleData._id);
                                                                        console.log('bundleData.productId:', bundleData.productId);
                                                                        console.log('bundleData.name:', bundleData.name);
                                                                        console.log('bundleData.title:', bundleData.title);
                                                                        
                                                                        if (bundleData.bundleDetails) {
                                                                            console.log('bundleDetails exists - keys:', Object.keys(bundleData.bundleDetails));
                                                                            console.log('bundleDetails full object:', JSON.stringify(bundleData.bundleDetails, null, 2));
                                                                        } else {
                                                                            console.log('❌ bundleDetails is null/undefined');
                                                                        }
                                                                        
                                                                        if (bundleData.bundleId) {
                                                                            console.log('bundleId exists - type:', typeof bundleData.bundleId);
                                                                            if (typeof bundleData.bundleId === 'object') {
                                                                                console.log('bundleId keys:', Object.keys(bundleData.bundleId));
                                                                                console.log('bundleId full object:', JSON.stringify(bundleData.bundleId, null, 2));
                                                                            } else {
                                                                                console.log('bundleId value (string):', bundleData.bundleId);
                                                                            }
                                                                        } else {
                                                                            console.log('❌ bundleId is null/undefined');
                                                                        }
                                                                        
                                                                        if (bundleData.productDetails) {
                                                                            console.log('productDetails exists - length:', bundleData.productDetails.length);
                                                                            console.log('productDetails content:', bundleData.productDetails);
                                                                        } else {
                                                                            console.log('❌ productDetails is null/undefined');
                                                                        }
                                                                        
                                                                        console.log('=== END BUNDLE ITEMS DETECTION ===');
                                                                        
                                                                        return [];
                                                                    };
                                                                    
                                                                    const bundleItems = getBundleItems();
                                                                    
                                                                    if (bundleItems.length > 0) {
                                                                        return (
                                                                            <div className="mt-2">
                                                                                <p className="text-xs font-medium text-gray-600 mb-1">
                                                                                    Bundle includes ({bundleItems.length} items):
                                                                                </p>
                                                                                <div className="space-y-1">
                                                                                    {bundleItems.map((bundleItem, bundleIndex) => (
                                                                                        <div key={bundleIndex} className="text-xs text-gray-500 pl-2 border-l-2 border-gray-200">
                                                                                            • {bundleItem.name || bundleItem.title || 'Bundle Item'} 
                                                                                            (Qty: {bundleItem.quantity || 1}, Price: {formatCurrency(bundleItem.price || 0)})
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    } else {
                                                                        return (
                                                                            <div className="mt-2">
                                                                                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border">
                                                                                    ⚠️ Bundle items details not available
                                                                                </p>
                                                                                <details className="mt-1">
                                                                                    <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                                                                                    <div className="text-xs text-gray-400 mt-1 bg-gray-50 p-2 rounded border max-h-20 overflow-auto">
                                                                                        <p><strong>Bundle Keys:</strong> {Object.keys(item).join(', ')}</p>
                                                                                        <p><strong>Has bundleId:</strong> {item.bundleId ? 'Yes' : 'No'}</p>
                                                                                        <p><strong>Has bundleDetails:</strong> {item.bundleDetails ? 'Yes' : 'No'}</p>
                                                                                        <p><strong>Has items:</strong> {item.items ? 'Yes' : 'No'}</p>
                                                                                        <p><strong>bundleId type:</strong> {typeof item.bundleId}</p>
                                                                                        <p><strong>bundleDetails type:</strong> {typeof item.bundleDetails}</p>
                                                                                    </div>
                                                                                </details>
                                                                            </div>
                                                                        );
                                                                    }
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-900">
                                                        {item.size ? (
                                                            <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                                                                isCancelled ? 'bg-red-100 text-red-600' :
                                                                isReturned ? 'bg-purple-100 text-purple-600' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                                {item.size}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-3 text-center ${
                                                        isCancelled ? 'text-red-600 line-through' :
                                                        isReturned ? 'text-purple-600 line-through' :
                                                        'text-gray-900'
                                                    }`}>
                                                        {item.quantity}
                                                    </td>
                                                    {/* Original Price Column */}
                                                    <td className="px-4 py-3 text-center">
                                                        <div className={`${
                                                            isCancelled ? 'text-red-600' :
                                                            isReturned ? 'text-purple-600' :
                                                            'text-gray-900'
                                                        }`}>
                                                            {pricingDetails.hasDiscount ? (
                                                                <span className="line-through text-gray-500 text-sm">
                                                                    {formatCurrency(pricingDetails.originalPrice)}
                                                                </span>
                                                            ) : (
                                                                <span className={isCancelled || isReturned ? 'line-through' : ''}>
                                                                    {formatCurrency(pricingDetails.originalPrice)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Discount Column */}
                                                    <td className="px-4 py-3 text-center">
                                                        {(() => {
                                                            // Enhanced discount detection logic
                                                            console.log('🔍 Discount Column Debug:', {
                                                                itemName: getProductName(),
                                                                pricingDetails,
                                                                hasDiscount: pricingDetails.hasDiscount,
                                                                discountAmount: pricingDetails.discountAmount,
                                                                discountPercentage: pricingDetails.discountPercentage,
                                                                originalPrice: pricingDetails.originalPrice,
                                                                finalPrice: pricingDetails.finalPrice,
                                                                itemTotal: item.itemTotal,
                                                                subTotalAmt: payment.subTotalAmt,
                                                                calculatedTotal: pricingDetails.finalPrice * (item.quantity || 1)
                                                            });
                                                            
                                                            // Check multiple discount indicators
                                                            const hasProductDiscount = pricingDetails.hasDiscount;
                                                            const hasAmountDiscount = pricingDetails.discountAmount > 0;
                                                            const hasPercentageDiscount = pricingDetails.discountPercentage > 0;
                                                            const hasPriceDifference = pricingDetails.originalPrice > pricingDetails.finalPrice;
                                                            
                                                            // Additional check: Compare calculated vs actual totals
                                                            const calculatedItemTotal = pricingDetails.originalPrice * (item.quantity || 1);
                                                            const actualItemTotal = item.itemTotal || (pricingDetails.finalPrice * (item.quantity || 1));
                                                            const hasItemTotalDiscount = Math.abs(calculatedItemTotal - actualItemTotal) > 0.01;
                                                            
                                                            // Check if subtotal indicates discount
                                                            const expectedSubtotal = pricingDetails.originalPrice * (item.quantity || 1);
                                                            const actualSubtotal = payment.subTotalAmt || 0;
                                                            const hasSubtotalDiscount = Math.abs(expectedSubtotal - actualSubtotal) > 0.01 && actualSubtotal < expectedSubtotal;
                                                            
                                                            const hasAnyDiscount = hasProductDiscount || hasAmountDiscount || hasPercentageDiscount || 
                                                                                 hasPriceDifference || hasItemTotalDiscount || hasSubtotalDiscount;
                                                            
                                                            console.log('🔍 Discount Detection Summary:', {
                                                                hasProductDiscount,
                                                                hasAmountDiscount,
                                                                hasPercentageDiscount,
                                                                hasPriceDifference,
                                                                hasItemTotalDiscount,
                                                                hasSubtotalDiscount,
                                                                hasAnyDiscount,
                                                                calculatedItemTotal,
                                                                actualItemTotal,
                                                                expectedSubtotal,
                                                                actualSubtotal
                                                            });
                                                            
                                                            if (hasAnyDiscount) {
                                                                // Calculate effective discount
                                                                let effectiveDiscountAmount = pricingDetails.discountAmount;
                                                                let effectiveDiscountPercentage = pricingDetails.discountPercentage;
                                                                
                                                                // If pricing details don't show discount but we detected one, calculate it
                                                                if (!hasProductDiscount && (hasItemTotalDiscount || hasSubtotalDiscount)) {
                                                                    effectiveDiscountAmount = Math.max(
                                                                        calculatedItemTotal - actualItemTotal,
                                                                        expectedSubtotal - actualSubtotal
                                                                    );
                                                                    effectiveDiscountPercentage = pricingDetails.originalPrice > 0 ? 
                                                                        Math.round((effectiveDiscountAmount / (pricingDetails.originalPrice * (item.quantity || 1))) * 100) : 0;
                                                                }
                                                                
                                                                return (
                                                                    <div className="space-y-1">
                                                                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                            -{effectiveDiscountPercentage}%
                                                                        </div>
                                                                        <div className="text-xs text-green-600 font-medium">
                                                                            -{formatCurrency(effectiveDiscountAmount)}
                                                                        </div>
                                                                        {hasSubtotalDiscount && !hasProductDiscount && (
                                                                            <div className="text-xs text-blue-600 italic">
                                                                                Applied
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <span className="text-gray-400 text-xs">No Discount</span>
                                                                );
                                                            }
                                                        })()}
                                                    </td>
                                                    {/* Final Price Column */}
                                                    <td className={`px-4 py-3 text-right ${
                                                        isCancelled ? 'text-red-600 line-through' :
                                                        isReturned ? 'text-purple-600 line-through' :
                                                        'text-gray-900'
                                                    }`}>
                                                        {(() => {
                                                            // Calculate the actual final price considering detected discounts
                                                            const hasProductDiscount = pricingDetails.hasDiscount;
                                                            const hasAmountDiscount = pricingDetails.discountAmount > 0;
                                                            const hasPercentageDiscount = pricingDetails.discountPercentage > 0;
                                                            const hasPriceDifference = pricingDetails.originalPrice > pricingDetails.finalPrice;
                                                            
                                                            // Additional check: Compare calculated vs actual totals
                                                            const calculatedItemTotal = pricingDetails.originalPrice * (item.quantity || 1);
                                                            const actualItemTotal = item.itemTotal || (pricingDetails.finalPrice * (item.quantity || 1));
                                                            const hasItemTotalDiscount = Math.abs(calculatedItemTotal - actualItemTotal) > 0.01;
                                                            
                                                            // Check if subtotal indicates discount
                                                            const expectedSubtotal = pricingDetails.originalPrice * (item.quantity || 1);
                                                            const actualSubtotal = payment.subTotalAmt || 0;
                                                            const hasSubtotalDiscount = Math.abs(expectedSubtotal - actualSubtotal) > 0.01 && actualSubtotal < expectedSubtotal;
                                                            
                                                            const hasAnyDiscount = hasProductDiscount || hasAmountDiscount || hasPercentageDiscount || 
                                                                                 hasPriceDifference || hasItemTotalDiscount || hasSubtotalDiscount;
                                                            
                                                            let displayFinalPrice = pricingDetails.finalPrice;
                                                            let effectiveDiscountAmount = pricingDetails.discountAmount;
                                                            
                                                            // If we detected discount but pricing details don't show it, calculate the actual final price
                                                            if (hasAnyDiscount && (!hasProductDiscount || pricingDetails.finalPrice >= pricingDetails.originalPrice)) {
                                                                if (hasSubtotalDiscount) {
                                                                    // Use subtotal to determine actual unit price
                                                                    displayFinalPrice = actualSubtotal / (item.quantity || 1);
                                                                    effectiveDiscountAmount = pricingDetails.originalPrice - displayFinalPrice;
                                                                } else if (hasItemTotalDiscount) {
                                                                    // Use item total to determine actual unit price
                                                                    displayFinalPrice = actualItemTotal / (item.quantity || 1);
                                                                    effectiveDiscountAmount = pricingDetails.originalPrice - displayFinalPrice;
                                                                }
                                                            }
                                                            
                                                            console.log('🔍 Final Price Calculation:', {
                                                                itemName: getProductName(),
                                                                originalFinalPrice: pricingDetails.finalPrice,
                                                                calculatedFinalPrice: displayFinalPrice,
                                                                hasAnyDiscount,
                                                                effectiveDiscountAmount,
                                                                actualSubtotal,
                                                                expectedSubtotal,
                                                                quantity: item.quantity || 1
                                                            });
                                                            
                                                            return (
                                                                <div className="space-y-1">
                                                                    <div className="font-medium">
                                                                        {formatCurrency(displayFinalPrice)}
                                                                    </div>
                                                                    {hasAnyDiscount && (
                                                                        <div className="text-xs text-green-600 font-medium">
                                                                            After Discount
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    {/* Total Column */}
                                                    {/* Total Column */}
                                                    <td className={`px-4 py-3 text-right font-medium ${
                                                        isCancelled ? 'text-red-600 line-through' :
                                                        isReturned ? 'text-purple-600 line-through' :
                                                        'text-gray-900'
                                                    }`}>
                                                        {(() => {
                                                            // Calculate the actual total considering detected discounts
                                                            const hasProductDiscount = pricingDetails.hasDiscount;
                                                            const hasAmountDiscount = pricingDetails.discountAmount > 0;
                                                            const hasPercentageDiscount = pricingDetails.discountPercentage > 0;
                                                            const hasPriceDifference = pricingDetails.originalPrice > pricingDetails.finalPrice;
                                                            
                                                            // Additional check: Compare calculated vs actual totals
                                                            const calculatedItemTotal = pricingDetails.originalPrice * (item.quantity || 1);
                                                            const actualItemTotal = item.itemTotal || (pricingDetails.finalPrice * (item.quantity || 1));
                                                            const hasItemTotalDiscount = Math.abs(calculatedItemTotal - actualItemTotal) > 0.01;
                                                            
                                                            // Check if subtotal indicates discount
                                                            const expectedSubtotal = pricingDetails.originalPrice * (item.quantity || 1);
                                                            const actualSubtotal = payment.subTotalAmt || 0;
                                                            const hasSubtotalDiscount = Math.abs(expectedSubtotal - actualSubtotal) > 0.01 && actualSubtotal < expectedSubtotal;
                                                            
                                                            const hasAnyDiscount = hasProductDiscount || hasAmountDiscount || hasPercentageDiscount || 
                                                                                 hasPriceDifference || hasItemTotalDiscount || hasSubtotalDiscount;
                                                            
                                                            let displayFinalPrice = pricingDetails.finalPrice;
                                                            let displayTotal = pricingDetails.finalPrice * (item.quantity || 1);
                                                            
                                                            // If we detected discount but pricing details don't show it, calculate the actual totals
                                                            if (hasAnyDiscount && (!hasProductDiscount || pricingDetails.finalPrice >= pricingDetails.originalPrice)) {
                                                                if (hasSubtotalDiscount) {
                                                                    // Use subtotal as the actual total
                                                                    displayTotal = actualSubtotal;
                                                                    displayFinalPrice = actualSubtotal / (item.quantity || 1);
                                                                } else if (hasItemTotalDiscount) {
                                                                    // Use item total as the actual total
                                                                    displayTotal = actualItemTotal;
                                                                    displayFinalPrice = actualItemTotal / (item.quantity || 1);
                                                                }
                                                            }
                                                            
                                                            const originalTotal = pricingDetails.originalPrice * (item.quantity || 1);
                                                            
                                                            console.log('🔍 Total Column Calculation:', {
                                                                itemName: getProductName(),
                                                                originalTotal,
                                                                displayTotal,
                                                                hasAnyDiscount,
                                                                actualSubtotal,
                                                                expectedSubtotal
                                                            });
                                                            
                                                            return (
                                                                <div className="space-y-1">
                                                                    <div className="font-bold">
                                                                        {formatCurrency(displayTotal)}
                                                                    </div>
                                                                    {hasAnyDiscount && originalTotal > displayTotal && (
                                                                        <div className="text-xs text-gray-500">
                                                                            <span className="line-through">
                                                                                {formatCurrency(originalTotal)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {hasAnyDiscount && (
                                                                        <div className="text-xs text-green-600 font-medium">
                                                                            Saved: {formatCurrency(originalTotal - displayTotal)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${itemStatusInfo.colorClass}`}>
                                                            <span className="mr-1">{itemStatusInfo.icon}</span>
                                                            {itemStatusInfo.text}
                                                        </span>
                                                        {/* Additional status details */}
                                                        {(isCancelled || isReturned) && (
                                                            <div className="mt-1">
                                                                {item.cancelDate && (
                                                                    <p className="text-xs text-red-500">
                                                                        Cancelled: {new Date(item.cancelDate).toLocaleDateString('en-IN')}
                                                                    </p>
                                                                )}
                                                                {item.returnDate && (
                                                                    <p className="text-xs text-purple-500">
                                                                        Returned: {new Date(item.returnDate).toLocaleDateString('en-IN')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        // Fallback for legacy order structure
                                        (() => {
                                            // Get legacy order status
                                            const getLegacyOrderStatus = () => {
                                                const orderStatus = payment.orderStatus || 'Active';
                                                const paymentStatus = payment.paymentStatus || '';
                                                
                                                if (orderStatus === 'CANCELLED' || paymentStatus.includes('REFUND')) {
                                                    return {
                                                        text: 'CANCELLED',
                                                        colorClass: 'bg-red-100 text-red-800 border border-red-200',
                                                        icon: '❌',
                                                        isCancelled: true
                                                    };
                                                } else if (orderStatus === 'RETURNED') {
                                                    return {
                                                        text: 'RETURNED',
                                                        colorClass: 'bg-purple-100 text-purple-800 border border-purple-200',
                                                        icon: '↩️',
                                                        isReturned: true
                                                    };
                                                } else {
                                                    return {
                                                        text: 'ACTIVE',
                                                        colorClass: 'bg-green-100 text-green-800 border border-green-200',
                                                        icon: '✅',
                                                        isCancelled: false,
                                                        isReturned: false
                                                    };
                                                }
                                            };
                                            
                                            const legacyStatusInfo = getLegacyOrderStatus();
                                            const isCancelled = legacyStatusInfo.isCancelled;
                                            const isReturned = legacyStatusInfo.isReturned;
                                            
                                            // Calculate legacy pricing details
                                            const legacyItem = {
                                                size: payment.size || payment.productDetails?.size,
                                                quantity: payment.orderQuantity || payment.totalQuantity || 1,
                                                itemTotal: payment.subTotalAmt,
                                                sizeAdjustedPrice: payment.sizeAdjustedPrice,
                                                originalPrice: payment.productDetails?.originalPrice || payment.productDetails?.price
                                            };
                                            const legacyPricingDetails = getPricingDetails(legacyItem, payment.productDetails);
                                            
                                            return (
                                                <tr className={`border-b border-gray-200 ${
                                                    isCancelled ? 'bg-red-50 opacity-75' : 
                                                    isReturned ? 'bg-purple-50 opacity-75' : 
                                                    'bg-white'
                                                }`}>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className={`font-medium ${
                                                                isCancelled ? 'text-red-600 line-through' : 
                                                                isReturned ? 'text-purple-600 line-through' : 
                                                                'text-gray-900'
                                                            }`}>
                                                                {payment.productDetails?.name || payment.productDetails?.title || 'Product Item'}
                                                            </p>
                                                            <p className={`text-sm ${
                                                                isCancelled || isReturned ? 'text-gray-400' : 'text-gray-500'
                                                            }`}>Product</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-900">
                                                        {payment.size || payment.productDetails?.size ? (
                                                            <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                                                                isCancelled ? 'bg-red-100 text-red-600' :
                                                                isReturned ? 'bg-purple-100 text-purple-600' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                                {payment.size || payment.productDetails?.size}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-3 text-center ${
                                                        isCancelled ? 'text-red-600 line-through' :
                                                        isReturned ? 'text-purple-600 line-through' :
                                                        'text-gray-900'
                                                    }`}>
                                                        {payment.orderQuantity || payment.totalQuantity || 1}
                                                    </td>
                                                    {/* Legacy Original Price Column */}
                                                    <td className="px-4 py-3 text-center">
                                                        <div className={`${
                                                            isCancelled ? 'text-red-600' :
                                                            isReturned ? 'text-purple-600' :
                                                            'text-gray-900'
                                                        }`}>
                                                            {legacyPricingDetails.hasDiscount ? (
                                                                <span className="line-through text-gray-500 text-sm">
                                                                    {formatCurrency(legacyPricingDetails.originalPrice)}
                                                                </span>
                                                            ) : (
                                                                <span className={isCancelled || isReturned ? 'line-through' : ''}>
                                                                    {formatCurrency(legacyPricingDetails.originalPrice)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Legacy Discount Column */}
                                                    <td className="px-4 py-3 text-center">
                                                        {(() => {
                                                            // Enhanced legacy discount detection
                                                            console.log('🔍 Legacy Discount Column Debug:', {
                                                                legacyPricingDetails,
                                                                hasDiscount: legacyPricingDetails.hasDiscount,
                                                                discountAmount: legacyPricingDetails.discountAmount,
                                                                discountPercentage: legacyPricingDetails.discountPercentage,
                                                                originalPrice: legacyPricingDetails.originalPrice,
                                                                finalPrice: legacyPricingDetails.finalPrice,
                                                                subTotalAmt: payment.subTotalAmt,
                                                                orderQuantity: payment.orderQuantity || payment.totalQuantity || 1
                                                            });
                                                            
                                                            // Check multiple discount indicators for legacy orders
                                                            const hasProductDiscount = legacyPricingDetails.hasDiscount;
                                                            const hasAmountDiscount = legacyPricingDetails.discountAmount > 0;
                                                            const hasPercentageDiscount = legacyPricingDetails.discountPercentage > 0;
                                                            const hasPriceDifference = legacyPricingDetails.originalPrice > legacyPricingDetails.finalPrice;
                                                            
                                                            // Legacy-specific checks
                                                            const quantity = payment.orderQuantity || payment.totalQuantity || 1;
                                                            const expectedTotal = legacyPricingDetails.originalPrice * quantity;
                                                            const actualSubtotal = payment.subTotalAmt || 0;
                                                            const hasSubtotalDiscount = Math.abs(expectedTotal - actualSubtotal) > 0.01 && actualSubtotal < expectedTotal;
                                                            
                                                            const hasAnyDiscount = hasProductDiscount || hasAmountDiscount || hasPercentageDiscount || 
                                                                                 hasPriceDifference || hasSubtotalDiscount;
                                                            
                                                            console.log('🔍 Legacy Discount Detection Summary:', {
                                                                hasProductDiscount,
                                                                hasAmountDiscount,
                                                                hasPercentageDiscount,
                                                                hasPriceDifference,
                                                                hasSubtotalDiscount,
                                                                hasAnyDiscount,
                                                                expectedTotal,
                                                                actualSubtotal,
                                                                quantity
                                                            });
                                                            
                                                            if (hasAnyDiscount) {
                                                                // Calculate effective discount for legacy orders
                                                                let effectiveDiscountAmount = legacyPricingDetails.discountAmount;
                                                                let effectiveDiscountPercentage = legacyPricingDetails.discountPercentage;
                                                                
                                                                // If pricing details don't show discount but we detected one, calculate it
                                                                if (!hasProductDiscount && hasSubtotalDiscount) {
                                                                    effectiveDiscountAmount = expectedTotal - actualSubtotal;
                                                                    effectiveDiscountPercentage = expectedTotal > 0 ? 
                                                                        Math.round((effectiveDiscountAmount / expectedTotal) * 100) : 0;
                                                                }
                                                                
                                                                return (
                                                                    <div className="space-y-1">
                                                                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                            -{effectiveDiscountPercentage}%
                                                                        </div>
                                                                        <div className="text-xs text-green-600 font-medium">
                                                                            -{formatCurrency(effectiveDiscountAmount)}
                                                                        </div>
                                                                        {hasSubtotalDiscount && !hasProductDiscount && (
                                                                            <div className="text-xs text-blue-600 italic">
                                                                                Applied
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <span className="text-gray-400 text-xs">No Discount</span>
                                                                );
                                                            }
                                                        })()}
                                                    </td>
                                                    {/* Legacy Final Price Column */}
                                                    <td className={`px-4 py-3 text-right ${
                                                        isCancelled ? 'text-red-600 line-through' :
                                                        isReturned ? 'text-purple-600 line-through' :
                                                        'text-gray-900'
                                                    }`}>
                                                        {(() => {
                                                            // Calculate legacy final price considering detected discounts
                                                            const hasProductDiscount = legacyPricingDetails.hasDiscount;
                                                            const hasAmountDiscount = legacyPricingDetails.discountAmount > 0;
                                                            const hasPercentageDiscount = legacyPricingDetails.discountPercentage > 0;
                                                            const hasPriceDifference = legacyPricingDetails.originalPrice > legacyPricingDetails.finalPrice;
                                                            
                                                            // Legacy-specific checks
                                                            const quantity = payment.orderQuantity || payment.totalQuantity || 1;
                                                            const expectedTotal = legacyPricingDetails.originalPrice * quantity;
                                                            const actualSubtotal = payment.subTotalAmt || 0;
                                                            const hasSubtotalDiscount = Math.abs(expectedTotal - actualSubtotal) > 0.01 && actualSubtotal < expectedTotal;
                                                            
                                                            const hasAnyDiscount = hasProductDiscount || hasAmountDiscount || hasPercentageDiscount || 
                                                                                 hasPriceDifference || hasSubtotalDiscount;
                                                            
                                                            let displayFinalPrice = legacyPricingDetails.finalPrice;
                                                            
                                                            // If we detected discount but pricing details don't show it, calculate the actual final price
                                                            if (hasAnyDiscount && (!hasProductDiscount || legacyPricingDetails.finalPrice >= legacyPricingDetails.originalPrice)) {
                                                                if (hasSubtotalDiscount) {
                                                                    // Use subtotal to determine actual unit price
                                                                    displayFinalPrice = actualSubtotal / quantity;
                                                                }
                                                            }
                                                            
                                                            console.log('🔍 Legacy Final Price Calculation:', {
                                                                originalFinalPrice: legacyPricingDetails.finalPrice,
                                                                calculatedFinalPrice: displayFinalPrice,
                                                                hasAnyDiscount,
                                                                actualSubtotal,
                                                                expectedTotal,
                                                                quantity
                                                            });
                                                            
                                                            return (
                                                                <div className="space-y-1">
                                                                    <div className="font-medium">
                                                                        {formatCurrency(displayFinalPrice)}
                                                                    </div>
                                                                    {hasAnyDiscount && (
                                                                        <div className="text-xs text-green-600 font-medium">
                                                                            After Discount
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    {/* Legacy Total Column */}
                                                            
                                                    {/* Legacy Total Column */}
                                                    <td className={`px-4 py-3 text-right font-medium ${
                                                        isCancelled ? 'text-red-600 line-through' :
                                                        isReturned ? 'text-purple-600 line-through' :
                                                        'text-gray-900'
                                                    }`}>
                                                        <div className="space-y-1">
                                                            <div className="font-bold">
                                                                {formatCurrency(legacyPricingDetails.finalPrice * (legacyItem.quantity || 1))}
                                                            </div>
                                                            {legacyPricingDetails.hasDiscount && (
                                                                <div className="text-xs text-gray-500">
                                                                    <span className="line-through">
                                                                        {formatCurrency(legacyPricingDetails.originalPrice * (legacyItem.quantity || 1))}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {legacyPricingDetails.hasDiscount && (
                                                                <div className="text-xs text-green-600 font-medium">
                                                                    Saved: {formatCurrency(legacyPricingDetails.discountAmount * (legacyItem.quantity || 1))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${legacyStatusInfo.colorClass}`}>
                                                            <span className="mr-1">{legacyStatusInfo.icon}</span>
                                                            {legacyStatusInfo.text}
                                                        </span>
                                                        {/* Additional status details for legacy orders */}
                                                        {(isCancelled || isReturned) && (
                                                            <div className="mt-1">
                                                                {payment.refundDetails?.refundDate && (
                                                                    <p className="text-xs text-red-500">
                                                                        Refunded: {new Date(payment.refundDetails.refundDate).toLocaleDateString('en-IN')}
                                                                    </p>
                                                                )}
                                                                {payment.returnDetails?.returnDate && (
                                                                    <p className="text-xs text-purple-500">
                                                                        Returned: {new Date(payment.returnDetails.returnDate).toLocaleDateString('en-IN')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })()
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-md">
                            <div className="bg-gray-50 p-6 rounded-lg border">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                                <div className="space-y-3">
                                    {(() => {
                                        const discountSummary = calculateTotalDiscountSavings();
                                        return (
                                            <>
                                                {/* Show original pricing if there are discounts */}
                                                {discountSummary.hasSavings && (
                                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                                        <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                                                            🎉 You Saved Money!
                                                        </h4>
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex justify-between">
                                                                <span className="text-green-700">Original Amount:</span>
                                                                <span className="text-green-700 line-through">
                                                                    {formatCurrency(discountSummary.totalOriginalAmount)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-700">After Discount:</span>
                                                                <span className="text-green-700 font-medium">
                                                                    {formatCurrency(discountSummary.totalFinalAmount)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between border-t border-green-200 pt-1">
                                                                <span className="text-green-800 font-medium">Total Savings ({discountSummary.savingsPercentage}%):</span>
                                                                <span className="text-green-800 font-bold">
                                                                    {formatCurrency(discountSummary.totalSavings)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="text-gray-900">{formatCurrency(payment.subTotalAmt)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Delivery Charges:</span>
                                        <span className="text-gray-900">
                                            {formatCurrency(payment.deliveryCharge || (payment.totalAmt || 0) - (payment.subTotalAmt || 0))}
                                        </span>
                                    </div>
                                    {payment.taxAmount && payment.taxAmount > 0 ? (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tax (GST):</span>
                                            <span className="text-gray-900">{formatCurrency(payment.taxAmount)}</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tax (GST):</span>
                                            <span className="text-gray-900">Included</span>
                                        </div>
                                    )}
                                    {payment.discountAmount && payment.discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount Applied:</span>
                                            <span>-{formatCurrency(payment.discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span className="text-gray-900">Total Amount:</span>
                                            <span className="text-gray-900">{formatCurrency(payment.totalAmt)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Payment Method and Transaction Details */}
                                    <div className="mt-4 pt-3 border-t">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Method:</span>
                                                <span className="text-gray-900 font-medium">{payment.paymentMethod || 'Cash on Delivery'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Status:</span>
                                                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                                                    payment.paymentStatus?.toLowerCase() === 'paid' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : payment.paymentStatus?.includes('REFUND')
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {payment.paymentStatus}
                                                </span>
                                            </div>
                                            {payment.paymentId && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Transaction ID:</span>
                                                    <span className="text-gray-900 font-mono text-xs">{payment.paymentId}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Order Date:</span>
                                                <span className="text-gray-900">{new Date(payment.orderDate).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            {payment.estimatedDeliveryDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Expected Delivery:</span>
                                                    <span className="text-gray-900">{new Date(payment.estimatedDeliveryDate).toLocaleDateString('en-IN')}</span>
                                                </div>
                                            )}
                                            {payment.actualDeliveryDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Delivered On:</span>
                                                    <span className="text-green-600 font-medium">{new Date(payment.actualDeliveryDate).toLocaleDateString('en-IN')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="text-center text-sm text-gray-600">
                            <p className="mb-2"><strong>Thank you for shopping with casualclothings!</strong></p>
                            <p>For any queries, contact us at casualclothing787@gmail.com or call +91 9442955929</p>
                            <p className="mt-2">This is a computer generated invoice and does not require signature.</p>
                        </div>
                    </div>
                </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Print Invoice
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                        Download PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InvoiceModal
