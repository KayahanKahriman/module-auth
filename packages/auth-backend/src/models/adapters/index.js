/**
 * Database adapter factory
 * Creates the appropriate database adapter based on configuration
 * @module models/adapters
 */

import { PostgreSQLAdapter } from './postgresql.js';
import { MySQLAdapter } from './mysql.js';
import { MongoDBAdapter } from './mongodb.js';

/**
 * Creates a database adapter based on configuration
 * @param {Object} config - Application configuration
 * @returns {BaseDatabaseAdapter} Database adapter instance
 * @throws {Error} If database type is not supported
 */
export function createDatabaseAdapter(config) {
  const dbType = config.database.type.toLowerCase();

  switch (dbType) {
    case 'postgresql':
    case 'postgres':
    case 'pg':
      return new PostgreSQLAdapter(config);

    case 'mysql':
    case 'mariadb':
      return new MySQLAdapter(config);

    case 'mongodb':
    case 'mongo':
      return new MongoDBAdapter(config);

    default:
      throw new Error(
        `Unsupported database type: ${dbType}. Supported types are: postgresql, mysql, mongodb`
      );
  }
}

/**
 * Singleton database adapter instance
 */
let dbInstance = null;

/**
 * Gets the database adapter instance (singleton)
 * @param {Object} config - Application configuration
 * @returns {BaseDatabaseAdapter} Database adapter instance
 */
export function getDatabase(config) {
  if (!dbInstance) {
    dbInstance = createDatabaseAdapter(config);
  }
  return dbInstance;
}

/**
 * Resets the database adapter instance
 * Useful for testing or reconfiguration
 */
export function resetDatabase() {
  dbInstance = null;
}

export { PostgreSQLAdapter, MySQLAdapter, MongoDBAdapter };
