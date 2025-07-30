import UserModel from "../models/users.model.js";
import sendEmail from "../config/sendEmail.js";
import bcryptjs from "bcryptjs";
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import dotenv from "dotenv";
import { JWTService } from "../utils/JWTService.js";
import Logger from "../utils/logger.js";
import uploadImageClodinary from "../utils/uploadimageCloudnary.js";
import generatedOtp from '../utils/generatedOtp.js'
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
dotenv.config();

export async function registerUserController(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Provide email,name and password",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (user) {
      return res.json({
        message: "Email already exist",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const payload = {
      name,
      email,
      password: hashPassword,
    };

    const newUser = new UserModel(payload);
    const save = await newUser.save();

    // Generate tokens using JWTService
    const accessToken = await JWTService.generateAccessToken(save._id);
    const refreshToken = await JWTService.generateRefreshToken(save._id);
    
    // Set cookies using JWTService
    JWTService.setTokenCookies(res, accessToken, refreshToken);
    
    // Log successful registration
    Logger.info('User registered successfully', { userId: save._id });

    const verifyEmailUrl = `${process.env.FRONT_URL}/verify-email?code=${save._id}`;
    const verifyEmail = await sendEmail({
      sendTo: email,
      subject: "Verification E-mail from Casual Clothing Fashion",
      html: verifyEmailTemplate({
        name,
        url: verifyEmailUrl,
      }),
    });

    return res.json({
      message: "User Created Successfully",
      error: false,
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: save._id,
          name: save.name,
          email: save.email
        }
      }
    });
  } catch (error) {
    Logger.error('Registration error', { error: error.message });
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function verifyEmailController(req, res) {
  try {
    const code = req.body;

    const id = await UserModel.findOne({ _id: code });
    if (!id) {
      Logger.warn('Invalid user verification attempt', { code });
      return res.status(400).json({
        message: "Not a valid user",
        error: true,
        success: false,
      });
    }

    const updateUser = await UserModel.updateOne(
      {
        _id: code,
      },
      {
        verify_email: true,
      }
    );

    Logger.info('User email verified successfully', { userId: code });
    
    return res.json({
      message: "Verified Successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    Logger.error('Email verification error', { error: error.message });
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    if(!email || !password){
        return res.status(400).json({
            message: "Please provide the inputs required",
            error: true,
            success: false,
        })
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid mail ID",
        error: true,
        success: false,
      });
    }

    if (user.status !== "Active") {
      return res.status(400).json({
        message: "Contact with Admin",
        error: true,
        success: false,
      });
    }

    const chkPassword = await bcryptjs.compare(password, user.password);

    if (!chkPassword) {
      return res.status(400).json({
        message: "Make sure your password is correct",
        error: true,
        success: false,
      });
    }

    const updateuser = await UserModel.findByIdAndUpdate(user?._id, {
      last_login_date: new Date()
      });

    // Use JWTService to generate tokens
    const accessToken = await JWTService.generateAccessToken(user._id);
    const refreshToken = await JWTService.generateRefreshToken(user._id);
    
    // Set cookies using JWTService
    JWTService.setTokenCookies(res, accessToken, refreshToken);
    
    // Log successful login
    Logger.info('User login successful', { userId: user._id });

   return res.json({
        message:"User login Successfully",
        error : false,
        success : true,
        data : {
            accessToken,
            refreshToken
        }
    })

  } catch (error) {
    Logger.error('Login error', { error: error.message });
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function logoutController(req, res) {
    try {
        const userId = req.userId;
        
        // Use JWTService to clear cookies
        JWTService.clearTokenCookies(res);
        
        // Use JWTService to invalidate all tokens
        await JWTService.invalidateAllTokens(userId);
        
        // Log the successful logout
        Logger.info('User logged out successfully', { userId });

        return res.json({
            message : "Logout Successfully",
            error:false,
            success: true
        })

    } catch (error) {
        Logger.error('Logout error', { error: error.message });
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async  function uploadAvatar(request,response){
  try {
      const userId = request.userId // auth middlware
      const image = request.file  // multer middleware

      const upload = await uploadImageClodinary(image)
      
      const updateUser = await UserModel.findByIdAndUpdate(userId,{
          avatar : upload.url
      })

      return response.json({
          message : "upload profile",
          success : true,
          error : false,
          data : {
              _id : userId,
              avatar : upload.url
          }
      })

  } catch (error) {
      Logger.error('Upload avatar error', { error: error.message });
      return response.status(500).json({
          message : error.message || error,
          error : true,
          success : false
      })
  }
}

export async function updateUserDetails(request,response){
  try {
      const userId = request.userId //auth middleware
      const { name, email, mobile, password } = request.body 

      let hashPassword = ""

      if(password){
          // Validate password strength if password is being updated
          const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          
          if (!strongPasswordRegex.test(password)) {
              return response.status(400).json({
                  message: "Password must contain at least 8 characters with uppercase, lowercase, number and special character (@$!%*?&)",
                  error: true,
                  success: false
              });
          }

          const salt = await bcryptjs.genSalt(10)
          hashPassword = await bcryptjs.hash(password,salt)
      }

      const updateUser = await UserModel.updateOne({ _id : userId},{
          ...(name && { name : name }),
          ...(email && { email : email }),
          ...(mobile && { mobile : mobile }),
          ...(password && { password : hashPassword })
      })

      return response.json({
          message : "Updated successfully",
          error : false,
          success : true,
          data : updateUser
      })


  } catch (error) {
      Logger.error('Update user details error', { error: error.message });
      return response.status(500).json({
          message : error.message || error,
          error : true,
          success : false
      })
  }
}

export async function forgotPasswordController(request,response) {
  try {
      const { email } = request.body 

      const user = await UserModel.findOne({ email })

      if(!user){
          Logger.warn('Password reset attempt with invalid email', { email });
          return response.status(400).json({
              message : "Email not available",
              error : true,
              success : false
          })
      }

      const otp = generatedOtp()
      const expireTime = new Date() + 60 * 60 * 1000 // 1hr

      const update = await UserModel.findByIdAndUpdate(user._id,{
        forgot_password_otp : otp,
          forgot_password_expiry : new Date(expireTime).toISOString()
      })

      await sendEmail({
          sendTo : email,
          subject : "Forgot password from Casual Clothing Fashion",
          html : forgotPasswordTemplate({
              name : user.name,
              otp : otp
          })
      })

      Logger.info('Password reset OTP sent', { userId: user._id });
      
      return response.json({
          message : "check your email",
          error : false,
          success : true
      })

  } catch (error) {
      Logger.error('Forgot password error', { error: error.message });
      return response.status(500).json({
          message : error.message || error,
          error : true,
          success : false
      })
  }
}

export async function verifyForgotPasswordOtp(request,response){
  try {
      const { email , otp }  = request.body

      if(!email || !otp){
          Logger.warn('OTP verification missing required fields');
          return response.status(400).json({
              message : "Provide required field email, otp.",
              error : true,
              success : false
          })
      }

      const user = await UserModel.findOne({ email })

      if(!user){
          Logger.warn('OTP verification attempt with invalid email', { email });
          return response.status(400).json({
              message : "Email not available",
              error : true,
              success : false
          })
      }

      const currentTime = new Date().toISOString()

      if(user.forgot_password_expiry < currentTime  ){
          Logger.warn('Expired OTP used', { userId: user._id });
          return response.status(400).json({
              message : "Otp is expired",
              error : true,
              success : false
          })
      }

      if(otp !== user.forgot_password_otp){
          Logger.warn('Invalid OTP attempt', { userId: user._id });
          return response.status(400).json({
              message : "Invalid otp",
              error : true,
              success : false
          })
      }

      //if otp is not expired
      //otp === user.forgot_password_otp

      const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
          forgot_password_otp : "",
          forgot_password_expiry : ""
      })
      
      Logger.info('OTP verification successful', { userId: user._id });
      
      return response.json({
          message : "Verify otp successfully",
          error : false,
          success : true
      })

  } catch (error) {
      Logger.error('OTP verification error', { error: error.message });
      return response.status(500).json({
          message : error.message || error,
          error : true,
          success : false
      })
  }
}

export async function resetpassword(request,response){
  try {
      const { email , newPassword, confirmPassword } = request.body 

      if(!email || !newPassword || !confirmPassword){
          Logger.warn('Password reset attempt missing required fields');
          return response.status(400).json({
              message : "provide required fields email, newPassword, confirmPassword"
          })
      }

      const user = await UserModel.findOne({ email })

      if(!user){
          Logger.warn('Password reset attempt with invalid email', { email });
          return response.status(400).json({
              message : "Email is not available",
              error : true,
              success : false
          })
      }

      if(newPassword !== confirmPassword){
          Logger.warn('Password reset attempt with mismatched passwords', { userId: user._id });
          return response.status(400).json({
              message : "newPassword and confirmPassword must be same.",
              error : true,
              success : false,
          })
      }

      const salt = await bcryptjs.genSalt(10)
      const hashPassword = await bcryptjs.hash(newPassword,salt)

      const update = await UserModel.findOneAndUpdate(user._id,{
          password : hashPassword
      })

      // After password reset, invalidate all existing tokens for security
      await JWTService.invalidateAllTokens(user._id);
      
      Logger.info('Password reset successful', { userId: user._id });

      return response.json({
          message : "Password updated successfully.",
          error : false,
          success : true
      })

  } catch (error) {
      Logger.error('Password reset error', { error: error.message });
      return response.status(500).json({
          message : error.message || error,
          error : true,
          success : false
      })
  }
}

export async function refreshToken(request, response) {
  try {
      // Use JWTService to get the token
      const refreshToken = JWTService.getTokenFromRequest(request, 'refreshToken');

      if (!refreshToken) {
          return response.status(401).json({
              message: "Refresh token is required",
              error: true,
              success: false,
              code: 'TOKEN_MISSING'
          });
      }

      // Use JWTService to verify the token and get the user
      const result = await JWTService.verifyRefreshToken(refreshToken);

      if (!result) {
          return response.status(401).json({
              message: "Invalid or expired refresh token",
              error: true,
              success: false,
              code: 'TOKEN_INVALID'
          });
      }

      const { decoded, user } = result;
      const userId = decoded.id;
      
      // Generate new tokens
      const newAccessToken = await JWTService.generateAccessToken(userId);
      const newRefreshToken = await JWTService.generateRefreshToken(userId);
      
      // Set cookies using JWTService
      JWTService.setTokenCookies(response, newAccessToken, newRefreshToken);

      // Log the successful token refresh
      Logger.info('Token refreshed successfully', { userId });

      return response.json({
          message: "Authentication tokens refreshed successfully",
          error: false,
          success: true,
          data: {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken
          }
      });


  } catch (error) {
      Logger.error('Token refresh error', { 
          error: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
      
      return response.status(500).json({
          message: "Failed to refresh authentication tokens",
          error: true,
          success: false,
          code: 'REFRESH_ERROR'
      });
  }
}

export async function userDetails(request,response){
  try {
      const userId  = request.userId

      const user = await UserModel.findById(userId).select('-password -refresh_token')

      return response.json({
          message : 'user details',
          data : user,
          error : false,
          success : true
      })
  } catch (error) {
      Logger.error('Get user details error', { error: error.message });
      return response.status(500).json({
          message : "Something is wrong",
          error : true,
          success : false
      })
  }
}

export async function googleSignInController(req, res) {
  try {
    const { name, email, photoURL, uid } = req.body;

    if (!name || !email || !uid) {
      return res.status(400).json({
        message: "Name, email, and uid are required",
        error: true,
        success: false,
      });
    }

    let user = await UserModel.findOne({ email });

    if (user) {
      const updateUser = await UserModel.findByIdAndUpdate(user._id, {
        last_login_date: new Date(),
        ...(photoURL && { avatar: photoURL }),
      });

      // Use JWTService to generate tokens
      const accessToken = await JWTService.generateAccessToken(user._id);
      const refreshToken = await JWTService.generateRefreshToken(user._id);

      // Set cookies using JWTService
      JWTService.setTokenCookies(res, accessToken, refreshToken);

      // Log successful Google sign-in
      Logger.info('Google sign-in successful for existing user', { userId: user._id });

      return res.json({
        message: "Login successful",
        error: false,
        success: true,
        data: {
          accessToken,
          refreshToken,
        },
      });
    } else {
      const newUser = new UserModel({
        name,
        email,
        password: uid,
        avatar: photoURL || "",
        verify_email: true,
        google_id: uid,
      });

      const savedUser = await newUser.save();

      // Use JWTService to generate tokens
      const accessToken = await JWTService.generateAccessToken(savedUser._id);
      const refreshToken = await JWTService.generateRefreshToken(savedUser._id);

      // Set cookies using JWTService
      JWTService.setTokenCookies(res, accessToken, refreshToken);

      // Log successful Google account creation
      Logger.info('Google account created and signed in', { userId: savedUser._id });

      return res.json({
        message: "Account created and logged in successfully",
        error: false,
        success: true,
        data: {
          accessToken,
          refreshToken,
        },
      });
    }
  } catch (error) {
    Logger.error('Google sign-in error', { error: error.message });
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

