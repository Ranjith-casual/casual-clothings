import UserModel from "../models/users.model.js";
export const admin = async(request,response,next)=>{
    try {
       const  userId = request.userId

       const user = await UserModel.findById(userId)
       
       if(!user) {
            return response.status(404).json({
                message : "User not found",
                error : true,
                success : false,
                code: 'USER_NOT_FOUND'
            })
       }

       if(user.role !== 'ADMIN'){
            console.log('Normalized role for admin check:', user.role);
            return response.status(403).json({
                message : "Permission denied. Admin access required.",
                error : true,
                success : false,
                code: 'ADMIN_REQUIRED'
            })
       }

       next()

    } catch (error) {
        return response.status(500).json({
            message : "Permission denial",
            error : true,
            success : false
        })
    }
}