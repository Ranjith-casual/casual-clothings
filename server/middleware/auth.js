import { JWTService } from '../utils/JWTService.js';
import Logger from '../utils/logger.js';

/**
 * Authentication middleware
 * Verifies the access token and sets the user ID in the request object
 */
export const auth = async(req, res, next) => {
    try {
        // Get token from request using centralized method
        const token = JWTService.getTokenFromRequest(req, 'accessToken');

        if(!token){
            return res.status(401).json({
                message: "Authentication required. Please login.",
                error: true,
                success: false,
                code: 'AUTH_REQUIRED'
            });
        }

        try {
            // Verify token using our service
            const decoded = await JWTService.verifyAccessToken(token);
            
            if(!decoded){
                return res.status(401).json({
                    message: "Invalid or expired token. Please login again.",
                    error: true,
                    success: false,
                    code: 'TOKEN_INVALID'
                });
            }
            
            // Set user ID in request for route handlers
            req.userId = decoded.id;
            next();
            
        } catch (jwtError) {
            // Handle JWT specific errors with appropriate status codes
            if (jwtError.name === 'TokenExpiredError') {
                Logger.debug('Token expired', { userId: req.userId });
                return res.status(401).json({
                    message: "Session expired. Please login again.",
                    error: true,
                    success: false,
                    tokenExpired: true,
                    code: 'TOKEN_EXPIRED'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    message: "Invalid authentication token. Please login again.",
                    error: true,
                    success: false,
                    code: 'TOKEN_INVALID'
                });
            } else {
                throw jwtError; // Let the outer catch block handle other JWT errors
            }
        }

    } catch (error) {
        Logger.error("Auth middleware error", { 
            error: error.message, 
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
        });
        return res.status(500).json({
            message: "Authentication failed due to a server error. Please try again.",
            error: true,
            success: false,
            code: 'AUTH_ERROR'
        });
    }
}
export default auth