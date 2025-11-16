/**
 * MySQL database adapter
 * @module models/adapters/mysql
 */

import mysql from 'mysql2/promise';
import { BaseDatabaseAdapter } from './base.js';
import { mysqlSchema, rowToUser, userToRow } from '../user.js';

/**
 * MySQL Database Adapter
 * @extends BaseDatabaseAdapter
 */
export class MySQLAdapter extends BaseDatabaseAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
  }

  /**
   * Connects to MySQL database
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      // Parse connection string or use object config
      const connectionConfig = this._parseConnectionString(this.config.database.url);

      this.pool = mysql.createPool({
        ...connectionConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      connection.release();

      console.log('Connected to MySQL database');
    } catch (error) {
      console.error('MySQL connection error:', error);
      throw new Error(`Failed to connect to MySQL: ${error.message}`);
    }
  }

  /**
   * Disconnects from MySQL database
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      console.log('Disconnected from MySQL database');
    }
  }

  /**
   * Initializes MySQL schema
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.pool.query(mysqlSchema);
      console.log('MySQL schema initialized');
    } catch (error) {
      console.error('MySQL initialization error:', error);
      throw new Error(`Failed to initialize MySQL schema: ${error.message}`);
    }
  }

  /**
   * Creates a new user in MySQL
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const row = userToRow(userData);

    const query = `
      INSERT INTO users (email, password, name, phone, role, is_email_verified, is_active, avatar, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      const [result] = await this.pool.execute(query, values);
      const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [
        result.insertId,
      ]);

      return rowToUser(rows[0]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
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
    const query = 'SELECT * FROM users WHERE id = ?';

    try {
      const [rows] = await this.pool.execute(query, [id]);
      return rows.length > 0 ? rowToUser(rows[0]) : null;
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
    const query = 'SELECT * FROM users WHERE email = ?';

    try {
      const [rows] = await this.pool.execute(query, [email.toLowerCase()]);

      if (rows.length > 0) {
        const user = rows[0];
        // Parse JSON for refresh_tokens
        if (typeof user.refresh_tokens === 'string') {
          user.refresh_tokens = JSON.parse(user.refresh_tokens || '[]');
        }
        return rowToUser(user);
      }

      return null;
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

    Object.entries(row).forEach(([key, value]) => {
      if (value !== undefined) {
        // Handle JSON fields
        if (key === 'refresh_tokens' && Array.isArray(value)) {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      await this.pool.execute(query, values);
      const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);

      if (rows.length === 0) {
        throw new Error('User not found');
      }

      // Parse JSON for refresh_tokens
      if (typeof rows[0].refresh_tokens === 'string') {
        rows[0].refresh_tokens = JSON.parse(rows[0].refresh_tokens || '[]');
      }

      return rowToUser(rows[0]);
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
    const query = 'DELETE FROM users WHERE id = ?';

    try {
      const [result] = await this.pool.execute(query, [id]);
      return result.affectedRows > 0;
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

    // Apply filters
    if (filters.role) {
      query += ' AND role = ?';
      values.push(filters.role);
    }

    if (filters.isActive !== undefined) {
      query += ' AND is_active = ?';
      values.push(filters.isActive);
    }

    if (filters.isEmailVerified !== undefined) {
      query += ' AND is_email_verified = ?';
      values.push(filters.isEmailVerified);
    }

    // Apply sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Apply pagination
    if (options.limit) {
      query += ' LIMIT ?';
      values.push(options.limit);
    }

    if (options.offset) {
      query += ' OFFSET ?';
      values.push(options.offset);
    }

    try {
      const [rows] = await this.pool.execute(query, values);

      // Parse JSON fields
      return rows.map((row) => {
        if (typeof row.refresh_tokens === 'string') {
          row.refresh_tokens = JSON.parse(row.refresh_tokens || '[]');
        }
        return rowToUser(row);
      });
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
    try {
      // Get current tokens
      const [rows] = await this.pool.execute('SELECT refresh_tokens FROM users WHERE id = ?', [userId]);

      if (rows.length === 0) {
        throw new Error('User not found');
      }

      let tokens = [];
      if (rows[0].refresh_tokens) {
        tokens = typeof rows[0].refresh_tokens === 'string'
          ? JSON.parse(rows[0].refresh_tokens)
          : rows[0].refresh_tokens;
      }

      tokens.push(token);

      await this.pool.execute(
        'UPDATE users SET refresh_tokens = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(tokens), userId]
      );
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
    try {
      // Get current tokens
      const [rows] = await this.pool.execute('SELECT refresh_tokens FROM users WHERE id = ?', [userId]);

      if (rows.length === 0) {
        throw new Error('User not found');
      }

      let tokens = [];
      if (rows[0].refresh_tokens) {
        tokens = typeof rows[0].refresh_tokens === 'string'
          ? JSON.parse(rows[0].refresh_tokens)
          : rows[0].refresh_tokens;
      }

      tokens = tokens.filter((t) => t !== token);

      await this.pool.execute(
        'UPDATE users SET refresh_tokens = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(tokens), userId]
      );
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
    try {
      await this.pool.execute(
        'UPDATE users SET refresh_tokens = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify([]), userId]
      );
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
    try {
      await this.pool.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
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

  /**
   * Parses MySQL connection string to config object
   * @private
   * @param {string} connectionString - MySQL connection string
   * @returns {Object} Connection config
   */
  _parseConnectionString(connectionString) {
    const url = new URL(connectionString);

    return {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    };
  }
}
