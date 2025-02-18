#!/usr/bin/env python3
"""
Translink Position Data Fetcher

This script defines a TranslinkPositionFetcher class that fetches GTFS position data
from Translink's API and writes it to Redis.
"""

from pathlib import Path
import sys
import requests
import json
import pandas as pd
from datetime import datetime

from utils.secrets import SecretsManager
from utils.parser import parse_gtfs_position_data
from utils.redis_client import drift_redis_client, store_with_history

class TranslinkPositionFetcher:
    def __init__(self, output_dir: str = "/tmp"):
        # Use SecretsManager to get the API key; adjust the cloud provider as needed
        self.api_key = SecretsManager(cloud_provider='local').get_parameter('/translink/api-key')
        self.position_url = f"https://gtfsapi.translink.ca/v3/gtfsposition?apikey={self.api_key}"
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def fetch_gtfs_data(self, url: str) -> bytes:
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.content
        except requests.RequestException:
            return None

    def write_to_redis(self, df: pd.DataFrame, tag: str):
        client = drift_redis_client()
        key = f"translink:{tag}"
        
        # Convert DataFrame to JSON
        data_json = df.to_json(orient="records")
        # Store with history
        store_with_history(client, key, data_json)

    def run(self):
        position_data_raw = self.fetch_gtfs_data(self.position_url)
        if not position_data_raw:
            sys.exit(1)
        position_df = parse_gtfs_position_data(position_data_raw)
        self.write_to_redis(position_df, "position")

async def get_position():
    """Async wrapper for position fetcher"""
    fetcher = TranslinkPositionFetcher()
    fetcher.run()

if __name__ == "__main__":
    fetcher = TranslinkPositionFetcher()
    fetcher.run()
