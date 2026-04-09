#!/bin/bash

echo "🚀 Starting deployment process..."

# Navigate to client directory
cd client

echo "📦 Cleaning old build files..."
rm -rf build
rm -rf node_modules/.cache

echo "🔨 Building production version..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Upload the 'client/build' folder to your server"
    echo "2. Make sure to clear your CDN cache if you're using one"
    echo "3. Clear browser cache with Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
    echo ""
    echo "🎉 Deployment preparation complete!"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
