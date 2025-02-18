from fastapi import APIRouter
from app.api.v1.endpoints.trips import ride_detection, nearest_routes, bus_positions

router = APIRouter()

router.include_router(ride_detection.router, prefix="/trips/ride_detection")
router.include_router(nearest_routes.router, prefix="/trips/nearest_routes")
router.include_router(bus_positions.router, prefix="/trips/bus_positions")
