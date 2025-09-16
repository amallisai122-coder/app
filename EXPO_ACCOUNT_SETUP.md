# 🚀 Expo Account Setup & APK Build Guide

## Step 1: Create Your Free Expo Account

### 1.1 Visit Expo Registration
Open this link in your browser: **https://expo.dev/signup**

### 1.2 Sign Up Options
Choose one of these methods:
- ✅ **Email & Password** (recommended)
- 🔗 **GitHub Account** (if you have one)
- 🔗 **Google Account** (quick option)

### 1.3 Account Details
If using email signup:
- **Email**: Use your primary email (build notifications sent here)
- **Username**: Choose a unique username (will be in your app URLs)
- **Password**: Use a secure password
- **Full Name**: Your name or organization name

### 1.4 Verify Email
- Check your email for verification link
- Click the verification link
- Account is now ready!

## Step 2: Login and Build APK

### 2.1 Login via Terminal
```bash
# Navigate to your project
cd /app/frontend

# Login to Expo
eas login
```

**Enter your credentials when prompted:**
- Username/Email: [your-expo-username]
- Password: [your-expo-password]

### 2.2 Configure Build (First Time Only)
```bash
# Setup build configuration
eas build:configure --platform android
```

This will:
- Create/update `eas.json` file
- Set up Android build profile
- Configure project settings

### 2.3 Start APK Build
```bash
# Build production APK
eas build --platform android --profile production
```

**What happens next:**
- ✅ Code uploaded to Expo servers
- ✅ Build environment prepared
- ✅ APK compiled (takes 10-15 minutes)
- ✅ Download link sent to your email
- ✅ Build available in Expo dashboard

## Step 3: Monitor Your Build

### 3.1 Build Status
After running the build command, you'll see:
```
✔ Build started successfully
📋 Build details: https://expo.dev/accounts/[username]/projects/mindclear-app/builds/[build-id]
```

### 3.2 Track Progress
You can monitor build progress:
- **Terminal**: Shows real-time status
- **Email**: Updates sent to your registered email
- **Dashboard**: Visit the build URL shown above

### 3.3 Build Phases
The build process includes:
1. **Queued** (waiting for available build server)
2. **Building** (compiling your app)
3. **Finished** (APK ready for download)

## Step 4: Download Your APK

### 4.1 Build Complete Notification
When build finishes, you'll receive:
- ✅ Email with download link
- ✅ Terminal confirmation message
- ✅ Dashboard shows "Finished" status

### 4.2 Download Options
**Option A: Direct Link**
- Check your email for download link
- Link format: `https://expo.dev/artifacts/[build-id]`
- Click to download APK file

**Option B: Dashboard**
- Visit: `https://expo.dev/accounts/[username]/projects/mindclear-app/builds`
- Find your build
- Click "Download" button

**Option C: Command Line**
```bash
# List recent builds
eas build:list

# Download specific build
eas build:download [build-id]
```

## Step 5: APK File Details

Your downloaded APK will be named something like:
- `mindclear-app-1.0.0.apk`
- `build-[timestamp].apk`
- File size: ~50-100MB (typical for React Native apps)

## 🎉 Success! What's Next?

### Install on Android Device:
1. **Transfer APK** to your Android phone
2. **Enable Unknown Sources**: Settings > Security > Unknown Sources
3. **Install APK**: Tap the APK file and follow prompts
4. **Start Backend**: Run `python3 start_backend.py` on your laptop
5. **Open App**: Launch MindClear on your phone

### Share with Others:
- Send APK file directly
- Include backend setup instructions
- Provide `start_backend.py` script

## 🔧 Troubleshooting

### Login Issues:
- **Wrong credentials**: Double-check username/password
- **Network error**: Check internet connection
- **2FA enabled**: Use app-specific password if needed

### Build Failures:
- **Invalid config**: Check `app.json` syntax
- **Dependencies**: Run `yarn install` first
- **Expo limits**: Free accounts have build limits (check dashboard)

### Download Issues:
- **Link expired**: Links expire after 30 days
- **File corrupt**: Re-download from dashboard
- **Email not received**: Check spam folder

## 💡 Pro Tips

1. **Free Tier Limits**: 
   - 30 builds per month
   - 1 concurrent build
   - Upgrade for more builds

2. **Build Optimization**:
   - Use `--profile preview` for faster test builds
   - Use `--profile production` for final releases

3. **Version Management**:
   - Update version in `app.json` for each build
   - Use semantic versioning (1.0.0, 1.0.1, etc.)

4. **Build History**:
   - All builds saved in dashboard
   - Can re-download previous builds
   - Build logs available for debugging

---

## 🚀 Ready to Build!

Run this command to start:
```bash
cd /app && ./build_apk.sh
```

The script will guide you through each step interactively!