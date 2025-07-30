import crypto from 'crypto';
import UserModel from '../models/users.model.js';
import mongoose from 'mongoose';

// Enhanced admin permission middleware
export const enhancedAdminAuth = async (req, res, next) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findById(userId).select('role status');
        
        // Check if user exists and is active
        if (!user) {
            return res.status(401).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({
                message: "Account is not active",
                error: true,
                success: false
            });
        }

        // Strict role checking
        if (!user.role || user.role !== 'ADMIN') {
            return res.status(403).json({
                message: "Insufficient permissions - Admin access required",
                error: true,
                success: false
            });
        }

        // Log admin actions for security audit
        const Logger = (await import('../utils/logger.js')).default;
        Logger.info('AdminAuth', `ADMIN ACTION: User ${userId} accessing ${req.method} ${req.path}`);
        
        next();

    } catch (error) {
        const Logger = (await import('../utils/logger.js')).default;
        Logger.error('AdminAuth', "Enhanced admin auth error", error);
        return res.status(500).json({
            message: "Authorization check failed",
            error: true,
            success: false
        });
    }
};

// Resource ownership validation
export const validateResourceOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            const resourceId = req.params.id || req.body.orderId || req.body.userId;
            
            if (!resourceId) {
                return res.status(400).json({
                    message: "Resource ID required",
                    error: true,
                    success: false
                });
            }

            let resource;
            
            switch (resourceType) {
                case 'order':
                    // Dynamically import order model to avoid circular dependencies
                    const orderModel = mongoose.model('order');
                    resource = await orderModel.findOne({ 
                        _id: resourceId, 
                        userId: userId 
                    });
                    break;
                case 'cart':
                    // Dynamically import cart model to avoid circular dependencies
                    const CartProductModel = mongoose.model('cartproduct');
                    resource = await CartProductModel.findOne({ 
                        _id: resourceId, 
                        userId: userId 
                    });
                    break;
                default:
                    return res.status(400).json({
                        message: "Invalid resource type",
                        error: true,
                        success: false
                    });
            }

            if (!resource) {
                return res.status(404).json({
                    message: "Resource not found or access denied",
                    error: true,
                    success: false
                });
            }

            req.resource = resource;
            next();

        } catch (error) {
            console.error("Resource ownership validation error:", error);
            return res.status(500).json({
                message: "Resource validation failed",
                error: true,
                success: false
            });
        }
    };
};

// Generate secure tokens
export const generateSecureToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

export default {
    enhancedAdminAuth,
    validateResourceOwnership,
    generateSecureToken
};
