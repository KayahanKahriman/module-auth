/**
 * Custom error classes and error handling utilities
 * @module utils/errors
 */

/**
 * Base API Error class
 * @extends Error
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to JSON response format
   * @returns {Object} JSON error response
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      errors: this.errors,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * Validation Error - 400
 */
export class ValidationError extends APIError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, 400, errors);
  }
}

/**
 * Authentication Error - 401
 */
export class AuthenticationError extends APIError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization Error - 403
 */
export class AuthorizationError extends APIError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends APIError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * Rate Limit Error - 429
 */
export class RateLimitError extends APIError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429);
  }
}

/**
 * Internal Server Error - 500
 */
export class InternalServerError extends APIError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

/**
 * Service Unavailable Error - 503
 */
export class ServiceUnavailableError extends APIError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503);
  }
}

/**
 * Express error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Handle Joi validation errors
  if (err.name === 'ValidationError' && err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  // Handle MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }
  }

  // Handle PostgreSQL/MySQL errors
  if (err.code) {
    // PostgreSQL duplicate key
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Resource already exists',
      });
    }

    // MySQL duplicate key
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Resource already exists',
      });
    }
  }

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Creates a standardized success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 */
export function sendSuccess(res, data = null, statusCode = 200, message = 'Success') {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Creates a standardized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array|Object} errors - Additional error details
 */
export function sendError(res, message, statusCode = 500, errors = null) {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
