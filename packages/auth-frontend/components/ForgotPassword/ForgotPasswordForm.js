/**
 * ForgotPasswordForm Component
 * Headless forgot password form
 * @module components/ForgotPassword/ForgotPasswordForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext.js';
import { useState } from 'react';

/**
 * Forgot password form validation schema
 */
const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
});

/**
 * Headless ForgotPasswordForm Component
 * Sends password reset email
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onError - Error callback
 * @param {Function} props.children - Render function
 * @returns {JSX.Element}
 *
 * @example
 * <ForgotPasswordForm onSuccess={() => setEmailSent(true)}>
 *   {({ register, errors, isSubmitting, submitError, onSubmit, isSuccess }) => (
 *     <form onSubmit={onSubmit}>
 *       <input {...register('email')} placeholder="Enter your email" />
 *       {errors.email && <span>{errors.email.message}</span>}
 *       {submitError && <span className="error">{submitError}</span>}
 *
 *       {isSuccess && (
 *         <div className="success">
 *           Password reset link sent! Check your email.
 *         </div>
 *       )}
 *
 *       <button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? 'Sending...' : 'Send Reset Link'}
 *       </button>
 *     </form>
 *   )}
 * </ForgotPasswordForm>
 */
export function ForgotPasswordForm({
  onSuccess,
  onError,
  children,
}) {
  const { forgotPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setIsSuccess(false);

    try {
      await forgotPassword(data.email);
      setIsSuccess(true);

      if (onSuccess) {
        await onSuccess();
      }

      reset();
    } catch (error) {
      setSubmitError(error.message || 'Failed to send reset email');

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
