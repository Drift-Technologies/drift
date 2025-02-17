#!/usr/bin/env python3
"""
Translink Data Fetcher

This script defines a TranslinkDataFetcher class that fetches GTFS realtime and position data
from Translink's API and saves them as Parquet files with timestamps in the filenames.
"""

import os
from datetime import datetime
from pathlib import Path
import sys
import boto3

import pandas as pd
import requests
from google.transit import gtfs_realtime_pb2
from google.cloud import secretmanager



AWS_S3_BUCKET = "translinkdata"


class CloudService:
    def __init__(self, cloud_provider: str):
        self.cloud_provider = cloud_provider

    def get_parameter(self, name):
        if self.cloud_provider == 'aws':
            ssm = boto3.client('ssm')
            response = ssm.get_parameter(
                Name=name,
                WithDecryption=True
            )
            return response['Parameter']['Value']

        elif self.cloud_provider == 'local':
            return os.getenv(name)

        elif self.cloud_provider == 'gcp': 
            client = secretmanager.SecretManagerServiceClient()
            # Access the secret version
            response = client.access_secret_version(name=name)
            # Return the secret payload
            return response.payload.data.decode('UTF-8')
        else:
            raise ValueError(f"Unsupported cloud provider: {self.cloud_provider}")

class TranslinkDataFetcher:
    def __init__(self, output_dir: str = "/tmp"):
        """
        Initialize the TranslinkDataFetcher.

        Args:
            env_path (str): Path to the .env file containing environment variables.
            output_dir (str): Directory where Parquet files will be saved.
        """
        self.api_key = self._get_parameter('/translink/api-key')
        self.position_url = (
            f"https://gtfsapi.translink.ca/v3/gtfsposition?apikey={self.api_key}"
        )
        self.realtime_url = (
            f"https://gtfsapi.translink.ca/v3/gtfsrealtime?apikey={self.api_key}"
        )
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)


    def load_environment(self, env_path: str):
        """
        Load environment variables from a .env file.

        Args:
            env_path (str): Path to the .env file.
        """
        load_dotenv(env_path)
        if not os.getenv("TRANSLINK_KEY"):
            sys.exit(1)

    def fetch_gtfs_data(self, url: str) -> bytes:
        """
        Fetch GTFS data from the given URL.

        Args:
            url (str): The API endpoint to fetch data from.

        Returns:
            bytes: The raw response content if successful, else None.
        """
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.content
        except requests.RequestException:
            return None

    def parse_gtfs_realtime_data(self, response: bytes) -> pd.DataFrame:
        """
        Parse GTFS realtime data from the response.

        Args:
            response (bytes): The raw GTFS realtime data.

        Returns:
            pd.DataFrame: A DataFrame containing parsed realtime data.
        """
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(response)

        rows = []
        for entity in feed.entity:
            if not entity.HasField("trip_update"):
                continue  # Skip if there's no trip_update

            trip_update = entity.trip_update
            trip = trip_update.trip
            vehicle = trip_update.vehicle

            base_row = {
                "id": entity.id,
                "is_deleted": entity.is_deleted,
                "trip_id": trip.trip_id,
                "start_date": trip.start_date,
                "schedule_relationship": trip.schedule_relationship,
                "route_id": trip.route_id,
                "direction_id": trip.direction_id,
                "vehicle_id": vehicle.id if vehicle.HasField("id") else None,
                "vehicle_label": vehicle.label if vehicle.HasField("label") else None,
                "current_datetime": datetime.utcnow(),  # Use UTC for consistency
            }

            for stop_time_update in trip_update.stop_time_update:
                row = base_row.copy()
                row.update(
                    {
                        "stop_sequence": stop_time_update.stop_sequence,
                        "stop_id": stop_time_update.stop_id,
                        "arrival_delay": (
                            stop_time_update.arrival.delay
                            if stop_time_update.HasField("arrival")
                            else None
                        ),
                        "arrival_time": (
                            stop_time_update.arrival.time
                            if stop_time_update.HasField("arrival")
                            else None
                        ),
                        "departure_delay": (
                            stop_time_update.departure.delay
                            if stop_time_update.HasField("departure")
                            else None
                        ),
                        "departure_time": (
                            stop_time_update.departure.time
                            if stop_time_update.HasField("departure")
                            else None
                        ),
                        "stop_schedule_relationship": stop_time_update.schedule_relationship,
                    }
                )
                rows.append(row)

        if rows:
            return pd.DataFrame(rows)
        else:
            return pd.DataFrame()

    def parse_gtfs_position_data(self, response: bytes) -> pd.DataFrame:
        """
        Parse GTFS position data from the response.

        Args:
            response (bytes): The raw GTFS position data.

        Returns:
            pd.DataFrame: A DataFrame containing parsed position data.
        """
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(response)

        rows = []
        for entity in feed.entity:
            if not entity.HasField("vehicle"):
                continue  # Skip if there's no vehicle information

            vehicle = entity.vehicle
            trip = vehicle.trip
            position = vehicle.position

            row = {
                "id": entity.id,
                "trip_id": trip.trip_id,
                "start_date": trip.start_date,
                "schedule_relationship": trip.schedule_relationship,
                "route_id": trip.route_id,
                "direction_id": trip.direction_id,
                "vehicle_id": (
                    vehicle.vehicle.id if vehicle.vehicle.HasField("id") else None
                ),
                "vehicle_label": (
                    vehicle.vehicle.label if vehicle.vehicle.HasField("label") else None
                ),
                "latitude": (
                    position.latitude if position.HasField("latitude") else None
                ),
                "longitude": (
                    position.longitude if position.HasField("longitude") else None
                ),
                "current_stop_sequence": (
                    vehicle.current_stop_sequence
                    if vehicle.HasField("current_stop_sequence")
                    else None
                ),
                "current_status": (
                    vehicle.current_status
                    if vehicle.HasField("current_status")
                    else None
                ),
                "timestamp": (
                    vehicle.timestamp if vehicle.HasField("timestamp") else None
                ),
                "stop_id": vehicle.stop_id if vehicle.HasField("stop_id") else None,
                "current_datetime": datetime.utcnow(),  # Use UTC for consistency
            }
            rows.append(row)

        if rows:
            return pd.DataFrame(rows)
        else:
            return pd.DataFrame()

    def write_to_redis():
        return 

    def run(self):
        """
        Execute the data fetching and saving process.
        """
        realtime_data_raw = self.fetch_gtfs_data(self.realtime_url)
        position_data_raw = self.fetch_gtfs_data(self.position_url)

        if not realtime_data_raw or not position_data_raw:
            sys.exit(1)

        realtime_df = self.parse_gtfs_realtime_data(realtime_data_raw)
        position_df = self.parse_gtfs_position_data(position_data_raw)

        self.write_to_redis(position_df, "position")
        self.write_to_redis(realtime_df, "realtime")


if __name__ == "__main__":
    fetcher = TranslinkDataFetcher()
    fetcher.run()