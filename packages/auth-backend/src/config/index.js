/**
 * Configuration module for authentication backend
 * Loads and validates environment variables and provides configuration defaults
 * @module config
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Default configuration object
 * Can be overridden by environment variables or runtime configuration
 */
const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // Database configuration
  database: {
    type: process.env.DATABASE_TYPE || 'postgresql',
    url: process.env.DATABASE_URL || '',
    options: {
      // PostgreSQL/MySQL options
      ssl: process.env.DATABASE_SSL === 'true',
      // MongoDB options
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'default-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASSWORD || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: process.env.CORS_CREDENTIALS !== 'false',
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    loginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 5,
  },

  // OAuth configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/api/auth/oauth/google/callback',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:3000/api/auth/oauth/github/callback',
    },
  },

  // Feature flags
  features: {
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    oauth: process.env.ENABLE_OAUTH === 'true',
    phoneAuth: process.env.ENABLE_PHONE_AUTH === 'true',
    magicLink: process.env.ENABLE_MAGIC_LINK === 'true',
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
    passwordResetExpiresIn:
      parseInt(process.env.PASSWORD_RESET_EXPIRES_IN, 10) || 3600000, // 1 hour
    emailVerificationExpiresIn:
      parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_IN, 10) || 86400000, // 24 hours
  },

  // Frontend URL (for email links)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Customizable endpoints
  endpoints: {
    login: '/login',
    register: '/register',
    logout: '/logout',
    refresh: '/refresh',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    verifyEmail: '/verify-email',
    profile: '/profile',
    resendVerification: '/resend-verification',
  },

  // User schema configuration - additional fields that can be added to the user model
  userSchema: {
    additionalFields: [],
  },

  // Event hooks - functions that can be triggered on specific events
  hooks: {
    onRegister: null,
    onLogin: null,
    onLogout: null,
    onPasswordReset: null,
    onEmailVerified: null,
  },
};

/**
 * Merges custom configuration with default configuration
 * @param {Object} customConfig - Custom configuration object to merge
 * @returns {Object} Merged configuration object
 */
export function mergeConfig(customConfig) {
  return {
    ...config,
    ...customConfig,
    server: { ...config.server, ...customConfig.server },
    database: { ...config.database, ...customConfig.database },
    jwt: { ...config.jwt, ...customConfig.jwt },
    email: { ...config.email, ...customConfig.email },
    redis: { ...config.redis, ...customConfig.redis },
    cors: { ...config.cors, ...customConfig.cors },
    rateLimit: { ...config.rateLimit, ...customConfig.rateLimit },
    oauth: {
      google: { ...config.oauth.google, ...customConfig.oauth?.google },
      github: { ...config.oauth.github, ...customConfig.oauth?.github },
    },
    features: { ...config.features, ...customConfig.features },
    security: { ...config.security, ...customConfig.security },
    endpoints: { ...config.endpoints, ...customConfig.endpoints },
    userSchema: { ...config.userSchema, ...customConfig.userSchema },
    hooks: { ...config.hooks, ...customConfig.hooks },
  };
}

/**
 * Validates required configuration
 * @param {Object} cfg - Configuration object to validate
 * @throws {Error} If required configuration is missing
 */
export function validateConfig(cfg) {
  const errors = [];

  if (!cfg.jwt.secret || cfg.jwt.secret === 'default-secret-change-in-production') {
    errors.push('JWT_SECRET must be set in production');
  }

  if (!cfg.jwt.refreshSecret || cfg.jwt.refreshSecret === 'default-refresh-secret-change-in-production') {
    errors.push('JWT_REFRESH_SECRET must be set in production');
  }

  if (!cfg.database.url) {
    errors.push('DATABASE_URL must be set');
  }

  if (cfg.features.emailVerification && (!cfg.email.auth.user || !cfg.email.auth.pass)) {
    errors.push('Email credentials must be set when email verification is enabled');
  }

  if (cfg.server.env === 'production' && errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  if (errors.length > 0) {
    console.warn('Configuration warnings:', errors);
  }
}

export default config;
