/**
 * Main entry point for @auth/frontend package
 * Exports all components, hooks, and utilities
 * @module auth-frontend
 */

// Context and Provider
export { AuthProvider, useAuth } from './contexts/AuthContext.js';

// Hooks
export { useProtectedRoute } from './hooks/useProtectedRoute.js';

// Components
export { LoginForm } from './components/Login/LoginForm.js';
export { RegisterForm } from './components/Register/RegisterForm.js';
export { ForgotPasswordForm } from './components/ForgotPassword/ForgotPasswordForm.js';
export { ResetPasswordForm } from './components/ResetPassword/ResetPasswordForm.js';
export {
  UserProfileForm,
  UserProfileDisplay,
} from './components/UserProfile/UserProfileForm.js';
