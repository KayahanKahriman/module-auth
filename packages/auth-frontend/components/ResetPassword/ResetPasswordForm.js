/**
 * ResetPasswordForm Component
 * Headless password reset form
 * @module components/ResetPassword/ResetPasswordForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext.js';
import { useState } from 'react';

/**
 * Reset password form validation schema
 */
const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      'Password must contain uppercase, lowercase, number, and special character'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

/**
 * Headless ResetPasswordForm Component
 * Resets user password with token
 *
 * @param {Object} props - Component props
 * @param {string} props.token - Password reset token from URL
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onError - Error callback
 * @param {Function} props.children - Render function
 * @returns {JSX.Element}
 *
 * @example
 * const searchParams = useSearchParams();
 * const token = searchParams.get('token');
 *
 * <ResetPasswordForm
 *   token={token}
 *   onSuccess={() => router.push('/login')}
 * >
 *   {({ register, errors, isSubmitting, submitError, onSubmit, isSuccess }) => (
 *     <form onSubmit={onSubmit}>
 *       <input
 *         {...register('password')}
 *         type="password"
 *         placeholder="New password"
 *       />
 *       {errors.password && <span>{errors.password.message}</span>}
 *
 *       <input
 *         {...register('confirmPassword')}
 *         type="password"
 *         placeholder="Confirm password"
 *       />
 *       {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
 *
 *       {submitError && <span className="error">{submitError}</span>}
 *
 *       {isSuccess && (
 *         <div className="success">Password reset successfully!</div>
 *       )}
 *
 *       <button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? 'Resetting...' : 'Reset Password'}
 *       </button>
 *     </form>
 *   )}
 * </ResetPasswordForm>
 */
export function ResetPasswordForm({
  token,
  onSuccess,
  onError,
  children,
}) {
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!token) {
      setSubmitError('Invalid or missing reset token');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setIsSuccess(false);

    try {
      await resetPassword(token, data.password, data.confirmPassword);
      setIsSuccess(true);

      if (onSuccess) {
        await onSuccess();
      }

      reset();
    } catch (error) {
      setSubmitError(error.message || 'Failed to reset password');

      if (onError) {
        await onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return children({
    register,
    errors,
    isSubmitting,
    submitError,
    isSuccess,
    onSubmit,
    reset,
  });
}
