# 🧠 MindClear - Brain Rot Reduction App

A React Native mobile app designed to help users reduce brain rot through interactive challenges and usage analytics.

## 🏗️ Building APK

See detailed instructions in [APK_BUILD_INSTRUCTIONS.md](./APK_BUILD_INSTRUCTIONS.md)

**Quick Build:**
```bash
npm install -g @expo/cli eas-cli
eas login
cd frontend && yarn install
eas build --platform android --profile production
```

## 🖥️ Running Backend Locally

### Debian/Ubuntu:
```bash
sudo apt install python3 python3-pip mongodb
sudo systemctl start mongod
python3 start_backend.py
```

### Windows:
```bash
# Install Python 3.7+ and MongoDB first
start_backend.bat
```

## 📱 App Features
- AI-powered challenge generation
- Usage session tracking
- Analytics and insights
- Difficulty levels (easy, medium, hard, auto)
- Time-based rewards system

## 🔧 Tech Stack
- **Frontend**: React Native (Expo)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Emergent LLM integration

## 📋 Quick Setup
1. Build APK using instructions above
2. Install APK on Android device
3. Run backend locally using startup scripts
4. Open app and start reducing brain rot!

---
*Made with ❤️ for better digital wellness*
