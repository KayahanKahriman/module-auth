/**
 * Standalone server entry point
 * Runs the authentication server as a standalone application
 * @module server
 */

import { createAuthApp } from './index.js';
import config from './config/index.js';

/**
 * Starts the authentication server
 */
async function startServer() {
  try {
    // Create the Express app with default configuration
    const app = await createAuthApp(config);

    const port = config.server.port;
    const env = config.server.env;

    // Start server
    const server = app.listen(port, () => {
      console.log('\n🚀 Authentication Server Started');
      console.log('================================');
      console.log(`Environment: ${env}`);
      console.log(`Port: ${port}`);
      console.log(`Database: ${config.database.type}`);
      console.log(`\nEndpoints:`);
      console.log(`  Health Check: http://localhost:${port}/auth/health`);
      console.log(`  Register:     http://localhost:${port}/auth/register`);
      console.log(`  Login:        http://localhost:${port}/auth/login`);
      console.log(`  Profile:      http://localhost:${port}/auth/profile`);
      console.log('================================\n');
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
