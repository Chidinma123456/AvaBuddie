#!/bin/bash

# VirtualDoc Deployment Script

set -e

echo "🚀 Starting VirtualDoc deployment..."

# Check if environment variables are set
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Error: VITE_SUPABASE_URL is not set"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: VITE_SUPABASE_ANON_KEY is not set"
    exit 1
fi

if [ -z "$VITE_GEMINI_API_KEY" ]; then
    echo "❌ Error: VITE_GEMINI_API_KEY is not set"
    exit 1
fi

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests (if available)
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "🧪 Running tests..."
    npm test
fi

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"

# Optional: Deploy to specific platform
if [ "$1" = "netlify" ]; then
    echo "🌐 Deploying to Netlify..."
    npx netlify deploy --prod --dir=dist
elif [ "$1" = "vercel" ]; then
    echo "🌐 Deploying to Vercel..."
    npx vercel --prod
elif [ "$1" = "docker" ]; then
    echo "🐳 Building Docker image..."
    docker build -t virtualdoc:latest .
    echo "✅ Docker image built successfully!"
fi

echo "🎉 Deployment completed!"