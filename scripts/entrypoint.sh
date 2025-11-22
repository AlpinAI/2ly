#!/bin/sh
set -e

echo "Waiting for keys..."
while [ ! -f /keys/.env.generated ]; do sleep 1; done
echo "Keys found. Waiting 1s for sync..."
sleep 1

echo "Sourcing keys..."
set -a
. /keys/.env.generated
set +a

echo "Starting application..."
exec "$@"
