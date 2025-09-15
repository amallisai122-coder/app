# 🏗️ Local APK Build Guide (No Expo Account Needed)

## Method 1: Expo Development Build (Recommended)

### Prerequisites:
- Android Studio installed
- Android SDK and build tools
- Java JDK 17+

### Setup Android Environment:
```bash
# Install Android Studio from https://developer.android.com/studio

# Add to ~/.bashrc or ~/.zshrc:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Install required SDK components:
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### Build APK Locally:
```bash
cd /app/frontend

# Create development build
expo run:android --variant release

# Or create production APK
npx create-expo-app --template blank
# Then migrate your code and build
```

## Method 2: React Native CLI Build

### Convert to React Native CLI:
```bash
cd /app/frontend

# Eject from Expo (creates android/ folder)
expo eject

# Build APK
cd android
./gradlew assembleRelease

# APK will be in: android/app/build/outputs/apk/release/
```

## Method 3: Using Expo EAS (Cloud Build)

### Step 1: Create Free Expo Account
1. Visit: https://expo.dev/signup
2. Sign up with email (free tier includes builds)

### Step 2: Login and Build
```bash
cd /app/frontend

# Login to Expo
eas login

# Configure build
eas build:configure --platform android

# Build APK
eas build --platform android --profile production
```

### Step 3: Download APK
- Build takes 10-15 minutes
- Download link sent to your email
- Or check: https://expo.dev/accounts/[username]/projects/mindclear-app/builds

## Method 4: GitHub Actions (Automated)

Create `.github/workflows/build-apk.yml`:
```yaml
name: Build APK
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: yarn install
        working-directory: frontend
      - run: eas build --platform android --non-interactive
        working-directory: frontend
```

## 🎯 Recommended Approach:

**For Quick Setup:** Use Method 3 (Expo EAS) - just need free account
**For Full Control:** Use Method 2 (React Native CLI) - requires Android Studio setup
**For Learning:** Use Method 1 (Local Development Build)

## 📱 After Building:

1. **Install APK** on Android device
2. **Start Backend**: `python3 start_backend.py`  
3. **Open App** and enjoy!

## 🔧 Troubleshooting:

- **Build fails**: Check Android SDK versions
- **Signing errors**: Generate debug keystore
- **Permission issues**: Enable "Unknown Sources" for APK install
- **Network issues**: Ensure phone and laptop on same WiFi