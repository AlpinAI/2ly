# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/frontend2/ ./packages/frontend2/
COPY packages/common/ ./packages/common/

# Install dependencies
RUN npm install

# Build the frontend
ARG BUILD_MODE=production

# Set environment variables for Vite build (only if provided)
ARG VITE_GRAPHQL_HOST=""
ARG VITE_GRAPHQL_HOST_SSL=""
ENV VITE_GRAPHQL_HOST=${VITE_GRAPHQL_HOST}
ENV VITE_GRAPHQL_HOST_SSL=${VITE_GRAPHQL_HOST_SSL}

RUN npm run build -w @2ly/frontend2 -- --mode ${BUILD_MODE}

# Remove unnecessary node_modules now that we have a build
RUN rm -rf node_modules
RUN rm -rf packages/frontend2/node_modules
RUN rm -rf packages/common/node_modules

# Stage 2: production image
FROM nginx:alpine

# Copy build files
COPY --from=builder /app/packages/frontend2/dist /usr/share/nginx/html
COPY packages/frontend2/nginx.conf /etc/nginx/conf.d/default.conf

# Copy and setup entrypoint script
COPY packages/frontend2/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]