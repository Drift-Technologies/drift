from fastapi import FastAPI
from app.api.v1.endpoints import router as api_v1_router

app = FastAPI(title="DriftBus API")

app.include_router(api_v1_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to DriftBus API"} 

@app.get("/trips")
async def get_trips():
    return {"message": "Trips retrieved successfully"}

@app.get("/trip-detection")
async def get_trip_detection():
    return {"message": "Trip detection retrieved successfully"}

@app.get("/payment-status")
async def get_payment_status():
    return {"message": "Payment status retrieved successfully"}
