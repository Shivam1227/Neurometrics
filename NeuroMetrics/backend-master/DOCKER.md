# Docker Setup Guide

This guide explains how to run the ALZ backend using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose V2

## Quick Start

### 1. Start All Services

Run the entire stack (PostgreSQL, MinIO, and Backend):

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5432
- Start MinIO object storage on ports 9000 (API) and 9001 (Console)
- Build and start the backend service on port 3000
- Automatically run Prisma migrations
- Initialize the admin user

### 2. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f minio
```

### 3. Stop Services

```bash
docker-compose down
```

To also remove volumes (database and MinIO data):

```bash
docker-compose down -v
```

## Service URLs

- **Backend API**: http://localhost:3000
- **MinIO Console**: http://localhost:9001 (credentials: minioadmin/minioadmin)
- **PostgreSQL**: localhost:5432 (credentials: alz/123)

## Environment Variables

The backend service uses the following environment variables (configured in docker-compose.yml):

| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | production | Application environment |
| PORT | 3000 | Backend server port |
| DATABASE_URL | postgresql://alz:123@postgres:5432/alz_db | PostgreSQL connection string |
| JWT_SECRET | (change this!) | Secret key for JWT tokens |
| JWT_EXPIRES_IN | 7d | JWT token expiration time |
| S3_ENDPOINT | http://minio:9000 | MinIO endpoint |
| S3_ACCESS_KEY_ID | minioadmin | MinIO access key |
| S3_SECRET_ACCESS_KEY | minioadmin | MinIO secret key |
| S3_BUCKET | alz | Default S3 bucket name |
| ADMIN_EMAIL | admin@example.com | Initial admin user email |
| ADMIN_PASSWORD | admin123 | Initial admin user password |

**⚠️ Security Warning**: Change the JWT_SECRET, ADMIN_PASSWORD, and database credentials before deploying to production!

## Development

### Rebuild Backend

If you make changes to the code:

```bash
docker-compose up -d --build backend
```

### Run Prisma Migrations

Migrations are automatically run on container startup. To run manually:

```bash
docker-compose exec backend bunx prisma migrate deploy
```

### Access Database

```bash
docker-compose exec postgres psql -U alz -d alz_db
```

### Create a New Migration

```bash
# Make changes to prisma/schema.prisma, then:
docker-compose exec backend bunx prisma migrate dev --name your_migration_name
```

## Troubleshooting

### Backend fails to start

Check if PostgreSQL is ready:

```bash
docker-compose logs postgres
```

The backend waits for PostgreSQL health check to pass before starting.

### MinIO bucket not created

Create the bucket manually:

```bash
docker-compose exec backend sh -c "apt-get update && apt-get install -y curl && \
  curl -X PUT http://minio:9000/alz \
  -H 'Host: minio:9000' \
  -H 'Authorization: AWS minioadmin:minioadmin'"
```

Or use the MinIO Console at http://localhost:9001

### Port conflicts

If ports 3000, 5432, 9000, or 9001 are already in use, modify the port mappings in docker-compose.yml:

```yaml
ports:
  - "3001:3000"  # Map to different host port
```

## Production Deployment

For production:

1. Create a `.env.production` file with secure credentials
2. Update `docker-compose.yml` to use the environment file
3. Use secrets management (Docker Secrets, Kubernetes Secrets, etc.)
4. Set up proper backup strategies for PostgreSQL and MinIO volumes
5. Use a reverse proxy (nginx, traefik) for SSL/TLS termination
6. Configure proper logging and monitoring

## Volume Management

Data is persisted in Docker volumes:

- `alz_postgres_data`: PostgreSQL database
- `alz_minio_data`: MinIO object storage

To backup:

```bash
docker run --rm -v alz_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .

docker run --rm -v alz_minio_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/minio_backup.tar.gz -C /data .
```

To restore:

```bash
docker run --rm -v alz_postgres_data:/data -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/postgres_backup.tar.gz"

docker run --rm -v alz_minio_data:/data -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/minio_backup.tar.gz"
```

