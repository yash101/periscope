#!/bin/bash

# Periscope Development Startup Script

echo "🔍 Starting Periscope Development Mode..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if dist directory exists and is older than src
if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
    echo "🔨 Building Periscope..."
    npm run build
fi

echo "🚀 Starting development mode..."
npm run dev