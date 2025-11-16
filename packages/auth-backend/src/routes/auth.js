/**
 * Authentication routes
 * Defines all authentication endpoints
 * @module routes/auth
 */

import express from 'express';
import { createAuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} from '../middleware/rateLimiter.js';

/**
 * Creates authentication router with custom configuration
 * @param {Object} db - Database adapter instance
 * @param {Object} config - Configuration object
 * @returns {express.Router} Express router
 */
export function createAuthRouter(db, config) {
  const router = express.Router();
  const controller = createAuthController(db, config);

  // Get custom endpoints from config or use defaults
  const endpoints = config.endpoints || {};

  /**
   * Public routes (no authentication required)
   */

  // Health check
  router.get('/health', controller.healthCheck);

  // Register
  router.post(
    endpoints.register || '/register',
    authLimiter,
    controller.register
  );

  // Login
  router.post(
    endpoints.login || '/login',
    authLimiter,
    controller.login
  );

  // Refresh token
  router.post(
    endpoints.refresh || '/refresh',
    controller.refreshToken
  );

  // Verify email
  router.post(
    endpoints.verifyEmail || '/verify-email',
    controller.verifyEmail
  );

  // Resend verification email
  router.post(
    endpoints.resendVerification || '/resend-verification',
    emailVerificationLimiter,
    controller.resendVerification
  );

  // Forgot password
  router.post(
    endpoints.forgotPassword || '/forgot-password',
    passwordResetLimiter,
    controller.forgotPassword
  );

  // Reset password
  router.post(
    endpoints.resetPassword || '/reset-password',
    controller.resetPassword
  );

  /**
   * Protected routes (authentication required)
   */

  // Logout
  router.post(
    endpoints.logout || '/logout',
    authenticate,
    controller.logout
  );

  // Logout from all devices
  router.post(
    '/logout-all',
    authenticate,
    controller.logoutAll
  );

  // Change password
  router.post(
    '/change-password',
    authenticate,
    controller.changePassword
  );

  // Get current user
  router.get(
    '/me',
    authenticate,
    controller.getCurrentUser
  );

  // Get profile
  router.get(
    endpoints.profile || '/profile',
    authenticate,
    controller.getProfile
  );

  // Update profile
  router.put(
    endpoints.profile || '/profile',
    authenticate,
    controller.updateProfile
  );

  return router;
}
