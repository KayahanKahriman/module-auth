/**
 * JWT utility functions for token generation and verification
 * @module utils/jwt
 */

import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generates an access token for a user
 * @param {Object} payload - User data to encode in token
 * @param {string} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} [payload.role] - User role
 * @returns {string} JWT access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'user',
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
}

/**
 * Generates a refresh token for a user
 * @param {Object} payload - User data to encode in token
 * @param {string} payload.id - User ID
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      type: 'refresh',
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
    }
  );
}

/**
 * Generates both access and refresh tokens
 * @param {Object} user - User object
 * @param {string} user.id - User ID
 * @param {string} user.email - User email
 * @param {string} [user.role] - User role
 * @returns {Object} Object containing accessToken and refreshToken
 */
export function generateTokens(user) {
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Verifies an access token
 * @param {string} token - JWT access token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verifies a refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decodes a token without verifying it (useful for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Generates a token for email verification
 * @param {string} userId - User ID
 * @returns {string} Email verification token
 */
export function generateEmailVerificationToken(userId) {
  return jwt.sign(
    {
      id: userId,
      type: 'email-verification',
    },
    config.jwt.secret,
    {
      expiresIn: config.security.emailVerificationExpiresIn,
    }
  );
}

/**
 * Verifies an email verification token
 * @param {string} token - Email verification token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyEmailVerificationToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded.type !== 'email-verification') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Email verification token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid email verification token');
    }
    throw error;
  }
}

/**
 * Generates a token for password reset
 * @param {string} userId - User ID
 * @returns {string} Password reset token
 */
export function generatePasswordResetToken(userId) {
  return jwt.sign(
    {
      id: userId,
      type: 'password-reset',
    },
    config.jwt.secret,
    {
      expiresIn: config.security.passwordResetExpiresIn,
    }
  );
}

/**
 * Verifies a password reset token
 * @param {string} token - Password reset token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyPasswordResetToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Password reset token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid password reset token');
    }
    throw error;
  }
}
