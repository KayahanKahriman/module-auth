/**
 * Main entry point for auth-backend package
 * Exports all components for use in other projects
 * @module auth-backend
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createAuthRouter } from './routes/auth.js';
import { getDatabase } from './models/adapters/index.js';
import { errorHandler } from './utils/errors.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import config, { mergeConfig, validateConfig } from './config/index.js';

/**
 * Creates and configures the authentication router
 * This is the main function to integrate the auth module into your Express app
 *
 * @param {Object} customConfig - Custom configuration to override defaults
 * @returns {express.Router} Configured Express router
 *
 * @example
 * import express from 'express';
 * import { createAuthRouter } from '@auth/backend';
 *
 * const app = express();
 * app.use(express.json());
 *
 * const authRouter = await createAuthRouter({
 *   database: {
 *     type: 'postgresql',
 *     url: process.env.DATABASE_URL,
 *   },
 *   jwt: {
 *     secret: process.env.JWT_SECRET,
 *   },
 * });
 *
 * app.use('/api/auth', authRouter);
 */
export async function createAuthRouter(customConfig = {}) {
  // Merge configurations
  const finalConfig = mergeConfig(customConfig);

  // Validate configuration
  validateConfig(finalConfig);

  // Get database adapter
  const db = getDatabase(finalConfig);

  // Connect to database
  await db.connect();

  // Initialize database schema
  await db.initialize();

  // Create router
  const router = createAuthRouter(db, finalConfig);

  return router;
}

/**
 * Creates a complete Express app with authentication
 * Includes all necessary middleware and configuration
 *
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<express.Application>} Configured Express app
 *
 * @example
 * import { createAuthApp } from '@auth/backend';
 *
 * const app = await createAuthApp({
 *   database: { type: 'mongodb', url: process.env.DATABASE_URL },
 * });
 *
 * app.listen(3000);
 */
export async function createAuthApp(customConfig = {}) {
  const app = express();

  // Merge configurations
  const finalConfig = mergeConfig(customConfig);

  // Validate configuration
  validateConfig(finalConfig);

  // Security middleware
  app.use(helmet());

  // CORS middleware
  app.use(
    cors({
      origin: finalConfig.cors.origin,
      credentials: finalConfig.cors.credentials,
    })
  );

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use(generalLimiter);

  // Get database adapter
  const db = getDatabase(finalConfig);

  // Connect to database
  await db.connect();

  // Initialize database schema
  await db.initialize();

  // Authentication routes
  const authRouter = createAuthRouter(db, finalConfig);
  app.use('/auth', authRouter);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Authentication API',
      version: '1.0.0',
      endpoints: {
        health: '/auth/health',
        register: '/auth/register',
        login: '/auth/login',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        profile: '/auth/profile',
      },
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

// Export utilities and components
export { default as config } from './config/index.js';
export { mergeConfig, validateConfig } from './config/index.js';

// Export database adapters
export {
  getDatabase,
  createDatabaseAdapter,
  PostgreSQLAdapter,
  MySQLAdapter,
  MongoDBAdapter,
} from './models/adapters/index.js';

// Export middleware
export { authenticate, authorize, optionalAuth, isOwner } from './middleware/auth.js';
export {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  createRateLimiter,
} from './middleware/rateLimiter.js';

// Export services
export { AuthService } from './services/authService.js';

// Export utils
export * from './utils/jwt.js';
export * from './utils/password.js';
export * from './utils/email.js';
export * from './utils/validation.js';
export * from './utils/errors.js';

// Export models
export { sanitizeUser, rowToUser, userToRow } from './models/user.js';
