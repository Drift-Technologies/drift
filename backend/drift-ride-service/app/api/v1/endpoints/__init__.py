from fastapi import APIRouter
from app.api.v1.endpoints import trip_detection, trips

router = APIRouter()

router.include_router(trip_detection.router, prefix = "/trip-detection")