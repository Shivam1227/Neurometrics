# Use Bun as the base image
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy Prisma schema first
COPY prisma ./prisma

# Generate Prisma Client
RUN bunx prisma generate

# Copy source code
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "index.ts"]

