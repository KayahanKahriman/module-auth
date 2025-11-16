/**
 * RegisterForm Component
 * Headless registration form with validation
 * @module components/Register/RegisterForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext.js';
import { useState } from 'react';

/**
 * Registration form validation schema
 */
const registerSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
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
  phone: yup.string().optional(),
});

/**
 * Headless RegisterForm Component
 * Provides form state, validation, and submission logic
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onError - Error callback
 * @param {Function} props.children - Render function
 * @param {Object} props.defaultValues - Default form values
 * @returns {JSX.Element}
 *
 * @example
 * <RegisterForm onSuccess={(user) => router.push('/welcome')}>
 *   {({ register, errors, isSubmitting, onSubmit }) => (
 *     <form onSubmit={onSubmit}>
 *       <input {...register('name')} placeholder="Name" />
 *       {errors.name && <span>{errors.name.message}</span>}
 *
 *       <input {...register('email')} placeholder="Email" />
 *       {errors.email && <span>{errors.email.message}</span>}
 *
 *       <input {...register('password')} type="password" />
 *       {errors.password && <span>{errors.password.message}</span>}
 *
 *       <input {...register('confirmPassword')} type="password" />
 *       {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
 *
 *       <button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? 'Creating account...' : 'Register'}
 *       </button>
 *     </form>
 *   )}
 * </RegisterForm>
 */
export function RegisterForm({
  onSuccess,
  onError,
  children,
  defaultValues = {},
}) {
  const { register: registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      ...defaultValues,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = data;

      const result = await registerUser(userData);

      if (onSuccess) {
        await onSuccess(result.user);
      }

      reset();
    } catch (error) {
      setSubmitError(error.message || 'Registration failed');

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
