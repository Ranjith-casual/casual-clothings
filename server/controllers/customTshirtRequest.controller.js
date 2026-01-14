import CustomTshirtRequestModel from "../models/customTshirtRequest.model.js";
import sendEmail from "../config/sendEmail.js";

// Create custom t-shirt request
export const createCustomTshirtRequest = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            tshirtType,
            color,
            size,
            designDescription,
            uploadedImage,
            preferredDeliveryDate,
            genders,
            genderImages
        } = req.body;

        // Check if user is authenticated
        if (!req.userId) {
            return res.status(401).json({
                message: "Authentication required to create custom t-shirt request",
                error: true,
                success: false
            });
        }

        // Validate required fields
        if (!name || !email || !phone || !tshirtType || !color || !size || !designDescription || !preferredDeliveryDate) {
            return res.status(400).json({
                message: "All required fields must be provided",
                error: true,
                success: false
            });
        }

        // Validate genders
        if (!genders || !Array.isArray(genders) || genders.length === 0) {
            return res.status(400).json({
                message: "At least one gender option must be selected",
                error: true,
                success: false
            });
        }

        // Validate delivery date is in the future
        const deliveryDate = new Date(preferredDeliveryDate);
        const currentDate = new Date();
        if (deliveryDate <= currentDate) {
            return res.status(400).json({
                message: "Preferred delivery date must be in the future",
                error: true,
                success: false
            });
        }

        // Create new request
        console.log('Creating custom t-shirt request...');
        console.log('User ID from auth middleware:', req.userId);
        console.log('Request body:', req.body);
        
        const customRequest = new CustomTshirtRequestModel({
            userId: req.userId, // Always use authenticated user ID
            name,
            email,
            phone,
            tshirtType,
            color,
            size,
            designDescription,
            uploadedImage: uploadedImage || "",
            preferredDeliveryDate: deliveryDate,
            genders,
            genderImages: genderImages || {}
        });

        console.log('Custom request object before save:', {
            userId: customRequest.userId,
            name: customRequest.name,
            email: customRequest.email
        });

        const savedRequest = await customRequest.save();
        
        console.log('Saved request:', {
            id: savedRequest._id,
            userId: savedRequest.userId,
            name: savedRequest.name
        });

        // Send confirmation email to customer
        try {
            await sendEmail({
                sendTo: email,
                subject: "Custom T-Shirt Request Received - CasualClothings",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Thank you for your custom t-shirt request!</h2>
                        <p>Hi ${name},</p>
                        <p>We have received your custom t-shirt request and our team will review it within 24-48 hours.</p>
                        
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Request Details:</h3>
                            <p><strong>Request ID:</strong> ${savedRequest._id}</p>
                            <p><strong>T-Shirt Type:</strong> ${tshirtType}</p>
                            <p><strong>Color:</strong> ${color}</p>
                            <p><strong>Size:</strong> ${size}</p>
                            <p><strong>Gender Options:</strong> ${genders.join(', ')}</p>
                            <p><strong>Design Description:</strong> ${designDescription}</p>
                            <p><strong>Preferred Delivery Date:</strong> ${deliveryDate.toLocaleDateString()}</p>
                        </div>
                        
                        <p>You can track your request status or contact us via WhatsApp for any queries.</p>
                        
                        <p style="margin-top: 30px;">
                            Best regards,<br>
                            CasualClothings Team
                        </p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
        }

        return res.json({
            message: "Custom t-shirt request submitted successfully",
            data: savedRequest,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get all custom t-shirt requests (Admin)
export const getAllCustomTshirtRequests = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status = '',
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.body;

        // Build filter
        const filter = {};
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { designDescription: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const requests = await CustomTshirtRequestModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const totalRequests = await CustomTshirtRequestModel.countDocuments(filter);

        // Get status counts for dashboard
        const statusCounts = await CustomTshirtRequestModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusSummary = {
            Pending: 0,
            Accepted: 0,
            Rejected: 0,
            "In Production": 0,
            Completed: 0
        };

        statusCounts.forEach(item => {
            statusSummary[item._id] = item.count;
        });

        return res.json({
            message: "Custom t-shirt requests fetched successfully",
            data: requests,
            totalRequests,
            totalPages: Math.ceil(totalRequests / limit),
            currentPage: parseInt(page),
            statusSummary,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Update custom t-shirt request status (Admin)
export const updateCustomTshirtRequestStatus = async (req, res) => {
    try {
        const { 
            requestId, 
            status, 
            adminNotes = '', 
            estimatedPrice = 0, 
            rejectionReason = '' 
        } = req.body;

        if (!requestId || !status) {
            return res.status(400).json({
                message: "Request ID and status are required",
                error: true,
                success: false
            });
        }

        const validStatuses = ['Pending', 'Accepted', 'Rejected', 'In Production', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status",
                error: true,
                success: false
            });
        }

        const updateData = {
            status,
            adminNotes
        };

        if (status === 'Accepted') {
            updateData.acceptedAt = new Date();
            updateData.estimatedPrice = estimatedPrice;
        }

        if (status === 'Rejected') {
            updateData.rejectionReason = rejectionReason;
        }

        if (status === 'Completed') {
            updateData.completedAt = new Date();
        }

        const updatedRequest = await CustomTshirtRequestModel.findByIdAndUpdate(
            requestId,
            updateData,
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({
                message: "Custom t-shirt request not found",
                error: true,
                success: false
            });
        }

        // Send status update email to customer
        try {
            let emailSubject = `Custom T-Shirt Request Status Update - ${status}`;
            let emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Your Custom T-Shirt Request Status Update</h2>
                    <p>Hi ${updatedRequest.name},</p>
                    <p>Your custom t-shirt request (ID: ${updatedRequest._id}) status has been updated to: <strong>${status}</strong></p>
            `;

            if (status === 'Accepted') {
                emailContent += `
                    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Great news!</strong> Your request has been accepted.</p>
                        ${estimatedPrice > 0 ? `<p><strong>Estimated Price:</strong> ₹${estimatedPrice}</p>` : ''}
                        <p>We will start working on your custom t-shirt soon.</p>
                    </div>
                `;
            } else if (status === 'Rejected') {
                emailContent += `
                    <div style="background-color: #ffe8e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p>Unfortunately, we cannot proceed with your request at this time.</p>
                        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
                        <p>Feel free to submit a new request with modifications.</p>
                    </div>
                `;
            } else if (status === 'In Production') {
                emailContent += `
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p>Your custom t-shirt is now in production!</p>
                        <p>Expected delivery: ${updatedRequest.preferredDeliveryDate.toLocaleDateString()}</p>
                    </div>
                `;
            } else if (status === 'Completed') {
                emailContent += `
                    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Your custom t-shirt is ready!</strong></p>
                        <p>Please contact us to arrange delivery or pickup.</p>
                    </div>
                `;
            }

            if (adminNotes) {
                emailContent += `<p><strong>Additional Notes:</strong> ${adminNotes}</p>`;
            }

            emailContent += `
                    <p>For any questions, feel free to contact us via WhatsApp.</p>
                    <p style="margin-top: 30px;">
                        Best regards,<br>
                        CasualClothings Team
                    </p>
                </div>
            `;

            await sendEmail({
                sendTo: updatedRequest.email,
                subject: emailSubject,
                html: emailContent
            });
        } catch (emailError) {
            console.error("Failed to send status update email:", emailError);
        }

        return res.json({
            message: "Custom t-shirt request status updated successfully",
            data: updatedRequest,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get single custom t-shirt request
export const getCustomTshirtRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await CustomTshirtRequestModel.findById(requestId);

        if (!request) {
            return res.status(404).json({
                message: "Custom t-shirt request not found",
                error: true,
                success: false
            });
        }

        return res.json({
            message: "Custom t-shirt request fetched successfully",
            data: request,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Delete custom t-shirt request (Admin)
export const deleteCustomTshirtRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const deletedRequest = await CustomTshirtRequestModel.findByIdAndDelete(requestId);

        if (!deletedRequest) {
            return res.status(404).json({
                message: "Custom t-shirt request not found",
                error: true,
                success: false
            });
        }

        return res.json({
            message: "Custom t-shirt request deleted successfully",
            data: deletedRequest,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get dashboard statistics (Admin)
export const getCustomTshirtDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

        // Total requests
        const totalRequests = await CustomTshirtRequestModel.countDocuments();

        // This month's requests
        const monthlyRequests = await CustomTshirtRequestModel.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        // This week's requests
        const weeklyRequests = await CustomTshirtRequestModel.countDocuments({
            createdAt: { $gte: startOfWeek }
        });

        // Status breakdown
        const statusBreakdown = await CustomTshirtRequestModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Gender distribution
        const genderStats = await CustomTshirtRequestModel.aggregate([
            { $unwind: "$genders" },
            {
                $group: {
                    _id: "$genders",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Popular t-shirt types
        const tshirtTypeStats = await CustomTshirtRequestModel.aggregate([
            {
                $group: {
                    _id: "$tshirtType",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Popular colors
        const colorStats = await CustomTshirtRequestModel.aggregate([
            {
                $group: {
                    _id: "$color",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Revenue estimate (only from accepted/completed orders)
        const revenueStats = await CustomTshirtRequestModel.aggregate([
            {
                $match: {
                    status: { $in: ['Accepted', 'In Production', 'Completed'] },
                    estimatedPrice: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$estimatedPrice" },
                    averageOrder: { $avg: "$estimatedPrice" }
                }
            }
        ]);

        // Recent requests
        const recentRequests = await CustomTshirtRequestModel
            .find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email status createdAt estimatedPrice');

        return res.json({
            message: "Dashboard statistics fetched successfully",
            data: {
                overview: {
                    totalRequests,
                    monthlyRequests,
                    weeklyRequests
                },
                statusBreakdown,
                genderStats,
                tshirtTypeStats,
                colorStats,
                revenue: revenueStats[0] || { totalRevenue: 0, averageOrder: 0 },
                recentRequests
            },
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Export requests to CSV (Admin)
export const exportCustomTshirtRequests = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const requests = await CustomTshirtRequestModel.find(filter).sort({ createdAt: -1 });

        // Convert to CSV format
        const csvHeader = [
            'Request ID',
            'Name',
            'Email',
            'Phone',
            'T-Shirt Type',
            'Color',
            'Size',
            'Genders',
            'Design Description',
            'Status',
            'Estimated Price',
            'Preferred Delivery Date',
            'Created At',
            'Admin Notes'
        ].join(',');

        const csvRows = requests.map(request => [
            request._id,
            request.name,
            request.email,
            request.phone,
            request.tshirtType,
            request.color,
            request.size,
            request.genders.join('; '),
            `"${request.designDescription.replace(/"/g, '""')}"`,
            request.status,
            request.estimatedPrice || 0,
            request.preferredDeliveryDate.toLocaleDateString(),
            request.createdAt.toLocaleDateString(),
            `"${(request.adminNotes || '').replace(/"/g, '""')}"`
        ].join(','));

        const csvContent = [csvHeader, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=custom_tshirt_requests.csv');
        
        return res.send(csvContent);

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Bulk update status (Admin)
export const bulkUpdateCustomTshirtRequests = async (req, res) => {
    try {
        const { requestIds, status, adminNotes } = req.body;

        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({
                message: "Request IDs array is required",
                error: true,
                success: false
            });
        }

        const validStatuses = ['Pending', 'Accepted', 'Rejected', 'In Production', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status",
                error: true,
                success: false
            });
        }

        const updateData = { status };
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
        }

        if (status === 'Accepted') {
            updateData.acceptedAt = new Date();
        } else if (status === 'Completed') {
            updateData.completedAt = new Date();
        }

        const result = await CustomTshirtRequestModel.updateMany(
            { _id: { $in: requestIds } },
            updateData
        );

        return res.json({
            message: `${result.modifiedCount} requests updated successfully`,
            data: { modifiedCount: result.modifiedCount },
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get user's own custom t-shirt requests
export const getUserCustomTshirtRequests = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        console.log('getUserCustomTshirtRequests called');
        console.log('User ID from auth middleware:', userId);

        if (!userId) {
            console.log('No user ID provided, returning 401');
            return res.status(401).json({
                message: "User authentication required",
                error: true,
                success: false
            });
        }

        // Find all requests by this user
        console.log('Searching for requests with userId:', userId);
        const requests = await CustomTshirtRequestModel.find({
            userId: userId
        }).sort({ createdAt: -1 }); // Sort by newest first

        console.log('Found requests:', requests.length);
        console.log('Requests details:', requests.map(r => ({ id: r._id, userId: r.userId, name: r.name })));

        return res.json({
            message: "User custom t-shirt requests retrieved successfully",
            data: requests,
            error: false,
            success: true
        });

    } catch (error) {
        console.error('Error in getUserCustomTshirtRequests:', error);
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};
