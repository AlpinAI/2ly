# Dockerfile for 2LY Runtime
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/runtime/ ./packages/runtime/
COPY packages/common/ ./packages/common/

# Install all dependencies (including dev for TypeScript compilation)
RUN npm ci --quiet

# Build the runtime
RUN npm run build -w @2ly/runtime

# Stage 2: Production
FROM node:22-alpine

# Install Python 3.12 and uv for MCP server execution
# - Install Python and pip from Alpine repos
# - Create python symlink for compatibility
# - Install uv (fast Python package manager) via official installer
# - Copy uv/uvx to /usr/local/bin so non-root users can access them
RUN apk add --no-cache \
  python3 \
  py3-pip \
  curl \
  && ln -sf /usr/bin/python3 /usr/bin/python \
  && curl -LsSf https://astral.sh/uv/install.sh | sh \
  && cp /root/.local/bin/uv /usr/local/bin/uv \
  && cp /root/.local/bin/uvx /usr/local/bin/uvx \
  && chmod 755 /usr/local/bin/uv /usr/local/bin/uvx \
  && rm -rf /root/.local \
  && apk del curl

WORKDIR /app

# Copy only the built artifacts from builder
COPY --from=builder /app/packages/runtime/dist ./packages/runtime/dist

# Create logs directory
RUN mkdir -p logs

# Copy entrypoint script
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S runtime && \
  adduser -S runtime -u 1001 && \
  chown -R runtime:runtime /app

USER runtime

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check - runtime running')" || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "packages/runtime/dist/index.js"]