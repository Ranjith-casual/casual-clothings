import Logger from '../utils/logger.js';

export const securityHeaders = (req, res, next) => {
  try {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Enhanced CSP that properly allows necessary resources while maintaining security
    const isDevelopment = process.env.NODE_ENV === 'development';
    const frontendUrl = process.env.FRONT_URL || 'http://localhost:3000';
    
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' ${isDevelopment ? "'unsafe-eval'" : ""} 'unsafe-inline' https://apis.google.com https://accounts.google.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${frontendUrl} https: wss: ws:`,
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "media-src 'self' data: https:",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "form-action 'self'",
      "base-uri 'self'",
      "manifest-src 'self'",
      isDevelopment ? "upgrade-insecure-requests" : ""
    ].filter(Boolean).join('; ');
    
    res.setHeader('Content-Security-Policy', cspDirectives);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    
    Logger.debug('Security headers applied successfully', { 
      path: req.path,
      method: req.method,
      environment: process.env.NODE_ENV 
    });
    
    next();
  } catch (error) {
    Logger.error('Security headers setup failed', { 
      error: error.message,
      path: req.path,
      method: req.method 
    });
    
    return res.status(500).json({
      message: 'Security headers setup failed',
      error: true,
      success: false
    });
  }
};

// Additional security middleware for request validation
export const requestValidation = (req, res, next) => {
  try {
    // Block requests with suspicious patterns
    const suspiciousPatterns = [
      /(\<|\%3C).*script.*(\>|\%3E)/i,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /\.\.\/\.\.\//,
      /etc\/passwd/i,
      /union.*select/i
    ];

    const userAgent = req.get('User-Agent') || '';
    const requestUrl = req.originalUrl || '';
    const requestBody = JSON.stringify(req.body || {});

    // Check for suspicious patterns in various request parts
    const checkString = `${userAgent} ${requestUrl} ${requestBody}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(checkString)) {
        Logger.warn('Suspicious request blocked', {
          ip: req.ip,
          userAgent,
          url: requestUrl,
          pattern: pattern.toString()
        });
        
        return res.status(403).json({
          message: 'Request blocked for security reasons',
          error: true,
          success: false
        });
      }
    }

    // Validate request size (prevent large payload attacks)
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (contentLength > maxSize) {
      Logger.warn('Request blocked - payload too large', {
        ip: req.ip,
        contentLength,
        maxSize,
        url: requestUrl
      });
      
      return res.status(413).json({
        message: 'Request payload too large',
        error: true,
        success: false
      });
    }

    next();
  } catch (error) {
    Logger.error('Request validation failed', { 
      error: error.message,
      path: req.path,
      method: req.method 
    });
    
    return res.status(500).json({
      message: 'Request validation failed',
      error: true,
      success: false
    });
  }
};