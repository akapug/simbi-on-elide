# Simbi Modern - Quick Start

This is the modern rebuild of Simbi using the latest technologies.

## 🚀 Quick Start (Works with minimal configuration!)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (recommended)

### Start Services

```bash
# 1. Start infrastructure (PostgreSQL, Redis, Meilisearch, MailHog)
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Set up environment (copy and optionally edit)
cd apps/backend
cp .env.example .env
# Edit .env if you want to configure optional services

# 4. Generate Prisma client and run migrations
cd ../..
npm run prisma:generate
npm run prisma:migrate

# 5. Start development servers
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- API Docs: http://localhost:3000/api/docs

## ✅ Works Out of the Box!

The application will start and run with just:
- PostgreSQL (from docker-compose)
- Redis (from docker-compose)
- JWT secret (default provided, change in production!)

**All other services are OPTIONAL and will gracefully degrade:**

| Service | When Missing | Fallback |
|---------|-------------|----------|
| Google OAuth | OAuth button hidden | Email/password login works |
| Facebook OAuth | OAuth button hidden | Email/password login works |
| Stripe | Payment features disabled | Simbi credits still work |
| AWS S3 | Files stored locally | Local storage in `./uploads/` |
| Meilisearch | Database search used | PostgreSQL full-text search |
| SendGrid | Email disabled | App works, no emails sent |
| Twilio | SMS disabled | App works, no SMS sent |
| OneSignal | Push disabled | App works, no push notifications |

## 🎨 Visual Assets

The app uses Simbi's existing visual assets:
- ✅ Simbi logo and icons
- ✅ Brand colors (orange, blue, green)
- ✅ Empty state illustrations
- ✅ Service placeholders
- ✅ All original icons

Assets are copied from the original app to `/modern/apps/frontend/public/`

## 📝 Configuration

### Minimum Required (already in docker-compose)
```bash
DATABASE_URL="postgresql://simbi:simbi_dev_password@localhost:5432/simbi_development"
REDIS_HOST=localhost
JWT_SECRET=your-secret-key  # Change in production!
```

### Add Optional Services (when you need them)

Edit `apps/backend/.env` and add API keys:

```bash
# Enable Stripe payments
STRIPE_SECRET_KEY=sk_test_...

# Enable file uploads to S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Enable Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Enable Facebook OAuth
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...

# And so on...
```

The app will detect configured services on startup and show their status.

## 🔧 Troubleshooting

### "Can't connect to database"
```bash
# Make sure PostgreSQL is running
docker-compose up -d postgres

# Check it's accessible
docker-compose ps
```

### "Can't connect to Redis"
```bash
# Make sure Redis is running
docker-compose up -d redis
```

### Missing features
Check the startup logs - they'll show which optional services are disabled:
```
✅ Stripe              enabled
⚠️  AWS S3             disabled (optional)
⚠️  SendGrid Email     disabled (optional)
```

Add API keys to `.env` to enable them!

## 📚 Full Documentation

See the main [README.md](./README.md) for comprehensive documentation.

## 🎯 Development Workflow

```bash
# Start all services
npm run dev

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Build for production
npm run build
```

That's it! The app works out of the box with minimal setup. Add API keys as you need them! 🎉
