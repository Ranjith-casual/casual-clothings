import { Router } from 'express';
import { registerUserController,refreshToken, userDetails, resetpassword,updateUserDetails, verifyForgotPasswordOtp, forgotPasswordController, verifyEmailController, loginController, logoutController, uploadAvatar, googleSignInController } from '../controllers/user.controllers.js';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/multer.js'; 
import { validateUser, validatePasswordReset } from '../middleware/validationMiddleware.js';
const userRouter = Router();

userRouter.post('/register', validateUser, registerUserController);
userRouter.post('/verify-email', verifyEmailController);
userRouter.post('/login', loginController);
userRouter.post('/google-signin', googleSignInController);
userRouter.get('/logout', auth, logoutController);
userRouter.put('/upload-avatar', auth, upload.single('avatar'), uploadAvatar); 
userRouter.put('/update-user',auth,updateUserDetails)
userRouter.put('/forgot-password',forgotPasswordController)
userRouter.put('/verify-forgot-password-otp',verifyForgotPasswordOtp)
userRouter.put('/reset-password', validatePasswordReset, resetpassword)
userRouter.post('/refresh-token',refreshToken)
userRouter.get('/user-details',auth,userDetails)

export default userRouter;
