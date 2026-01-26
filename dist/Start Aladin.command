#!/bin/bash
# Aladin Launcher - Just double-click to run!
# Starts a local server and opens in browser

cd "$(dirname "$0")"
PORT=8765

# Find free port
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

echo "🧞 Starting Aladin on http://localhost:$PORT"
echo "   Press Ctrl+C to stop"
echo ""

# Open browser after a short delay
(sleep 1 && open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null) &

# Start server
python3 -m http.server $PORT
