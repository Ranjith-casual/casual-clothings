import orderCancellationModel from "../models/orderCancellation.model.js";
import cancellationPolicyModel from "../models/cancellationPolicy.model.js";
import orderModel from "../models/order.model.js";
import UserModel from "../models/users.model.js";
import sendEmail from "../config/sendEmail.js";
import fs from 'fs';

// User requests order cancellation
export const requestOrderCancellation = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId, reason, additionalReason } = req.body;

        console.log('Cancellation request data:', {
            userId,
            orderId,
            reason,
            additionalReason,
            body: req.body
        });

        // Validate required fields
        if (!orderId || !reason) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID and reason are required"
            });
        }

        // Validate order exists and belongs to user
        const order = await orderModel.findOne({ 
            _id: orderId, 
            userId: userId 
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found or doesn't belong to you"
            });
        }

        // Check if order can be cancelled based on status
        const nonCancellableStatuses = ['OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (nonCancellableStatuses.includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: `Cannot cancel order with status: ${order.orderStatus}`
            });
        }
        
        // Check if payment is online and paid
        if (order.paymentMethod !== 'Online Payment' || order.paymentStatus !== 'PAID') {
            return res.status(400).json({
                success: false,
                error: true,
                message: `Only paid online orders can be cancelled`
            });
        }

        // Check if cancellation request already exists
        const existingRequest = await orderCancellationModel.findOne({
            orderId: orderId,
            status: { $in: ['PENDING', 'APPROVED'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Cancellation request already exists for this order"
            });
        }

        // Get current policy for refund calculation
        const policy = await cancellationPolicyModel.findOne({ isActive: true });
        const refundPercentage = 75;

        // Create cancellation request
        const cancellationRequest = new orderCancellationModel({
            orderId,
            userId,
            reason,
            additionalReason,
            adminResponse: {
                refundPercentage
            }
        });

        console.log("About to save cancellation request:", cancellationRequest);
        const savedRequest = await cancellationRequest.save();
        console.log("Cancellation request saved successfully:", savedRequest._id);

        // Get user details for email
        const user = await UserModel.findById(userId);
        console.log("User found for email:", user.name, user.email);

        // Send confirmation email to user
        if (user.email) {
            await sendEmail({
                sendTo: user.email,
                subject: "Order Cancellation Request Received",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Order Cancellation Request Received</h2>
                        <p>Dear ${user.name},</p>
                        <p>We have received your cancellation request for order <strong>#${order.orderId}</strong>.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3>Request Details:</h3>
                            <p><strong>Order ID:</strong> ${order.orderId}</p>
                            <p><strong>Reason:</strong> ${reason}</p>
                            <p><strong>Request Date:</strong> ${new Date().toLocaleDateString()}</p>
                            <p><strong>Expected Refund:</strong> ₹${(order.totalAmt * refundPercentage / 100).toFixed(2)} (${refundPercentage}% of order value)</p>
                        </div>
                        
                        <p><strong>What happens next?</strong></p>
                        <ul>
                            <li>Our team will review your request within 48 hours</li>
                            <li>You will receive an email with the decision</li>
                            <li>If approved, refund will be processed within 5-7 business days</li>
                        </ul>
                        
                        <p>Thank you for your patience.</p>
                        <p>Best regards,<br>casualclothings Team</p>
                    </div>
                `
            });
        }

        res.status(200).json({
            success: true,
            error: false,
            message: "Cancellation request submitted successfully",
            data: {
                requestId: cancellationRequest._id,
                expectedRefund: (order.totalAmt * refundPercentage / 100).toFixed(2),
                refundPercentage
            }
        });

    } catch (error) {
        console.error("Error in requestOrderCancellation:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// User function to get their own cancellation requests
export const getUserCancellationRequests = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        const requests = await orderCancellationModel.find({
            userId: userId
        })
        .populate({
            path: 'orderId',
            select: 'orderId totalAmt orderDate orderStatus paymentMethod paymentStatus items subTotalAmt totalQuantity orderQuantity productDetails',
            populate: [
                {
                    path: 'items.productId',
                    select: 'name title image price'
                },
                {
                    path: 'items.bundleId',
                    select: 'title name image price'
                }
            ]
        })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            error: false,
            message: "User cancellation requests retrieved successfully",
            data: requests
        });

    } catch (error) {
        console.error("Error in getUserCancellationRequests:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Admin function to get all cancellation requests
export const getCancellationRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        
        const filter = { isActive: true };
        if (status !== 'all') {
            filter.status = status;
        }

        const requests = await orderCancellationModel.find(filter)
            .populate({
                path: 'orderId',
                select: 'orderId totalAmt orderDate orderStatus paymentMethod paymentStatus items subTotalAmt totalQuantity orderQuantity productDetails',
                populate: [
                    {
                        path: 'items.productId',
                        select: 'name title image price'
                    },
                    {
                        path: 'items.bundleId',
                        select: 'title name image price'
                    }
                ]
            })
            .populate('userId', 'name email')
            .populate('adminResponse.processedBy', 'name')
            .sort({ requestDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await orderCancellationModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            error: false,
            data: {
                requests,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRequests: total
            }
        });

    } catch (error) {
        console.error("Error in getCancellationRequests:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Admin processes cancellation request (approve/reject)
export const processCancellationRequest = async (req, res) => {
    try {
        const adminId = req.userId;
        const { requestId, action, adminComments, customRefundPercentage } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Invalid action. Must be APPROVED or REJECTED"
            });
        }

        const cancellationRequest = await orderCancellationModel.findById(requestId)
            .populate({
                path: 'orderId',
                populate: [
                    {
                        path: 'items.productId',
                        select: 'name title image price'
                    },
                    {
                        path: 'items.bundleId',
                        select: 'title name image price'
                    }
                ]
            })
            .populate('userId');

        if (!cancellationRequest) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Cancellation request not found"
            });
        }

        if (cancellationRequest.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Request has already been processed"
            });
        }

        // Calculate refund amount
        const order = cancellationRequest.orderId;
        const refundPercentage = customRefundPercentage || cancellationRequest.adminResponse.refundPercentage;
        const refundAmount = action === 'APPROVED' ? (order.totalAmt * refundPercentage / 100) : 0;

        // Update cancellation request
        cancellationRequest.status = action;
        cancellationRequest.adminResponse.processedBy = adminId;
        cancellationRequest.adminResponse.processedDate = new Date();
        cancellationRequest.adminResponse.adminComments = adminComments;
        cancellationRequest.adminResponse.refundAmount = refundAmount;
        cancellationRequest.adminResponse.refundPercentage = refundPercentage;

        if (action === 'APPROVED') {
            cancellationRequest.refundDetails.refundStatus = 'PROCESSING';
            
            // Update order status to cancelled
            await orderModel.findByIdAndUpdate(order._id, {
                orderStatus: 'CANCELLED',
                paymentStatus: 'REFUND_PROCESSING'
            });
        }

        await cancellationRequest.save();

        // Send email to user
        const user = cancellationRequest.userId;
        if (user.email) {
            const emailSubject = action === 'APPROVED' 
                ? "Order Cancellation Approved - Refund Processing"
                : "Order Cancellation Request Rejected";

            const emailContent = action === 'APPROVED' 
                ? `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #28a745;">Order Cancellation Approved</h2>
                        <p>Dear ${user.name},</p>
                        <p>Your cancellation request for order <strong>#${order.orderId}</strong> has been approved.</p>
                        
                        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                            <h3>Refund Details:</h3>
                            <p><strong>Refund Amount:</strong> ₹${refundAmount.toFixed(2)}</p>
                            <p><strong>Refund Percentage:</strong> ${refundPercentage}%</p>
                            <p><strong>Processing Time:</strong> 5-7 business days</p>
                            <p><strong>Refund Method:</strong> Original payment method</p>
                        </div>
                        
                        ${adminComments ? `<p><strong>Admin Comments:</strong> ${adminComments}</p>` : ''}
                        
                        <p>Your refund will be processed within 5-7 business days and will be credited to your original payment method.</p>
                        
                        <p>Thank you for your understanding.</p>
                        <p>Best regards,<br>casualclothings Team</p>
                    </div>
                `
                : `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc3545;">Order Cancellation Request Rejected</h2>
                        <p>Dear ${user.name},</p>
                        <p>We regret to inform you that your cancellation request for order <strong>#${order.orderId}</strong> has been rejected.</p>
                        
                        ${adminComments ? `
                            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                                <p><strong>Reason:</strong> ${adminComments}</p>
                            </div>
                        ` : ''}
                        
                        <p>Your order will continue to be processed as normal. If you have any concerns, please contact our customer support team.</p>
                        
                        <p>Thank you for your understanding.</p>
                        <p>Best regards,<br>casualclothings Team</p>
                    </div>
                `;

            await sendEmail({
                sendTo: user.email,
                subject: emailSubject,
                html: emailContent
            });
        }

        res.status(200).json({
            success: true,
            error: false,
            message: `Cancellation request ${action.toLowerCase()} successfully`,
            data: {
                status: action,
                refundAmount: refundAmount,
                refundPercentage: refundPercentage
            }
        });

    } catch (error) {
        console.error("Error in processCancellationRequest:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Admin completes refund process
export const completeRefund = async (req, res) => {
    try {
        const adminId = req.userId;
        const { requestId, transactionId, adminComments } = req.body;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Request ID is required"
            });
        }

        const cancellationRequest = await orderCancellationModel.findById(requestId)
            .populate('orderId')
            .populate('userId');

        if (!cancellationRequest) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Cancellation request not found"
            });
        }

        // Check if the request is in APPROVED status
        if (cancellationRequest.status !== 'APPROVED') {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Only approved cancellation requests can be refunded"
            });
        }

        // Check if refund is already processed
        if (cancellationRequest.refundDetails.refundStatus === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Refund has already been processed"
            });
        }

        // Update cancellation request with refund details
        cancellationRequest.refundDetails.refundId = transactionId || `REF-${Date.now()}`;
        cancellationRequest.refundDetails.refundDate = new Date();
        cancellationRequest.refundDetails.refundStatus = 'COMPLETED';
        cancellationRequest.adminResponse.adminComments = adminComments || cancellationRequest.adminResponse.adminComments;
        
        await cancellationRequest.save();

        // Update order status
        const order = cancellationRequest.orderId;
        await orderModel.findByIdAndUpdate(order._id, {
            orderStatus: 'CANCELLED',
            paymentStatus: 'REFUND_SUCCESSFUL', // This status will be used to calculate net revenue in payment stats
            refundDetails: {
                refundId: cancellationRequest.refundDetails.refundId,
                refundAmount: cancellationRequest.adminResponse.refundAmount,
                refundPercentage: cancellationRequest.adminResponse.refundPercentage,
                refundDate: new Date(),
                retainedAmount: order.totalAmt - cancellationRequest.adminResponse.refundAmount // Calculate retained amount
            }
        });

        // Send email to user with PDF attachment
        const user = cancellationRequest.userId;
        if (user.email) {
            try {
                // Get order details with populated product info
                const orderDetails = await orderModel.findById(order._id)
                    .populate('userId', 'name email')
                    .populate('items.productId', 'name image price')
                    .populate('items.bundleId', 'title image images bundlePrice')
                    .populate('deliveryAddress');

                // Prepare data for PDF generation
                const refundData = {
                    orderId: order.orderId,
                    orderNumber: order.orderId,
                    orderDate: order.orderDate,
                    refundId: cancellationRequest.refundDetails.refundId,
                    refundDate: cancellationRequest.refundDetails.refundDate,
                    refundStatus: 'COMPLETED',
                    refundReason: cancellationRequest.reason,
                    refundAmount: cancellationRequest.adminResponse.refundAmount,
                    userName: user.name,
                    email: user.email,
                    paymentMethod: order.paymentMethod,
                    paymentStatus: 'REFUNDED',
                    items: orderDetails.items,
                    user: user
                };

                // Generate PDF
                const generateInvoicePdf = (await import('../utils/generateInvoicePdf.js')).default;
                const pdfPath = await generateInvoicePdf(refundData, 'refund');

                // Send email with PDF attachment
                await sendEmail({
                    sendTo: user.email,
                    subject: `Your Refund has been Processed – [${order.orderId}]`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #28a745;">Refund Successful</h2>
                            <p>Dear ${user.name},</p>
                            <p>We're pleased to inform you that the refund for your cancelled order <strong>#${order.orderId}</strong> has been successfully processed.</p>
                            
                            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                                <h3>Refund Details:</h3>
                                <p><strong>Refund Amount:</strong> ₹${cancellationRequest.adminResponse.refundAmount.toFixed(2)}</p>
                                <p><strong>Refund ID:</strong> ${cancellationRequest.refundDetails.refundId}</p>
                                <p><strong>Refund Date:</strong> ${new Date().toLocaleDateString()}</p>
                                <p><strong>Refund Method:</strong> Original payment method</p>
                            </div>
                            
                            <p>The refund has been processed to your original payment method. It may take 2-5 business days to reflect in your account, depending on your bank's policies.</p>
                            
                            <p>Please find attached a PDF copy of your refund details for your records.</p>
                            
                            <p>Thank you for your patience and understanding.</p>
                            <p>Best regards,<br>casualclothings Team</p>
                        </div>
                    `,
                    attachments: [
                        {
                            filename: `refund_${order.orderId}.pdf`,
                            path: pdfPath
                        }
                    ]
                });
                
                // Clean up the PDF file after sending
                fs.promises.unlink(pdfPath).catch(err => console.error('Error deleting temp PDF:', err));
                
            } catch (emailError) {
                console.error('Error sending refund email:', emailError);
                // Don't throw, as the refund was successful even if the email failed
            }
        }

        res.status(200).json({
            success: true,
            error: false,
            message: "Refund processed successfully",
            data: {
                refundId: cancellationRequest.refundDetails.refundId,
                refundDate: cancellationRequest.refundDetails.refundDate,
                refundAmount: cancellationRequest.adminResponse.refundAmount,
                orderNumber: order.orderId
            }
        });

    } catch (error) {
        console.error("Error in completeRefund:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Get all refunds (Admin)
export const getAllRefunds = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        
        const filter = {};
        
        // Filter by refund status
        if (status !== 'all') {
            filter['refundDetails.refundStatus'] = status;
        } else {
            // Only get requests with refund status (approved or in process)
            filter.status = 'APPROVED';
        }

        const refunds = await orderCancellationModel.find(filter)
            .populate({
                path: 'orderId',
                select: 'orderId totalAmt orderDate orderStatus paymentStatus paymentMethod items subTotalAmt totalQuantity orderQuantity productDetails',
                populate: [
                    {
                        path: 'items.productId',
                        select: 'name title images image price _id'
                    },
                    {
                        path: 'items.bundleId',
                        select: 'title name images image bundlePrice price _id'
                    }
                ]
            })
            .populate('userId', 'name email')
            .populate('adminResponse.processedBy', 'name')
            .sort({ 'refundDetails.refundDate': -1, 'adminResponse.processedDate': -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        // Log the first refund's order details to debug
        if (refunds.length > 0 && refunds[0].orderId) {
            console.log("First refund order items:", 
                JSON.stringify(refunds[0].orderId.items.map(item => ({
                    itemType: item.itemType,
                    productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
                    bundleId: typeof item.bundleId === 'object' ? item.bundleId._id : item.bundleId,
                    productDetails: item.productDetails,
                    bundleDetails: item.bundleDetails
                })))
            );
        }

        const total = await orderCancellationModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            error: false,
            data: {
                refunds,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRefunds: total
            }
        });

    } catch (error) {
        console.error("Error in getAllRefunds:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Get cancellation policy
export const getCancellationPolicy = async (req, res) => {
    try {
        const policy = await cancellationPolicyModel.findOne({ isActive: true });
        
        if (!policy) {
            // Create default policy if none exists
            const defaultPolicy = new cancellationPolicyModel({
                refundPercentage: 65,
                responseTimeHours: 48,
                allowedReasons: [
                    { reason: 'Changed mind' },
                    { reason: 'Found better price' },
                    { reason: 'Wrong item ordered' },
                    { reason: 'Delivery delay' },
                    { reason: 'Product defect expected' },
                    { reason: 'Financial constraints' },
                    { reason: 'Duplicate order' },
                    { reason: 'Other' }
                ],
                timeBasedRules: [
                    { description: 'Within 1 hour of order', timeFrameHours: 1, refundPercentage: 65 },
                    { description: 'Within 24 hours of order', timeFrameHours: 24, refundPercentage: 65 },
                    { description: 'After 24 hours', timeFrameHours: 999999, refundPercentage: 65 }
                ],
                orderStatusRules: [
                    { orderStatus: 'ORDER PLACED', canCancel: true, refundPercentage: 65 },
                    { orderStatus: 'PROCESSING', canCancel: true, refundPercentage: 65 },
                    { orderStatus: 'OUT FOR DELIVERY', canCancel: false, refundPercentage: 0 },
                    { orderStatus: 'DELIVERED', canCancel: false, refundPercentage: 0 }
                ],
                terms: [
                    { title: 'Response Time', content: 'We will respond to your cancellation request within 48 hours.' },
                    { title: 'Refund Processing', content: 'Approved refunds will be processed within 5-7 business days.' },
                    { title: 'Refund Amount', content: 'Refund amount depends on order status and time of cancellation request.' }
                ]
            });
            
            await defaultPolicy.save();
            return res.status(200).json({
                success: true,
                error: false,
                data: defaultPolicy
            });
        }

        res.status(200).json({
            success: true,
            error: false,
            data: policy
        });

    } catch (error) {
        console.error("Error in getCancellationPolicy:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Update cancellation policy (Admin only)
export const updateCancellationPolicy = async (req, res) => {
    try {
        const adminId = req.userId;
        const updateData = req.body;

        const policy = await cancellationPolicyModel.findOneAndUpdate(
            { isActive: true },
            {
                ...updateData,
                lastUpdated: new Date(),
                updatedBy: adminId
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            error: false,
            message: "Cancellation policy updated successfully",
            data: policy
        });

    } catch (error) {
        console.error("Error in updateCancellationPolicy:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Get all refunds for a specific user
export const getUserRefunds = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Query for all cancellation/refund requests belonging to this user
        const userRefunds = await orderCancellationModel.find({
            userId: userId,
        })
        .populate({
            path: 'orderId',
            populate: {
                path: 'items.productId items.bundleId',
                select: 'name title images image'
            }
        })
        .populate('userId', 'name email')
        .sort({ 
            requestDate: -1, 
            'refundDetails.refundDate': -1, 
            'adminResponse.processedDate': -1 
        });

        // Return the refunds
        return res.status(200).json({
            success: true,
            error: false,
            message: "User refunds retrieved successfully",
            data: userRefunds
        });
    } catch (error) {
        console.error("Error getting user refunds:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error while getting user refunds"
        });
    }
};

// Get refund invoice
export const getRefundInvoice = async (req, res) => {
    try {
        const userId = req.userId;
        const refundId = req.params.refundId;
        
        if (!refundId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Refund ID is required"
            });
        }
        
        // Find the refund record
        const refund = await orderCancellationModel.findOne({
            userId: userId,
            'refundDetails.refundId': refundId,
            status: 'APPROVED',
            'refundDetails.refundStatus': 'COMPLETED'
        }).populate('orderId').populate('userId');
        
        if (!refund) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Refund not found or not authorized to access"
            });
        }
        
        // Check if invoice file exists
        const invoicePath = `./invoices/refund-${refundId}.pdf`;
        
        if (!fs.existsSync(invoicePath)) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Invoice file not found"
            });
        }
        
        // Send the file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=refund-invoice-${refundId}.pdf`);
        
        const fileStream = fs.createReadStream(invoicePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error("Error getting refund invoice:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error while getting refund invoice"
        });
    }
};

// Get cancellation details by order ID
export const getCancellationByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID is required"
            });
        }

        // Find the order first to get the object ID
        const order = await orderModel.findOne({ orderId: orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Find cancellation request by order object ID
        const cancellationRequest = await orderCancellationModel.findOne({ orderId: order._id })
            .populate({
                path: 'orderId',
                select: 'orderId totalAmt orderDate orderStatus paymentMethod paymentStatus items subTotalAmt totalQuantity'
            })
            .populate({
                path: 'userId',
                select: 'name email'
            })
            .populate({
                path: 'adminResponse.processedBy',
                select: 'name email'
            });

        if (!cancellationRequest) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "No cancellation request found for this order"
            });
        }

        return res.status(200).json({
            success: true,
            error: false,
            message: "Cancellation details retrieved successfully",
            data: cancellationRequest
        });

    } catch (error) {
        console.error("Error getting cancellation details by order ID:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error while getting cancellation details"
        });
    }
};
