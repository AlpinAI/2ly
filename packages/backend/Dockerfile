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

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy only the built artifacts from builder
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Create logs directory
RUN mkdir -p logs

# Copy entrypoint script
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S orchestrator && \
  adduser -S orchestrator -u 1001 && \
  chown -R orchestrator:orchestrator /app

USER orchestrator

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check - orchestrator running')" || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "packages/backend/dist/index.js"]