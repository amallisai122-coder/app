#!/bin/bash

# MindClear Distribution Package Creator
echo "🧠 Creating MindClear Distribution Package"
echo "========================================="

# Create distribution directory
DIST_DIR="mindclear-distribution"
rm -rf $DIST_DIR
mkdir -p $DIST_DIR

echo "📁 Creating package structure..."

# Copy essential files
cp -r backend $DIST_DIR/
cp -r frontend $DIST_DIR/
cp start_backend.py $DIST_DIR/
cp start_backend.bat $DIST_DIR/
cp README.md $DIST_DIR/
cp APK_BUILD_INSTRUCTIONS.md $DIST_DIR/

# Create a simple installer script
cat > $DIST_DIR/install.sh << 'EOF'
#!/bin/bash
echo "🧠 MindClear Installation"
echo "========================"

# Check if running on Debian/Ubuntu
if command -v apt &> /dev/null; then
    echo "📦 Installing system dependencies..."
    sudo apt update
    sudo apt install -y python3 python3-pip mongodb nodejs npm
    
    echo "🚀 Starting MongoDB..."
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    echo "✅ Installation complete!"
    echo "Run: python3 start_backend.py"
else
    echo "ℹ️  Please install Python 3.7+, MongoDB, and Node.js manually"
fi
EOF

chmod +x $DIST_DIR/install.sh
chmod +x $DIST_DIR/start_backend.py

# Clean up unnecessary files
rm -rf $DIST_DIR/frontend/node_modules
rm -rf $DIST_DIR/frontend/.expo
rm -rf $DIST_DIR/backend/__pycache__

echo "✅ Distribution package created in: $DIST_DIR/"
echo ""
echo "📋 Package contents:"
ls -la $DIST_DIR/

echo ""
echo "🚀 Next steps:"
echo "1. cd $DIST_DIR"
echo "2. Build APK: cd frontend && yarn install && eas build --platform android"
echo "3. Distribute the entire folder to users"
echo ""
echo "📱 Users should:"
echo "1. Run install.sh (on Debian/Ubuntu)"
echo "2. Run python3 start_backend.py"
echo "3. Install the APK on their Android device"