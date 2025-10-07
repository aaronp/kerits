#!/bin/bash

# Build script for GitHub Pages deployment
# Builds the Kerits UI for deployment

echo "🏗️  Building Kerits UI for GitHub Pages..."
echo ""

# Set repository name (will be updated by GitHub Actions or specify manually)
REPO_NAME="kerits"
echo "📝 Using repository name: $REPO_NAME"
echo ""

# Create deployment directory
echo "📁 Creating deployment directory..."
rm -rf deploy
mkdir -p deploy

# Navigate to UI directory
cd ui

# Install dependencies
echo "📦 Installing dependencies..."
bun install
if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
fi

# Update base path in vite config
echo "🔧 Setting base path to /$REPO_NAME..."
sed -i.bak "s|base: '/kerits'|base: '/$REPO_NAME'|g" vite.config.ts

# Build UI using standard config
echo "🎨 Building UI..."
bun run build
if [ $? -ne 0 ]; then
    echo "❌ UI build failed"
    # Restore original config
    mv vite.config.ts.bak vite.config.ts
    exit 1
fi

# Restore original config
mv vite.config.ts.bak vite.config.ts

# Copy UI to deployment root
echo "📋 Copying UI to deployment directory..."
cd ..
cp -r ui/dist/* deploy/

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Deployment directory contents:"
ls -la deploy/
echo ""
echo "🌐 To test locally:"
echo "   cd deploy"
echo "   python3 -m http.server 8000"
echo "   # or: npx serve -s ."
echo ""
echo "Then visit:"
echo "   - http://localhost:8000/ (UI)"
echo ""
echo "📤 Ready for GitHub Pages deployment!"
echo "   Will be available at: https://<username>.github.io/$REPO_NAME/"
