/**
 * In-Memory database adapter (for testing/development only)
 * @module models/adapters/memory
 */

import { BaseDatabaseAdapter } from './base.js';
import { sanitizeUser } from '../user.js';
import crypto from 'crypto';

/**
 * In-Memory Database Adapter
 * @extends BaseDatabaseAdapter
 */
export class MemoryAdapter extends BaseDatabaseAdapter {
  constructor(config) {
    super(config);
    this.users = new Map();
  }

  async connect() {
    console.log('Connected to in-memory database');
  }

  async disconnect() {
    this.users.clear();
    console.log('Disconnected from in-memory database');
  }

  async initialize() {
    console.log('In-memory database initialized');
  }

  async createUser(userData) {
    const user = {
      id: crypto.randomUUID(),
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

    if (this.findUserByEmailSync(user.email)) {
      throw new Error('Email already exists');
    }

    this.users.set(user.id, user);
    return { ...user };
  }

  findUserByEmailSync(email) {
    return Array.from(this.users.values()).find(
      (u) => u.email === email.toLowerCase()
    );
  }

  async findUserById(id) {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findUserByEmail(email) {
    const user = this.findUserByEmailSync(email);
    return user ? { ...user } : null;
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      ...updates,
      id: user.id,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return { ...updatedUser };
  }

  async deleteUser(id) {
    return this.users.delete(id);
  }

  async findUsers(filters = {}, options = {}) {
    let users = Array.from(this.users.values());

    if (filters.role) {
      users = users.filter((u) => u.role === filters.role);
    }

    if (filters.isActive !== undefined) {
      users = users.filter((u) => u.isActive === filters.isActive);
    }

    if (filters.isEmailVerified !== undefined) {
      users = users.filter((u) => u.isEmailVerified === filters.isEmailVerified);
    }

    if (options.limit) {
      users = users.slice(0, options.limit);
    }

    return users.map((u) => ({ ...u }));
  }

  async addRefreshToken(userId, token) {
    const user = this.users.get(userId);
    if (user) {
      user.refreshTokens.push(token);
      user.updatedAt = new Date();
    }
  }

  async removeRefreshToken(userId, token) {
    const user = this.users.get(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      user.updatedAt = new Date();
    }
  }

  async removeAllRefreshTokens(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.refreshTokens = [];
      user.updatedAt = new Date();
    }
  }

  async updateLastLogin(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.lastLogin = new Date();
      user.updatedAt = new Date();
    }
  }

  async healthCheck() {
    return true;
  }
}
