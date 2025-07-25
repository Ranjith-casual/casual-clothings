import jwt from 'jsonwebtoken';

// Optional authentication middleware - adds user info if available but doesn't require auth
const optionalAuth = (req, res, next) => {
    try {
        console.log('=== OptionalAuth Middleware Debug ===');
        console.log('Cookies:', req.cookies);
        console.log('Authorization header:', req.headers?.authorization);
        
        const tokenFromCookie = req.cookies?.accessToken;
        const authHeader = req.headers?.authorization;
        const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.split(" ")[1] : null;
        
        console.log('Token from cookie:', tokenFromCookie);
        console.log('Token from header:', tokenFromHeader);
        
        const token = tokenFromCookie || tokenFromHeader;
        console.log('Final token to use:', token ? 'TOKEN_FOUND' : 'NO_TOKEN');
        
        if (token) {
            try {
                const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
                req.userId = decode.id;
                console.log('OptionalAuth: User authenticated with ID:', req.userId);
                console.log('Token decode result:', { id: decode.id, iat: decode.iat, exp: decode.exp });
            } catch (jwtError) {
                // Token is invalid, but continue as guest
                req.userId = null;
                console.log('OptionalAuth: Invalid token, continuing as guest. Error:', jwtError.message);
            }
        } else {
            req.userId = null;
            console.log('OptionalAuth: No token found, continuing as guest');
        }
        
        console.log('Final req.userId:', req.userId);
        console.log('=== End OptionalAuth Debug ===\n');
        next();
    } catch (error) {
        // Continue as guest user
        req.userId = null;
        console.log('OptionalAuth: Error processing token, continuing as guest:', error.message);
        next();
    }
};

export default optionalAuth;
