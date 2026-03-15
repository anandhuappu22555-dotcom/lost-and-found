from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import math
import os
from masking import detect_and_mask

app = FastAPI()

class Item(BaseModel):
    category: str
    color: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: Optional[str] = None

class FoundItem(BaseModel):
    id: int
    category: str
    lat: float
    lng: float
    description: Optional[str] = None

class MatchRequest(BaseModel):
    lost_item: Item
    candidates: List[FoundItem]

@app.get("/")
def read_root():
    return {"message": "AI Service Running"}

@app.post("/mask")
async def mask_image(image_path: str = Body(..., embed=True)):
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Path logic: uploads\originals\file.jpg -> uploads\masked\file.jpg
    masked_path = image_path.replace("originals", "masked")
    os.makedirs(os.path.dirname(masked_path), exist_ok=True)
    
    try:
        regions = detect_and_mask(image_path, masked_path)
        return {
            "masked_path": masked_path,
            "regions_count": len(regions),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_distance(lat1, lng1, lat2, lng2):
    return math.sqrt((lat1-lat2)**2 + (lng1-lng2)**2)

@app.post("/match")
def match_items(request: MatchRequest):
    lost = request.lost_item
    matches = []
    
    for found in request.candidates:
        score = 0
        if lost.category.lower() == found.category.lower():
            score += 30
            
        if lost.lat and found.lat:
            dist = calculate_distance(lost.lat, lost.lng, found.lat, found.lng)
            if dist < 0.1: # Roughly 10km
                score += 20
        
        if score > 0:
            matches.append({"found_item_id": found.id, "score": score})
            
    matches.sort(key=lambda x: x["score"], reverse=True)
    return {"matches": matches}
