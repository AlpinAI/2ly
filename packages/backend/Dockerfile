# syntax=docker/dockerfile:1
# Dockerfile for Skilder Orchestrator
# Optimized multi-stage build with BuildKit cache mounts

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation (creates cacheable layer)
COPY package*.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/common/package.json ./packages/common/

# Install all dependencies with BuildKit cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --quiet

# Copy source code and tsconfig (after npm ci to maximize cache hits)
COPY tsconfig.json ./
COPY packages/backend/ ./packages/backend/
COPY packages/common/ ./packages/common/

# Copy key generation script for bundling
COPY scripts/generate-keys.js ./scripts/

# Build the backend
RUN npm run build:schema -w @skilder-ai/common && npm run build -w @skilder-ai/backend

# Bundle key generation script into standalone file
# Using .cjs extension to force CommonJS in ESM project
# Note: Source file already has shebang, no banner needed
RUN npx esbuild scripts/generate-keys.js \
    --bundle \
    --platform=node \
    --target=node18 \
    --minify \
    --format=cjs \
    --outfile=scripts/generate-keys.bundle.cjs

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Install system dependencies and create non-root user in single layer
RUN apk add --no-cache curl su-exec && \
    addgroup -g 1001 -S orchestrator && \
    adduser -S orchestrator -u 1001 && \
    mkdir -p /app/logs && \
    chown -R orchestrator:orchestrator /app

# Copy only the built artifacts from builder
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Copy bundled key generation script (standalone, no dependencies needed)
COPY --from=builder /app/scripts/generate-keys.bundle.cjs ./scripts/generate-keys.bundle.cjs

# Copy shell scripts
COPY ./generate-keys.sh /app/generate-keys.sh
COPY ./packages/backend/entrypoint.sh /app/entrypoint.sh

# Make scripts executable
RUN chmod +x /app/generate-keys.sh /app/entrypoint.sh /app/scripts/generate-keys.bundle.cjs

# Set environment variable for entrypoint
ENV SERVICE_USER=orchestrator

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "packages/backend/dist/index.js"]
