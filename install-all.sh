#!/bin/bash

# Cloudflare Migration - Install All Dependencies
# This script installs dependencies for both Workers and Frontend

echo "🚀 Installing Cloudflare Migration Dependencies..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install Workers dependencies
echo "📦 Installing Workers dependencies..."
cd workers
if [ ! -f "package.json" ]; then
    echo "❌ workers/package.json not found!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Workers dependencies"
    exit 1
fi

echo "✅ Workers dependencies installed"
echo ""

# Install Frontend dependencies
echo "📦 Installing Frontend dependencies..."
cd ../client
if [ ! -f "package.json" ]; then
    echo "❌ client/package.json not found!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"
echo ""

cd ..

echo "🎉 All dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Install Wrangler CLI: npm install -g wrangler"
echo "2. Login to Cloudflare: wrangler login"
echo "3. Follow QUICK_START_CLOUDFLARE.md for deployment"
echo ""
echo "To test locally:"
echo "  cd workers && npm run dev"
