#!/bin/bash

# MindClear APK Builder Script
echo "🧠 MindClear APK Builder"
echo "========================"

cd /app/frontend

echo "📋 Build Prerequisites Check:"
echo "✅ Expo CLI: $(expo --version)"
echo "✅ EAS CLI: $(eas --version)"
echo "✅ Node.js: $(node --version)"
echo "✅ Yarn: $(yarn --version)"

echo ""
echo "🔐 Authentication Required:"
echo "You need to login to Expo to build APK on their servers."
echo ""

read -p "Do you have an Expo account? (y/n): " has_account

if [ "$has_account" = "y" ] || [ "$has_account" = "Y" ]; then
    echo ""
    echo "🔑 Please login to your Expo account:"
    eas login
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🏗️ Building APK..."
        echo "⏱️  This will take 10-15 minutes..."
        
        # Initialize EAS project if needed
        eas build:configure --platform android
        
        # Build the APK
        eas build --platform android --profile production --non-interactive
        
        echo ""
        echo "✅ Build submitted! Check your email or Expo dashboard for download link."
        echo "🔗 Build status: https://expo.dev/accounts/[username]/projects/mindclear-app/builds"
    else
        echo "❌ Login failed. Please try again."
    fi
    
else
    echo ""
    echo "📝 To create a free Expo account:"
    echo "1. Visit: https://expo.dev/signup"
    echo "2. Sign up with email"
    echo "3. Run this script again"
    echo ""
    echo "🔄 Alternative: Local Build Setup"
    echo "For advanced users who want to build locally:"
    echo "1. Install Android Studio"
    echo "2. Setup Android SDK"
    echo "3. Run: expo run:android --variant release"
fi

echo ""
echo "📱 Once you have the APK:"
echo "1. Transfer APK file to your Android device"
echo "2. Install the APK (enable 'Unknown Sources' if needed)"
echo "3. Start backend: python3 ../start_backend.py"
echo "4. Open MindClear app on your phone"