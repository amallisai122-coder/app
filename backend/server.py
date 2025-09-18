from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Brain Rot Reduction API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class Challenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: int
    difficulty: str = "medium"
    timeReward: int = 8
    completed: bool = False
    correct: Optional[bool] = None

class ChallengeRequest(BaseModel):
    difficulty: Optional[str] = "medium"
    user_performance: Optional[List[Dict[str, Any]]] = []

class AppInfo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    packageName: str
    appName: str
    displayName: str
    category: Optional[str] = "social"
    icon: Optional[str] = None  # base64 encoded icon
    isSystemApp: bool = False
    version: Optional[str] = None
    installDate: Optional[datetime] = None
    lastUsed: Optional[datetime] = None

class MonitoredApp(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: Optional[str] = "default"  # For multi-user support later
    packageName: str
    appName: str
    displayName: str
    icon: Optional[str] = None
    dailyLimit: int  # minutes
    timeUsed: int = 0  # minutes today
    isBlocked: bool = False
    category: Optional[str] = "social"
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class UsageSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: Optional[str] = "default"
    appId: str
    packageName: str
    appName: str
    duration: int  # minutes
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    date: str
    sessionType: str = "active"  # active, background, foreground

class Analytics(BaseModel):
    totalTimeUsed: int
    averageDaily: float
    mostUsedApp: str
    streakDays: int
    challengesCompleted: int
    timeEarned: int

# Initialize LLM Chat
llm_api_key = os.environ.get('EMERGENT_LLM_KEY')
if not llm_api_key:
    logger.warning("EMERGENT_LLM_KEY not found, using fallback challenge generation")

async def generate_ai_challenge(difficulty: str, user_performance: List[Dict]) -> Challenge:
    """Generate a math challenge using AI based on user performance"""
    try:
        if not llm_api_key:
            return generate_fallback_challenge(difficulty)
            
        # Analyze user performance to adjust difficulty
        recent_performance = user_performance[-5:] if user_performance else []
        success_rate = 0.5  # default
        
        if recent_performance:
            correct_count = sum(1 for p in recent_performance if p.get('correct', False))
            success_rate = correct_count / len(recent_performance)
        
        # Adjust difficulty based on performance
        valid_difficulties = ["easy", "medium", "hard"]
        if success_rate > 0.8 and difficulty == "auto":
            actual_difficulty = "hard"
        elif success_rate < 0.4 and difficulty == "auto":
            actual_difficulty = "easy"
        elif difficulty in valid_difficulties:
            actual_difficulty = difficulty
        elif difficulty == "auto":
            actual_difficulty = "medium"
        else:
            # Invalid difficulty, default to medium
            actual_difficulty = "medium"
        
        # Create LLM chat instance
        chat = LlmChat(
            api_key=llm_api_key,
            session_id=f"challenge_{datetime.now().timestamp()}",
            system_message=f"""You are a math challenge generator for a brain training app. 
            Generate a single math problem appropriate for {actual_difficulty} level.
            
            Difficulty guidelines:
            - Easy: Single digit operations, basic addition/subtraction (reward: 5-7 minutes)
            - Medium: Two digit operations, multiplication/division (reward: 8-10 minutes)  
            - Hard: Multi-digit operations, complex calculations (reward: 12-15 minutes)
            
            User's recent success rate: {success_rate:.1%}
            
            Respond with ONLY a JSON object in this exact format:
            {{"question": "12 + 8 = ?", "answer": 20, "timeReward": 8}}
            
            Make sure the answer is a whole number."""
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(
            text=f"Generate a {actual_difficulty} math challenge. Success rate: {success_rate:.1%}"
        )
        
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        try:
            ai_data = json.loads(response.strip())
            challenge = Challenge(
                question=ai_data["question"],
                answer=int(ai_data["answer"]),
                difficulty=actual_difficulty,
                timeReward=int(ai_data["timeReward"]),
            )
            
            # Store challenge in database
            await db.challenges.insert_one(challenge.dict())
            return challenge
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Failed to parse AI response: {e}, response: {response}")
            return generate_fallback_challenge(actual_difficulty)
            
    except Exception as e:
        logger.error(f"AI challenge generation failed: {e}")
        return generate_fallback_challenge(difficulty)

def generate_fallback_challenge(difficulty: str) -> Challenge:
    """Fallback challenge generation when AI is unavailable"""
    import random
    
    challenges = {
        "easy": [
            {"question": "7 + 8 = ?", "answer": 15, "timeReward": 5},
            {"question": "15 - 6 = ?", "answer": 9, "timeReward": 5},
            {"question": "4 × 3 = ?", "answer": 12, "timeReward": 6},
            {"question": "18 ÷ 6 = ?", "answer": 3, "timeReward": 6},
            {"question": "9 + 7 = ?", "answer": 16, "timeReward": 5},
            {"question": "20 - 11 = ?", "answer": 9, "timeReward": 5},
        ],
        "medium": [
            {"question": "23 + 47 = ?", "answer": 70, "timeReward": 8},
            {"question": "84 - 29 = ?", "answer": 55, "timeReward": 8},
            {"question": "12 × 7 = ?", "answer": 84, "timeReward": 9},
            {"question": "144 ÷ 12 = ?", "answer": 12, "timeReward": 9},
            {"question": "38 + 56 = ?", "answer": 94, "timeReward": 8},
            {"question": "100 - 67 = ?", "answer": 33, "timeReward": 8},
        ],
        "hard": [
            {"question": "156 + 289 = ?", "answer": 445, "timeReward": 12},
            {"question": "500 - 247 = ?", "answer": 253, "timeReward": 12},
            {"question": "23 × 18 = ?", "answer": 414, "timeReward": 15},
            {"question": "2880 ÷ 24 = ?", "answer": 120, "timeReward": 15},
            {"question": "347 + 678 = ?", "answer": 1025, "timeReward": 12},
            {"question": "1000 - 456 = ?", "answer": 544, "timeReward": 12},
        ],
    }
    
    # Validate difficulty and default to medium if invalid
    difficulty_key = difficulty if difficulty in challenges else "medium"
    selected = random.choice(challenges[difficulty_key])
    
    return Challenge(
        question=selected["question"],
        answer=selected["answer"],
        difficulty=difficulty_key,
        timeReward=selected["timeReward"],
    )

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Brain Rot Reduction API", "version": "1.0.0"}

@api_router.post("/challenges/generate", response_model=Challenge)
async def generate_challenge(request: ChallengeRequest):
    """Generate a new math challenge using AI or fallback"""
    try:
        challenge = await generate_ai_challenge(
            request.difficulty or "medium",
            request.user_performance or []
        )
        return challenge
    except Exception as e:
        logger.error(f"Challenge generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate challenge")

@api_router.post("/challenges/{challenge_id}/submit")
async def submit_challenge(challenge_id: str, answer: int):
    """Submit an answer for a challenge"""
    try:
        challenge = await db.challenges.find_one({"id": challenge_id})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        correct = answer == challenge["answer"]
        
        # Update challenge in database
        await db.challenges.update_one(
            {"id": challenge_id},
            {"$set": {"completed": True, "correct": correct}}
        )
        
        return {
            "correct": correct,
            "timeReward": challenge["timeReward"] if correct else 0,
            "correctAnswer": challenge["answer"]
        }
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Challenge submission failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit challenge")

# API Routes for Dynamic App Management

@api_router.post("/apps/register", response_model=AppInfo)
async def register_app(app_info: AppInfo):
    """Register a new app detected on the device"""
    try:
        # Check if app already exists
        existing_app = await db.app_registry.find_one({"packageName": app_info.packageName})
        if existing_app:
            # Update existing app info
            await db.app_registry.update_one(
                {"packageName": app_info.packageName},
                {"$set": app_info.dict()}
            )
        else:
            # Insert new app
            await db.app_registry.insert_one(app_info.dict())
        
        return app_info
    except Exception as e:
        logger.error(f"Failed to register app: {e}")
        raise HTTPException(status_code=500, detail="Failed to register app")

@api_router.get("/apps/registry")
async def get_app_registry():
    """Get all registered apps from device scan"""
    try:
        apps = await db.app_registry.find({}).to_list(1000)
        
        # Convert ObjectId to string for JSON serialization
        for app in apps:
            if "_id" in app:
                app["_id"] = str(app["_id"])
        
        return apps
    except Exception as e:
        logger.error(f"Failed to get app registry: {e}")
        raise HTTPException(status_code=500, detail="Failed to get app registry")

@api_router.post("/apps/monitored", response_model=MonitoredApp)
async def add_monitored_app(monitored_app: MonitoredApp):
    """Add an app to monitoring list"""
    try:
        # Check if already being monitored
        existing = await db.monitored_apps.find_one({
            "packageName": monitored_app.packageName,
            "userId": monitored_app.userId,
            "isActive": True
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="App is already being monitored")
        
        await db.monitored_apps.insert_one(monitored_app.dict())
        return monitored_app
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add monitored app: {e}")
        raise HTTPException(status_code=500, detail="Failed to add monitored app")

@api_router.get("/apps/monitored")
async def get_monitored_apps(user_id: str = "default"):
    """Get all monitored apps for a user"""
    try:
        apps = await db.monitored_apps.find({
            "userId": user_id,
            "isActive": True
        }).to_list(100)
        
        # Convert ObjectId to string for JSON serialization
        for app in apps:
            if "_id" in app:
                app["_id"] = str(app["_id"])
        
        return apps
    except Exception as e:
        logger.error(f"Failed to get monitored apps: {e}")
        raise HTTPException(status_code=500, detail="Failed to get monitored apps")

@api_router.put("/apps/monitored/{app_id}/usage")
async def update_app_usage(app_id: str, time_used: int):
    """Update app usage time"""
    try:
        result = await db.monitored_apps.update_one(
            {"id": app_id},
            {
                "$set": {
                    "timeUsed": time_used,
                    "isBlocked": time_used >= await get_app_daily_limit(app_id),
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Monitored app not found")
        
        return {"success": True, "timeUsed": time_used}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update app usage: {e}")
        raise HTTPException(status_code=500, detail="Failed to update app usage")

@api_router.delete("/apps/monitored/{app_id}")
async def remove_monitored_app(app_id: str):
    """Remove app from monitoring"""
    try:
        result = await db.monitored_apps.update_one(
            {"id": app_id},
            {"$set": {"isActive": False, "updatedAt": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Monitored app not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove monitored app: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove monitored app")

async def get_app_daily_limit(app_id: str) -> int:
    """Helper function to get app's daily limit"""
    app = await db.monitored_apps.find_one({"id": app_id})
    return app.get("dailyLimit", 60) if app else 60

@api_router.post("/usage/session", response_model=UsageSession)
async def log_usage_session(session: UsageSession):
    """Log a usage session with enhanced tracking"""
    try:
        # Update monitored app usage if this is for a monitored app
        monitored_app = await db.monitored_apps.find_one({
            "packageName": session.packageName,
            "userId": session.userId,
            "isActive": True
        })
        
        if monitored_app:
            current_usage = monitored_app.get("timeUsed", 0)
            new_usage = current_usage + session.duration
            
            await db.monitored_apps.update_one(
                {"packageName": session.packageName, "userId": session.userId},
                {
                    "$set": {
                        "timeUsed": new_usage,
                        "isBlocked": new_usage >= monitored_app.get("dailyLimit", 60),
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
        
        # Store the usage session
        await db.usage_sessions.insert_one(session.dict())
        return session
    except Exception as e:
        logger.error(f"Failed to log usage session: {e}")
        raise HTTPException(status_code=500, detail="Failed to log usage session")

@api_router.get("/usage/apps/{package_name}/daily")
async def get_daily_app_usage(package_name: str, user_id: str = "default"):
    """Get daily usage for a specific app"""
    try:
        from datetime import timedelta
        today = datetime.utcnow().date()
        start_date = datetime.combine(today, datetime.min.time())
        end_date = start_date + timedelta(days=1)
        
        sessions = await db.usage_sessions.find({
            "packageName": package_name,
            "userId": user_id,
            "timestamp": {"$gte": start_date, "$lt": end_date}
        }).to_list(1000)
        
        total_usage = sum(session.get("duration", 0) for session in sessions)
        
        return {
            "packageName": package_name,
            "totalUsage": total_usage,
            "sessionCount": len(sessions),
            "date": today.isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get daily app usage: {e}")
        raise HTTPException(status_code=500, detail="Failed to get daily app usage")

@api_router.get("/usage/realtime")
async def get_realtime_usage(user_id: str = "default"):
    """Get real-time usage data for all monitored apps"""
    try:
        monitored_apps = await db.monitored_apps.find({
            "userId": user_id,
            "isActive": True
        }).to_list(100)
        
        usage_data = []
        for app in monitored_apps:
            # Get today's usage from sessions
            from datetime import timedelta
            today = datetime.utcnow().date()
            start_date = datetime.combine(today, datetime.min.time())
            end_date = start_date + timedelta(days=1)
            
            sessions = await db.usage_sessions.find({
                "packageName": app["packageName"],
                "userId": user_id,
                "timestamp": {"$gte": start_date, "$lt": end_date}
            }).to_list(1000)
            
            daily_usage = sum(session.get("duration", 0) for session in sessions)
            
            usage_data.append({
                "id": app["id"],
                "packageName": app["packageName"],
                "appName": app["appName"],
                "dailyLimit": app["dailyLimit"],
                "timeUsed": daily_usage,
                "isBlocked": daily_usage >= app["dailyLimit"],
                "percentage": min((daily_usage / app["dailyLimit"]) * 100, 100)
            })
        
        return usage_data
    except Exception as e:
        logger.error(f"Failed to get realtime usage: {e}")
        raise HTTPException(status_code=500, detail="Failed to get realtime usage")

@api_router.get("/usage/sessions")
async def get_usage_sessions(days: int = 30):
    """Get usage sessions for analytics"""
    try:
        # Get sessions from last N days
        from datetime import timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        sessions = await db.usage_sessions.find({
            "timestamp": {"$gte": start_date}
        }).to_list(1000)
        
        # Convert ObjectId to string for JSON serialization
        for session in sessions:
            if "_id" in session:
                session["_id"] = str(session["_id"])
        
        return sessions
    except Exception as e:
        logger.error(f"Failed to get usage sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get usage sessions")

@api_router.get("/analytics", response_model=Analytics)
async def get_analytics():
    """Get usage analytics"""
    try:
        # Get challenges from last 30 days
        from datetime import timedelta
        start_date = datetime.utcnow() - timedelta(days=30)
        
        challenges = await db.challenges.find({}).to_list(1000)
        
        usage_sessions = await db.usage_sessions.find({
            "timestamp": {"$gte": start_date}
        }).to_list(1000)
        
        # Calculate analytics
        total_time_used = sum(session.get("duration", 0) for session in usage_sessions)
        challenges_completed = len([c for c in challenges if c.get("completed", False)])
        time_earned = sum(c.get("timeReward", 0) for c in challenges if c.get("correct", False))
        
        # Calculate most used app
        app_usage = {}
        for session in usage_sessions:
            app_name = session.get("appName", "Unknown")
            app_usage[app_name] = app_usage.get(app_name, 0) + session.get("duration", 0)
        
        most_used_app = max(app_usage.keys(), key=app_usage.get) if app_usage else "None"
        
        return Analytics(
            totalTimeUsed=total_time_used,
            averageDaily=total_time_used / 30,
            mostUsedApp=most_used_app,
            streakDays=7,  # TODO: Calculate actual streak
            challengesCompleted=challenges_completed,
            timeEarned=time_earned
        )
    except Exception as e:
        logger.error(f"Failed to get analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analytics")

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "ai_enabled": bool(llm_api_key)
    }

@api_router.get("/apps/search")
async def search_apps(query: Optional[str] = None, category: Optional[str] = None, limit: int = 50):
    """Search and filter apps in registry"""
    try:
        # Build search query
        search_filter = {}
        
        if query:
            search_filter["$or"] = [
                {"appName": {"$regex": query, "$options": "i"}},
                {"displayName": {"$regex": query, "$options": "i"}},
                {"packageName": {"$regex": query, "$options": "i"}}
            ]
        
        if category:
            search_filter["category"] = category
        
        apps = await db.app_registry.find(search_filter).limit(limit).to_list(limit)
        
        # Convert ObjectId to string for JSON serialization
        for app in apps:
            if "_id" in app:
                app["_id"] = str(app["_id"])
        
        return {
            "apps": apps,
            "count": len(apps),
            "query": query,
            "category": category
        }
    except Exception as e:
        logger.error(f"Failed to search apps: {e}")
        raise HTTPException(status_code=500, detail="Failed to search apps")

@api_router.get("/apps/categories")
async def get_app_categories():
    """Get all available app categories"""
    try:
        # Get unique categories from registry
        categories = await db.app_registry.distinct("category")
        
        # Count apps per category
        category_counts = []
        for category in categories:
            count = await db.app_registry.count_documents({"category": category})
            category_counts.append({
                "name": category,
                "count": count,
                "displayName": category.replace("_", " ").title()
            })
        
        return sorted(category_counts, key=lambda x: x["count"], reverse=True)
    except Exception as e:
        logger.error(f"Failed to get app categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to get app categories")

@api_router.post("/apps/bulk-register")
async def bulk_register_apps(apps: List[AppInfo]):
    """Bulk register apps from device scan"""
    try:
        registered_count = 0
        updated_count = 0
        
        for app_info in apps:
            existing_app = await db.app_registry.find_one({"packageName": app_info.packageName})
            
            if existing_app:
                # Update existing app
                await db.app_registry.update_one(
                    {"packageName": app_info.packageName},
                    {"$set": app_info.dict()}
                )
                updated_count += 1
            else:
                # Insert new app
                await db.app_registry.insert_one(app_info.dict())
                registered_count += 1
        
        return {
            "success": True,
            "registered": registered_count,
            "updated": updated_count,
            "total": len(apps)
        }
    except Exception as e:
        logger.error(f"Failed to bulk register apps: {e}")
        raise HTTPException(status_code=500, detail="Failed to bulk register apps")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)