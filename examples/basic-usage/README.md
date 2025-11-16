# Basic Usage Example

This example demonstrates a simple integration of the authentication module with Express backend and Next.js frontend.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
# Backend
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://localhost:5432/authdb
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start Database

```bash
# Using Docker
docker-compose up -d postgres

# Or use your own PostgreSQL instance
```

### 4. Run Backend

```bash
cd backend
npm install
npm run dev
```

### 5. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
basic-usage/
├── backend/
│   ├── server.js          # Express server with auth routes
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.js      # Root layout with AuthProvider
│   │   ├── page.js        # Home page
│   │   ├── login/
│   │   │   └── page.js    # Login page
│   │   ├── register/
│   │   │   └── page.js    # Register page
│   │   └── dashboard/
│   │       └── page.js    # Protected dashboard
│   └── package.json
└── docker-compose.yml     # Database services
```

## Features Demonstrated

- ✅ User registration
- ✅ User login
- ✅ Protected routes
- ✅ User profile display
- ✅ Logout functionality
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states

## Backend Integration

```javascript
// backend/server.js
import express from 'express';
import { createAuthRouter } from '@auth/backend';

const app = express();
app.use(express.json());

const authRouter = await createAuthRouter({
  database: {
    type: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
});

app.use('/api/auth', authRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Frontend Integration

```javascript
// frontend/app/layout.js
import { AuthProvider } from '@auth/frontend';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider
          config={{
            apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
          }}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## API Endpoints

Once running, the following endpoints are available:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/health` - Health check

## Testing

Test the API with curl:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get Profile (with token)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Next Steps

- Add email verification
- Implement OAuth (Google, GitHub)
- Add role-based access control
- Customize email templates
- Add profile picture upload
- Implement 2FA

## License

MIT
