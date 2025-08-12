from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import opencv_cards
from game_manager import get_game_manager, GameManager
from poker_game import PlayerAction


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Load OpenCV training images on startup
train_ranks = None
train_suits = None

@app.on_event("startup")
async def load_training_images():
    """Load OpenCV card training images on startup"""
    global train_ranks, train_suits
    try:
        cards_path = "/app/backend/Card_Imgs/"
        if os.path.exists(cards_path):
            train_ranks = opencv_cards.load_ranks(cards_path)
            train_suits = opencv_cards.load_suits(cards_path)
            logger.info("✅ OpenCV training images loaded successfully")
        else:
            logger.error("❌ Card_Imgs directory not found")
    except Exception as e:
        logger.error(f"❌ Failed to load training images: {e}")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# OpenCV Card Detection Models
class CardScanRequest(BaseModel):
    frame_data: str

class DetectedCard(BaseModel):
    rank: str
    suit: str
    name: str
    color: str
    confidence: float
    center: List[int]
    debug: dict

class CardScanResponse(BaseModel):
    cards: List[DetectedCard]
    processing_time_ms: float
    frame_processed: bool

# Poker Game Models
class CreateGameRequest(BaseModel):
    small_blind: int = 10
    big_blind: int = 20

class JoinGameRequest(BaseModel):
    game_id: str
    player_name: str
    chips: int = 1000

class PlayerActionRequest(BaseModel):
    action: str  # fold, check, call, raise, all_in
    raise_amount: int = 0

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Poker Game Endpoints
@api_router.post("/poker/create-game")
async def create_poker_game(request: CreateGameRequest):
    """Create a new poker game"""
    manager = get_game_manager()
    game_id = manager.create_game(request.small_blind, request.big_blind)
    return {"game_id": game_id, "message": "Game created successfully"}

@api_router.post("/poker/join-game")
async def join_poker_game(request: JoinGameRequest):
    """Join a poker game"""
    manager = get_game_manager()
    player_id = manager.join_game(request.game_id, request.player_name, request.chips)
    
    if player_id:
        return {"player_id": player_id, "message": "Joined game successfully"}
    else:
        raise HTTPException(status_code=400, detail="Could not join game (game full or not found)")

@api_router.post("/poker/leave-game/{player_id}")
async def leave_poker_game(player_id: str):
    """Leave current poker game"""
    manager = get_game_manager()
    success = manager.leave_game(player_id)
    
    if success:
        return {"message": "Left game successfully"}
    else:
        raise HTTPException(status_code=404, detail="Player not found in any game")

@api_router.post("/poker/start-game/{game_id}")
async def start_poker_game(game_id: str):
    """Start a poker game"""
    manager = get_game_manager()
    success = manager.start_game(game_id)
    
    if success:
        return {"message": "Game started successfully"}
    else:
        raise HTTPException(status_code=400, detail="Cannot start game (need at least 2 players)")

@api_router.post("/poker/action/{player_id}")
async def make_poker_action(player_id: str, request: PlayerActionRequest):
    """Make a poker action (fold, check, call, raise, all_in)"""
    manager = get_game_manager()
    success = manager.make_action(player_id, request.action, request.raise_amount)
    
    if success:
        return {"message": "Action completed successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid action or not your turn")

@api_router.get("/poker/game-state/{player_id}")
async def get_poker_game_state(player_id: str):
    """Get current game state for a player"""
    manager = get_game_manager()
    game_state = manager.get_game_state(player_id)
    
    if game_state:
        return game_state
    else:
        raise HTTPException(status_code=404, detail="Player not found in any game")

@api_router.get("/poker/games")
async def list_poker_games():
    """List all active poker games"""
    manager = get_game_manager()
    return {"games": manager.list_games()}

@api_router.post("/scan-cards", response_model=CardScanResponse)
async def scan_cards(request: CardScanRequest):
    """OpenCV-based card detection endpoint"""
    global train_ranks, train_suits
    
    if not train_ranks or not train_suits:
        raise HTTPException(status_code=503, detail="Card training images not loaded")
    
    try:
        import time
        start_time = time.time()
        
        # Detect cards using OpenCV
        detected_cards = opencv_cards.detect_cards_from_frame(
            request.frame_data, 
            train_ranks, 
            train_suits
        )
        
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Convert to response format
        card_responses = []
        for card in detected_cards:
            card_responses.append(DetectedCard(**card))
        
        return CardScanResponse(
            cards=card_responses,
            processing_time_ms=round(processing_time, 2),
            frame_processed=True
        )
        
    except Exception as e:
        logger.error(f"Card detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Card detection failed: {str(e)}")

@api_router.get("/scanner/health")
async def scanner_health():
    """Check if card scanner is ready"""
    global train_ranks, train_suits
    
    status = {
        "scanner_ready": train_ranks is not None and train_suits is not None,
        "training_images_loaded": {
            "ranks": len(train_ranks) if train_ranks else 0,
            "suits": len(train_suits) if train_suits else 0
        }
    }
    
    return status

@api_router.get("/health-check")
async def api_health_check():
    """Simple health check for frontend connectivity"""
    return {
        "status": "ok",
        "message": "Backend API is working",
        "timestamp": datetime.utcnow().isoformat()
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
