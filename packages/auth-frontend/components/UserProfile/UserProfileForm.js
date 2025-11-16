/**
 * UserProfileForm Component
 * Headless user profile form
 * @module components/UserProfile/UserProfileForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext.js';
import { useState, useEffect } from 'react';

/**
 * User profile form validation schema
 */
const profileSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  phone: yup
    .string()
    .optional(),
  bio: yup
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional(),
  avatar: yup
    .string()
    .url('Avatar must be a valid URL')
    .optional(),
});

/**
 * Headless UserProfileForm Component
 * Updates user profile information
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onError - Error callback
 * @param {Function} props.children - Render function
 * @returns {JSX.Element}
 *
 * @example
 * <UserProfileForm onSuccess={() => toast.success('Profile updated!')}>
 *   {({ register, errors, isSubmitting, submitError, onSubmit, user }) => (
 *     <form onSubmit={onSubmit}>
 *       <input {...register('name')} placeholder="Name" />
 *       {errors.name && <span>{errors.name.message}</span>}
 *
 *       <input {...register('phone')} placeholder="Phone" />
 *       {errors.phone && <span>{errors.phone.message}</span>}
 *
 *       <textarea {...register('bio')} placeholder="Bio" />
 *       {errors.bio && <span>{errors.bio.message}</span>}
 *
 *       <input {...register('avatar')} placeholder="Avatar URL" />
 *       {errors.avatar && <span>{errors.avatar.message}</span>}
 *
 *       {submitError && <span className="error">{submitError}</span>}
 *
 *       <button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? 'Saving...' : 'Save Changes'}
 *       </button>
 *     </form>
 *   )}
 * </UserProfileForm>
 */
export function UserProfileForm({
  onSuccess,
  onError,
  children,
}) {
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      bio: '',
      avatar: '',
    },
  });

  // Populate form with current user data
  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('phone', user.phone || '');
      setValue('bio', user.bio || '');
      setValue('avatar', user.avatar || '');
    }
  }, [user, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Only send fields that have values
      const updates = {};
      Object.keys(data).forEach((key) => {
        if (data[key]) {
          updates[key] = data[key];
        }
      });

      const updatedUser = await updateProfile(updates);

      if (onSuccess) {
        await onSuccess(updatedUser);
      }
    } catch (error) {
      setSubmitError(error.message || 'Failed to update profile');

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
    user,
  });
}

/**
 * UserProfileDisplay Component
 * Displays user profile information (read-only)
 *
 * @param {Object} props - Component props
 * @param {Function} props.children - Render function receiving user data
 * @returns {JSX.Element}
 *
 * @example
 * <UserProfileDisplay>
 *   {({ user, loading }) => {
 *     if (loading) return <div>Loading...</div>;
 *
 *     return (
 *       <div>
 *         <h2>{user.name}</h2>
 *         <p>{user.email}</p>
 *         <p>{user.bio}</p>
 *         {user.avatar && <img src={user.avatar} alt={user.name} />}
 *       </div>
 *     );
 *   }}
 * </UserProfileDisplay>
 */
export function UserProfileDisplay({ children }) {
  const { user, loading } = useAuth();

  return children({ user, loading });
}
