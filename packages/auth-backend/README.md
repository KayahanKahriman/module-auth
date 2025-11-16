# @auth/backend

A modular, database-agnostic authentication backend for Node.js with Express.

## Features

- 🔐 JWT + Refresh Token authentication
- 🗄️ Database agnostic (PostgreSQL, MySQL, MongoDB)
- 🛡️ Security best practices (bcrypt, helmet, CORS, rate limiting)
- ✉️ Email verification and password reset
- 🎯 Role-based access control (RBAC)
- ⚙️ Highly configurable
- 🪝 Event hooks for custom logic
- 📧 Beautiful email templates
- 🚀 Production-ready

## Installation

```bash
npm install @auth/backend
```

## Quick Start

```javascript
import express from 'express';
import { createAuthRouter } from '@auth/backend';

const app = express();
app.use(express.json());

// Configure and create auth router
const authRouter = await createAuthRouter({
  database: {
    type: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  email: {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
});

app.use('/api/auth', authRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/authdb

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Features
ENABLE_EMAIL_VERIFICATION=true
```

### Configuration Object

```javascript
const config = {
  database: {
    type: 'postgresql', // 'postgresql', 'mysql', or 'mongodb'
    url: 'postgresql://localhost:5432/authdb',
  },
  jwt: {
    secret: 'your-jwt-secret',
    expiresIn: '15m',
    refreshSecret: 'your-refresh-secret',
    refreshExpiresIn: '7d',
  },
  email: {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-password',
    },
    from: 'noreply@yourapp.com',
  },
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
  features: {
    emailVerification: true,
    oauth: false,
  },
  endpoints: {
    login: '/login',
    register: '/register',
    // ... customize endpoints
  },
  hooks: {
    onRegister: async (user) => {
      // Custom logic after registration
    },
    onLogin: async (user) => {
      // Custom logic after login
    },
  },
};
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login with email and password |
| POST | `/refresh` | Refresh access token |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with token |
| POST | `/verify-email` | Verify email address |
| POST | `/resend-verification` | Resend verification email |
| GET | `/health` | Health check |

### Protected Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/logout` | Logout user |
| POST | `/logout-all` | Logout from all devices |
| POST | `/change-password` | Change password |
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update user profile |
| GET | `/me` | Get current user |

## Database Support

### PostgreSQL

```javascript
{
  database: {
    type: 'postgresql',
    url: 'postgresql://user:pass@localhost:5432/db',
  }
}
```

### MySQL

```javascript
{
  database: {
    type: 'mysql',
    url: 'mysql://user:pass@localhost:3306/db',
  }
}
```

### MongoDB

```javascript
{
  database: {
    type: 'mongodb',
    url: 'mongodb://localhost:27017/db',
  }
}
```

## Middleware

### Protect Routes

```javascript
import { authenticate, authorize } from '@auth/backend';

// Require authentication
app.get('/protected', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Require specific role
app.get('/admin', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Admin only' });
});
```

### Rate Limiting

```javascript
import { authLimiter, passwordResetLimiter } from '@auth/backend';

app.post('/login', authLimiter, loginController);
app.post('/forgot-password', passwordResetLimiter, forgotPasswordController);
```

## Event Hooks

Execute custom logic on authentication events:

```javascript
{
  hooks: {
    onRegister: async (user) => {
      // Send to analytics, create user profile, etc.
      await analytics.track('user_registered', { userId: user.id });
    },
    onLogin: async (user) => {
      // Track login event
      await analytics.track('user_logged_in', { userId: user.id });
    },
    onLogout: async (user) => {
      // Cleanup sessions
    },
    onPasswordReset: async (user) => {
      // Log security event
    },
    onEmailVerified: async (user) => {
      // Grant access to features
    },
  }
}
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Refresh token rotation
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection

## Examples

### Custom User Fields

```javascript
// Extend user schema with custom fields
const authRouter = await createAuthRouter({
  // ... other config
  userSchema: {
    additionalFields: [
      { name: 'phone', type: 'string', required: false },
      { name: 'company', type: 'string', required: false },
    ],
  },
});
```

### Using with Different Databases

See the [examples](../../examples) directory for complete examples:

- [Basic Usage](../../examples/basic-usage)
- [PostgreSQL](../../examples/with-postgresql)
- [MongoDB](../../examples/with-mongodb)

## Error Handling

The package includes comprehensive error handling:

```javascript
try {
  const result = await authService.login(email, password);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication error
  } else if (error instanceof ValidationError) {
    // Handle validation error
  }
}
```

## Testing

```bash
npm test
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
