#!/bin/sh

# Docker entrypoint script for runtime configuration
# Replaces placeholders in built JavaScript files with actual environment variables

set -e

# Function to check if host contains localhost
host_contains_localhost() {
    local host="$1"
    echo "$host" | grep -q -E "(localhost|127\.0\.0\.1)"
}

# Determine configuration based on environment variables
if [ -n "$VITE_GRAPHQL_HOST" ]; then
    # Host provided, determine SSL setting
    HOST="$VITE_GRAPHQL_HOST"
    
    # Remove protocol if present
    HOST=$(echo "$HOST" | sed 's|^https\?://||' | sed 's|^wss\?://||')
    
    # Determine SSL based on VITE_GRAPHQL_HOST_SSL or auto-detect
    if [ -n "$VITE_GRAPHQL_HOST_SSL" ]; then
        # Explicit SSL setting provided
        if [ "$VITE_GRAPHQL_HOST_SSL" = "true" ]; then
            HOST_SSL="true"
        else
            HOST_SSL="false"
        fi
    else
        # Auto-detect: use SSL unless host contains localhost
        if host_contains_localhost "$HOST"; then
            HOST_SSL="false"
        else
            HOST_SSL="true"
        fi
    fi
    
    echo "Configuring GraphQL host:"
    echo "  Host: $HOST"
    echo "  SSL: $HOST_SSL"
    
    # Replace placeholders in JavaScript files
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|RUNTIME_VITE_GRAPHQL_HOST|$HOST|g" {} \;
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|RUNTIME_VITE_GRAPHQL_HOST_SSL|$HOST_SSL|g" {} \;
    
    echo "Configuration complete. Starting nginx..."
else
    # No environment variables provided, use frontend defaults
    echo "No VITE_GRAPHQL_HOST provided, using frontend defaults."
    echo "Starting nginx..."
fi

# Start nginx
exec "$@"
