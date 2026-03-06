#!/bin/bash

echo "Starting Moz Bulk URL Checker..."
echo ""
echo "Step 1: Starting backend server on port 3001..."
node src/server.js &
SERVER_PID=$!

sleep 2

echo ""
echo "Step 2: Starting frontend dev server..."
echo ""
echo "✅ Backend server running on http://localhost:3001"
echo "✅ Frontend will be available at http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev

kill $SERVER_PID
