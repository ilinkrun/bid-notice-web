#!/bin/bash

# Kill any existing server processes
echo "Stopping any existing servers..."
ps aux | grep -E "(tsx|node).*graphql" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
fuser -k 21023/tcp 2>/dev/null

# Wait for ports to be released
sleep 2

# Start the server
echo "Starting GraphQL server..."
export CHROMIUM_EXECUTABLE_PATH=/opt/google/chrome/google-chrome
npm run graphql:dev
