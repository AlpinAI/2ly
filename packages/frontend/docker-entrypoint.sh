#!/bin/sh

# Docker entrypoint script for runtime configuration
# Injects runtime environment variables into index.html via window.__ENV__

set -e

INDEX_FILE="/usr/share/nginx/html/index.html"

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

    # Create the runtime config script
    CONFIG_SCRIPT="<script>window.__ENV__={GRAPHQL_HOST:\"$HOST\",GRAPHQL_HOST_SSL:$HOST_SSL};</script>"

    # Inject the config script into index.html (before closing </head> tag)
    if [ -f "$INDEX_FILE" ]; then
        # Use sed to insert the script tag before </head>
        sed -i "s|</head>|$CONFIG_SCRIPT</head>|" "$INDEX_FILE"
        echo "Runtime configuration injected into index.html"
    else
        echo "Warning: index.html not found at $INDEX_FILE"
    fi

    echo "Configuration complete. Starting nginx..."
else
    # No environment variables provided, app will use defaults
    echo "No VITE_GRAPHQL_HOST provided, frontend will use default configuration (localhost:3000)."
    echo "Starting nginx..."
fi

# Start nginx
exec "$@"
