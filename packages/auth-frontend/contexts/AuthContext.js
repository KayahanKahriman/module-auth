/**
 * Authentication Context
 * Provides authentication state and methods to the entire application
 * @module contexts/AuthContext
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Authentication Context
 */
const AuthContext = createContext(undefined);

/**
 * Default configuration
 */
const defaultConfig = {
  apiBaseUrl: 'http://localhost:3000',
  endpoints: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    profile: '/auth/profile',
    me: '/auth/me',
  },
  storage: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'auth_refresh_token',
    userKey: 'auth_user',
  },
  redirects: {
    afterLogin: '/dashboard',
    afterLogout: '/',
    afterRegister: '/welcome',
  },
  autoRefresh: true,
  refreshInterval: 14 * 60 * 1000, // 14 minutes
};

/**
 * Authentication Provider Component
 * Wraps the application to provide authentication context
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.config - Configuration object
 * @returns {JSX.Element}
 */
export function AuthProvider({ children, config = {} }) {
  const finalConfig = { ...defaultConfig, ...config };

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Makes an API request to the auth backend
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const url = `${finalConfig.apiBaseUrl}${endpoint}`;
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }, [finalConfig.apiBaseUrl]);

  /**
   * Gets access token from storage
   * @returns {string|null} Access token
   */
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(finalConfig.storage.tokenKey);
  }, [finalConfig.storage.tokenKey]);

  /**
   * Gets refresh token from storage
   * @returns {string|null} Refresh token
   */
  const getRefreshToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(finalConfig.storage.refreshTokenKey);
  }, [finalConfig.storage.refreshTokenKey]);

  /**
   * Stores tokens in localStorage
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   */
  const storeTokens = useCallback((accessToken, refreshToken) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(finalConfig.storage.tokenKey, accessToken);
    localStorage.setItem(finalConfig.storage.refreshTokenKey, refreshToken);
  }, [finalConfig.storage.tokenKey, finalConfig.storage.refreshTokenKey]);

  /**
   * Stores user data in localStorage
   * @param {Object} userData - User object
   */
  const storeUser = useCallback((userData) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(finalConfig.storage.userKey, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  }, [finalConfig.storage.userKey]);

  /**
   * Clears all auth data from storage
   */
  const clearAuthData = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(finalConfig.storage.tokenKey);
    localStorage.removeItem(finalConfig.storage.refreshTokenKey);
    localStorage.removeItem(finalConfig.storage.userKey);
    setUser(null);
    setIsAuthenticated(false);
  }, [finalConfig.storage.tokenKey, finalConfig.storage.refreshTokenKey, finalConfig.storage.userKey]);

  /**
   * Registers a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      const response = await apiRequest(finalConfig.endpoints.register, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.data.accessToken && response.data.refreshToken) {
        storeTokens(response.data.accessToken, response.data.refreshToken);
        storeUser(response.data.user);
      }

      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [apiRequest, finalConfig.endpoints.register, storeTokens, storeUser]);

  /**
   * Logs in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const response = await apiRequest(finalConfig.endpoints.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      storeTokens(response.data.accessToken, response.data.refreshToken);
      storeUser(response.data.user);

      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [apiRequest, finalConfig.endpoints.login, storeTokens, storeUser]);

  /**
   * Logs out the current user
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      setError(null);
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        await apiRequest(finalConfig.endpoints.logout, {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthData();
    }
  }, [apiRequest, finalConfig.endpoints.logout, getRefreshToken, clearAuthData]);

  /**
   * Refreshes the access token
   * @returns {Promise<boolean>} Success status
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        return false;
      }

      const response = await apiRequest(finalConfig.endpoints.refresh, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      storeTokens(response.data.accessToken, response.data.refreshToken);
      storeUser(response.data.user);

      return true;
    } catch (err) {
      console.error('Token refresh error:', err);
      clearAuthData();
      return false;
    }
  }, [apiRequest, finalConfig.endpoints.refresh, getRefreshToken, storeTokens, storeUser, clearAuthData]);

  /**
   * Fetches current user data
   * @returns {Promise<Object>} User data
   */
  const fetchUser = useCallback(async () => {
    try {
      const response = await apiRequest(finalConfig.endpoints.me);
      storeUser(response.data.user);
      return response.data.user;
    } catch (err) {
      clearAuthData();
      throw err;
    }
  }, [apiRequest, finalConfig.endpoints.me, storeUser, clearAuthData]);

  /**
   * Updates user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      setError(null);
      const response = await apiRequest(finalConfig.endpoints.profile, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      storeUser(response.data.user);
      return response.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [apiRequest, finalConfig.endpoints.profile, storeUser]);

  /**
   * Requests password reset
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      setError(null);
      await apiRequest(finalConfig.endpoints.forgotPassword, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [apiRequest, finalConfig.endpoints.forgotPassword]);

  /**
   * Resets password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<void>}
   */
  const resetPassword = useCallback(async (token, password, confirmPassword) => {
    try {
      setError(null);
      await apiRequest(finalConfig.endpoints.resetPassword, {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword }),
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [apiRequest, finalConfig.endpoints.resetPassword]);

  /**
   * Verifies email with token
   * @param {string} token - Verification token
   * @returns {Promise<void>}
   */
  const verifyEmail = useCallback(async (token) => {
    try {
      setError(null);
      const response = await apiRequest(finalConfig.endpoints.verifyEmail, {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      if (user) {
        storeUser({ ...user, isEmailVerified: true });
      }

      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [apiRequest, finalConfig.endpoints.verifyEmail, user, storeUser]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      const storedUser = localStorage.getItem(finalConfig.storage.userKey);

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);

          // Fetch fresh user data
          await fetchUser();
        } catch (err) {
          console.error('Auth initialization error:', err);
          clearAuthData();
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, [getToken, finalConfig.storage.userKey, fetchUser, clearAuthData]);

  // Auto refresh token
  useEffect(() => {
    if (!finalConfig.autoRefresh || !isAuthenticated) {
      return;
    }

    const interval = setInterval(() => {
      refreshAccessToken();
    }, finalConfig.refreshInterval);

    return () => clearInterval(interval);
  }, [finalConfig.autoRefresh, finalConfig.refreshInterval, isAuthenticated, refreshAccessToken]);

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    verifyEmail,
    refreshAccessToken,
    fetchUser,
    getToken,
    config: finalConfig,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook
 * Access authentication context
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
