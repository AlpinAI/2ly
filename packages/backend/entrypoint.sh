#!/bin/sh
set -e

# Configuration
KEYS_DIR=${KEYS_DIR:-/keys}
AUTOGEN_KEYS=${AUTOGEN_KEYS:-false}

echo "🔐 2ly Entrypoint - Key Management"
echo "=================================="
echo "Keys directory: $KEYS_DIR"
echo "Auto-generation: $AUTOGEN_KEYS"
echo ""

# Priority 1: Use ENV variables if both critical keys are provided
if [ -n "$SYSTEM_KEY" ] && [ -n "$ENCRYPTION_KEY" ]; then
  echo "✅ Using keys from environment variables"
  echo ""

# Priority 2: Auto-generate if enabled and not already initialized
elif [ "$AUTOGEN_KEYS" = "true" ] && [ ! -f "$KEYS_DIR/.initialized" ]; then
  echo "🔧 Auto-generating keys (not found and AUTOGEN_KEYS=true)..."
  /app/generate-keys.sh
  echo ""

# Priority 3: Wait for and load existing keys
elif [ -f "$KEYS_DIR/.env.generated" ]; then
  echo "✅ Loading existing keys from $KEYS_DIR/.env.generated"
  echo ""

else
  echo "❌ ERROR: No keys available!"
  echo ""
  echo "Available options:"
  echo "  1. Set AUTOGEN_KEYS=true to enable auto-generation"
  echo "  2. Provide SYSTEM_KEY and ENCRYPTION_KEY via environment variables"
  echo "  3. Mount a volume with pre-generated keys to $KEYS_DIR"
  echo ""
  exit 1
fi

# Source generated keys from .env.generated (only if ENV vars not already set)
if [ -f "$KEYS_DIR/.env.generated" ]; then
  echo "📥 Loading environment variables from $KEYS_DIR/.env.generated"

  # Read line by line and only export if variable not already set
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    case "$key" in
      ''|'#'*) continue ;;
    esac

    # Only export if not already set (ENV variables take precedence)
    if eval "[ -z \"\$$key\" ]"; then
      export "$key=$value"
    fi
  done < "$KEYS_DIR/.env.generated"

  echo "✅ Environment variables loaded"
  echo ""
fi

# Fix permissions if running as root and SERVICE_USER is set
if [ "$(id -u)" = "0" ] && [ -n "$SERVICE_USER" ]; then
  echo "🔧 Fixing ownership of $KEYS_DIR for $SERVICE_USER..."
  chown -R "$SERVICE_USER:$SERVICE_USER" "$KEYS_DIR" 2>/dev/null || true
  # Note: /app ownership is set at build time (Dockerfile), no need to chown here

  echo "🔄 Dropping privileges to $SERVICE_USER..."
  echo ""
  echo "Starting application..."
  exec su-exec "$SERVICE_USER" "$@"
fi

echo "Starting application..."
exec "$@"
