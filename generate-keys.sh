#!/bin/sh
set -e

# Standalone key generation script for skilder
# Can be run manually or invoked by Docker containers
#
# Usage:
#   sh ./generate-keys.sh                    # Generate to dev/.docker-keys/
#   KEYS_DIR=/custom/path sh ./generate-keys.sh  # Generate to custom path

# Determine keys directory
# Default: dev/.docker-keys for local development
# Can be overridden via KEYS_DIR environment variable
if [ -z "$KEYS_DIR" ]; then
  if [ -f "/app/scripts/generate-keys.bundle.cjs" ] || [ -f "/app/scripts/generate-keys.js" ]; then
    # Running inside Docker container
    KEYS_DIR="/keys"
  else
    # Running on host - use dev/.docker-keys
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    KEYS_DIR="$SCRIPT_DIR/dev/.docker-keys"
  fi
fi

# Create keys directory if it doesn't exist
mkdir -p "$KEYS_DIR"

# Set permissions on directory (if we have permission)
chmod 700 "$KEYS_DIR" 2>/dev/null || true

echo "🔐 Skilder Key Generation"
echo "===================="
echo ""
echo "Keys directory: $KEYS_DIR"
echo ""

# Determine Node.js script location
# Prefer bundled script (no dependencies needed) over source script
if [ -f "/app/scripts/generate-keys.bundle.cjs" ]; then
  # Running inside Docker container with bundled script
  NODE_SCRIPT="/app/scripts/generate-keys.bundle.cjs"
elif [ -f "/app/scripts/generate-keys.js" ]; then
  # Running inside Docker container with source script (legacy)
  NODE_SCRIPT="/app/scripts/generate-keys.js"
elif [ -f "$(dirname "$0")/scripts/generate-keys.bundle.cjs" ]; then
  # Running on host with bundled script
  NODE_SCRIPT="$(cd "$(dirname "$0")" && pwd)/scripts/generate-keys.bundle.cjs"
elif [ -f "$(dirname "$0")/scripts/generate-keys.js" ]; then
  # Running on host with source script
  NODE_SCRIPT="$(cd "$(dirname "$0")" && pwd)/scripts/generate-keys.js"
else
  echo "❌ Error: generate-keys.js not found"
  echo "Expected locations:"
  echo "  - /app/scripts/generate-keys.bundle.cjs (Docker, bundled)"
  echo "  - /app/scripts/generate-keys.js (Docker, source)"
  echo "  - ./scripts/generate-keys.bundle.cjs (host, bundled)"
  echo "  - ./scripts/generate-keys.js (host, source)"
  exit 1
fi

# Check if node is available
if ! command -v node > /dev/null 2>&1; then
  echo "❌ Error: Node.js is not installed"
  echo "Please install Node.js to generate keys"
  exit 1
fi

# Export KEYS_DIR for the Node.js script
export KEYS_DIR

# Run the Node.js key generation script
node "$NODE_SCRIPT"

# Ensure proper permissions on generated files
chmod 600 "$KEYS_DIR/.env.generated" 2>/dev/null || true
chmod 600 "$KEYS_DIR/.env.local" 2>/dev/null || true
chmod 600 "$KEYS_DIR/private.pem" 2>/dev/null || true
chmod 644 "$KEYS_DIR/public.pem" 2>/dev/null || true
chmod 644 "$KEYS_DIR/operator.jwt" 2>/dev/null || true
chmod 600 "$KEYS_DIR/.initialized" 2>/dev/null || true

echo ""
echo "✅ Key generation complete!"
echo "Keys saved to: $KEYS_DIR"
echo ""
