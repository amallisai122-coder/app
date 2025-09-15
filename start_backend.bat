@echo off
echo 🧠 MindClear Backend Startup
echo ========================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python is installed

echo.
echo 📦 Installing dependencies...
cd backend
pip install -r requirements.txt

echo.
echo 🚀 Starting MindClear backend server...
echo 📡 Backend will be available at: http://localhost:8001
echo 🔗 API documentation: http://localhost:8001/docs
echo.
echo ⚠️  Keep this window open while using the app
echo ⚠️  Press Ctrl+C to stop the server
echo.

python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

pause