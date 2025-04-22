#!/bin/bash

cd ~/FicHearth-Lite

echo "Checking for & installing dependencies..."
(cd backend && npm install)
(cd frontend/FicHearth-Lite && npm install)

echo "Starting backend..."
cd backend
node server.js >> logs/fichearth.log 2>&1 &
BACKEND_PID=$!

echo "Starting frontend..."
cd ../
cd frontend/FicHearth-Lite
npm run dev &
FRONTEND_PID=$!

echo "FicHearth is running!"

cleanup() {
    echo "Stopping backend (PID $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null

    echo "Stopping frontend (PID $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null

    echo "Processes stopped. Exiting."
}

trap cleanup SIGINT

wait
