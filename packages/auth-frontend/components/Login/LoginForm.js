/**
 * LoginForm Component
 * Headless login form with validation
 * @module components/Login/LoginForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext.js';
import { useState } from 'react';

/**
 * Login form validation schema
 */
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required'),
  rememberMe: yup.boolean(),
});

/**
 * Headless LoginForm Component
 * Provides form state, validation, and submission logic
 * Renderless - uses render prop pattern
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Success callback with user data
 * @param {Function} props.onError - Error callback with error object
 * @param {Function} props.children - Render function receiving form props
 * @param {Object} props.defaultValues - Default form values
 * @returns {JSX.Element}
 *
 * @example
 * <LoginForm onSuccess={(user) => router.push('/dashboard')}>
 *   {({ register, errors, isSubmitting, onSubmit }) => (
 *     <form onSubmit={onSubmit}>
 *       <input {...register('email')} placeholder="Email" />
 *       {errors.email && <span>{errors.email.message}</span>}
 *
 *       <input {...register('password')} type="password" />
 *       {errors.password && <span>{errors.password.message}</span>}
 *
 *       <button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? 'Logging in...' : 'Login'}
 *       </button>
 *     </form>
 *   )}
 * </LoginForm>
 */
export function LoginForm({
  onSuccess,
  onError,
  children,
  defaultValues = {},
}) {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
      ...defaultValues,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await login(data.email, data.password);

      if (onSuccess) {
        await onSuccess(result.user);
      }

      reset();
    } catch (error) {
      setSubmitError(error.message || 'Login failed');

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
    onSubmit,
    reset,
  });
}
