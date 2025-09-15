#!/usr/bin/env python3
"""
MindClear Backend Startup Script
This script starts the backend server locally for the APK version
"""

import subprocess
import sys
import os
import webbrowser
from pathlib import Path

def check_python():
    """Check if Python 3.7+ is installed"""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        return False
    print("✅ Python version:", sys.version.split()[0])
    return True

def check_mongodb():
    """Check if MongoDB is running"""
    try:
        import pymongo
        client = pymongo.MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        client.server_info()
        print("✅ MongoDB is running")
        return True
    except:
        print("❌ MongoDB is not running. Please start MongoDB first.")
        print("   On Debian/Ubuntu: sudo systemctl start mongod")
        return False

def install_requirements():
    """Install required packages"""
    backend_dir = Path(__file__).parent / "backend"
    requirements_file = backend_dir / "requirements.txt"
    
    if requirements_file.exists():
        print("📦 Installing backend dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(requirements_file)])
        print("✅ Dependencies installed")
    else:
        print("❌ requirements.txt not found")
        return False
    return True

def start_backend():
    """Start the FastAPI backend server"""
    backend_dir = Path(__file__).parent / "backend"
    server_file = backend_dir / "server.py"
    
    if not server_file.exists():
        print("❌ server.py not found")
        return False
    
    print("🚀 Starting MindClear backend server...")
    print("📡 Backend will be available at: http://localhost:8001")
    print("🔗 API documentation: http://localhost:8001/docs")
    print("\n⚠️  Keep this terminal window open while using the app")
    print("⚠️  Press Ctrl+C to stop the server\n")
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    # Start the server
    subprocess.run([
        sys.executable, "-m", "uvicorn", "server:app",
        "--host", "0.0.0.0",
        "--port", "8001",
        "--reload"
    ])

def main():
    print("🧠 MindClear Backend Startup")
    print("=" * 40)
    
    if not check_python():
        return
    
    if not check_mongodb():
        return
    
    if not install_requirements():
        return
    
    start_backend()

if __name__ == "__main__":
    main()