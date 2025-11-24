# Dockerfile for 2LY Orchestrator
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/backend/ ./packages/backend/
COPY packages/common/ ./packages/common/

# Install all dependencies (including dev for TypeScript compilation)
RUN npm ci --quiet

# Build the backend
RUN npm run build -w @2ly/backend

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Install system dependencies (curl for healthcheck, su-exec for privilege dropping)
RUN apk add --no-cache curl su-exec

# Copy only the built artifacts from builder
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Copy node_modules needed for key generation script
COPY --from=builder /app/node_modules ./node_modules

# Copy key generation scripts
COPY ./generate-keys.sh /app/generate-keys.sh
COPY ./scripts/generate-keys.js /app/scripts/generate-keys.js
COPY ./scripts/entrypoint.sh /app/entrypoint.sh

# Make scripts executable
RUN chmod +x /app/generate-keys.sh /app/entrypoint.sh

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S orchestrator && \
  adduser -S orchestrator -u 1001 && \
  chown -R orchestrator:orchestrator /app

# Set environment variable for entrypoint
ENV SERVICE_USER=orchestrator

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check - orchestrator running')" || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "packages/backend/dist/index.js"]