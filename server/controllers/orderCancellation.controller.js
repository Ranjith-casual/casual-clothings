import orderCancellationModel from "../models/orderCancellation.model.js";
import cancellationPolicyModel from "../models/cancellationPolicy.model.js";
import orderModel from "../models/order.model.js";
import UserModel from "../models/users.model.js";
import sendEmail from "../config/sendEmail.js";

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
        const nonCancellableStatuses = ['DELIVERED', 'CANCELLED'];
        if (nonCancellableStatuses.includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: `Cannot cancel order with status: ${order.orderStatus}`
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
        const refundPercentage = policy?.refundPercentage || 65;

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
                        <p>Best regards,<br>DarkCart Team</p>
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
        .populate('orderId', 'orderId totalAmt orderDate orderStatus paymentMethod')
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
            .populate('orderId', 'orderId totalAmt orderDate orderStatus')
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
            .populate('orderId')
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
                        <p>Best regards,<br>DarkCart Team</p>
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
                        <p>Best regards,<br>DarkCart Team</p>
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
