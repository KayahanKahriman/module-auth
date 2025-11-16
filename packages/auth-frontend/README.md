# @auth/frontend

Modular authentication components and hooks for Next.js 15 with App Router.

## Features

- 🎨 **Headless Components** - Unstyled, ready for your design system
- 🪝 **React Hooks** - useAuth, useProtectedRoute, and more
- ✅ **Form Validation** - Built-in validation with react-hook-form + Yup
- 🔄 **Auto Token Refresh** - Automatic access token refresh
- 📱 **Responsive Ready** - Mobile-first design approach
- ♿ **Accessible** - ARIA compliant components
- 🎯 **Type Safe** - Full JSDoc documentation
- 🚀 **Next.js 15** - Optimized for App Router

## Installation

```bash
npm install @auth/frontend react-hook-form yup
```

## Quick Start

### 1. Wrap Your App with AuthProvider

```javascript
// app/layout.js
import { AuthProvider } from '@auth/frontend';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider
          config={{
            apiBaseUrl: 'http://localhost:3000',
            redirects: {
              afterLogin: '/dashboard',
              afterLogout: '/',
            },
          }}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Use Authentication Components

```javascript
// app/login/page.js
'use client';

import { LoginForm } from '@auth/frontend';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <LoginForm onSuccess={() => router.push('/dashboard')}>
      {({ register, errors, isSubmitting, submitError, onSubmit }) => (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Email"
              className="input"
            />
            {errors.email && (
              <p className="error">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              {...register('password')}
              type="password"
              placeholder="Password"
              className="input"
            />
            {errors.password && (
              <p className="error">{errors.password.message}</p>
            )}
          </div>

          {submitError && <p className="error">{submitError}</p>}

          <button type="submit" disabled={isSubmitting} className="btn">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}
    </LoginForm>
  );
}
```

### 3. Protect Routes

```javascript
// app/dashboard/page.js
'use client';

import { useProtectedRoute } from '@auth/frontend';

export default function DashboardPage() {
  const { user, loading } = useProtectedRoute();

  if (loading) return <div>Loading...</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

## Configuration

```javascript
<AuthProvider
  config={{
    apiBaseUrl: 'http://localhost:3000',
    endpoints: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      profile: '/auth/profile',
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
  }}
>
  {children}
</AuthProvider>
```

## Components

### LoginForm

```javascript
import { LoginForm } from '@auth/frontend';

<LoginForm
  onSuccess={(user) => router.push('/dashboard')}
  onError={(error) => toast.error(error.message)}
>
  {({ register, errors, isSubmitting, submitError, onSubmit }) => (
    <form onSubmit={onSubmit}>
      {/* Your form fields */}
    </form>
  )}
</LoginForm>
```

### RegisterForm

```javascript
import { RegisterForm } from '@auth/frontend';

<RegisterForm
  onSuccess={(user) => router.push('/welcome')}
>
  {({ register, errors, isSubmitting, submitError, onSubmit }) => (
    <form onSubmit={onSubmit}>
      <input {...register('name')} placeholder="Name" />
      <input {...register('email')} placeholder="Email" />
      <input {...register('password')} type="password" />
      <input {...register('confirmPassword')} type="password" />
      <button type="submit">Register</button>
    </form>
  )}
</RegisterForm>
```

### ForgotPasswordForm

```javascript
import { ForgotPasswordForm } from '@auth/frontend';

<ForgotPasswordForm onSuccess={() => setEmailSent(true)}>
  {({ register, errors, isSubmitting, isSuccess, onSubmit }) => (
    <form onSubmit={onSubmit}>
      <input {...register('email')} placeholder="Email" />
      {isSuccess && <p>Check your email for reset link!</p>}
      <button type="submit">Send Reset Link</button>
    </form>
  )}
</ForgotPasswordForm>
```

### ResetPasswordForm

```javascript
import { ResetPasswordForm } from '@auth/frontend';
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const token = searchParams.get('token');

<ResetPasswordForm
  token={token}
  onSuccess={() => router.push('/login')}
>
  {({ register, errors, isSubmitting, isSuccess, onSubmit }) => (
    <form onSubmit={onSubmit}>
      <input {...register('password')} type="password" />
      <input {...register('confirmPassword')} type="password" />
      {isSuccess && <p>Password reset successfully!</p>}
      <button type="submit">Reset Password</button>
    </form>
  )}
</ResetPasswordForm>
```

### UserProfileForm

```javascript
import { UserProfileForm } from '@auth/frontend';

<UserProfileForm onSuccess={() => toast.success('Profile updated!')}>
  {({ register, errors, isSubmitting, user, onSubmit }) => (
    <form onSubmit={onSubmit}>
      <input {...register('name')} placeholder="Name" />
      <input {...register('phone')} placeholder="Phone" />
      <textarea {...register('bio')} placeholder="Bio" />
      <button type="submit">Save Changes</button>
    </form>
  )}
</UserProfileForm>
```

## Hooks

### useAuth

Access authentication state and methods throughout your app.

```javascript
import { useAuth } from '@auth/frontend';

function MyComponent() {
  const {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  } = useAuth();

  // Use auth methods
}
```

### useProtectedRoute

Protect routes and redirect unauthenticated users.

```javascript
import { useProtectedRoute } from '@auth/frontend';

function ProtectedPage() {
  const { user, loading } = useProtectedRoute({
    redirectTo: '/login',
    requireEmailVerified: true,
  });

  if (loading) return <Loading />;

  return <div>Protected content for {user.name}</div>;
}
```

## Styling

All components are headless (unstyled), allowing you to apply your own styles. Here's an example with Tailwind CSS:

```javascript
<LoginForm onSuccess={() => router.push('/dashboard')}>
  {({ register, errors, isSubmitting, submitError, onSubmit }) => (
    <form onSubmit={onSubmit} className="max-w-md mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Logging in...' : 'Sign in'}
      </button>
    </form>
  )}
</LoginForm>
```

## Server Components

For server-side authentication checks:

```javascript
// app/dashboard/page.js
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token');

  if (!token) {
    redirect('/login');
  }

  // Fetch user data server-side
  const user = await fetchUser(token.value);

  return <div>Welcome, {user.name}!</div>;
}
```

## Error Handling

```javascript
<LoginForm
  onError={(error) => {
    if (error.message.includes('verify')) {
      router.push('/verify-email');
    } else {
      toast.error(error.message);
    }
  }}
>
  {/* form */}
</LoginForm>
```

## Examples

Check out the [examples](../../examples) directory for complete implementations:

- Basic authentication flow
- Dashboard with protected routes
- User profile management
- Password reset flow

## TypeScript Support

While this package is written in JavaScript, full JSDoc comments are provided for excellent IDE support and type checking.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
