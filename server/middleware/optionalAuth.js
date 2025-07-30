import { JWTService } from '../utils/JWTService.js';
import Logger from '../utils/logger.js';

/**
 * Optional authentication middleware
 * Attempts to authenticate the user but allows the request to proceed
 * even if authentication fails. Sets req.userId if authentication succeeds,
 * otherwise sets it to null.
 */
const optionalAuth = async (req, res, next) => {
    try {
        // Get token using centralized method
        const token = JWTService.getTokenFromRequest(req, 'accessToken');
        
        // Log at debug level only
        Logger.debug('OptionalAuth processing', {
            hasToken: !!token,
            source: token ? (req.cookies?.accessToken ? 'cookie' : 'header') : 'none'
        });
        
        if (token) {
            try {
                // Verify the token using our service
                const decoded = await JWTService.verifyAccessToken(token);
                if (decoded) {
                    req.userId = decoded.id;
                    Logger.debug('OptionalAuth successful', { userId: req.userId });
                } else {
                    req.userId = null;
                    Logger.debug('OptionalAuth failed: invalid token');
                }
            } catch (jwtError) {
                // Token is invalid, but continue as guest
                req.userId = null;
                Logger.debug('OptionalAuth token error', { error: jwtError.message });
            }
        } else {
            req.userId = null;
            Logger.debug('OptionalAuth: no token provided');
        }
        
        next();
    } catch (error) {
        // Continue as guest user in case of error
        req.userId = null;
        Logger.error('OptionalAuth unexpected error', { 
            error: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
        next();
    }
};

export default optionalAuth;
