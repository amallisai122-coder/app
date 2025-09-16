#!/bin/bash

# Simple MindClear APK Builder
export PATH=$PATH:/usr/local/bin

echo "🧠 MindClear APK Builder"
echo "========================"
echo ""

cd /app/frontend

echo "Step 1: Create Expo Account"
echo "---------------------------"
echo "1. Open: https://expo.dev/signup"
echo "2. Sign up with your email"
echo "3. Verify your email"
echo "4. Remember your username/password"
echo ""
read -p "Have you created an Expo account? (y/n): " account_ready

if [ "$account_ready" != "y" ]; then
    echo ""
    echo "Please create an account first, then run this script again."
    echo "Visit: https://expo.dev/signup"
    exit 1
fi

echo ""
echo "Step 2: Login to Expo"
echo "---------------------"
eas login

if [ $? -ne 0 ]; then
    echo "❌ Login failed. Please check your credentials."
    exit 1
fi

echo ""
echo "Step 3: Configure Build"
echo "-----------------------"
eas build:configure --platform android

echo ""
echo "Step 4: Build APK"
echo "-----------------"
echo "This will take 10-15 minutes..."
eas build --platform android --profile production

echo ""
echo "🎉 Build submitted!"
echo "Check your email for the download link."