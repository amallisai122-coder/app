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
BACKEND_URL = "https://repo-diagnostics-1.preview.emergentagent.com/api"

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
                "appId": "com.instagram.android",
                "appName": "Instagram",
                "duration": 45,  # 45 minutes
                "timestamp": datetime.utcnow().isoformat(),
                "date": datetime.utcnow().strftime("%Y-%m-%d")
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
        
        # Log all error handling tests
        for test_name, success, details in error_tests:
            self.log_test(f"Error Handling - {test_name}", success, details)
    
    async def run_all_tests(self):
        """Run all backend tests"""
        print("🧠 Brain Rot Reduction App - Backend API Testing")
        print("=" * 60)
        print(f"Testing backend at: {BACKEND_URL}")
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
        
        # Test 4: Usage Session Logging
        await self.test_usage_session_logging()
        
        # Test 5: Usage Sessions Retrieval
        await self.test_usage_sessions_retrieval()
        
        # Test 6: Analytics
        await self.test_analytics()
        
        # Test 7: Error Handling
        await self.test_error_handling()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
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
        
        return passed == total

async def main():
    """Main test runner"""
    async with BackendTester() as tester:
        success = await tester.run_all_tests()
        return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)