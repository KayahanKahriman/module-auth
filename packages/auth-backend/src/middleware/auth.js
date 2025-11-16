/**
 * Authentication middleware
 * Protects routes by verifying JWT tokens
 * @module middleware/auth
 */

import { verifyAccessToken } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

/**
 * Middleware to verify JWT access token
 * Adds user data to req.user if token is valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user data to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return next(error);
    }

    return next(new AuthenticationError(error.message));
  }
}

/**
 * Middleware to check if user has required role
 * Must be used after authenticate middleware
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AuthenticationError('Authentication required. Please use authenticate middleware first.')
      );
    }

    const userRole = req.user.role;
    const allowedRoles = roles.flat();

    if (!allowedRoles.includes(userRole)) {
      return next(
        new AuthorizationError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attaches user data if token is provided and valid, but doesn't fail if missing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Don't fail, just continue without user data
    next();
  }
}

/**
 * Middleware to check if user owns the resource
 * Compares req.user.id with req.params.userId or req.params.id
 * @param {string} paramName - Name of parameter containing user ID (default: 'userId')
 * @returns {Function} Express middleware
 */
export function isOwner(paramName = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const resourceUserId = req.params[paramName] || req.params.id;

    if (!resourceUserId) {
      return next(new Error(`Parameter ${paramName} not found in request`));
    }

    // Allow if user owns resource or is admin
    if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
      return next(
        new AuthorizationError('You do not have permission to access this resource')
      );
    }

    next();
  };
}

/**
 * Middleware to check if user is active
 * Requires database check - must be implemented with database instance
 * @param {Object} db - Database adapter instance
 * @returns {Function} Express middleware
 */
export function isActive(db) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentication required'));
      }

      const user = await db.findUserById(req.user.id);

      if (!user) {
        return next(new AuthenticationError('User not found'));
      }

      if (!user.isActive) {
        return next(
          new AuthorizationError('Your account has been deactivated. Please contact support.')
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user's email is verified
 * Requires database check - must be implemented with database instance
 * @param {Object} db - Database adapter instance
 * @returns {Function} Express middleware
 */
export function isEmailVerified(db) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentication required'));
      }

      const user = await db.findUserById(req.user.id);

      if (!user) {
        return next(new AuthenticationError('User not found'));
      }

      if (!user.isEmailVerified) {
        return next(
          new AuthorizationError('Please verify your email address to access this resource')
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
