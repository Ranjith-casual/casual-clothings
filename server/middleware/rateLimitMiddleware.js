import rateLimit from 'express-rate-limit';

// Basic rate limiter
export const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
    error: true,
    success: false
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login/register attempts per windowMs
  message: {
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    error: true,
    success: false
  },
  standardHeaders: true,
  legacyHeaders: false
});