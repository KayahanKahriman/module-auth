/**
 * PostgreSQL database adapter
 * @module models/adapters/postgresql
 */

import pkg from 'pg';
const { Pool } = pkg;
import { BaseDatabaseAdapter } from './base.js';
import { postgresqlSchema, rowToUser, userToRow } from '../user.js';

/**
 * PostgreSQL Database Adapter
 * @extends BaseDatabaseAdapter
 */
export class PostgreSQLAdapter extends BaseDatabaseAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
  }

  /**
   * Connects to PostgreSQL database
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      this.pool = new Pool({
        connectionString: this.config.database.url,
        ssl: this.config.database.options.ssl
          ? { rejectUnauthorized: false }
          : false,
      });

      // Test the connection
      const client = await this.pool.connect();
      client.release();

      console.log('Connected to PostgreSQL database');
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
    }
  }

  /**
   * Disconnects from PostgreSQL database
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      console.log('Disconnected from PostgreSQL database');
    }
  }

  /**
   * Initializes PostgreSQL schema
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.pool.query(postgresqlSchema);
      console.log('PostgreSQL schema initialized');
    } catch (error) {
      console.error('PostgreSQL initialization error:', error);
      throw new Error(`Failed to initialize PostgreSQL schema: ${error.message}`);
    }
  }

  /**
   * Creates a new user in PostgreSQL
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const row = userToRow(userData);

    const query = `
      INSERT INTO users (email, password, name, phone, role, is_email_verified, is_active, avatar, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      row.email,
      row.password,
      row.name || null,
      row.phone || null,
      row.role || 'user',
      row.is_email_verified || false,
      row.is_active !== undefined ? row.is_active : true,
      row.avatar || null,
      row.bio || null,
    ];

    try {
      const result = await this.pool.query(query, values);
      return rowToUser(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Finds a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  async findUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Finds a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';

    try {
      const result = await this.pool.query(query, [email.toLowerCase()]);
      return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Updates a user
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(id, updates) {
    const row = userToRow(updates);

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(row).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      return rowToUser(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Deletes a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Finds users with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of users
   */
  async findUsers(filters = {}, options = {}) {
    let query = 'SELECT * FROM users WHERE 1=1';
    const values = [];
    let paramCount = 1;

    // Apply filters
    if (filters.role) {
      query += ` AND role = $${paramCount}`;
      values.push(filters.role);
      paramCount++;
    }

    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      values.push(filters.isActive);
      paramCount++;
    }

    if (filters.isEmailVerified !== undefined) {
      query += ` AND is_email_verified = $${paramCount}`;
      values.push(filters.isEmailVerified);
      paramCount++;
    }

    // Apply sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Apply pagination
    if (options.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
      paramCount++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(options.offset);
      paramCount++;
    }

    try {
      const result = await this.pool.query(query, values);
      return result.rows.map(rowToUser);
    } catch (error) {
      throw new Error(`Failed to find users: ${error.message}`);
    }
  }

  /**
   * Adds a refresh token to user
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<void>}
   */
  async addRefreshToken(userId, token) {
    const query = `
      UPDATE users
      SET refresh_tokens = array_append(refresh_tokens, $1),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    try {
      await this.pool.query(query, [token, userId]);
    } catch (error) {
      throw new Error(`Failed to add refresh token: ${error.message}`);
    }
  }

  /**
   * Removes a refresh token from user
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<void>}
   */
  async removeRefreshToken(userId, token) {
    const query = `
      UPDATE users
      SET refresh_tokens = array_remove(refresh_tokens, $1),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    try {
      await this.pool.query(query, [token, userId]);
    } catch (error) {
      throw new Error(`Failed to remove refresh token: ${error.message}`);
    }
  }

  /**
   * Removes all refresh tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async removeAllRefreshTokens(userId) {
    const query = `
      UPDATE users
      SET refresh_tokens = '{}',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await this.pool.query(query, [userId]);
    } catch (error) {
      throw new Error(`Failed to remove all refresh tokens: ${error.message}`);
    }
  }

  /**
   * Updates user's last login timestamp
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await this.pool.query(query, [userId]);
    } catch (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Checks database connection health
   * @returns {Promise<boolean>} True if connected
   */
  async healthCheck() {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
}
