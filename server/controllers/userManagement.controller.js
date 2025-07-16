import UserModel from '../models/users.model.js'
import OrderModel from '../models/order.model.js'
import bcryptjs from 'bcryptjs'

// Get all users with pagination and filters
async function getAllUsers(request, response) {
    try {
        const { page = 1, limit = 10, search, role, status } = request.body

        // Build query object
        let query = {}

        // Add search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }

        // Add role filter
        if (role && role !== 'all') {
            query.role = role
        }

        // Add status filter
        if (status && status !== 'all') {
            query.status = status
        }

        // Calculate pagination
        const skip = (page - 1) * limit
        const totalUsers = await UserModel.countDocuments(query)
        const totalPages = Math.ceil(totalUsers / limit)

        // Fetch users
        const users = await UserModel.find(query)
            .select('-password -refreshToken')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))

        response.status(200).json({
            message: "Users fetched successfully",
            success: true,
            data: {
                users,
                totalUsers,
                totalPages,
                currentPage: parseInt(page),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        })

    } catch (error) {
        response.status(500).json({
            message: error.message || "Internal server error",
            success: false
        })
    }
}

// Get user details by ID
async function getUserDetails(request, response) {
    try {
        const { userId } = request.body

        if (!userId) {
            return response.status(400).json({
                message: "User ID is required",
                success: false
            })
        }

        const user = await UserModel.findById(userId)
            .select('-password -refreshToken')
            .populate('address_details')

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                success: false
            })
        }

        response.status(200).json({
            message: "User details fetched successfully",
            success: true,
            data: user
        })

    } catch (error) {
        response.status(500).json({
            message: error.message || "Internal server error",
            success: false
        })
    }
}

// Get user order history
async function getUserOrderHistory(request, response) {
    try {
        const { userId } = request.body

        if (!userId) {
            return response.status(400).json({
                message: "User ID is required",
                success: false
            })
        }

        const orders = await OrderModel.find({ userId })
            .populate({
                path: 'items.productId',
                select: 'name price image'
            })
            .populate({
                path: 'items.bundleId',
                select: 'title bundlePrice image'
            })
            .populate('deliveryAddress')
            .sort({ createdAt: -1 })
            .limit(50) // Limit to last 50 orders

        response.status(200).json({
            message: "User order history fetched successfully",
            success: true,
            data: orders
        })

    } catch (error) {
        response.status(500).json({
            message: error.message || "Internal server error",
            success: false
        })
    }
}

// Toggle user status (active/blocked)
async function toggleUserStatus(request, response) {
    try {
        const { userId, status } = request.body

        if (!userId || !status) {
            return response.status(400).json({
                message: "User ID and status are required",
                success: false
            })
        }

        if (!['active', 'blocked'].includes(status)) {
            return response.status(400).json({
                message: "Invalid status. Must be 'active' or 'blocked'",
                success: false
            })
        }

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
        ).select('-password -refreshToken')

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                success: false
            })
        }

        response.status(200).json({
            message: `User ${status === 'active' ? 'unblocked' : 'blocked'} successfully`,
            success: true,
            data: user
        })

    } catch (error) {
        response.status(500).json({
            message: error.message || "Internal server error",
            success: false
        })
    }
}

// Update user role
async function updateUserRole(request, response) {
    try {
        const { userId, role } = request.body

        if (!userId || !role) {
            return response.status(400).json({
                message: "User ID and role are required",
                success: false
            })
        }

        if (!['ADMIN', 'SELLER', 'BUYER'].includes(role)) {
            return response.status(400).json({
                message: "Invalid role. Must be 'ADMIN', 'SELLER', or 'BUYER'",
                success: false
            })
        }

        // Prevent changing the role of the requesting admin
        if (userId === request.userId && role !== 'ADMIN') {
            return response.status(400).json({
                message: "Cannot change your own admin role",
                success: false
            })
        }

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password -refreshToken')

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                success: false
            })
        }

        response.status(200).json({
            message: "User role updated successfully",
            success: true,
            data: user
        })

    } catch (error) {
        response.status(500).json({
            message: error.message || "Internal server error",
            success: false
        })
    }
}

// Update user details
async function updateUserDetails(request, response) {
    try {
        const { userId, name, email, mobile } = request.body

        if (!userId) {
            return response.status(400).json({
                message: "User ID is required",
                success: false
            })
        }

        const updateData = {}
        if (name) updateData.name = name
        if (email) updateData.email = email
        if (mobile) updateData.mobile = mobile

        // Check if email already exists (if email is being updated)
        if (email) {
            const existingUser = await UserModel.findOne({ 
                email, 
                _id: { $ne: userId } 
            })
            
            if (existingUser) {
                return response.status(400).json({
                    message: "Email already exists",
                    success: false
                })
            }
        }

        const user = await UserModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password -refreshToken')

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                success: false
            })
        }

        response.status(200).json({
            message: "User details updated successfully",
            success: true,
            data: user
        })

    } catch (error) {
        response.status(500).json({
            message: error.message || "Internal server error",
            success: false
        })
    }
}

// Delete user (soft delete by setting status to inactive)
async function deleteUser(request, response) {
    try {
        const { userId } = request.body

        if (!userId) {
            return response.status(400).json({
                message: "User ID is required",
                success: false
            })
        }

        // Prevent deleting the requesting admin
        if (userId === request.userId) {
            return response.status(400).json({
                message: "Cannot delete your own account",
                success: false
            })
        }

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { 
                status: 'deleted',
                email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
            },
            { new: true }
        ).select('-password -refreshToken')

        if (!user) {
            return response.status(404).json({
                message: "User not found",
                success: false
            })
        }

        response.status(200).json({
            message: "User deleted successfully",
            success: true,
            data: user
        })

    } catch (error) {
        response.status(500).json({
            message: error.message || "Internal server error",
            success: false
        })
    }
}

// Get user statistics
async function getUserStats(request, response) {
    try {
        const totalUsers = await UserModel.countDocuments({ status: { $ne: 'deleted' } })
        const activeUsers = await UserModel.countDocuments({ status: 'active' })
        const blockedUsers = await UserModel.countDocuments({ status: 'blocked' })
        
        const adminCount = await UserModel.countDocuments({ role: 'ADMIN', status: { $ne: 'deleted' } })
        const sellerCount = await UserModel.countDocuments({ role: 'SELLER', status: { $ne: 'deleted' } })
        const buyerCount = await UserModel.countDocuments({ role: 'BUYER', status: { $ne: 'deleted' } })

        // Recent registrations (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recentRegistrations = await UserModel.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
            status: { $ne: 'deleted' }
        })

        response.status(200).json({
            message: "User statistics fetched successfully",
            success: true,
            data: {
                totalUsers,
                activeUsers,
                blockedUsers,
                roleDistribution: {
                    admins: adminCount,
                    sellers: sellerCount,
                    buyers: buyerCount
                },
                recentRegistrations
            }
        })

    } catch (error) {
        response.status(500).json({
            message: error.message || "Internal server error",
            success: false
        })
    }
}

export {
    getAllUsers,
    getUserDetails,
    getUserOrderHistory,
    toggleUserStatus,
    updateUserRole,
    updateUserDetails,
    deleteUser,
    getUserStats
}
