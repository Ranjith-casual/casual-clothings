
import Joi from 'joi';

export const validateUser = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
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
    
    next();
  } catch (error) {
    return res.status(500).json({
      message: 'User validation failed',
      error: true,
      success: false
    });
  }
};