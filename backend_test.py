#!/usr/bin/env python3
"""
Backend API Testing for Brain Rot Reduction App
Tests all API endpoints to ensure they're working correctly
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, List
import uuid

# Backend URL from frontend environment
BACKEND_URL = "https://app-heartbeat.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.challenge_id = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    async def test_health_check(self):
        """Test health check endpoint and verify AI is enabled"""
        try:
            async with self.session.get(f"{BACKEND_URL}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    ai_enabled = data.get("ai_enabled", False)
                    
                    if ai_enabled:
                        self.log_test("Health Check - AI Enabled", True, 
                                    f"Status: {data.get('status')}, AI: {ai_enabled}")
                    else:
                        self.log_test("Health Check - AI Disabled", False, 
                                    f"AI integration not working. Status: {data.get('status')}")
                    return data
                else:
                    self.log_test("Health Check", False, 
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return None
    
    async def test_challenge_generation(self, difficulty: str = "medium"):
        """Test challenge generation with specified difficulty"""
        try:
            payload = {
                "difficulty": difficulty,
                "user_performance": [
                    {"correct": True, "timeReward": 8},
                    {"correct": False, "timeReward": 0},
                    {"correct": True, "timeReward": 10}
                ]
            }
            
            async with self.session.post(f"{BACKEND_URL}/challenges/generate", 
                                       json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Validate challenge structure
                    required_fields = ["id", "question", "answer", "difficulty", "timeReward"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.challenge_id = data["id"]  # Store for submission test
                        self.log_test(f"Challenge Generation ({difficulty})", True,
                                    f"Question: {data['question']}, Reward: {data['timeReward']} min")
                        return data
                    else:
                        self.log_test(f"Challenge Generation ({difficulty})", False,
                                    f"Missing fields: {missing_fields}", data)
                        return None
                else:
                    self.log_test(f"Challenge Generation ({difficulty})", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test(f"Challenge Generation ({difficulty})", False, f"Exception: {str(e)}")
            return None
    
    async def test_challenge_submission(self, challenge_id: str, answer: int):
        """Test challenge submission"""
        try:
            async with self.session.post(f"{BACKEND_URL}/challenges/{challenge_id}/submit",
                                       params={"answer": answer}) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Validate response structure
                    required_fields = ["correct", "timeReward", "correctAnswer"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        result = "Correct" if data["correct"] else "Incorrect"
                        self.log_test("Challenge Submission", True,
                                    f"Answer: {answer}, Result: {result}, Reward: {data['timeReward']} min")
                        return data
                    else:
                        self.log_test("Challenge Submission", False,
                                    f"Missing fields: {missing_fields}", data)
                        return None
                else:
                    self.log_test("Challenge Submission", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("Challenge Submission", False, f"Exception: {str(e)}")
            return None
    
    async def test_usage_session_logging(self):
        """Test usage session logging"""
        try:
            session_data = {
                "id": str(uuid.uuid4()),
                "userId": "default",
                "appId": "com.instagram.android",
                "packageName": "com.instagram.android",  # Added missing field
                "appName": "Instagram",
                "duration": 45,  # 45 minutes
                "timestamp": datetime.utcnow().isoformat(),
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "sessionType": "active"
            }
            
            async with self.session.post(f"{BACKEND_URL}/usage/session",
                                       json=session_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("Usage Session Logging", True,
                                f"Logged {session_data['duration']} min for {session_data['appName']}")
                    return data
                else:
                    self.log_test("Usage Session Logging", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("Usage Session Logging", False, f"Exception: {str(e)}")
            return None
    
    async def test_usage_sessions_retrieval(self):
        """Test usage sessions retrieval"""
        try:
            async with self.session.get(f"{BACKEND_URL}/usage/sessions?days=7") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list):
                        self.log_test("Usage Sessions Retrieval", True,
                                    f"Retrieved {len(data)} sessions from last 7 days")
                        return data
                    else:
                        self.log_test("Usage Sessions Retrieval", False,
                                    "Response is not a list", data)
                        return None
                else:
                    self.log_test("Usage Sessions Retrieval", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("Usage Sessions Retrieval", False, f"Exception: {str(e)}")
            return None
    
    async def test_analytics(self):
        """Test analytics endpoint"""
        try:
            async with self.session.get(f"{BACKEND_URL}/analytics") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Validate analytics structure
                    required_fields = ["totalTimeUsed", "averageDaily", "mostUsedApp", 
                                     "streakDays", "challengesCompleted", "timeEarned"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log_test("Analytics", True,
                                    f"Total time: {data['totalTimeUsed']} min, "
                                    f"Challenges: {data['challengesCompleted']}, "
                                    f"Time earned: {data['timeEarned']} min")
                        return data
                    else:
                        self.log_test("Analytics", False,
                                    f"Missing fields: {missing_fields}", data)
                        return None
                else:
                    self.log_test("Analytics", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("Analytics", False, f"Exception: {str(e)}")
            return None
    
    async def test_app_registration(self):
        """Test app registration endpoint"""
        try:
            app_data = {
                "id": str(uuid.uuid4()),
                "packageName": "com.instagram.android",
                "appName": "Instagram",
                "displayName": "Instagram",
                "category": "social",
                "icon": "base64_encoded_icon_data",
                "isSystemApp": False,
                "version": "1.0.0",
                "installDate": datetime.utcnow().isoformat(),
                "lastUsed": datetime.utcnow().isoformat()
            }
            
            async with self.session.post(f"{BACKEND_URL}/apps/register", json=app_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("App Registration", True, 
                                f"Registered {data.get('appName')} ({data.get('packageName')})")
                    return data
                else:
                    self.log_test("App Registration", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("App Registration", False, f"Exception: {str(e)}")
            return None

    async def test_app_registry_retrieval(self):
        """Test app registry retrieval"""
        try:
            async with self.session.get(f"{BACKEND_URL}/apps/registry") as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list):
                        self.log_test("App Registry Retrieval", True,
                                    f"Retrieved {len(data)} registered apps")
                        return data
                    else:
                        self.log_test("App Registry Retrieval", False,
                                    "Response is not a list", data)
                        return None
                else:
                    self.log_test("App Registry Retrieval", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("App Registry Retrieval", False, f"Exception: {str(e)}")
            return None

    async def test_monitored_app_management(self):
        """Test monitored app management endpoints"""
        # Test adding monitored app
        monitored_app_data = {
            "id": str(uuid.uuid4()),
            "userId": "default",
            "packageName": "com.tiktok.android",
            "appName": "TikTok",
            "displayName": "TikTok",
            "icon": "base64_icon_data",
            "dailyLimit": 60,  # 60 minutes
            "timeUsed": 0,
            "isBlocked": False,
            "category": "social",
            "isActive": True,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        try:
            # Add monitored app
            async with self.session.post(f"{BACKEND_URL}/apps/monitored", 
                                       json=monitored_app_data) as response:
                if response.status == 200:
                    data = await response.json()
                    app_id = data.get("id")
                    self.log_test("Add Monitored App", True,
                                f"Added {data.get('appName')} to monitoring")
                    
                    # Test getting monitored apps
                    async with self.session.get(f"{BACKEND_URL}/apps/monitored?user_id=default") as get_response:
                        if get_response.status == 200:
                            monitored_apps = await get_response.json()
                            self.log_test("Get Monitored Apps", True,
                                        f"Retrieved {len(monitored_apps)} monitored apps")
                        else:
                            self.log_test("Get Monitored Apps", False,
                                        f"HTTP {get_response.status}", await get_response.text())
                    
                    # Test updating app usage
                    if app_id:
                        async with self.session.put(f"{BACKEND_URL}/apps/monitored/{app_id}/usage",
                                                  params={"time_used": 30}) as update_response:
                            if update_response.status == 200:
                                update_data = await update_response.json()
                                self.log_test("Update App Usage", True,
                                            f"Updated usage to {update_data.get('timeUsed')} minutes")
                            else:
                                self.log_test("Update App Usage", False,
                                            f"HTTP {update_response.status}", await update_response.text())
                        
                        # Test removing monitored app
                        async with self.session.delete(f"{BACKEND_URL}/apps/monitored/{app_id}") as delete_response:
                            if delete_response.status == 200:
                                delete_data = await delete_response.json()
                                self.log_test("Remove Monitored App", True,
                                            f"Successfully removed app from monitoring")
                            else:
                                self.log_test("Remove Monitored App", False,
                                            f"HTTP {delete_response.status}", await delete_response.text())
                    
                    return data
                else:
                    self.log_test("Add Monitored App", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("Monitored App Management", False, f"Exception: {str(e)}")
            return None

    async def test_app_search_and_categories(self):
        """Test app search and categories endpoints"""
        try:
            # Test app search
            async with self.session.get(f"{BACKEND_URL}/apps/search?query=instagram&category=social&limit=10") as response:
                if response.status == 200:
                    data = await response.json()
                    apps = data.get("apps", [])
                    self.log_test("App Search", True,
                                f"Found {len(apps)} apps matching 'instagram' in social category")
                else:
                    self.log_test("App Search", False,
                                f"HTTP {response.status}", await response.text())
            
            # Test get categories
            async with self.session.get(f"{BACKEND_URL}/apps/categories") as response:
                if response.status == 200:
                    categories = await response.json()
                    self.log_test("Get App Categories", True,
                                f"Retrieved {len(categories)} app categories")
                    return categories
                else:
                    self.log_test("Get App Categories", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("App Search and Categories", False, f"Exception: {str(e)}")
            return None

    async def test_bulk_app_registration(self):
        """Test bulk app registration"""
        try:
            apps_data = [
                {
                    "id": str(uuid.uuid4()),
                    "packageName": "com.youtube.android",
                    "appName": "YouTube",
                    "displayName": "YouTube",
                    "category": "entertainment",
                    "isSystemApp": False,
                    "version": "1.0.0"
                },
                {
                    "id": str(uuid.uuid4()),
                    "packageName": "com.spotify.music",
                    "appName": "Spotify",
                    "displayName": "Spotify Music",
                    "category": "music",
                    "isSystemApp": False,
                    "version": "1.0.0"
                }
            ]
            
            async with self.session.post(f"{BACKEND_URL}/apps/bulk-register", json=apps_data) as response:
                if response.status == 200:
                    data = await response.json()
                    registered = data.get("registered", 0)
                    updated = data.get("updated", 0)
                    total = data.get("total", 0)
                    self.log_test("Bulk App Registration", True,
                                f"Registered: {registered}, Updated: {updated}, Total: {total}")
                    return data
                else:
                    self.log_test("Bulk App Registration", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("Bulk App Registration", False, f"Exception: {str(e)}")
            return None

    async def test_enhanced_usage_tracking(self):
        """Test enhanced usage tracking endpoints"""
        try:
            # Test enhanced usage session logging
            session_data = {
                "id": str(uuid.uuid4()),
                "userId": "default",
                "appId": "com.instagram.android",
                "packageName": "com.instagram.android",
                "appName": "Instagram",
                "duration": 25,
                "timestamp": datetime.utcnow().isoformat(),
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "sessionType": "active"
            }
            
            async with self.session.post(f"{BACKEND_URL}/usage/session", json=session_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("Enhanced Usage Session Logging", True,
                                f"Logged {session_data['duration']} min session for {session_data['appName']}")
                else:
                    self.log_test("Enhanced Usage Session Logging", False,
                                f"HTTP {response.status}", await response.text())
            
            # Test daily app usage
            async with self.session.get(f"{BACKEND_URL}/usage/apps/com.instagram.android/daily?user_id=default") as response:
                if response.status == 200:
                    data = await response.json()
                    total_usage = data.get("totalUsage", 0)
                    session_count = data.get("sessionCount", 0)
                    self.log_test("Daily App Usage", True,
                                f"Instagram: {total_usage} min total, {session_count} sessions today")
                else:
                    self.log_test("Daily App Usage", False,
                                f"HTTP {response.status}", await response.text())
            
            # Test realtime usage data
            async with self.session.get(f"{BACKEND_URL}/usage/realtime?user_id=default") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("Realtime Usage Data", True,
                                f"Retrieved realtime data for {len(data)} monitored apps")
                    return data
                else:
                    self.log_test("Realtime Usage Data", False,
                                f"HTTP {response.status}", await response.text())
                    return None
        except Exception as e:
            self.log_test("Enhanced Usage Tracking", False, f"Exception: {str(e)}")
            return None

    async def test_error_handling(self):
        """Test error handling for invalid requests"""
        error_tests = []
        
        # Test invalid challenge submission
        try:
            async with self.session.post(f"{BACKEND_URL}/challenges/invalid-id/submit",
                                       params={"answer": 42}) as response:
                if response.status == 404:
                    error_tests.append(("Invalid Challenge ID", True, "Correctly returned 404"))
                else:
                    error_tests.append(("Invalid Challenge ID", False, f"Expected 404, got {response.status}"))
        except Exception as e:
            error_tests.append(("Invalid Challenge ID", False, f"Exception: {str(e)}"))
        
        # Test invalid difficulty level
        try:
            payload = {"difficulty": "impossible"}
            async with self.session.post(f"{BACKEND_URL}/challenges/generate",
                                       json=payload) as response:
                # Should still work with fallback to medium
                if response.status == 200:
                    data = await response.json()
                    if data.get("difficulty") in ["easy", "medium", "hard"]:
                        error_tests.append(("Invalid Difficulty Fallback", True, 
                                          f"Fallback to {data.get('difficulty')}"))
                    else:
                        error_tests.append(("Invalid Difficulty Fallback", False, 
                                          f"Unexpected difficulty: {data.get('difficulty')}"))
                else:
                    error_tests.append(("Invalid Difficulty Fallback", False, 
                                      f"HTTP {response.status}"))
        except Exception as e:
            error_tests.append(("Invalid Difficulty Fallback", False, f"Exception: {str(e)}"))

        # Test invalid monitored app operations
        try:
            async with self.session.put(f"{BACKEND_URL}/apps/monitored/invalid-id/usage",
                                      params={"time_used": 30}) as response:
                if response.status == 404:
                    error_tests.append(("Invalid Monitored App Update", True, "Correctly returned 404"))
                else:
                    error_tests.append(("Invalid Monitored App Update", False, f"Expected 404, got {response.status}"))
        except Exception as e:
            error_tests.append(("Invalid Monitored App Update", False, f"Exception: {str(e)}"))

        try:
            async with self.session.delete(f"{BACKEND_URL}/apps/monitored/invalid-id") as response:
                if response.status == 404:
                    error_tests.append(("Invalid Monitored App Delete", True, "Correctly returned 404"))
                else:
                    error_tests.append(("Invalid Monitored App Delete", False, f"Expected 404, got {response.status}"))
        except Exception as e:
            error_tests.append(("Invalid Monitored App Delete", False, f"Exception: {str(e)}"))
        
        # Log all error handling tests
        for test_name, success, details in error_tests:
            self.log_test(f"Error Handling - {test_name}", success, details)
    
    async def run_all_tests(self):
        """Run all backend tests"""
        print("🧠 Brain Rot Reduction App - Backend API Testing")
        print("=" * 80)
        print(f"Testing backend at: {BACKEND_URL}")
        print("Testing Dynamic App Management & Enhanced Usage Tracking")
        print()
        
        # Test 1: Health Check
        health_data = await self.test_health_check()
        
        # Test 2: Challenge Generation (different difficulties)
        difficulties = ["easy", "medium", "hard", "auto"]
        challenge_data = None
        for difficulty in difficulties:
            challenge_data = await self.test_challenge_generation(difficulty)
            if challenge_data and not self.challenge_id:
                self.challenge_id = challenge_data["id"]
        
        # Test 3: Challenge Submission
        if self.challenge_id and challenge_data:
            # Submit correct answer
            await self.test_challenge_submission(self.challenge_id, challenge_data["answer"])
            
            # Generate another challenge for incorrect answer test
            new_challenge = await self.test_challenge_generation("medium")
            if new_challenge:
                # Submit incorrect answer
                wrong_answer = new_challenge["answer"] + 1
                await self.test_challenge_submission(new_challenge["id"], wrong_answer)
        
        # Test 4: Usage Session Logging (Original)
        await self.test_usage_session_logging()
        
        # Test 5: Usage Sessions Retrieval
        await self.test_usage_sessions_retrieval()
        
        # Test 6: Analytics
        await self.test_analytics()
        
        # NEW DYNAMIC APP MANAGEMENT TESTS
        print("🔄 Testing Dynamic App Management Features...")
        print("-" * 50)
        
        # Test 7: App Registration
        await self.test_app_registration()
        
        # Test 8: App Registry Retrieval
        await self.test_app_registry_retrieval()
        
        # Test 9: Bulk App Registration
        await self.test_bulk_app_registration()
        
        # Test 10: App Search and Categories
        await self.test_app_search_and_categories()
        
        # Test 11: Monitored App Management
        await self.test_monitored_app_management()
        
        # NEW ENHANCED USAGE TRACKING TESTS
        print("📊 Testing Enhanced Usage Tracking Features...")
        print("-" * 50)
        
        # Test 12: Enhanced Usage Tracking
        await self.test_enhanced_usage_tracking()
        
        # Test 13: Error Handling (Updated with new endpoints)
        print("🛡️ Testing Error Handling...")
        print("-" * 50)
        await self.test_error_handling()
        
        # Summary
        print("=" * 80)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        else:
            print("\n✅ ALL TESTS PASSED!")
            print("Dynamic App Management and Enhanced Usage Tracking are fully functional!")
        
        return passed == total

async def main():
    """Main test runner"""
    async with BackendTester() as tester:
        success = await tester.run_all_tests()
        return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)