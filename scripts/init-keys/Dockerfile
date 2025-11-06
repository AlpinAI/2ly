FROM node:20-alpine

# The node:20-alpine image already has a 'node' user with UID 1000
# We'll use that instead of creating a new user

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy init script
COPY generate-keys.js ./

# Create keys directory with proper permissions (owned by node user)
RUN mkdir -p /data/keys && \
    chown -R node:node /data/keys && \
    chmod 0700 /data/keys

# Switch to node user (UID 1000)
USER node

# Run the key generation script
CMD ["node", "generate-keys.js"]
