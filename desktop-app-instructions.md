# Desktop App Creation Instructions

## Method 1: Electron Wrapper (Recommended)

### Prerequisites:
- Node.js installed on your laptop
- Git (optional)

### Steps:

1. **Clone/Download the project**:
   ```bash
   # If you have git:
   git clone [your-repo-url]
   
   # Or download the zip file from your repository
   ```

2. **Install Electron globally**:
   ```bash
   npm install -g electron
   npm install -g electron-builder
   ```

3. **Create Electron wrapper**:
   ```bash
   cd your-project-folder
   npm init -y
   npm install electron --save-dev
   ```

4. **Create main.js file**:
   ```javascript
   const { app, BrowserWindow } = require('electron')
   const path = require('path')

   function createWindow() {
     const win = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: true,
         contextIsolation: false
       },
       icon: path.join(__dirname, 'assets/icon.png') // optional
     })

     // Load your web app
     win.loadURL('https://code-review-61.preview.emergentagent.com')
     
     // Optional: Remove menu bar
     win.setMenuBarVisibility(false)
   }

   app.whenReady().then(createWindow)

   app.on('window-all-closed', () => {
     if (process.platform !== 'darwin') {
       app.quit()
     }
   })
   ```

5. **Update package.json**:
   ```json
   {
     "name": "mindclear-app",
     "version": "1.0.0",
     "description": "Brain Rot Reduction App",
     "main": "main.js",
     "scripts": {
       "start": "electron .",
       "build": "electron-builder",
       "dist": "electron-builder --publish=never"
     },
     "build": {
       "appId": "com.mindclear.app",
       "productName": "MindClear",
       "directories": {
         "output": "dist"
       },
       "files": [
         "main.js",
         "package.json"
       ],
       "win": {
         "target": "nsis",
         "icon": "assets/icon.ico"
       },
       "mac": {
         "target": "dmg",
         "icon": "assets/icon.icns"
       },
       "linux": {
         "target": "AppImage",
         "icon": "assets/icon.png"
       }
     }
   }
   ```

6. **Run the app**:
   ```bash
   npm start
   ```

7. **Build executable**:
   ```bash
   npm run dist
   ```

This will create installer files in the `dist` folder.

## Method 2: Expo Desktop (If using Expo CLI)

1. **Install Expo CLI**:
   ```bash
   npm install -g @expo/cli
   ```

2. **Build for web**:
   ```bash
   expo build:web
   ```

3. **Use Electron to wrap the built web app**

## Method 3: Direct Static Files

1. **Download the built files** from `/app/frontend/dist/`
2. **Host locally** using any web server
3. **Wrap in Electron** as shown above

## Troubleshooting:

- **CORS Issues**: May need to configure CORS settings
- **API Access**: Ensure backend URL is accessible from desktop
- **Icons**: Add proper icons for professional look
- **Auto-updater**: Can be added for automatic updates

## File Structure:
```
desktop-app/
├── main.js
├── package.json
├── assets/
│   ├── icon.png
│   ├── icon.ico
│   └── icon.icns
└── dist/ (generated)
```