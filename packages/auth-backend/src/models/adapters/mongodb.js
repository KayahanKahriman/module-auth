/**
 * MongoDB database adapter
 * @module models/adapters/mongodb
 */

import { MongoClient, ObjectId } from 'mongodb';
import { BaseDatabaseAdapter } from './base.js';
import { sanitizeUser } from '../user.js';

/**
 * MongoDB Database Adapter
 * @extends BaseDatabaseAdapter
 */
export class MongoDBAdapter extends BaseDatabaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
    this.db = null;
    this.users = null;
  }

  /**
   * Connects to MongoDB
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      this.client = new MongoClient(this.config.database.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      await this.client.connect();

      const dbName = new URL(this.config.database.url).pathname.slice(1) || 'authdb';
      this.db = this.client.db(dbName);
      this.users = this.db.collection('users');

      console.log('Connected to MongoDB database');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
  }

  /**
   * Disconnects from MongoDB
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB database');
    }
  }

  /**
   * Initializes MongoDB indexes
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create unique index on email
      await this.users.createIndex({ email: 1 }, { unique: true });

      // Create index on role
      await this.users.createIndex({ role: 1 });

      // Create index on isActive
      await this.users.createIndex({ isActive: 1 });

      console.log('MongoDB indexes initialized');
    } catch (error) {
      console.error('MongoDB initialization error:', error);
      throw new Error(`Failed to initialize MongoDB: ${error.message}`);
    }
  }

  /**
   * Creates a new user in MongoDB
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      const user = {
        email: userData.email.toLowerCase(),
        password: userData.password,
        name: userData.name || null,
        phone: userData.phone || null,
        role: userData.role || 'user',
        isEmailVerified: userData.isEmailVerified || false,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        avatar: userData.avatar || null,
        bio: userData.bio || null,
        lastLogin: null,
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.users.insertOne(user);
      user._id = result.insertedId;
      user.id = result.insertedId.toString();

      return this._formatUser(user);
    } catch (error) {
      if (error.code === 11000) {
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
    try {
      const user = await this.users.findOne({ _id: new ObjectId(id) });
      return user ? this._formatUser(user) : null;
    } catch (error) {
      if (error.name === 'BSONError') {
        return null;
      }
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Finds a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findUserByEmail(email) {
    try {
      const user = await this.users.findOne({ email: email.toLowerCase() });
      return user ? this._formatUser(user) : null;
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
    try {
      const updateData = { ...updates };
      delete updateData.id;
      delete updateData._id;
      updateData.updatedAt = new Date();

      const result = await this.users.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('User not found');
      }

      return this._formatUser(result);
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
    try {
      const result = await this.users.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
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
    try {
      const query = {};

      if (filters.role) {
        query.role = filters.role;
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.isEmailVerified !== undefined) {
        query.isEmailVerified = filters.isEmailVerified;
      }

      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder === 'ASC' ? 1 : -1;

      let cursor = this.users
        .find(query)
        .sort({ [sortBy]: sortOrder });

      if (options.limit) {
        cursor = cursor.limit(options.limit);
      }

      if (options.offset) {
        cursor = cursor.skip(options.offset);
      }

      const users = await cursor.toArray();
      return users.map((user) => this._formatUser(user));
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
      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $push: { refreshTokens: token },
          $set: { updatedAt: new Date() },
        }
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
      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $pull: { refreshTokens: token },
          $set: { updatedAt: new Date() },
        }
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
      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { refreshTokens: [], updatedAt: new Date() },
        }
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
      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { lastLogin: new Date(), updatedAt: new Date() },
        }
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
      await this.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Formats MongoDB document to user object
   * @private
   * @param {Object} doc - MongoDB document
   * @returns {Object} Formatted user object
   */
  _formatUser(doc) {
    if (!doc) return null;

    return {
      id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      name: doc.name,
      phone: doc.phone,
      role: doc.role,
      isEmailVerified: doc.isEmailVerified,
      isActive: doc.isActive,
      avatar: doc.avatar,
      bio: doc.bio,
      lastLogin: doc.lastLogin,
      refreshTokens: doc.refreshTokens || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
