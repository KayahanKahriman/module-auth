# Authentication Module

A production-ready, modular, and framework-agnostic authentication system for Node.js and Next.js applications.

## Features

✨ **Modular Architecture** - Drop into any project with minimal configuration
🔐 **Multiple Auth Strategies** - Email/Password, OAuth, Magic Link, Phone/OTP
🎨 **Headless UI** - Unstyled components ready for your design system
🗄️ **Database Agnostic** - Support for PostgreSQL, MySQL, and MongoDB
🔄 **JWT + Refresh Tokens** - Secure token-based authentication
🛡️ **Security First** - Rate limiting, CORS, helmet, bcrypt
📱 **Responsive & Accessible** - ARIA compliant components
⚙️ **Highly Configurable** - Customize everything via config
🎯 **RBAC Ready** - Role-based access control support
📚 **Well Documented** - Comprehensive docs and JSDoc comments

## Project Structure

```
auth-module/
├── packages/
│   ├── auth-backend/      # Express.js backend
│   └── auth-frontend/     # Next.js frontend components
├── examples/
│   ├── basic-usage/       # Quick start example
│   ├── with-mongodb/      # MongoDB integration
│   └── with-postgresql/   # PostgreSQL integration
└── docs/                  # Documentation
```

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Backend setup
cd packages/auth-backend
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Frontend setup
cd packages/auth-frontend
npm run dev
```

### Backend Usage

```javascript
import express from 'express';
import { createAuthRouter } from '@auth/backend';

const app = express();

const authConfig = {
  database: {
    type: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
  },
  features: {
    emailVerification: true,
    oauth: false,
  },
};

app.use('/api/auth', createAuthRouter(authConfig));

app.listen(3000);
```

### Frontend Usage

```javascript
import { AuthProvider, useAuth, LoginForm } from '@auth/frontend';

function App() {
  return (
    <AuthProvider
      config={{
        apiBaseUrl: 'http://localhost:3000',
        redirects: {
          afterLogin: '/dashboard',
          afterLogout: '/',
        },
      }}
    >
      <YourApp />
    </AuthProvider>
  );
}

function LoginPage() {
  const { user } = useAuth();

  return (
    <LoginForm
      onSuccess={(user) => router.push('/dashboard')}
      onError={(error) => toast.error(error.message)}
    />
  );
}
```

## Packages

### @auth/backend

Express.js-based authentication backend with:
- JWT token management
- User registration & login
- Password reset flow
- Email verification
- OAuth integration
- Rate limiting
- Database adapters

[Backend Documentation →](./packages/auth-backend/README.md)

### @auth/frontend

Next.js components and hooks:
- Authentication context
- Login/Register forms
- Password reset forms
- Protected routes
- User profile management
- Headless UI components

[Frontend Documentation →](./packages/auth-frontend/README.md)

## Configuration

The system is highly configurable. See the full configuration options:

```javascript
{
  apiBaseUrl: 'http://localhost:3000',
  endpoints: {
    login: '/login',
    register: '/register',
    logout: '/logout',
    refresh: '/refresh',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    verifyEmail: '/verify-email',
    profile: '/profile'
  },
  userSchema: {
    additionalFields: [
      { name: 'phone', type: 'string', required: false },
      { name: 'address', type: 'string', required: false }
    ]
  },
  features: {
    emailVerification: true,
    oauth: false,
    phoneAuth: false,
    magicLink: false
  },
  ui: {
    theme: 'light',
    logo: null,
    redirects: {
      afterLogin: '/dashboard',
      afterLogout: '/',
      afterRegister: '/welcome'
    }
  }
}
```

[Full Configuration Guide →](./docs/CONFIGURATION.md)

## Examples

- **[Basic Usage](./examples/basic-usage)** - Simple authentication setup
- **[MongoDB Integration](./examples/with-mongodb)** - Using MongoDB
- **[PostgreSQL Integration](./examples/with-postgresql)** - Using PostgreSQL

## Documentation

- [Setup Guide](./docs/SETUP.md)
- [Configuration](./docs/CONFIGURATION.md)
- [API Reference](./docs/API.md)
- [Component Props](./docs/COMPONENTS.md)
- [Migration Guide](./docs/MIGRATION.md)
- [Security Best Practices](./docs/SECURITY.md)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build all packages
npm run build
```

## Testing

The project includes unit tests and integration test examples:

```bash
# Run all tests
npm test

# Run backend tests
npm test --workspace=packages/auth-backend

# Run frontend tests
npm test --workspace=packages/auth-frontend
```

## Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure CORS origins
- [ ] Enable rate limiting
- [ ] Set up SSL/TLS
- [ ] Configure email service
- [ ] Set up Redis for sessions (optional)
- [ ] Enable security headers
- [ ] Configure database backups
- [ ] Set up monitoring and logging

[Deployment Guide →](./docs/DEPLOYMENT.md)

## Security

This module follows security best practices:

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Refresh token rotation
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection

Report security vulnerabilities to: security@example.com

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- 📖 [Documentation](./docs)
- 💬 [Discussions](https://github.com/yourusername/auth-module/discussions)
- 🐛 [Issue Tracker](https://github.com/yourusername/auth-module/issues)

---

Made with ❤️ by the community
