import jwt from 'jsonwebtoken'

export const auth = async(req,res,next)=>{
    try {
        
        const token = req.cookies.accessToken || req?.headers?.authorization?.split(" ")[1]

        if(!token){
            return res.status(401).json({
                message: "Provide a valid access token",
                error : true,
                success :false
            })
        }

        try {
            const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
            
            if(!decode){
                return res.status(401).json({
                    message : "Provided token expired",
                    error : true,
                    success : false
                })
            }
            
            req.userId = decode.id;
            next();
            
        } catch (jwtError) {
            // Handle JWT specific errors with appropriate status codes
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: "JWT token has expired. Please login again.",
                    error: true,
                    success: false,
                    tokenExpired: true
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    message: "Invalid JWT token. Please login again.",
                    error: true,
                    success: false
                });
            } else {
                throw jwtError; // Let the outer catch block handle other JWT errors
            }
        }

    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            message : "Authentication error: " + (error.message || "Unknown error"),
            error : true,
            success : false
        })
    }
}
export default auth