# syntax=docker/dockerfile:1
# Dockerfile for 2LY Runtime
# Optimized multi-stage build with BuildKit cache mounts

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation (creates cacheable layer)
COPY package*.json ./
COPY packages/runtime/package.json ./packages/runtime/
COPY packages/common/package.json ./packages/common/

# Install all dependencies with BuildKit cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --quiet

# Copy source code and tsconfig (after npm ci to maximize cache hits)
COPY tsconfig.json ./
COPY packages/runtime/ ./packages/runtime/
COPY packages/common/ ./packages/common/

# Build the runtime
RUN npm run build -w @2ly/runtime

# Stage 2: Download uv (fast Python package manager)
FROM alpine:3.20 AS uv-downloader

RUN apk add --no-cache curl && \
    curl -LsSf https://astral.sh/uv/install.sh | sh

# Stage 3: Production
FROM node:22-alpine

WORKDIR /app

# Install system dependencies and create non-root user in single layer
# - Python 3 for MCP server execution
# - su-exec for privilege dropping in entrypoint
RUN apk add --no-cache python3 su-exec && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    addgroup -g 1001 -S runtime && \
    adduser -S runtime -u 1001 && \
    mkdir -p /app/logs && \
    chown -R runtime:runtime /app

# Copy uv binaries from downloader stage (avoids curl in final image)
COPY --from=uv-downloader /root/.local/bin/uv /usr/local/bin/uv
COPY --from=uv-downloader /root/.local/bin/uvx /usr/local/bin/uvx
RUN chmod 755 /usr/local/bin/uv /usr/local/bin/uvx

# Copy only the built artifacts from builder
COPY --from=builder /app/packages/runtime/dist ./packages/runtime/dist

# Copy entrypoint script
COPY ./packages/runtime/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set environment variable for entrypoint
ENV SERVICE_USER=runtime

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "packages/runtime/dist/index.js"]
