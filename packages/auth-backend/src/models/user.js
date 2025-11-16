/**
 * User model schema definition
 * This defines the structure of the user entity across all database types
 * @module models/user
 */

/**
 * Base user schema that applies to all database types
 * @typedef {Object} UserSchema
 * @property {string} id - Unique user identifier
 * @property {string} email - User email (unique)
 * @property {string} password - Hashed password
 * @property {string} name - User's name
 * @property {string} phone - User's phone number
 * @property {string} role - User role (user, admin, etc.)
 * @property {boolean} isEmailVerified - Email verification status
 * @property {boolean} isActive - Account active status
 * @property {string} avatar - Avatar URL
 * @property {string} bio - User bio
 * @property {Date} lastLogin - Last login timestamp
 * @property {string[]} refreshTokens - Array of valid refresh tokens
 * @property {Object} additionalFields - Custom additional fields
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Default user fields
 */
export const userFields = {
  id: 'string',
  email: 'string',
  password: 'string',
  name: 'string',
  phone: 'string',
  role: 'string',
  isEmailVerified: 'boolean',
  isActive: 'boolean',
  avatar: 'string',
  bio: 'string',
  lastLogin: 'date',
  refreshTokens: 'array',
  createdAt: 'date',
  updatedAt: 'date',
};

/**
 * PostgreSQL user table schema
 */
export const postgresqlSchema = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    avatar TEXT,
    bio TEXT,
    last_login TIMESTAMP,
    refresh_tokens TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`;

/**
 * MySQL user table schema
 */
export const mysqlSchema = `
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    avatar TEXT,
    bio TEXT,
    last_login TIMESTAMP NULL,
    refresh_tokens JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

/**
 * MongoDB user schema (using Mongoose-like structure)
 */
export const mongodbSchema = {
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin', 'moderator'],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  avatar: {
    type: String,
  },
  bio: {
    type: String,
  },
  lastLogin: {
    type: Date,
  },
  refreshTokens: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
};

/**
 * Validates user data
 * @param {Object} userData - User data to validate
 * @returns {boolean} True if valid
 */
export function validateUserData(userData) {
  if (!userData.email || !userData.password) {
    return false;
  }
  return true;
}

/**
 * Sanitizes user object for client response (removes sensitive data)
 * @param {Object} user - User object
 * @returns {Object} Sanitized user object
 */
export function sanitizeUser(user) {
  if (!user) return null;

  const { password, refreshTokens, ...sanitized } = user;
  return sanitized;
}

/**
 * Converts database row to user object
 * Handles field name conversion (snake_case to camelCase)
 * @param {Object} row - Database row
 * @returns {Object} User object
 */
export function rowToUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    phone: row.phone,
    role: row.role,
    isEmailVerified: row.is_email_verified ?? row.isEmailVerified,
    isActive: row.is_active ?? row.isActive,
    avatar: row.avatar,
    bio: row.bio,
    lastLogin: row.last_login ?? row.lastLogin,
    refreshTokens: row.refresh_tokens ?? row.refreshTokens ?? [],
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

/**
 * Converts user object to database row
 * Handles field name conversion (camelCase to snake_case)
 * @param {Object} user - User object
 * @returns {Object} Database row
 */
export function userToRow(user) {
  if (!user) return null;

  return {
    email: user.email,
    password: user.password,
    name: user.name,
    phone: user.phone,
    role: user.role,
    is_email_verified: user.isEmailVerified,
    is_active: user.isActive,
    avatar: user.avatar,
    bio: user.bio,
    last_login: user.lastLogin,
    refresh_tokens: user.refreshTokens,
  };
}
