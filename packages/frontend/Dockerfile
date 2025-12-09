# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/frontend/ ./packages/frontend/
COPY packages/common/ ./packages/common/

# Install dependencies
RUN npm install

# Build the frontend
ARG BUILD_MODE=production

# Build without hardcoded environment variables (runtime config will be injected)
RUN npm run build -w @skilder-ai/frontend -- --mode ${BUILD_MODE}

# Remove unnecessary node_modules now that we have a build
RUN rm -rf node_modules
RUN rm -rf packages/frontend/node_modules
RUN rm -rf packages/common/node_modules

# Stage 2: production image
FROM nginx:alpine

# Copy build files
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy and setup entrypoint script
COPY packages/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]