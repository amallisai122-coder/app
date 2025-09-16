#!/bin/bash

# MindClear Expo Setup Assistant
clear
echo "🧠 MindClear - Expo Account Setup Assistant"
echo "=========================================="
echo ""

# Function to wait for user input
wait_for_enter() {
    echo ""
    read -p "Press Enter to continue..."
    echo ""
}

# Function to check if user is logged in
check_login() {
    cd /app/frontend
    if eas whoami &>/dev/null; then
        current_user=$(eas whoami)
        echo "✅ Already logged in as: $current_user"
        return 0
    else
        echo "❌ Not logged in to Expo"
        return 1
    fi
}

echo "This assistant will help you:"
echo "1. 📝 Create an Expo account (if needed)"
echo "2. 🔑 Login to Expo"
echo "3. 🏗️ Build your APK"
echo "4. 📱 Download and install your app"

wait_for_enter

# Step 1: Check current login status
echo "🔍 Checking current login status..."
if check_login; then
    echo ""
    read -p "Continue with current account? (y/n): " continue_current
    if [ "$continue_current" != "y" ] && [ "$continue_current" != "Y" ]; then
        echo "Logging out..."
        cd /app/frontend && eas logout
    else
        echo "Great! Skipping to build step..."
        jump_to_build=true
    fi
fi

# Step 2: Account setup (if needed)
if [ "$jump_to_build" != "true" ]; then
    echo ""
    echo "📝 STEP 1: Expo Account Setup"
    echo "============================="
    echo ""
    echo "Do you have an Expo account?"
    echo "1. Yes, I have an account"
    echo "2. No, I need to create one"
    echo ""
    read -p "Choose option (1 or 2): " account_choice

    if [ "$account_choice" = "2" ]; then
        echo ""
        echo "🌐 Opening Expo signup page..."
        echo ""
        echo "Please:"
        echo "1. Open this URL in your browser: https://expo.dev/signup"
        echo "2. Sign up with your email address"
        echo "3. Verify your email"
        echo "4. Remember your username and password"
        echo ""
        echo "💡 Tip: Choose a username you'll remember - it will be used for your app URLs"
        
        wait_for_enter
        
        # Try to open browser (works on some systems)
        if command -v xdg-open > /dev/null; then
            xdg-open "https://expo.dev/signup" 2>/dev/null || true
        elif command -v open > /dev/null; then
            open "https://expo.dev/signup" 2>/dev/null || true
        fi
        
        echo "✅ Account created? Great! Let's continue..."
        wait_for_enter
    fi

    # Step 3: Login
    echo ""
    echo "🔑 STEP 2: Login to Expo"
    echo "========================="
    echo ""
    echo "Now let's login to your Expo account:"
    
    cd /app/frontend
    
    login_attempts=0
    while [ $login_attempts -lt 3 ]; do
        echo ""
        if eas login; then
            echo ""
            echo "✅ Login successful!"
            current_user=$(eas whoami)
            echo "👤 Logged in as: $current_user"
            break
        else
            login_attempts=$((login_attempts + 1))
            echo ""
            echo "❌ Login failed. Attempt $login_attempts/3"
            if [ $login_attempts -lt 3 ]; then
                echo "Please check your credentials and try again."
            fi
        fi
    done

    if [ $login_attempts -eq 3 ]; then
        echo ""
        echo "❌ Login failed after 3 attempts."
        echo "Please check:"
        echo "1. Username/email is correct"
        echo "2. Password is correct"
        echo "3. Internet connection is working"
        echo "4. Account is verified (check your email)"
        echo ""
        echo "Try running this script again: ./expo_setup_assistant.sh"
        exit 1
    fi
fi

# Step 4: Build Configuration
echo ""
echo "🔧 STEP 3: Build Configuration"
echo "=============================="
echo ""
echo "Setting up build configuration..."

cd /app/frontend

# Check if already configured
if [ -f "eas.json" ]; then
    echo "✅ Build configuration already exists"
else
    echo "📝 Creating build configuration..."
    if eas build:configure --platform android; then
        echo "✅ Build configuration created"
    else
        echo "❌ Build configuration failed"
        echo "This might be due to network issues. Let's try the build anyway..."
    fi
fi

wait_for_enter

# Step 5: Build APK
echo ""
echo "🏗️ STEP 4: Building Your APK"
echo "============================="
echo ""
echo "Ready to build your MindClear APK!"
echo ""
echo "Build options:"
echo "1. Production build (recommended for final APK)"
echo "2. Preview build (faster, for testing)"
echo ""
read -p "Choose build type (1 or 2): " build_type

if [ "$build_type" = "2" ]; then
    build_profile="preview"
    echo "Building preview APK (faster)..."
else
    build_profile="production"
    echo "Building production APK (recommended)..."
fi

echo ""
echo "🚀 Starting build process..."
echo "⏱️  This will take 10-15 minutes"
echo "📧 Build status will be sent to your email"
echo ""

if eas build --platform android --profile $build_profile; then
    echo ""
    echo "🎉 BUILD SUBMITTED SUCCESSFULLY!"
    echo "================================"
    echo ""
    echo "Your APK is now being built on Expo's servers."
    echo ""
    echo "📧 Check your email for build notifications"
    echo "🔗 Monitor progress at: https://expo.dev/accounts/$(eas whoami)/projects/mindclear-app/builds"
    echo ""
    echo "⏰ Build typically takes 10-15 minutes"
    echo "📱 You'll receive download link via email when complete"
    
else
    echo ""
    echo "❌ Build submission failed"
    echo "This could be due to:"
    echo "1. Network connectivity issues"
    echo "2. Build configuration problems" 
    echo "3. Expo service temporary issues"
    echo ""
    echo "Try running the build command manually:"
    echo "cd /app/frontend && eas build --platform android --profile production"
fi

# Step 6: Next Steps
echo ""
echo "📋 NEXT STEPS"
echo "============="
echo ""
echo "While your APK is building:"
echo ""
echo "1. 📧 Check your email for build completion notification"
echo "2. 📱 Prepare your Android device:"
echo "   - Enable 'Unknown Sources' in Settings > Security"
echo "   - Connect to same WiFi as your laptop"
echo ""
echo "3. 🖥️ Setup backend on your laptop:"
echo "   cd /app"
echo "   python3 start_backend.py"
echo ""
echo "4. 📲 When APK is ready:"
echo "   - Download APK from email link"
echo "   - Transfer to your Android device"
echo "   - Install the APK"
echo "   - Open MindClear app"
echo ""
echo "🎉 You're all set! Your Brain Rot Reduction app will be ready soon!"

# Check builds
echo ""
echo "🔍 Recent builds:"
eas build:list --limit 3 2>/dev/null || echo "Run 'eas build:list' to see your builds"

echo ""
echo "📚 For detailed instructions, see:"
echo "   - EXPO_ACCOUNT_SETUP.md"
echo "   - APK_BUILD_INSTRUCTIONS.md"