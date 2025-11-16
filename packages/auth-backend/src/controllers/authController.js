/**
 * Authentication controllers
 * Handles HTTP requests for authentication operations
 * @module controllers/authController
 */

import { AuthService } from '../services/authService.js';
import { asyncHandler, sendSuccess, sendError } from '../utils/errors.js';
import {
  validate,
  registerSchema,
  loginSchema,
  emailSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshTokenSchema,
  tokenSchema,
} from '../utils/validation.js';

/**
 * Creates authentication controllers with database dependency
 * @param {Object} db - Database adapter instance
 * @param {Object} config - Configuration object
 * @returns {Object} Controller functions
 */
export function createAuthController(db, config) {
  const authService = new AuthService(db, config);

  return {
    /**
     * Register a new user
     * POST /register
     */
    register: asyncHandler(async (req, res) => {
      const { error, value } = validate(registerSchema, req.body);

      if (error) {
        return sendError(res, 'Validation failed', 400, error);
      }

      const result = await authService.register(value);

      sendSuccess(res, result, 201, 'User registered successfully');
    }),

    /**
     * Login user
     * POST /login
     */
    login: asyncHandler(async (req, res) => {
      const { error, value } = validate(loginSchema, req.body);

      if (error) {
        return sendError(res, 'Validation failed', 400, error);
      }

      const result = await authService.login(value.email, value.password);

      sendSuccess(res, result, 200, 'Login successful');
    }),

    /**
     * Logout user
     * POST /logout
     */
    logout: asyncHandler(async (req, res) => {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendError(res, 'Refresh token is required', 400);
      }

      await authService.logout(req.user.id, refreshToken);

      sendSuccess(res, null, 200, 'Logout successful');
    }),

    /**
     * Logout from all devices
     * POST /logout-all
     */
    logoutAll: asyncHandler(async (req, res) => {
      await authService.logoutAll(req.user.id);

      sendSuccess(res, null, 200, 'Logged out from all devices');
    }),

    /**
     * Refresh access token
     * POST /refresh
     */
    refreshToken: asyncHandler(async (req, res) => {
      const { error, value } = validate(refreshTokenSchema, req.body);

      if (error) {
        return sendError(res, 'Validation failed', 400, error);
      }

      const result = await authService.refreshToken(value.refreshToken);

      sendSuccess(res, result, 200, 'Token refreshed successfully');
    }),

    /**
     * Verify email address
     * POST /verify-email
     */
    verifyEmail: asyncHandler(async (req, res) => {
      const { error, value } = validate(tokenSchema, req.body);

      if (error) {
        return sendError(res, 'Validation failed', 400, error);
      }

      const user = await authService.verifyEmail(value.token);

      sendSuccess(res, { user }, 200, 'Email verified successfully');
    }),

    /**
     * Resend verification email
     * POST /resend-verification
     */
    resendVerification: asyncHandler(async (req, res) => {
      const { error, value } = validate(emailSchema, req.body);

      if (error) {
        return sendError(res, 'Validation failed', 400, error);
      }

      await authService.resendVerificationEmail(value.email);

      sendSuccess(res, null, 200, 'Verification email sent');
    }),

    /**
     * Request password reset
     * POST /forgot-password
     */
    forgotPassword: asyncHandler(async (req, res) => {
      const { error, value } = validate(emailSchema, req.body);

      if (error) {
        return sendError(res, 'Validation failed', 400, error);
      }

      await authService.forgotPassword(value.email);

      // Always return success to prevent email enumeration
      sendSuccess(
        res,
        null,
        200,
        'If an account with that email exists, a password reset link has been sent'
      );
    }),

    /**
     * Reset password
     * POST /reset-password
     */
    resetPassword: asyncHandler(async (req, res) => {
      const { error, value } = validate(resetPasswordSchema, req.body);

      if (error) {
        return sendError(res, 'Validation failed', 400, error);
      }

      await authService.resetPassword(value.token, value.password);

      sendSuccess(res, null, 200, 'Password reset successfully');
    }),

    /**
     * Change password (when logged in)
     * POST /change-password
     */
    changePassword: asyncHandler(async (req, res) => {
      const { error, value } = validate(changePasswordSchema, req.body);

      if (error) {
        return sendError(res, 'Validation failed', 400, error);
      }

      await authService.changePassword(
        req.user.id,
        value.currentPassword,
        value.newPassword
      );

      sendSuccess(res, null, 200, 'Password changed successfully');
    }),

    /**
     * Get user profile
     * GET /profile
     */
    getProfile: asyncHandler(async (req, res) => {
      const user = await authService.getProfile(req.user.id);

      sendSuccess(res, { user }, 200, 'Profile retrieved successfully');
    }),

    /**
     * Update user profile
     * PUT /profile
     */
    updateProfile: asyncHandler(async (req, res) => {
      const { error, value } = validate(updateProfileSchema, req.body);

      if (error) {
        return sendError(res, 'Validation failed', 400, error);
      }

      const user = await authService.updateProfile(req.user.id, value);

      sendSuccess(res, { user }, 200, 'Profile updated successfully');
    }),

    /**
     * Get current user (from token)
     * GET /me
     */
    getCurrentUser: asyncHandler(async (req, res) => {
      const user = await authService.getProfile(req.user.id);

      sendSuccess(res, { user }, 200, 'User retrieved successfully');
    }),

    /**
     * Health check endpoint
     * GET /health
     */
    healthCheck: asyncHandler(async (req, res) => {
      const isHealthy = await db.healthCheck();

      if (!isHealthy) {
        return sendError(res, 'Database connection failed', 503);
      }

      sendSuccess(res, { status: 'ok', database: 'connected' }, 200, 'Service is healthy');
    }),
  };
}
