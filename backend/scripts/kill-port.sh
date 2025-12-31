#!/bin/bash
# Bash script to kill process using a specific port
# Usage: ./scripts/kill-port.sh 3000

PORT=$1

if [ -z "$PORT" ]; then
    echo "Usage: $0 <port>"
    exit 1
fi

echo "Checking for processes using port $PORT..."

# Find process using the port
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PID=$(lsof -ti:$PORT)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    PID=$(lsof -ti:$PORT 2>/dev/null || fuser $PORT/tcp 2>/dev/null | awk '{print $1}')
else
    echo "Unsupported OS. Please kill the process manually."
    exit 1
fi

if [ -z "$PID" ]; then
    echo "No process found using port $PORT"
    exit 0
fi

echo "Found process: PID $PID"
echo "Killing process $PID..."
kill -9 $PID
echo "Process $PID terminated."
echo "Port $PORT is now available."

