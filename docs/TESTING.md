# Testing Guide

Guide for testing the authentication module.

## Test Structure

This project uses Node.js built-in test runner for unit tests.

```
packages/auth-backend/src/
├── utils/
│   ├── password.js
│   └── password.test.js       # Unit tests for password utilities
├── services/
│   ├── authService.js
│   └── authService.test.js    # Unit tests for auth service
└── controllers/
    ├── authController.js
    └── authController.test.js # Unit tests for controllers
```

## Running Tests

### Backend Tests

```bash
# Run all tests
npm test --workspace=packages/auth-backend

# Run specific test file
node --test packages/auth-backend/src/utils/password.test.js

# Run tests with coverage (using c8)
npm install --save-dev c8
npx c8 npm test --workspace=packages/auth-backend
```

### Frontend Tests

```bash
# With Jest (recommended for React)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test --workspace=packages/auth-frontend
```

## Writing Tests

### Unit Tests Example

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { hashPassword, comparePassword } from './password.js';

test('hashPassword should hash a password', async () => {
  const password = 'TestPassword123!';
  const hashedPassword = await hashPassword(password);

  assert.ok(hashedPassword, 'Hashed password should exist');
  assert.notStrictEqual(hashedPassword, password);
});

test('comparePassword should match correct password', async () => {
  const password = 'TestPassword123!';
  const hashedPassword = await hashPassword(password);
  const isMatch = await comparePassword(password, hashedPassword);

  assert.strictEqual(isMatch, true);
});
```

### Integration Tests Example

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { createAuthApp } from '../src/index.js';

test('POST /register should create new user', async () => {
  const app = await createAuthApp({
    database: { type: 'mongodb', url: 'mongodb://localhost:27017/test' },
  });

  const response = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'TestPass123!',
      name: 'Test User',
    }),
  });

  const data = await response.json();

  assert.strictEqual(response.status, 201);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.accessToken);
});
```

### Component Tests Example (Frontend)

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { AuthProvider } from '../contexts/AuthContext';

test('LoginForm renders and submits', async () => {
  const onSuccess = jest.fn();

  render(
    <AuthProvider config={{ apiBaseUrl: 'http://localhost:3000' }}>
      <LoginForm onSuccess={onSuccess}>
        {({ register, errors, isSubmitting, onSubmit }) => (
          <form onSubmit={onSubmit}>
            <input {...register('email')} data-testid="email" />
            <input {...register('password')} data-testid="password" />
            <button type="submit">Login</button>
          </form>
        )}
      </LoginForm>
    </AuthProvider>
  );

  const emailInput = screen.getByTestId('email');
  const passwordInput = screen.getByTestId('password');
  const submitButton = screen.getByText('Login');

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'TestPass123!' } });
  fireEvent.click(submitButton);

  // Assert form submission
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});
```

## Test Coverage

### Recommended Coverage Targets

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Cover all critical user flows
- **E2E Tests**: Cover main authentication flows

### What to Test

#### Backend

**Utils:**
- ✅ Password hashing and comparison
- ✅ JWT token generation and verification
- ✅ Input validation
- ✅ Email sending (mock)

**Services:**
- ✅ User registration
- ✅ User login
- ✅ Token refresh
- ✅ Password reset
- ✅ Email verification
- ✅ Profile updates

**Controllers:**
- ✅ Request handling
- ✅ Error responses
- ✅ Success responses
- ✅ Validation

**Middleware:**
- ✅ Authentication middleware
- ✅ Authorization middleware
- ✅ Rate limiting

#### Frontend

**Hooks:**
- ✅ useAuth hook
- ✅ useProtectedRoute hook

**Components:**
- ✅ LoginForm submission
- ✅ RegisterForm validation
- ✅ Form error handling
- ✅ Loading states

**Context:**
- ✅ AuthProvider state management
- ✅ Token storage
- ✅ Auto refresh

## Mocking

### Mock Database

```javascript
// Test database adapter
class MockDatabaseAdapter {
  constructor() {
    this.users = [];
  }

  async createUser(userData) {
    const user = { id: '123', ...userData };
    this.users.push(user);
    return user;
  }

  async findUserByEmail(email) {
    return this.users.find((u) => u.email === email);
  }

  // ... other methods
}
```

### Mock Email Service

```javascript
// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }),
  }),
}));
```

### Mock API Calls

```javascript
// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  })
);
```

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret

      - name: Run linter
        run: npm run lint
```

## Manual Testing

### Postman Collection

Import this collection for manual API testing:

```json
{
  "info": {
    "name": "Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/auth/register",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"Test123!@#\",\"name\":\"Test User\"}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"Test123!@#\"}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

### cURL Commands

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get Profile
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Testing

### Load Testing with k6

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const url = 'http://localhost:3000/auth/login';
  const payload = JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!@#',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

Run with:
```bash
k6 run load-test.js
```

## Security Testing

### OWASP ZAP

```bash
# Run security scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000
```

### SQL Injection Testing

```bash
# Test for SQL injection vulnerabilities
sqlmap -u "http://localhost:3000/auth/login" \
  --data="email=test@example.com&password=test" \
  --batch
```

## Best Practices

1. **Test in Isolation**: Each test should be independent
2. **Use Meaningful Names**: Test names should describe what they test
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and validation
4. **Mock External Dependencies**: Don't rely on external services in tests
5. **Clean Up**: Reset state between tests
6. **Test Edge Cases**: Don't just test the happy path
7. **Keep Tests Fast**: Unit tests should run in milliseconds

## Troubleshooting

**Tests timeout:**
- Increase test timeout
- Check for unhandled promises
- Ensure all async operations complete

**Database connection errors:**
- Verify test database is running
- Check connection string
- Ensure proper cleanup after tests

**Flaky tests:**
- Add proper waits for async operations
- Check for race conditions
- Ensure proper test isolation

## Resources

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Testing Library](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)

## Support

For testing questions, please open an issue on GitHub.
