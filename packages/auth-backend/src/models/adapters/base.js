/**
 * Base database adapter interface
 * All database adapters should implement these methods
 * @module models/adapters/base
 */

/**
 * Base Database Adapter class
 * Defines the interface that all database adapters must implement
 * @abstract
 */
export class BaseDatabaseAdapter {
  constructor(config) {
    this.config = config;
    this.client = null;
  }

  /**
   * Connects to the database
   * @abstract
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  /**
   * Disconnects from the database
   * @abstract
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  /**
   * Initializes the database schema/tables
   * @abstract
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Creates a new user
   * @abstract
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    throw new Error('createUser() must be implemented by subclass');
  }

  /**
   * Finds a user by ID
   * @abstract
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserById(id) {
    throw new Error('findUserById() must be implemented by subclass');
  }

  /**
   * Finds a user by email
   * @abstract
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserByEmail(email) {
    throw new Error('findUserByEmail() must be implemented by subclass');
  }

  /**
   * Updates a user
   * @abstract
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(id, updates) {
    throw new Error('updateUser() must be implemented by subclass');
  }

  /**
   * Deletes a user
   * @abstract
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteUser(id) {
    throw new Error('deleteUser() must be implemented by subclass');
  }

  /**
   * Finds users with filters and pagination
   * @abstract
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options (limit, offset, sort)
   * @returns {Promise<Array>} Array of users
   */
  async findUsers(filters = {}, options = {}) {
    throw new Error('findUsers() must be implemented by subclass');
  }

  /**
   * Adds a refresh token to user's token array
   * @abstract
   * @param {string} userId - User ID
   * @param {string} token - Refresh token to add
   * @returns {Promise<void>}
   */
  async addRefreshToken(userId, token) {
    throw new Error('addRefreshToken() must be implemented by subclass');
  }

  /**
   * Removes a refresh token from user's token array
   * @abstract
   * @param {string} userId - User ID
   * @param {string} token - Refresh token to remove
   * @returns {Promise<void>}
   */
  async removeRefreshToken(userId, token) {
    throw new Error('removeRefreshToken() must be implemented by subclass');
  }

  /**
   * Removes all refresh tokens for a user
   * @abstract
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async removeAllRefreshTokens(userId) {
    throw new Error('removeAllRefreshTokens() must be implemented by subclass');
  }

  /**
   * Updates user's last login timestamp
   * @abstract
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    throw new Error('updateLastLogin() must be implemented by subclass');
  }

  /**
   * Checks database connection health
   * @abstract
   * @returns {Promise<boolean>} True if connected
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by subclass');
  }
}
