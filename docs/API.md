# API Documentation

Complete API reference for the authentication backend.

## Base URL

```
http://localhost:3000/api/auth
```

## Response Format

All endpoints return JSON in the following format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Authentication

Protected endpoints require a JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Register User

Creates a new user account.

**Endpoint:** `POST /register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Validation Rules:**
- Email: Required, valid email format
- Password: Required, min 8 chars, must contain uppercase, lowercase, number, and special character
- Name: Optional, 2-100 characters
- Phone: Optional, valid phone format

---

### Login

Authenticates a user and returns tokens.

**Endpoint:** `POST /login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `401 Unauthorized` - Account deactivated
- `401 Unauthorized` - Email not verified (if verification enabled)

---

### Refresh Token

Generates a new access token using a refresh token.

**Endpoint:** `POST /refresh`

**Request Body:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### Logout

Invalidates the current refresh token.

**Endpoint:** `POST /logout` 🔒

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Logout All Devices

Invalidates all refresh tokens for the user.

**Endpoint:** `POST /logout-all` 🔒

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

---

### Get Profile

Retrieves the authenticated user's profile.

**Endpoint:** `GET /profile` 🔒

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "bio": "Software developer",
      "avatar": "https://example.com/avatar.jpg",
      "role": "user",
      "isEmailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Update Profile

Updates the authenticated user's profile.

**Endpoint:** `PUT /profile` 🔒

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "bio": "Updated bio",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Updated",
      "phone": "+1234567890",
      "bio": "Updated bio",
      "avatar": "https://example.com/new-avatar.jpg"
    }
  }
}
```

---

### Get Current User

Retrieves current user information from token.

**Endpoint:** `GET /me` 🔒

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

Same as Get Profile response.

---

### Forgot Password

Sends a password reset email to the user.

**Endpoint:** `POST /forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent"
}
```

**Note:** Always returns success to prevent email enumeration.

---

### Reset Password

Resets the user's password using a reset token.

**Endpoint:** `POST /reset-password`

**Request Body:**

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired token
- `400 Bad Request` - Passwords don't match

---

### Change Password

Changes the password for an authenticated user.

**Endpoint:** `POST /change-password` 🔒

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Current password is incorrect
- `400 Bad Request` - New password same as current
- `400 Bad Request` - Passwords don't match

---

### Verify Email

Verifies a user's email address using a verification token.

**Endpoint:** `POST /verify-email`

**Request Body:**

```json
{
  "token": "verification_token_from_email"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "isEmailVerified": true
    }
  }
}
```

---

### Resend Verification Email

Resends the email verification link.

**Endpoint:** `POST /resend-verification`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

### Health Check

Checks if the API and database are healthy.

**Endpoint:** `GET /health`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "database": "connected"
  }
}
```

**Error Response:** `503 Service Unavailable`

```json
{
  "success": false,
  "message": "Database connection failed"
}
```

## Rate Limiting

Rate limits are applied to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/login` | 5 requests | 15 minutes |
| `/register` | 5 requests | 15 minutes |
| `/forgot-password` | 3 requests | 1 hour |
| `/resend-verification` | 3 requests | 10 minutes |
| All others | 100 requests | 15 minutes |

Rate limit headers are included in responses:

```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1640000000
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication failed |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service is down |

## Examples

### Complete Authentication Flow

```javascript
// 1. Register
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: 'John Doe',
  }),
});

const { data } = await registerResponse.json();
const { accessToken, refreshToken } = data;

// 2. Access protected resource
const profileResponse = await fetch('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const profile = await profileResponse.json();

// 3. Refresh token when expired
const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken }),
});

const newTokens = await refreshResponse.json();

// 4. Logout
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ refreshToken }),
});
```

## Security

- All passwords are hashed with bcrypt (10 rounds)
- JWT tokens are signed and verified
- Refresh tokens are stored in the database
- Rate limiting prevents brute force attacks
- CORS is configurable
- Helmet security headers are applied
- Input validation prevents injection attacks

## Support

For issues or questions, please open an issue on GitHub.
