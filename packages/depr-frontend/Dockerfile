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

# Set environment variables for Vite build (only if provided)
ARG VITE_GRAPHQL_HTTP_URL=""
ARG VITE_GRAPHQL_WS_URL=""
ENV VITE_GRAPHQL_HTTP_URL=${VITE_GRAPHQL_HTTP_URL}
ENV VITE_GRAPHQL_WS_URL=${VITE_GRAPHQL_WS_URL}

RUN npm run build -w @2ly/frontend -- --mode ${BUILD_MODE}

# Remove unnecessary node_modules now that we have a build
RUN rm -rf node_modules
RUN rm -rf packages/frontend/node_modules
RUN rm -rf packages/common/node_modules

# Stage 2: production image
FROM nginx:alpine
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf