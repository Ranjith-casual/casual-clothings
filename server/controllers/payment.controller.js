import mongoose from "mongoose";
import orderModel from "../models/order.model.js";
import UserModel from "../models/users.model.js";
import orderCancellationModel from "../models/orderCancellation.model.js";
import sendEmail from "../config/sendEmail.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 15, search, status, method, dateFilter } = req.body;
        
        // Build query filters
        let query = {};
        
        // Search filter
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { paymentId: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Status filter
        if (status) {
            query.paymentStatus = { $regex: status, $options: 'i' };
        }
        
        // Payment method filter
        if (method) {
            query.paymentMethod = { $regex: method, $options: 'i' };
        }
        
        // Date filter
        if (dateFilter) {
            const now = new Date();
            let startDate;
            
            switch (dateFilter) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    const quarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), quarter * 3, 1);
                    break;
                default:
                    startDate = null;
            }
            
            if (startDate) {
                query.orderDate = { $gte: startDate };
            }
        }
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get payments with user details and order items
        const payments = await orderModel.find(query)
            .populate('userId', 'name email')
            .populate('deliveryAddress')
            .populate("items.productId", "name image price stock discount discountedPrice") // Add discount fields for products
            .populate("items.bundleId", "title image images bundlePrice originalPrice stock") // Include originalPrice for bundles
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // For refunded orders, get cancellation request details
        const formattedPayments = await Promise.all(payments.map(async payment => {
            const paymentObj = payment.toObject();
            
            // Add customer name
            paymentObj.customerName = payment.userId?.name || 'Unknown Customer';
            
            // Add delivery status information
            paymentObj.deliveryStatus = {
                estimatedDeliveryDate: payment.estimatedDeliveryDate,
                actualDeliveryDate: payment.actualDeliveryDate,
                deliveryNotes: payment.deliveryNotes,
                isDeliveryOverdue: payment.estimatedDeliveryDate && 
                    new Date() > new Date(payment.estimatedDeliveryDate) && 
                    !payment.actualDeliveryDate,
                daysSinceOrder: Math.floor((new Date() - new Date(payment.orderDate)) / (1000 * 60 * 60 * 24)),
                daysUntilDelivery: payment.estimatedDeliveryDate ? 
                    Math.floor((new Date(payment.estimatedDeliveryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
            };
            
            // If order is refunded, get more details from cancellation request
            if (payment.paymentStatus?.includes('REFUND') || payment.paymentStatus === 'REFUND_SUCCESSFUL') {
                // Initialize refundDetails if it doesn't exist
                if (!paymentObj.refundDetails) {
                    paymentObj.refundDetails = {};
                }
                
                try {
                    // Find the cancellation request for this order
                    const cancellationRequest = await orderCancellationModel.findOne({ 
                        orderId: payment._id,
                        'refundDetails.refundStatus': 'COMPLETED'
                    });
                    
                    if (cancellationRequest) {
                        // Use the refund details from the order if available, otherwise calculate from cancellation request
                        let refundPercentage = paymentObj.refundDetails?.refundPercentage;
                        let refundAmount = paymentObj.refundDetails?.refundAmount;
                        let retainedAmount = paymentObj.refundDetails?.retainedAmount;
                        
                        if (!refundPercentage || !refundAmount || !retainedAmount) {
                            // Fallback to admin response or calculate based on order timing
                            const orderDate = cancellationRequest.orderId?.orderDate || 
                                             cancellationRequest.orderId?.createdAt || 
                                             payment.createdAt;
                            if (orderDate) {
                                const hoursSinceOrder = (new Date() - new Date(orderDate)) / (1000 * 60 * 60);
                                refundPercentage = hoursSinceOrder <= 24 ? 90 : 75;
                            } else {
                                refundPercentage = cancellationRequest.adminResponse?.refundPercentage || 75;
                            }
                            refundAmount = (payment.totalAmt || 0) * (refundPercentage / 100);
                            retainedAmount = (payment.totalAmt || 0) - refundAmount;
                        }
                        
                        // Add request dates and admin details to the payment object
                        paymentObj.refundDetails = {
                            ...paymentObj.refundDetails,
                            requestDate: cancellationRequest.requestDate,
                            approvalDate: cancellationRequest.adminResponse?.processedDate,
                            reason: cancellationRequest.reason,
                            adminComments: cancellationRequest.adminResponse?.adminComments,
                            processedBy: cancellationRequest.adminResponse?.processedBy,
                            refundPercentage: refundPercentage,
                            refundAmount: refundAmount,
                            retainedAmount: retainedAmount
                        };
                    }
                } catch (err) {
                    console.error("Error fetching cancellation details:", err);
                }
            }
            
            return paymentObj;
        }));
        
        // Get total count for pagination
        const totalPayments = await orderModel.countDocuments(query);
        const totalPages = Math.ceil(totalPayments / limit);
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Payments retrieved successfully",
            data: {
                payments: formattedPayments,
                currentPage: parseInt(page),
                totalPages,
                totalPayments,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
        
    } catch (error) {
        console.error("Error in getAllPayments:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving payments",
            details: error.message
        });
    }
};

export const getPaymentStats = async (req, res) => {
    try {
        // Get current date for filtering
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // Aggregate payment statistics
        const stats = await orderModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmt" },
                    totalPayments: { $sum: 1 },
                    successfulPayments: {
                        $sum: {
                            $cond: [
                                { $or: [
                                    { $eq: ["$paymentStatus", "PAID"] },
                                    { $eq: ["$orderStatus", "DELIVERED"] }
                                ]},
                                1,
                                0
                            ]
                        }
                    },
                    failedPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentStatus", "FAILED"] },
                                1,
                                0
                            ]
                        }
                    },
                    codOrders: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentMethod", "Cash on Delivery"] },
                                1,
                                0
                            ]
                        }
                    },
                    onlinePayments: {
                        $sum: {
                            $cond: [
                                { $ne: ["$paymentMethod", "Cash on Delivery"] },
                                1,
                                0
                            ]
                        }
                    },
                    refundedAmount: {
                        $sum: {
                            $cond: [
                                { $or: [
                                    { $eq: ["$paymentStatus", "REFUNDED"] },
                                    { $eq: ["$paymentStatus", "REFUND_SUCCESSFUL"] },
                                    { $eq: ["$orderStatus", "CANCELLED"] }
                                ]},
                                { 
                                    $cond: [
                                        { $gt: [{ $ifNull: ["$cancellationData.refundDetails.actualRefundAmount", 0] }, 0] },
                                        "$cancellationData.refundDetails.actualRefundAmount",
                                        { 
                                            $cond: [
                                                { $gt: [{ $ifNull: ["$cancellationData.refundDetails.refundAmount", 0] }, 0] },
                                                "$cancellationData.refundDetails.refundAmount",
                                                { $ifNull: ["$refundDetails.refundAmount", 0] }
                                            ]
                                        }
                                    ]
                                },
                                0
                            ]
                        }
                    },
                    retainedAmount: {
                        $sum: {
                            $cond: [
                                { $or: [
                                    { $eq: ["$paymentStatus", "REFUND_SUCCESSFUL"] },
                                    { $eq: ["$orderStatus", "CANCELLED"] }
                                ]},
                                { 
                                    $cond: [
                                        { $gt: [{ $ifNull: ["$cancellationData.refundDetails.retentionFee", 0] }, 0] },
                                        "$cancellationData.refundDetails.retentionFee",
                                        { $ifNull: ["$refundDetails.retainedAmount", 0] }
                                    ]
                                },
                                0
                            ]
                        }
                    },
                    pendingPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentStatus", "PENDING"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        
        const result = stats[0] || {
            totalRevenue: 0,
            totalPayments: 0,
            successfulPayments: 0,
            failedPayments: 0,
            codOrders: 0,
            onlinePayments: 0,
            refundedAmount: 0,
            pendingPayments: 0,
            retainedAmount: 0
        };

        // Calculate net revenue (gross revenue minus refunded amounts)
        // Recalculate more accurate statistics
        // Get more detailed refund and retention data from cancelled orders
        const cancelledOrdersData = await orderModel.find({ orderStatus: 'CANCELLED' })
            .select('totalAmt cancellationData refundDetails');
        
        // Get any additional refund data from orderCancellations
        const allRefunds = await orderCancellationModel.find({
            $or: [
                { 'refundDetails.refundStatus': 'COMPLETED' },
                { 'adminResponse.status': 'APPROVED' },
                { 'status': 'APPROVED' }
            ]
        }).populate('orderId', 'totalAmt');
        
        let accurateRefundedAmount = 0;
        
        // Calculate from cancelled orders with refund details
        cancelledOrdersData.forEach(order => {
            if (order.cancellationData && order.cancellationData.refundDetails) {
                if (order.cancellationData.refundDetails.actualRefundAmount) {
                    accurateRefundedAmount += Number(order.cancellationData.refundDetails.actualRefundAmount);
                } else if (order.cancellationData.refundDetails.refundAmount) {
                    accurateRefundedAmount += Number(order.cancellationData.refundDetails.refundAmount);
                }
            } else if (order.refundDetails && order.refundDetails.refundAmount) {
                accurateRefundedAmount += Number(order.refundDetails.refundAmount);
            }
        });
        
        // Add from orderCancellations model if not already counted
        allRefunds.forEach(refund => {
            if (refund.adminResponse && refund.adminResponse.refundAmount) {
                // Check if the order was already counted to avoid double counting
                const alreadyCounted = cancelledOrdersData.some(
                    order => order._id.toString() === refund.orderId?._id?.toString()
                );
                
                if (!alreadyCounted) {
                    accurateRefundedAmount += Number(refund.adminResponse.refundAmount);
                }
            }
        });
        
        // Get gross revenue (total orders placed)
        const grossRevenue = result.totalRevenue; 
        
        // Calculate retained amount (from partial refunds)
        const retainedAmount = await calculateRetainedAmount();
        
        // Use the more accurate refunded amount if available
        const refundedAmount = accurateRefundedAmount > 0 ? accurateRefundedAmount : result.refundedAmount;
        
        // Calculate net revenue (gross minus refunds plus retention)
        const netRevenue = grossRevenue - refundedAmount + retainedAmount;
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Payment statistics retrieved successfully",
            data: {
                ...result,
                netRevenue: netRevenue, // Net revenue = Gross Revenue - Refunded Amount + Retained Amount
                grossRevenue: grossRevenue, // Original total revenue before refunds
                totalRevenue: netRevenue, // Update totalRevenue to be net revenue
                refundedAmount: refundedAmount, // More accurate refunded amount
                retainedAmount: retainedAmount // More accurate amount retained from partial refunds
            }
        });
        
    } catch (error) {
        console.error("Error in getPaymentStats:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving payment statistics",
            details: error.message
        });
    }
};

// Helper function to calculate retained amount from partial refunds
const calculateRetainedAmount = async () => {
    try {
        // Get all completed refunds
        const completedRefunds = await orderCancellationModel.find({
            $or: [
                { 'refundDetails.refundStatus': 'COMPLETED' },
                { 'adminResponse.status': 'APPROVED' },
                { 'status': 'APPROVED' }
            ]
        }).populate('orderId', 'totalAmt items cancellationData');

        let totalRetainedAmount = 0;

        // Calculate retained amount for each refund
        completedRefunds.forEach(refund => {
            if (refund.orderId) {
                // If we have explicit retention fee in the refund details, use that
                if (refund.refundDetails && refund.refundDetails.retentionFee) {
                    totalRetainedAmount += refund.refundDetails.retentionFee;
                }
                // If we have retention fee in admin response, use that
                else if (refund.adminResponse && refund.adminResponse.retentionFee) {
                    totalRetainedAmount += refund.adminResponse.retentionFee;
                }
                // Otherwise calculate based on refund percentage or amount
                else if (refund.adminResponse) {
                    const orderTotal = refund.orderId.totalAmt || 0;
                    
                    // If we have items to cancel, calculate based on those items only
                    if (refund.itemsToCancel && refund.itemsToCancel.length > 0) {
                        let cancelledItemsTotal = 0;
                        
                        // Calculate total value of cancelled items
                        refund.itemsToCancel.forEach(cancelItem => {
                            const itemId = cancelItem.itemId?.toString();
                            const originalItem = refund.orderId.items.find(item => 
                                item._id.toString() === itemId
                            );
                            
                            if (originalItem) {
                                const itemPrice = originalItem.unitPrice * originalItem.quantity;
                                cancelledItemsTotal += itemPrice;
                            }
                        });
                        
                        // If we have a refund amount, the retention fee is the difference
                        if (refund.adminResponse.refundAmount) {
                            const refundedAmount = refund.adminResponse.refundAmount;
                            const retainedAmount = cancelledItemsTotal - refundedAmount;
                            totalRetainedAmount += Math.max(0, retainedAmount);
                        }
                        // If we have refund percentage, calculate retention based on that
                        else if (refund.adminResponse.refundPercentage) {
                            const refundPercentage = refund.adminResponse.refundPercentage || 0;
                            const retainedPercentage = 100 - refundPercentage;
                            const retainedAmount = cancelledItemsTotal * (retainedPercentage / 100);
                            totalRetainedAmount += retainedAmount;
                        }
                        // Default to standard 10% retention fee
                        else {
                            totalRetainedAmount += cancelledItemsTotal * 0.10; // 10% retention
                        }
                    }
                    // Full order cancellation
                    else {
                        // If we have a refund amount, the retention fee is the difference
                        if (refund.adminResponse.refundAmount) {
                            const refundedAmount = refund.adminResponse.refundAmount;
                            const retainedAmount = orderTotal - refundedAmount;
                            totalRetainedAmount += Math.max(0, retainedAmount);
                        }
                        // If we have refund percentage, calculate retention based on that
                        else if (refund.adminResponse.refundPercentage) {
                            const refundPercentage = refund.adminResponse.refundPercentage || 0;
                            const retainedPercentage = 100 - refundPercentage;
                            const retainedAmount = orderTotal * (retainedPercentage / 100);
                            totalRetainedAmount += retainedAmount;
                        }
                        // Default to standard 10% retention fee
                        else {
                            totalRetainedAmount += orderTotal * 0.10; // 10% retention
                        }
                    }
                }
            }
        });

        return totalRetainedAmount;
    } catch (error) {
        console.error("Error calculating retained amount:", error);
        return 0;
    }
};

export const downloadInvoice = async (req, res) => {
    try {
        const { orderId, orderData } = req.body;
        const userId = req.userId; // Get userId from auth middleware
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID is required"
            });
        }
        
        // Build query - for admin, can access any order; for users, only their own orders
        let query = { orderId };
        if (req.user?.role !== 'ADMIN') {
            query.userId = userId; // Restrict to user's own orders
        }
        
        // Find the order
        let order;
        if (orderData && orderData.orderId === orderId) {
            // Use provided order data if available and matches
            order = orderData;
            
            // Verify the user owns this order (security check)
            if (req.user?.role !== 'ADMIN' && order.userId !== userId && order.userId?._id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: true,
                    message: "Access denied. You can only download your own invoices."
                });
            }
            console.log(order);
            // If user data is not populated in orderData, fetch it from database
            if (!order.userId?.name || !order.userId?.email) {
                const userPopulatedOrder = await orderModel.findOne(query)
                    .populate('userId', 'name email')
                    .populate('deliveryAddress');
                
                if (userPopulatedOrder) {
                    // Merge the populated user data with the provided order data
                    order.userId = userPopulatedOrder.userId;
                    order.deliveryAddress = userPopulatedOrder.deliveryAddress || order.deliveryAddress;
                }
            }
        } else {
            // Fetch from database
            order = await orderModel.findOne(query)
                .populate('userId', 'name email')
                .populate('deliveryAddress')
                .populate({
                    path: 'items.productId',
                    select: 'name title image price discount'
                })
                .populate({
                    path: 'items.bundleId',
                    select: 'title name image images bundlePrice originalPrice'
                });
        }
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found or access denied"
            });
        }
        
        // Determine invoice type based on order status
        let invoiceType = 'order';
        if (order.orderStatus === 'DELIVERED') {
            invoiceType = 'delivery';
        } else if (order.orderStatus === 'CANCELLED') {
            invoiceType = 'refund';
        }
        
        // Generate PDF invoice
        const filePath = await generateInvoicePdf(order, invoiceType);
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Stream the PDF file
        const fs = await import('fs');
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.pipe(res);
        
        // Clean up the temporary file after streaming
        fileStream.on('end', () => {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting temp PDF:', err);
            });
        });
        
        fileStream.on('error', (error) => {
            console.error('Error streaming PDF:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: true,
                    message: "Error downloading invoice"
                });
            }
        });
        
    } catch (error) {
        console.error("Error in downloadInvoice:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error generating invoice",
            details: error.message
        });
    }
};

// Helper function to generate PDF invoice
const generateInvoicePDF = async (order, type = 'order') => {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF with proper settings for compatibility
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: 40,
                bufferPages: true,
                info: {
                    Title: `${type === 'refund' ? 'Refund Invoice' : type === 'delivery' ? 'Delivery Invoice' : 'Order Invoice'} - ${order.orderId}`,
                    Author: 'Casual Clothings',
                    Subject: 'Invoice Document',
                    Creator: 'Casual Clothings System',
                    Producer: 'PDFKit'
                }
            });
            
            const filename = `${type}-invoice-${order.orderId}-${Date.now()}.pdf`;
            const filepath = path.join(process.cwd(), 'temp', filename);
            
            // Ensure temp directory exists
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            
            // Color scheme
            const primaryColor = '#2C3E50';
            const accentColor = '#3498DB';
            const grayColor = '#7F8C8D';
            const lightGray = '#ECF0F1';
            
            // Helper function to add styled text
            const addStyledText = (text, x, y, options = {}) => {
                const { fontSize = 12, color = '#000000', font = 'Helvetica', align = 'left', width, bold = false } = options;
                doc.font(bold ? 'Helvetica-Bold' : font)
                   .fontSize(fontSize)
                   .fillColor(color);
                
                if (width) {
                    doc.text(text, x, y, { width, align });
                } else {
                    doc.text(text, x, y, { align });
                }
            };
            
            // Helper function to draw horizontal line
            const drawLine = (x1, y1, x2, y2, color = '#000000', width = 1) => {
                doc.strokeColor(color)
                   .lineWidth(width)
                   .moveTo(x1, y1)
                   .lineTo(x2, y2)
                   .stroke();
            };
            
            // Helper function to draw rectangle
            const drawRect = (x, y, width, height, fillColor = null, strokeColor = null) => {
                if (fillColor) {
                    doc.rect(x, y, width, height).fillColor(fillColor).fill();
                }
                if (strokeColor) {
                    doc.rect(x, y, width, height).strokeColor(strokeColor).stroke();
                }
            };
            
            // Page dimensions
            const pageWidth = doc.page.width - 80; // Account for margins
            const leftMargin = 40;
            const rightMargin = doc.page.width - 40;
            let currentY = 60;
            
            // Company Header with Background
            drawRect(leftMargin, currentY - 10, pageWidth, 80, primaryColor);
            
            // Company Logo/Name
            addStyledText('CASUAL CLOTHINGS', leftMargin + 20, currentY + 5, {
                fontSize: 24,
                color: '#FFFFFF',
                font: 'Helvetica-Bold'
            });
            
            addStyledText('Premium Fashion & Lifestyle', leftMargin + 20, currentY + 32, {
                fontSize: 12,
                color: '#FFFFFF'
            });
            
            // Company Contact Info
            const contactY = currentY + 8;
            addStyledText('📧 orders@casualclothings.com', rightMargin - 200, contactY, {
                fontSize: 10,
                color: '#FFFFFF'
            });
            addStyledText('📞 +91 9442955929', rightMargin - 200, contactY + 15, {
                fontSize: 10,
                color: '#FFFFFF'
            });
            addStyledText('🌐 www.casualclothings.com', rightMargin - 200, contactY + 30, {
                fontSize: 10,
                color: '#FFFFFF'
            });
            
            currentY += 100;
            
            // Invoice Type Header
            let invoiceTitle = 'INVOICE';
            if (type === 'refund') {
                invoiceTitle = 'REFUND INVOICE';
            } else if (type === 'delivery') {
                invoiceTitle = 'DELIVERY CONFIRMATION INVOICE';
            }
            
            drawRect(leftMargin, currentY, pageWidth, 35, accentColor);
            addStyledText(invoiceTitle, leftMargin + 20, currentY + 10, {
                fontSize: 16,
                color: '#FFFFFF',
                font: 'Helvetica-Bold'
            });
            
            currentY += 55;
            
            // Invoice Details Section
            const invoiceDetailsY = currentY;
            
            // Left side - Bill To
            addStyledText('BILL TO:', leftMargin, invoiceDetailsY, {
                fontSize: 12,
                font: 'Helvetica-Bold',
                color: primaryColor
            });
            
            drawLine(leftMargin, invoiceDetailsY + 15, leftMargin + 80, invoiceDetailsY + 15, accentColor, 2);
            
            // Get customer details with multiple fallback options
            const customerName = order.userId?.name || 
                                 order.user?.name || 
                                 order.deliveryAddress?.name || 
                                 'Customer Name Not Available';
            
            const customerEmail = order.userId?.email || 
                                  order.user?.email || 
                                  order.customerEmail || 
                                  'Email Not Available';
            
            addStyledText(customerName, leftMargin, invoiceDetailsY + 25, {
                fontSize: 11,
                font: 'Helvetica-Bold'
            });
            
            addStyledText(customerEmail, leftMargin, invoiceDetailsY + 40, {
                fontSize: 10,
                color: grayColor
            });
            
            // Delivery Address
            if (order.deliveryAddress) {
                addStyledText('DELIVERY ADDRESS:', leftMargin, invoiceDetailsY + 65, {
                    fontSize: 10,
                    font: 'Helvetica-Bold',
                    color: primaryColor
                });
                
                const addressLines = [
                    order.deliveryAddress.address_line || '',
                    `${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''}`,
                    `${order.deliveryAddress.pincode || ''}, ${order.deliveryAddress.country || 'India'}`
                ].filter(line => line.trim());
                
                addressLines.forEach((line, index) => {
                    addStyledText(line, leftMargin, invoiceDetailsY + 80 + (index * 12), {
                        fontSize: 9,
                        color: grayColor
                    });
                });
            }
            
            // Right side - Invoice Details
            const rightColumnX = rightMargin - 200;
            addStyledText('INVOICE DETAILS:', rightColumnX, invoiceDetailsY, {
                fontSize: 12,
                font: 'Helvetica-Bold',
                color: primaryColor
            });
            
            drawLine(rightColumnX, invoiceDetailsY + 15, rightColumnX + 120, invoiceDetailsY + 15, accentColor, 2);
            
            const currentDate = new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            const invoiceDetails = [
                { label: 'Invoice Date:', value: currentDate },
                { label: 'Order ID:', value: order.orderId },
                { label: 'Order Date:', value: orderDate },
                { label: 'Payment Method:', value: order.paymentMethod || 'Online Payment' },
                { label: 'Payment Status:', value: order.paymentStatus || 'PAID' }
            ];
            
            invoiceDetails.forEach((detail, index) => {
                addStyledText(detail.label, rightColumnX, invoiceDetailsY + 25 + (index * 15), {
                    fontSize: 9,
                    font: 'Helvetica-Bold'
                });
                addStyledText(detail.value, rightColumnX + 85, invoiceDetailsY + 25 + (index * 15), {
                    fontSize: 9
                });
            });
            
            currentY = Math.max(invoiceDetailsY + 160, currentY + 120);
            
            // Items Table
            addStyledText('ORDER ITEMS', leftMargin, currentY, {
                fontSize: 14,
                font: 'Helvetica-Bold',
                color: primaryColor
            });
            
            currentY += 25;
            
            // Table Header
            drawRect(leftMargin, currentY, pageWidth, 25, lightGray);
            drawRect(leftMargin, currentY, pageWidth, 25, null, grayColor);
            
            const columnWidths = {
                item: 250,
                qty: 50,
                price: 80,
                total: 80
            };
            
            let columnX = leftMargin + 10;
            addStyledText('ITEM DESCRIPTION', columnX, currentY + 7, {
                fontSize: 10,
                font: 'Helvetica-Bold'
            });
            
            columnX += columnWidths.item;
            addStyledText('QTY', columnX, currentY + 7, {
                fontSize: 10,
                font: 'Helvetica-Bold',
                align: 'center',
                width: columnWidths.qty
            });
            
            columnX += columnWidths.qty;
            addStyledText('UNIT PRICE', columnX, currentY + 7, {
                fontSize: 10,
                font: 'Helvetica-Bold',
                align: 'center',
                width: columnWidths.price
            });
            
            columnX += columnWidths.price;
            addStyledText('TOTAL', columnX, currentY + 7, {
                fontSize: 10,
                font: 'Helvetica-Bold',
                align: 'center',
                width: columnWidths.total
            });
            
            currentY += 25;
            
            // Table Items
            let subtotal = 0;
            
            order.items?.forEach((item, index) => {
                const isBundle = item.itemType === 'bundle';
                const itemName = isBundle 
                    ? (item.bundleDetails?.title || item.bundleId?.title || 'Bundle')
                    : (item.productDetails?.name || item.productId?.name || 'Product');
                
                let itemPrice = 0;
                if (isBundle) {
                    itemPrice = item.bundleId?.bundlePrice || item.bundleDetails?.bundlePrice || 0;
                } else {
                    const productPrice = item.productId?.price || item.productDetails?.price || 0;
                    const discount = item.productId?.discount || item.productDetails?.discount || 0;
                    itemPrice = discount > 0 ? productPrice * (1 - discount/100) : productPrice;
                }
                
                const itemTotal = itemPrice * item.quantity;
                subtotal += itemTotal;
                
                // Alternate row background
                if (index % 2 === 1) {
                    drawRect(leftMargin, currentY, pageWidth, 20, '#F8F9FA');
                }
                
                // Row border
                drawRect(leftMargin, currentY, pageWidth, 20, null, '#E9ECEF');
                
                columnX = leftMargin + 10;
                addStyledText(itemName, columnX, currentY + 5, {
                    fontSize: 9,
                    width: columnWidths.item - 20
                });
                
                columnX += columnWidths.item;
                addStyledText(item.quantity.toString(), columnX, currentY + 5, {
                    fontSize: 9,
                    align: 'center',
                    width: columnWidths.qty
                });
                
                columnX += columnWidths.qty;
                addStyledText(`₹${itemPrice.toFixed(2)}`, columnX, currentY + 5, {
                    fontSize: 9,
                    align: 'center',
                    width: columnWidths.price
                });
                
                columnX += columnWidths.price;
                addStyledText(`₹${itemTotal.toFixed(2)}`, columnX, currentY + 5, {
                    fontSize: 9,
                    align: 'center',
                    width: columnWidths.total
                });
                
                currentY += 20;
            });
            
            currentY += 10;
            
            // Summary Section
            const summaryX = rightMargin - 200;
            const summaryWidth = 180;
            
            drawRect(summaryX, currentY, summaryWidth, 5, accentColor);
            currentY += 15;
            
            // Use actual delivery charge from order instead of calculating difference
            const deliveryCharge = order.deliveryCharge || 0;
            
            // Subtotal
            addStyledText('Subtotal:', summaryX, currentY, {
                fontSize: 11,
                font: 'Helvetica-Bold'
            });
            addStyledText(`₹${subtotal.toFixed(2)}`, summaryX + 120, currentY, {
                fontSize: 11,
                align: 'right',
                width: 60
            });
            currentY += 20;
            
            // Delivery charge if applicable
            if (deliveryCharge > 0) {
                addStyledText('Delivery Charge:', summaryX, currentY, {
                    fontSize: 11
                });
                addStyledText(`₹${deliveryCharge.toFixed(2)}`, summaryX + 120, currentY, {
                    fontSize: 11,
                    align: 'right',
                    width: 60
                });
                currentY += 20;
            }
            
            // Tax information (if applicable)
            const taxAmount = 0; // Add tax calculation if needed
            if (taxAmount > 0) {
                addStyledText('Tax (GST):', summaryX, currentY, {
                    fontSize: 11
                });
                addStyledText(`₹${taxAmount.toFixed(2)}`, summaryX + 120, currentY, {
                    fontSize: 11,
                    align: 'right',
                    width: 60
                });
                currentY += 20;
            }
            
            // Total line
            drawLine(summaryX, currentY, summaryX + summaryWidth - 20, currentY, primaryColor, 2);
            currentY += 10;
            
            // Total Amount
            drawRect(summaryX, currentY, summaryWidth - 20, 25, primaryColor);
            addStyledText('TOTAL AMOUNT:', summaryX + 10, currentY + 7, {
                fontSize: 12,
                font: 'Helvetica-Bold',
                color: '#FFFFFF'
            });
            addStyledText(`₹${order.totalAmt?.toFixed(2) || '0.00'}`, summaryX + 120, currentY + 7, {
                fontSize: 12,
                font: 'Helvetica-Bold',
                color: '#FFFFFF',
                align: 'right',
                width: 50
            });
            
            currentY += 50;
            
            // Additional Information Sections
            if (type === 'refund' && order.refundDetails) {
                addStyledText('REFUND INFORMATION', leftMargin, currentY, {
                    fontSize: 14,
                    font: 'Helvetica-Bold',
                    color: primaryColor
                });
                currentY += 25;
                
                drawRect(leftMargin, currentY, pageWidth, 80, '#FFF3CD');
                drawRect(leftMargin, currentY, pageWidth, 80, null, '#FFC107');
                
                const refundDetails = [
                    { label: 'Refund Amount:', value: `₹${order.refundDetails.refundAmount?.toFixed(2) || '0.00'}` },
                    { label: 'Refund Percentage:', value: `${order.refundDetails.refundPercentage || '0'}%` },
                    { label: 'Retained Amount:', value: `₹${order.refundDetails.retainedAmount?.toFixed(2) || '0.00'}` },
                    { label: 'Refund Reason:', value: order.refundDetails.refundReason || 'N/A' }
                ];
                
                refundDetails.forEach((detail, index) => {
                    addStyledText(detail.label, leftMargin + 15, currentY + 12 + (index * 15), {
                        fontSize: 10,
                        font: 'Helvetica-Bold'
                    });
                    addStyledText(detail.value, leftMargin + 150, currentY + 12 + (index * 15), {
                        fontSize: 10
                    });
                });
                
                currentY += 100;
            }
            
            if (type === 'delivery') {
                addStyledText('DELIVERY INFORMATION', leftMargin, currentY, {
                    fontSize: 14,
                    font: 'Helvetica-Bold',
                    color: primaryColor
                });
                currentY += 25;
                
                drawRect(leftMargin, currentY, pageWidth, 60, '#D4EDDA');
                drawRect(leftMargin, currentY, pageWidth, 60, null, '#28A745');
                
                const deliveryDetails = [];
                
                if (order.estimatedDeliveryDate) {
                    deliveryDetails.push({
                        label: 'Estimated Delivery:',
                        value: new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN')
                    });
                }
                
                if (order.actualDeliveryDate) {
                    deliveryDetails.push({
                        label: 'Actual Delivery:',
                        value: new Date(order.actualDeliveryDate).toLocaleDateString('en-IN')
                    });
                }
                
                if (order.deliveryNotes) {
                    deliveryDetails.push({
                        label: 'Delivery Notes:',
                        value: order.deliveryNotes
                    });
                }
                
                deliveryDetails.forEach((detail, index) => {
                    addStyledText(detail.label, leftMargin + 15, currentY + 12 + (index * 15), {
                        fontSize: 10,
                        font: 'Helvetica-Bold'
                    });
                    addStyledText(detail.value, leftMargin + 150, currentY + 12 + (index * 15), {
                        fontSize: 10,
                        width: pageWidth - 165
                    });
                });
                
                currentY += 80;
            }
            
            // Footer Section
            currentY += 30;
            
            // Terms and Conditions
            drawRect(leftMargin, currentY, pageWidth, 2, accentColor);
            currentY += 15;
            
            addStyledText('TERMS & CONDITIONS', leftMargin, currentY, {
                fontSize: 11,
                font: 'Helvetica-Bold',
                color: primaryColor
            });
            
            currentY += 20;
            
            const terms = [
                '• All sales are final unless otherwise specified.',
                '• Returns and exchanges are subject to our return policy.',
                '• Please contact customer service for any queries.',
                '• GST registration number: 33ABCDE1234F1Z5'
            ];
            
            terms.forEach((term, index) => {
                addStyledText(term, leftMargin, currentY + (index * 12), {
                    fontSize: 8,
                    color: grayColor
                });
            });
            
            currentY += terms.length * 12 + 20;
            
            // Thank you note
            addStyledText('Thank you for choosing Casual Clothings!', leftMargin, currentY, {
                fontSize: 12,
                font: 'Helvetica-Bold',
                color: primaryColor,
                align: 'center',
                width: pageWidth
            });
            
            addStyledText('This is a computer-generated invoice and does not require a signature.', leftMargin, currentY + 20, {
                fontSize: 8,
                color: grayColor,
                align: 'center',
                width: pageWidth
            });
            
            // Page numbering
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                addStyledText(`Page ${i + 1} of ${pageCount}`, rightMargin - 80, doc.page.height - 30, {
                    fontSize: 8,
                    color: grayColor
                });
            }
            
            doc.end();
            
            stream.on('finish', () => {
                resolve({ filepath, filename });
            });
            
            stream.on('error', (error) => {
                reject(error);
            });
            
        } catch (error) {
            reject(error);
        }
    });
};

// Function to send email with invoice after successful refund
export const sendRefundInvoiceEmail = async (order, refundDetails) => {
    try {
        // Enhance order data with refund-specific information for invoice generation
        const enhancedOrderData = {
            ...order.toObject(),
            refundAmount: refundDetails.refundAmount,
            refundId: refundDetails.refundId,
            refundDate: refundDetails.refundDate,
            refundReason: refundDetails.refundReason || 'Order Cancellation',
            refundStatus: 'Completed'
        };
        
        // Generate PDF invoice with enhanced data
        const filePath = await generateInvoicePdf(enhancedOrderData, 'refund');
        const filename = path.basename(filePath);
        
        // Email template for refund with invoice
        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: #f44336; color: white; text-align: center; padding: 20px; }
                    .content { padding: 20px; }
                    .refund-box { background: #f8f9ff; border: 2px solid #e8f0fe; border-radius: 8px; padding: 20px; margin: 20px 0; }
                    .amount { font-size: 24px; font-weight: bold; color: #1a73e8; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Refund Processed Successfully</h1>
                        <p>Order #${order.orderId}</p>
                    </div>
                    
                    <div class="content">
                        <h2>Dear ${order.userId?.name || order.user?.name || order.deliveryAddress?.name || 'Customer'},</h2>
                        
                        <p>Your refund has been processed successfully. Please find the refund invoice attached to this email.</p>
                        
                        <div class="refund-box">
                            <h3>Refund Details</h3>
                            <p><strong>Refund Amount:</strong> <span class="amount">₹${refundDetails.refundAmount?.toFixed(2)}</span></p>
                            <p><strong>Refund Percentage:</strong> ${refundDetails.refundPercentage}%</p>
                            <p><strong>Processing Time:</strong> 5-7 business days</p>
                            <p><strong>Cancellation Type:</strong> ${order.isFullOrderCancelled ? 'Full Order Cancellation' : 'Partial Order Cancellation'}</p>
                            
                            ${order.isFullOrderCancelled ? 
                              '<p>All items in this order have been cancelled and refunded.</p>' :
                              `<p>The following items have been cancelled and refunded:</p>
                              <ul style="margin-left: 20px;">
                                  ${order.items
                                    .filter(item => item.status === 'Cancelled')
                                    .map(item => {
                                        const itemName = item.productDetails?.name || item.bundleDetails?.title || 'Item';
                                        return `<li>${itemName} ${item.size ? `(Size: ${item.size})` : ''} - ₹${item.refundAmount}</li>`;
                                    })
                                    .join('')}
                              </ul>`
                            }
                        </div>
                        
                        <p>The refund amount will be credited to your original payment method within 5-7 business days.</p>
                        
                        <p>Thank you for your understanding.</p>
                        
                        <hr>
                        <p><small>This is an automated email. Please do not reply.</small></p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Send email with attachment
        await sendEmail({
            sendTo: order.userId?.email || order.user?.email || order.customerEmail,
            subject: `Refund Invoice - Order #${order.orderId}`,
            html: emailTemplate,
            attachments: [{
                filename: filename,
                path: filePath
            }]
        });
        
        // Clean up temporary file
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }, 60000); // Delete after 1 minute
        
        console.log(`Refund invoice email sent for order ${order.orderId}`);
        
    } catch (error) {
        console.error("Error sending refund invoice email:", error);
        throw error;
    }
};

// Function to send email with invoice after successful delivery
export const sendDeliveryInvoiceEmail = async (order) => {
    try {
        // Generate PDF invoice
        const filePath = await generateInvoicePdf(order, 'delivery');
        const filename = path.basename(filePath);
        
        // Email template for delivery confirmation with invoice
        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: #4caf50; color: white; text-align: center; padding: 20px; }
                    .content { padding: 20px; }
                    .delivery-box { background: #f1f8e9; border: 2px solid #c8e6c9; border-radius: 8px; padding: 20px; margin: 20px 0; }
                    .amount { font-size: 24px; font-weight: bold; color: #2e7d32; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚚 Order Delivered Successfully</h1>
                        <p>Order #${order.orderId}</p>
                    </div>
                    
                    <div class="content">
                        <h2>Dear ${order.userId?.name || order.user?.name || order.deliveryAddress?.name || 'Customer'},</h2>
                        
                        <p>Your order has been delivered successfully! Please find the delivery invoice attached to this email for your records.</p>
                        
                        <div class="delivery-box">
                            <h3>Delivery Details</h3>
                            <p><strong>Order Total:</strong> <span class="amount">₹${order.totalAmt?.toFixed(2)}</span></p>
                            <p><strong>Delivered On:</strong> ${order.actualDeliveryDate ? new Date(order.actualDeliveryDate).toLocaleDateString() : 'Today'}</p>
                            ${order.deliveryNotes ? `<p><strong>Delivery Notes:</strong> ${order.deliveryNotes}</p>` : ''}
                        </div>
                        
                        <p>We hope you enjoy your purchase! If you have any concerns about your order, please contact our customer support.</p>
                        
                        <p>Thank you for choosing Casual Clothings!</p>
                        
                        <hr>
                        <p><small>This is an automated email. Please do not reply.</small></p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Send email with attachment
        await sendEmail({
            sendTo: order.userId?.email || order.user?.email || order.customerEmail,
            subject: `Delivery Confirmation & Invoice - Order #${order.orderId}`,
            html: emailTemplate,
            attachments: [{
                filename: filename,
                path: filePath
            }]
        });
        
        // Clean up temporary file
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }, 60000); // Delete after 1 minute
        
        console.log(`Delivery invoice email sent for order ${order.orderId}`);
        
    } catch (error) {
        console.error("Error sending delivery invoice email:", error);
        throw error;
    }
};

// Function to handle successful refund completion and send email
export const handleRefundCompletion = async (req, res) => {
    try {
        const { orderId, refundDetails } = req.body;
        
        if (!orderId || !refundDetails) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID and refund details are required"
            });
        }
        
        // Find the order
        const order = await orderModel.findOne({ orderId })
            .populate('userId', 'name email')
            .populate('deliveryAddress')
            .populate({
                path: 'items.productId',
                select: 'name title image price discount'
            })
            .populate({
                path: 'items.bundleId',
                select: 'title name image images bundlePrice originalPrice'
            });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }
        
        // Update order with refund details
        await orderModel.findByIdAndUpdate(order._id, {
            paymentStatus: "REFUND_SUCCESSFUL",
            orderStatus: "CANCELLED",
            refundDetails: {
                ...refundDetails,
                refundDate: new Date()
            }
        });
        
        // Send refund invoice email
        await sendRefundInvoiceEmail(order, refundDetails);
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Refund completed and email sent successfully"
        });
        
    } catch (error) {
        console.error("Error in handleRefundCompletion:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error processing refund completion",
            details: error.message
        });
    }
};

// Function to handle successful delivery and send email
export const handleDeliveryCompletion = async (req, res) => {
    try {
        const { orderId, deliveryNotes = '' } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID is required"
            });
        }
        
        // Find the order
        const order = await orderModel.findOne({ orderId })
            .populate('userId', 'name email')
            .populate('deliveryAddress')
            .populate({
                path: 'items.productId',
                select: 'name title image price discount'
            })
            .populate({
                path: 'items.bundleId',
                select: 'title name image images bundlePrice originalPrice'
            });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }
        
        // Update order status to delivered
        await orderModel.findByIdAndUpdate(order._id, {
            orderStatus: "DELIVERED",
            paymentStatus: "PAID",
            actualDeliveryDate: new Date(),
            deliveryNotes: deliveryNotes
        });
        
        // Get updated order for email
        const updatedOrder = await orderModel.findById(order._id)
            .populate('userId', 'name email')
            .populate('deliveryAddress')
            .populate({
                path: 'items.productId',
                select: 'name title image price discount'
            })
            .populate({
                path: 'items.bundleId',
                select: 'title name image images bundlePrice originalPrice'
            });
        
        // Send delivery invoice email
        await sendDeliveryInvoiceEmail(updatedOrder);
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Delivery completed and email sent successfully"
        });
        
    } catch (error) {
        console.error("Error in handleDeliveryCompletion:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error processing delivery completion",
            details: error.message
        });
    }
};

export const initiateRefund = async (req, res) => {
    try {
        const { paymentId } = req.body;
        
        if (!paymentId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Payment ID is required"
            });
        }
        
        // Find the order by payment ID or order ID
        const order = await orderModel.findOne({
            $or: [
                { _id: paymentId },
                { paymentId: paymentId }
            ]
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Payment not found"
            });
        }
        
        // Check if refund is possible
        if (order.paymentStatus === "REFUNDED") {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Payment has already been refunded"
            });
        }
        
        if (order.paymentMethod === "Cash on Delivery" && order.orderStatus !== "DELIVERED") {
            return res.status(400).json({
                success: false,
                error: true,
                message: "COD orders can only be refunded if delivered"
            });
        }
        
        // Update order status to indicate refund initiated
        await orderModel.findByIdAndUpdate(order._id, {
            paymentStatus: "REFUND_INITIATED",
            orderStatus: "CANCELLED"
        });
        
        // Here you would integrate with actual payment gateway to process refund
        // For Razorpay: await razorpay.payments.refund(paymentId, { amount: order.totalAmt * 100 });
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Refund initiated successfully. It may take 3-5 business days to reflect in customer's account."
        });
        
    } catch (error) {
        console.error("Error in initiateRefund:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error initiating refund",
            details: error.message
        });
    }
};

export const getPaymentSettings = async (req, res) => {
    try {
        // In a real application, you would store these settings in database
        // For now, return default settings
        const defaultSettings = {
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
                paymentTimeout: 15
            }
        };
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Payment settings retrieved successfully",
            data: defaultSettings
        });
        
    } catch (error) {
        console.error("Error in getPaymentSettings:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving payment settings",
            details: error.message
        });
    }
};

export const updatePaymentSettings = async (req, res) => {
    try {
        const settings = req.body;
        
        // In a real application, you would save these settings to database
        // For now, just validate and return success
        
        if (!settings) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Settings data is required"
            });
        }
        
        // Validate Razorpay settings if enabled
        if (settings.razorpay?.enabled) {
            if (!settings.razorpay.keyId || !settings.razorpay.keySecret) {
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: "Razorpay Key ID and Secret are required when Razorpay is enabled"
                });
            }
        }
        
        // Here you would save to database:
        // await PaymentSettings.findOneAndUpdate({}, settings, { upsert: true });
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Payment settings updated successfully"
        });
        
    } catch (error) {
        console.error("Error in updatePaymentSettings:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error updating payment settings",
            details: error.message
        });
    }
};

// Get payment statistics with delivery insights
export const getPaymentStatsWithDelivery = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Build date filter
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter.orderDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Get basic payment statistics
        const totalPayments = await orderModel.countDocuments(dateFilter);
        const totalRevenue = await orderModel.aggregate([
            { $match: { ...dateFilter, paymentStatus: "PAID" } },
            { $group: { _id: null, total: { $sum: "$totalAmt" } } }
        ]);
        
        // Delivery-related statistics
        const deliveryStats = await orderModel.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    ordersWithEstimatedDate: {
                        $sum: { $cond: [{ $ne: ["$estimatedDeliveryDate", null] }, 1, 0] }
                    },
                    deliveredOrders: {
                        $sum: { $cond: [{ $ne: ["$actualDeliveryDate", null] }, 1, 0] }
                    },
                    overdueOrders: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ["$estimatedDeliveryDate", null] },
                                        { $eq: ["$actualDeliveryDate", null] },
                                        { $lt: ["$estimatedDeliveryDate", new Date()] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        
        // Refund statistics with delivery context
        const refundStats = await orderModel.aggregate([
            { 
                $match: { 
                    ...dateFilter,
                    paymentStatus: { $regex: "REFUND", $options: "i" }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRefunds: { $sum: 1 },
                    totalRefundAmount: { $sum: "$refundDetails.refundAmount" },
                    refundsAfterDelivery: {
                        $sum: { $cond: [{ $ne: ["$actualDeliveryDate", null] }, 1, 0] }
                    },
                    refundsPastEstimatedDate: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ["$estimatedDeliveryDate", null] },
                                        { $lt: ["$estimatedDeliveryDate", new Date()] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        
        // Average delivery time
        const avgDeliveryTime = await orderModel.aggregate([
            {
                $match: {
                    ...dateFilter,
                    actualDeliveryDate: { $ne: null },
                    orderDate: { $ne: null }
                }
            },
            {
                $project: {
                    deliveryDays: {
                        $divide: [
                            { $subtract: ["$actualDeliveryDate", "$orderDate"] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    averageDeliveryDays: { $avg: "$deliveryDays" }
                }
            }
        ]);
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Payment statistics with delivery insights retrieved successfully",
            data: {
                totalPayments,
                totalRevenue: totalRevenue[0]?.total || 0,
                deliveryInsights: deliveryStats[0] || {},
                refundInsights: refundStats[0] || {},
                averageDeliveryDays: avgDeliveryTime[0]?.averageDeliveryDays || 0
            }
        });
        
    } catch (error) {
        console.error("Error in getPaymentStatsWithDelivery:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving payment statistics",
            details: error.message
        });
    }
};
