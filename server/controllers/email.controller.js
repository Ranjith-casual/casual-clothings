import sendEmail from "../config/sendEmail.js";

export const sendRefundEmail = async (request, response) => {
    try {
        const { 
            email, 
            subject, 
            orderNumber, 
            refundAmount, 
            refundPercentage, 
            orderAmount, 
            userName,
            products = [],
            cancellationReason = 'Not provided',
            paymentMethod = 'Not available'
        } = request.body;

        if (!email || !orderNumber || !refundAmount) {
            return response.status(400).json({
                message: "Email, order number, and refund amount are required",
                error: true,
                success: false
            });
        }

        // Create HTML email template for refund notification
        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Refund Processed - Order #${orderNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px 20px; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                    .content { padding: 30px; }
                    .refund-box { background: #f8f9ff; border: 2px solid #e8f0fe; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
                    .refund-amount { font-size: 36px; font-weight: bold; color: #1a73e8; margin: 10px 0; }
                    .order-details { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .detail-label { font-weight: bold; color: #555; }
                    .detail-value { color: #333; }
                    .footer { background: #f8f9fa; text-align: center; padding: 20px; color: #666; font-size: 14px; }
                    .btn { display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                    .success-icon { font-size: 48px; color: #34a853; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="success-icon">✅</div>
                        <h1>Refund Processed Successfully</h1>
                        <p>Your cancellation request has been approved</p>
                    </div>
                    
                    <div class="content">
                        <h2>Dear ${userName},</h2>
                        <p>We have processed your cancellation request for Order #${orderNumber}. Your refund has been approved and will be credited to your original payment method.</p>
                        
                        <div class="refund-box">
                            <h3>Refund Amount</h3>
                            <div class="refund-amount">₹${refundAmount}</div>
                            <p style="color: #666; margin: 0;">${refundPercentage}% of original order amount</p>
                        </div>
                        
                        <div class="order-details">
                            <h3>Order Details</h3>
                            <div class="detail-row">
                                <span class="detail-label">Order Number:</span>
                                <span class="detail-value">#${orderNumber}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Original Amount:</span>
                                <span class="detail-value">₹${orderAmount}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Refund Amount:</span>
                                <span class="detail-value">₹${refundAmount}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Refund Percentage:</span>
                                <span class="detail-value">${refundPercentage}%</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Payment Method:</span>
                                <span class="detail-value">${paymentMethod}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Cancellation Reason:</span>
                                <span class="detail-value">${cancellationReason}</span>
                            </div>
                        </div>
                        
                        <h3>What happens next?</h3>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>Your refund of ₹${refundAmount} will be processed within 5-7 business days</li>
                            <li>The amount will be credited to your original payment method</li>
                            <li>You will receive a confirmation once the refund is completed</li>
                            <li>For any queries, please contact our customer support</li>
                        </ul>
                        
                        <p style="margin-top: 30px;">Thank you for shopping with us. We appreciate your understanding.</p>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/orders" class="btn">View Order History</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p><strong>CASUAL CLOTHINGS</strong></p>
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>If you have any questions, please contact our customer support.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail({
            sendTo: email,
            subject: subject || `Refund Processed for Order #${orderNumber}`,
            html: emailTemplate
        });

        return response.json({
            message: "Refund email sent successfully",
            success: true,
            error: false
        });

    } catch (error) {
        console.error("Error sending refund email:", error);
        return response.status(500).json({
            message: "Failed to send refund email",
            error: true,
            success: false
        });
    }
};
