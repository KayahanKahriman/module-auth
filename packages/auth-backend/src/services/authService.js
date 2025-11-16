/**
 * Authentication service
 * Contains business logic for authentication operations
 * @module services/authService
 */

import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateTokens,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '../utils/email.js';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';
import { sanitizeUser } from '../models/user.js';
import config from '../config/index.js';

/**
 * Authentication Service Class
 */
export class AuthService {
  constructor(database, customConfig = {}) {
    this.db = database;
    this.config = { ...config, ...customConfig };
  }

  /**
   * Registers a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} [userData.name] - User name
   * @returns {Promise<Object>} Created user and tokens
   */
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await this.db.findUserByEmail(userData.email);

      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await this.db.createUser({
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        name: userData.name,
        phone: userData.phone,
        role: userData.role || 'user',
        isEmailVerified: !this.config.features.emailVerification, // Auto-verify if feature is disabled
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Store refresh token
      await this.db.addRefreshToken(user.id, refreshToken);

      // Send verification email if enabled
      if (this.config.features.emailVerification) {
        const verificationToken = generateEmailVerificationToken(user.id);
        await sendVerificationEmail(user.email, verificationToken, user.name);
      } else {
        // Send welcome email
        await sendWelcomeEmail(user.email, user.name).catch((err) =>
          console.error('Failed to send welcome email:', err)
        );
      }

      // Trigger onRegister hook if provided
      if (this.config.hooks?.onRegister) {
        await this.config.hooks.onRegister(user);
      }

      return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Authenticates a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and tokens
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await this.db.findUserByEmail(email);

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new AuthenticationError(
          'Your account has been deactivated. Please contact support.'
        );
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if email verification is required
      if (this.config.features.emailVerification && !user.isEmailVerified) {
        throw new AuthenticationError(
          'Please verify your email address before logging in'
        );
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Store refresh token
      await this.db.addRefreshToken(user.id, refreshToken);

      // Update last login
      await this.db.updateLastLogin(user.id);

      // Trigger onLogin hook if provided
      if (this.config.hooks?.onLogin) {
        await this.config.hooks.onLogin(user);
      }

      return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logs out a user by invalidating refresh token
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<void>}
   */
  async logout(userId, refreshToken) {
    try {
      await this.db.removeRefreshToken(userId, refreshToken);

      // Trigger onLogout hook if provided
      if (this.config.hooks?.onLogout) {
        const user = await this.db.findUserById(userId);
        await this.config.hooks.onLogout(user);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logs out user from all devices by removing all refresh tokens
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async logoutAll(userId) {
    try {
      await this.db.removeAllRefreshTokens(userId);

      // Trigger onLogout hook if provided
      if (this.config.hooks?.onLogout) {
        const user = await this.db.findUserById(userId);
        await this.config.hooks.onLogout(user);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refreshes access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user
      const user = await this.db.findUserById(decoded.id);

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Check if refresh token exists in database
      if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Remove old refresh token
      await this.db.removeRefreshToken(user.id, refreshToken);

      // Generate new tokens
      const tokens = generateTokens(user);

      // Store new refresh token
      await this.db.addRefreshToken(user.id, tokens.refreshToken);

      return {
        user: sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifies user's email address
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} User object
   */
  async verifyEmail(token) {
    try {
      // Verify token
      const decoded = verifyEmailVerificationToken(token);

      // Get user
      const user = await this.db.findUserById(decoded.id);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.isEmailVerified) {
        throw new ValidationError('Email already verified');
      }

      // Update user
      const updatedUser = await this.db.updateUser(user.id, {
        isEmailVerified: true,
      });

      // Send welcome email
      await sendWelcomeEmail(user.email, user.name).catch((err) =>
        console.error('Failed to send welcome email:', err)
      );

      // Trigger onEmailVerified hook if provided
      if (this.config.hooks?.onEmailVerified) {
        await this.config.hooks.onEmailVerified(updatedUser);
      }

      return sanitizeUser(updatedUser);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resends email verification
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resendVerificationEmail(email) {
    try {
      const user = await this.db.findUserByEmail(email);

      if (!user) {
        // Don't reveal if email exists
        return;
      }

      if (user.isEmailVerified) {
        throw new ValidationError('Email already verified');
      }

      const verificationToken = generateEmailVerificationToken(user.id);
      await sendVerificationEmail(user.email, verificationToken, user.name);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initiates password reset process
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async forgotPassword(email) {
    try {
      const user = await this.db.findUserByEmail(email);

      if (!user) {
        // Don't reveal if email exists (security best practice)
        return;
      }

      // Generate password reset token
      const resetToken = generatePasswordResetToken(user.id);

      // Send password reset email
      await sendPasswordResetEmail(user.email, resetToken, user.name);
    } catch (error) {
      console.error('Forgot password error:', error);
      // Don't throw error to prevent email enumeration
    }
  }

  /**
   * Resets user password
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async resetPassword(token, newPassword) {
    try {
      // Verify token
      const decoded = verifyPasswordResetToken(token);

      // Get user
      const user = await this.db.findUserById(decoded.id);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await this.db.updateUser(user.id, {
        password: hashedPassword,
      });

      // Invalidate all refresh tokens for security
      await this.db.removeAllRefreshTokens(user.id);

      // Send confirmation email
      await sendPasswordChangedEmail(user.email, user.name).catch((err) =>
        console.error('Failed to send password changed email:', err)
      );

      // Trigger onPasswordReset hook if provided
      if (this.config.hooks?.onPasswordReset) {
        await this.config.hooks.onPasswordReset(user);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Changes user password (when logged in)
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.db.findUserById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isPasswordValid = await comparePassword(currentPassword, user.password);

      if (!isPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await this.db.updateUser(user.id, {
        password: hashedPassword,
      });

      // Invalidate all refresh tokens except current one
      await this.db.removeAllRefreshTokens(user.id);

      // Send confirmation email
      await sendPasswordChangedEmail(user.email, user.name).catch((err) =>
        console.error('Failed to send password changed email:', err)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getProfile(userId) {
    try {
      const user = await this.db.findUserById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user object
   */
  async updateProfile(userId, updates) {
    try {
      // Don't allow updating sensitive fields
      const allowedFields = ['name', 'phone', 'bio', 'avatar'];
      const filteredUpdates = {};

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const updatedUser = await this.db.updateUser(userId, filteredUpdates);

      return sanitizeUser(updatedUser);
    } catch (error) {
      throw error;
    }
  }
}
