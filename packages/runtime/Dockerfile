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

# Install system dependencies
# - Python 3.12 and pip for MCP server execution
# - uv (fast Python package manager) for MCP servers
# - su-exec for privilege dropping in entrypoint
RUN apk add --no-cache \
  python3 \
  py3-pip \
  curl \
  su-exec \
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

# Copy entrypoint script
COPY ./packages/runtime/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S runtime && \
  adduser -S runtime -u 1001 && \
  chown -R runtime:runtime /app

# Set environment variable for entrypoint
ENV SERVICE_USER=runtime

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check - runtime running')" || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "packages/runtime/dist/index.js"]