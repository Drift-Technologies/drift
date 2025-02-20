from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import h3

class ClientPosition(BaseModel):
    # api_key: str = Field(..., description="API key for authentication")
    latitude: float = Field(..., ge=-90, le=90, description="Client latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Client longitude")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Client timestamp")

    def to_h3(self, resolution: int = 7) -> str:
        """Convert latitude and longitude to H3 index"""
        return h3.geo_to_h3(self.latitude, self.longitude, resolution)