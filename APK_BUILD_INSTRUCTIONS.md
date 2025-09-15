# 📱 MindClear APK Build & Installation Guide

## 🏗️ Building the APK

### Prerequisites
- Node.js 18+ installed
- Git (optional)
- Android Studio (for advanced users) or just Android SDK

### Step 1: Install Build Tools
```bash
# Install Expo CLI and EAS CLI
npm install -g @expo/cli eas-cli

# Login to Expo (free account required)
eas login
```

### Step 2: Clone & Setup Project
```bash
# Clone your repository
git clone [your-repo-url] mindclear-app
cd mindclear-app/frontend

# Install dependencies
yarn install
```

### Step 3: Build APK
```bash
# Build APK for production
eas build --platform android --profile production

# Or build preview APK (faster, for testing)
eas build --platform android --profile preview
```

The build process will:
1. Upload your code to Expo's build servers
2. Compile the React Native app into an APK
3. Provide download link when complete (usually 10-15 minutes)

### Step 4: Download APK
After build completes, you'll get a download URL. The APK file will be named something like:
`mindclear-app-1.0.0.apk`

---

## 📲 Installing on Android Device

### Method 1: Direct Install
1. Download the APK file to your Android device
2. Open file manager and tap the APK file
3. If prompted, enable "Install from unknown sources"
4. Follow installation prompts

### Method 2: ADB Install (Developer)
```bash
# Enable Developer Options and USB Debugging on your phone
adb install mindclear-app-1.0.0.apk
```

---

## 🖥️ Setting Up Backend (Required)

### For Debian/Ubuntu Systems:

#### Step 1: Install Dependencies
```bash
# Update system
sudo apt update

# Install Python and MongoDB
sudo apt install python3 python3-pip mongodb

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod  # Auto-start on boot
```

#### Step 2: Setup Backend
```bash
# Navigate to your app directory
cd mindclear-app

# Run the backend startup script
python3 start_backend.py
```

The script will:
- ✅ Check Python version
- ✅ Verify MongoDB is running  
- 📦 Install required packages
- 🚀 Start the backend server on http://localhost:8001

#### Step 3: Keep Backend Running
- Keep the terminal window open while using the app
- The mobile app will connect to http://localhost:8001
- Press `Ctrl+C` to stop the server

---

## 📋 Quick Setup Summary

### For the person building APK:
```bash
npm install -g @expo/cli eas-cli
eas login
cd mindclear-app/frontend
yarn install
eas build --platform android --profile production
```

### For the person installing APK:
1. **Install APK**: Download and install the APK file on Android
2. **Install Backend Dependencies**: 
   ```bash
   sudo apt install python3 python3-pip mongodb
   sudo systemctl start mongod
   ```
3. **Start Backend**: 
   ```bash
   cd mindclear-app
   python3 start_backend.py
   ```
4. **Use App**: Open MindClear app on your phone

---

## 🔧 Troubleshooting

### Backend Issues:
- **MongoDB not found**: `sudo apt install mongodb`
- **Permission errors**: `sudo systemctl start mongod`
- **Port 8001 busy**: Change port in backend/server.py and .env.production

### APK Issues:
- **Build fails**: Check expo account and project configuration
- **App crashes**: Ensure backend is running on localhost:8001
- **Cannot install**: Enable "Unknown sources" in Android settings

### Network Issues:
- **App can't connect**: Ensure phone and computer are on same WiFi network
- **Firewall blocking**: Configure firewall to allow port 8001

---

## 📁 File Structure After Setup
```
mindclear-app/
├── backend/                 # FastAPI backend
├── frontend/               # React Native frontend  
├── start_backend.py        # Backend startup script
├── APK_BUILD_INSTRUCTIONS.md
└── mindclear-app-1.0.0.apk  # Generated APK file
```

## 🚀 Ready to Use!
Once both backend and APK are set up, you'll have a fully functional Brain Rot Reduction app running locally on your devices.