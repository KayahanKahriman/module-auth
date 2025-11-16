# Deployment Guide

Guide for deploying the authentication module to production.

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] Set strong JWT secrets (minimum 32 characters)
- [ ] Configured secure database credentials
- [ ] Set up SSL/TLS certificates
- [ ] Configured email service (SMTP or provider)
- [ ] Set up Redis for session management (optional)
- [ ] Configured CORS for your frontend domain
- [ ] Enabled rate limiting
- [ ] Set up monitoring and logging
- [ ] Configured database backups
- [ ] Reviewed and updated security settings

## Environment Variables

### Required

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT - MUST BE CHANGED
JWT_SECRET=<strong-secret-minimum-32-chars>
JWT_REFRESH_SECRET=<strong-secret-minimum-32-chars>

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=<your-sendgrid-api-key>
EMAIL_FROM=noreply@yourdomain.com
```

### Optional

```env
# Redis
REDIS_URL=redis://redis-host:6379
REDIS_ENABLED=true

# Features
ENABLE_EMAIL_VERIFICATION=true
ENABLE_OAUTH=false

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com

# Frontend
FRONTEND_URL=https://yourdomain.com
```

## Deployment Methods

### 1. Docker (Recommended)

#### Using Docker Compose

```bash
# 1. Clone repository
git clone <your-repo>
cd auth-module

# 2. Create production .env
cp .env.example .env
# Edit .env with production values

# 3. Build and start services
docker-compose -f docker-compose.prod.yml up -d

# 4. Check logs
docker-compose logs -f auth-backend
```

#### Production docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  auth-backend:
    build:
      context: ./packages/auth-backend
      dockerfile: Dockerfile
      target: production
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

### 2. Platform-as-a-Service (PaaS)

#### Heroku

```bash
# 1. Create Heroku app
heroku create your-auth-api

# 2. Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# 3. Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-refresh-secret
heroku config:set EMAIL_HOST=smtp.sendgrid.net
# ... set all required env vars

# 4. Deploy
git push heroku main

# 5. Check logs
heroku logs --tail
```

#### Vercel (Backend)

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "packages/auth-backend/src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "packages/auth-backend/src/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

```bash
# Deploy
vercel --prod
```

#### Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL
railway add postgresql

# 5. Set environment variables
railway variables set JWT_SECRET=your-secret

# 6. Deploy
railway up
```

### 3. Virtual Private Server (VPS)

#### DigitalOcean / AWS EC2 / Linode

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 4. Clone repository
git clone <your-repo>
cd auth-module

# 5. Install dependencies
npm install --workspaces

# 6. Set up environment
cp packages/auth-backend/.env.example packages/auth-backend/.env
nano packages/auth-backend/.env  # Edit with production values

# 7. Set up database
sudo -u postgres psql
CREATE DATABASE authdb;
CREATE USER authuser WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE authdb TO authuser;
\q

# 8. Install PM2 for process management
npm install -g pm2

# 9. Start application
cd packages/auth-backend
pm2 start src/server.js --name auth-api

# 10. Set up PM2 to start on boot
pm2 startup
pm2 save

# 11. Set up Nginx reverse proxy (optional)
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/auth-api
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/auth-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## Database Setup

### PostgreSQL (Production)

```bash
# 1. Connect to PostgreSQL
psql $DATABASE_URL

# 2. Create database and user (if not exists)
CREATE DATABASE authdb;
CREATE USER authuser WITH ENCRYPTED PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE authdb TO authuser;

# 3. Enable SSL (recommended)
ALTER SYSTEM SET ssl = on;
SELECT pg_reload_conf();
```

### Managed Database Services

#### AWS RDS (PostgreSQL)

1. Create RDS instance via AWS Console
2. Enable automated backups
3. Set up security groups for VPC
4. Get connection string: `postgresql://username:password@endpoint:5432/dbname`
5. Use in `DATABASE_URL` environment variable

#### DigitalOcean Managed Database

1. Create database cluster
2. Add trusted sources (your server IP)
3. Copy connection string
4. Enable SSL: Add `?sslmode=require` to connection string

## Security Hardening

### 1. Environment Variables

Never commit `.env` files. Use secret management:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name auth-api/jwt-secret \
  --secret-string "your-secret"

# Fetch in application
const secret = await secretsManager.getSecretValue({
  SecretId: 'auth-api/jwt-secret'
}).promise();
```

### 2. Rate Limiting

Configure strict rate limits:

```javascript
{
  rateLimit: {
    windowMs: 900000,        // 15 minutes
    maxRequests: 100,        // General limit
    loginMax: 5,             // Login attempts
  }
}
```

### 3. CORS

Restrict to your domain only:

```javascript
{
  cors: {
    origin: 'https://yourdomain.com',  // No wildcards
    credentials: true,
  }
}
```

### 4. HTTPS Only

Enforce HTTPS in production:

```javascript
// Add to Express app
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## Monitoring

### Health Checks

Set up monitoring for `/auth/health` endpoint:

```bash
# Simple uptime monitoring
curl -f http://localhost:3000/auth/health || exit 1

# With services like UptimeRobot, Pingdom, or StatusCake
```

### Logging

Use a logging service:

```javascript
// packages/auth-backend/src/server.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV === 'production') {
  // Send to logging service (Loggly, Papertrail, etc.)
}
```

### Error Tracking

Integrate error tracking:

```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

## Backup Strategy

### Database Backups

```bash
# Automated daily backup script
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-bucket/backups/
```

### Cron Job

```bash
# Add to crontab
crontab -e

# Daily at 2 AM
0 2 * * * /path/to/backup-script.sh
```

## Performance Optimization

### 1. Database Indexing

```sql
-- Already created in schema, but verify:
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 2. Connection Pooling

Configure database pool:

```javascript
{
  database: {
    pool: {
      max: 20,
      min: 5,
      idle: 10000,
    }
  }
}
```

### 3. Caching

Use Redis for session management:

```javascript
{
  redis: {
    url: process.env.REDIS_URL,
    enabled: true,
  }
}
```

## Scaling

### Horizontal Scaling

Use a load balancer (Nginx, AWS ALB):

```nginx
upstream auth_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;

    location / {
        proxy_pass http://auth_backend;
    }
}
```

### Vertical Scaling

Increase server resources as needed:
- Start: 1 CPU, 1GB RAM
- Medium: 2 CPU, 2GB RAM
- Large: 4+ CPU, 4GB+ RAM

## Troubleshooting

### Common Issues

**Database connection fails:**
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Test connection
psql $DATABASE_URL
```

**Token verification fails:**
```bash
# Ensure JWT_SECRET is set correctly
echo $JWT_SECRET

# Check token expiration
node -e "console.log(require('jsonwebtoken').decode('YOUR_TOKEN'))"
```

**Email sending fails:**
```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Check credentials
echo $EMAIL_USER
echo $EMAIL_PASSWORD
```

## Support

For deployment issues, please:
1. Check logs first
2. Review this guide
3. Open an issue on GitHub with deployment details

## Next Steps

After deployment:
1. Set up monitoring alerts
2. Configure backup notifications
3. Perform security audit
4. Load testing
5. Documentation for your team
