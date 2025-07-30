/**
 * Centralized error handling service for consistent error responses across the application
 */

export class ErrorHandler {
  /**
   * Standard error response format
   * @param {object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {object} details - Additional error details
   * @param {Error} [error] - Original error object (for logging)
   */
  static sendError(res, statusCode, message, details = null, error = null) {
    // Log the error for server-side tracking
    if (error) {
      console.error(`[${statusCode}] ${message}:`, error);
    }
    
    return res.status(statusCode).json({
      success: false,
      error: true,
      message,
      ...(details && { details })
    });
  }

  /**
   * Handle 400 Bad Request errors
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {object} details - Additional error details
   */
  static badRequest(res, message = 'Invalid request data', details = null) {
    return this.sendError(res, 400, message, details);
  }

  /**
   * Handle 401 Unauthorized errors
   * @param {object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = 'Authentication required') {
    return this.sendError(res, 401, message);
  }

  /**
   * Handle 403 Forbidden errors
   * @param {object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = 'You do not have permission to access this resource') {
    return this.sendError(res, 403, message);
  }

  /**
   * Handle 404 Not Found errors
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {string} resourceType - Type of resource that was not found
   * @param {string} resourceId - ID of the resource that was not found
   */
  static notFound(res, message = 'Resource not found', resourceType = null, resourceId = null) {
    const details = resourceType ? { resourceType, resourceId } : null;
    return this.sendError(res, 404, message, details);
  }

  /**
   * Handle 409 Conflict errors
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {object} details - Additional error details
   */
  static conflict(res, message = 'Resource conflict', details = null) {
    return this.sendError(res, 409, message, details);
  }

  /**
   * Handle 500 Internal Server errors
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {Error} error - Original error object
   */
  static serverError(res, message = 'Internal server error', error = null) {
    // Don't expose internal error details to client in production
    const isProduction = process.env.NODE_ENV === 'production';
    const details = !isProduction && error ? { stack: error.stack } : null;
    
    return this.sendError(res, 500, message, details, error);
  }
  
  /**
   * Handle validation errors (typically from express-validator)
   * @param {object} res - Express response object
   * @param {Array} errors - Validation errors array
   */
  static validationError(res, errors) {
    return this.sendError(res, 422, 'Validation failed', {
      errors: errors.map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
}

export default ErrorHandler;
