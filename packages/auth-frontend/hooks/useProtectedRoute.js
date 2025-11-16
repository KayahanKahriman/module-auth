/**
 * useProtectedRoute hook
 * Protects routes by redirecting unauthenticated users
 * @module hooks/useProtectedRoute
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext.js';

/**
 * Hook to protect routes from unauthenticated access
 * Redirects to login page if user is not authenticated
 *
 * @param {Object} options - Hook options
 * @param {string} options.redirectTo - URL to redirect if not authenticated
 * @param {boolean} options.requireEmailVerified - Require email verification
 * @returns {Object} Auth state
 *
 * @example
 * function DashboardPage() {
 *   const { user, loading } = useProtectedRoute();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return <div>Welcome {user.name}</div>;
 * }
 */
export function useProtectedRoute(options = {}) {
  const { redirectTo = '/login', requireEmailVerified = false } = options;
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requireEmailVerified && user && !user.isEmailVerified) {
      router.push('/verify-email');
    }
  }, [isAuthenticated, loading, user, requireEmailVerified, router, redirectTo]);

  return { user, loading, isAuthenticated };
}
