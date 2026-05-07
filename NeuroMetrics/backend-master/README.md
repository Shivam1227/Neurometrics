# AlzProject Backend

REST API backend for AlzProject, built with Express, Prisma, and PostgreSQL.

## Features

- JWT-based authentication
- User management with role-based access (participant, tester, admin)
- Test creation and management
- Question types: MCQ (single/multiple), numerical, text, file upload
- Media file handling with S3/MinIO
- Attempt tracking and grading (auto and manual)

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL 15+
- MinIO or S3-compatible storage

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   Create a `.env` file with the following variables:
   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-secret-key-change-this-in-production
   JWT_EXPIRES_IN=1h
   DATABASE_URL=postgresql://alz:123@localhost:5432/alz_db
   
   # S3/MinIO Configuration
   S3_ENDPOINT=http://localhost:9000
   S3_ACCESS_KEY_ID=minioadmin
   S3_SECRET_ACCESS_KEY=minioadmin
   S3_BUCKET=alz
   
   # Admin User (Auto-created on startup)
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=123456
   ```

3. **Start the database:**
   ```bash
   cd db
   docker-compose up -d
   ```

4. **Run migrations:**
   ```bash
   bun prisma migrate deploy
   ```

5. **Start the server:**
   ```bash
   bun run dev
   ```

## Admin User

The application automatically creates an admin user on startup using credentials from environment variables:

- **Email:** `ADMIN_EMAIL` (default: `admin@example.com`)
- **Password:** `ADMIN_PASSWORD` (default: `123456`)

**Important:** On every server restart, the admin user is recreated (deleted and created fresh) to ensure consistent root access. This means:
- You always have a working admin account
- Any changes to the admin user record will be reset on restart
- Update environment variables to change admin credentials

## API Documentation

See `openapi.yaml` for the complete API specification.

## Development

```bash
# Run in development mode with auto-reload
bun run dev

# Run tests
bun test

# Generate Prisma client
bun prisma generate

# Create a new migration
bun prisma migrate dev --name your_migration_name
```
