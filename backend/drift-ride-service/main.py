# FastAPI and related imports
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    Header,
    HTTPException,
    Depends,
    Request
)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# API
from app.api.v1.endpoints import router as api_v1_router

# Data processing
import pandas as pd
import numpy as np

# Python standard library
import asyncio
import os
import json
import math
from datetime import datetime, timedelta
from typing import Union

# Local imports
from pydantic import BaseModel

# Server
import uvicorn

# Environment variables
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variable with a default value for development
API_KEY = environ.get('API_KEY')

if not API_KEY:
    raise ValueError("API_KEY environment variable is not set")

app = FastAPI(
    title = "DriftBus Backend",
    version = "1.0.0"


)

app.include_router(api_v1_router, prefix="/api/v1")



limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount the static directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
