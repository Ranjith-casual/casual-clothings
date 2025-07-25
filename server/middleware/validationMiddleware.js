
import Joi from 'joi';

// Strong password regex: 8+ chars, 1 lowercase, 1 uppercase, 1 number, 1 special char
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const validateUser = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .pattern(strongPasswordRegex)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least 8 characters with uppercase, lowercase, number and special character (@$!%*?&)',
          'string.min': 'Password must be at least 8 characters long'
        }),
      confirmPassword: Joi.string().required(),
      role: Joi.string().valid('user', 'admin')
    });
    
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        message: `Validation error: ${error.details[0].message}`,
        error: true,
        success: false
      });
    }

    // Check if passwords match
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({
        message: 'Password and confirm password must match',
        error: true,
        success: false
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      message: 'User validation failed',
      error: true,
      success: false
    });
  }
};

export const validatePasswordReset = (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      newPassword: Joi.string()
        .min(8)
        .pattern(strongPasswordRegex)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least 8 characters with uppercase, lowercase, number and special character (@$!%*?&)',
          'string.min': 'Password must be at least 8 characters long'
        }),
      confirmPassword: Joi.string().required()
    });
    
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        message: `Validation error: ${error.details[0].message}`,
        error: true,
        success: false
      });
    }
    
    // Check if passwords match
    if (req.body.newPassword !== req.body.confirmPassword) {
      return res.status(400).json({
        message: 'New password and confirm password must match',
        error: true,
        success: false
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Password validation failed',
      error: true,
      success: false
    });
  }
};