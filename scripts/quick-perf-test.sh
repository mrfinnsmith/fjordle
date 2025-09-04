#!/bin/bash

echo "🚀 Quick Performance Test"
echo "========================="
echo ""
echo "1. Building production bundle..."
npm run build

echo ""
echo "2. Starting production server..."
npm run start &
SERVER_PID=$!

echo "3. Waiting for server to start..."
sleep 5

echo ""
echo "4. Server is running at http://localhost:3000"
echo "   You can now:"
echo "   - Open Chrome DevTools"
echo "   - Go to Lighthouse tab"
echo "   - Run a performance audit"
echo ""
echo "5. Press Ctrl+C to stop the server when done testing"

# Wait for user to stop
wait $SERVER_PID
