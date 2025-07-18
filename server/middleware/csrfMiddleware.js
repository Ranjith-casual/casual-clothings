import csrf from 'csurf';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

export const handleCSRFError = (err, req, res, next) => {
  try {
    if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({
        message: 'CSRF token validation failed - Form has been tampered with',
        error: true,
        success: false
      });
    }
    next(err);
  } catch (error) {
    return res.status(500).json({
      message: 'CSRF validation error',
      error: true,
      success: false
    });
  }
};