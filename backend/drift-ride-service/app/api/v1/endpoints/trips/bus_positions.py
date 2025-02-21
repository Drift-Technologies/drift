
"""
TODO
- Remove all the debug logs and clean up error handeling

"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis
import json
from datetime import datetime
import h3
import asyncio

from app.models.client_position import ClientPosition
from app.core.auth import verify_websocket_api_key, WebSocketAuthError

import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


router = APIRouter()

def get_redis_client():
    return redis.Redis(
        host="redis",
        port=6379,
        decode_responses=True
    )

@router.websocket("")
async def bus_positions_websocket(websocket: WebSocket):
    logger.info("Bus positions WebSocket connection attempt received")

    try:
        # Verify API key before accepting the connection
        await verify_websocket_api_key(websocket)
        await websocket.accept()
        logger.info("WebSocket connection authenticated and accepted")
    except WebSocketAuthError as e:
        logger.error(f"Authentication failed: {str(e)}")
        await websocket.close(code=4001, reason="Authentication failed")
        return
    except Exception as e:
        logger.error(f"Error during authentication: {str(e)}")
        await websocket.close(code=1008, reason="Server error during authentication")
        return

    redis_client = get_redis_client()
    stream_key = "translink:position:stream"
    logger.info(f"Connected to Redis, using stream key: {stream_key}")

    try:
        # Debug: Check if Redis is accessible and has data
        keys = redis_client.keys('*')
        logger.info(f"Found {len(keys)} Redis keys")
        
        # Check if our stream exists
        stream_exists = redis_client.exists(stream_key)
        logger.info(f"Stream {stream_key} exists: {stream_exists}")
        
        # Get stream info if it exists
        if stream_exists:
            stream_info = redis_client.xinfo_stream(stream_key)
            logger.info(f"Stream info: {len(stream_info)}")  # Log full stream info for debugging
            
            # Check last entries directly
            last_entries = redis_client.xrevrange(stream_key, count=1)
            logger.info(f"Last entry direct check: {len(last_entries)}")

    except Exception as e:
        logger.error(f"Redis debug check failed: {str(e)}", exc_info=True)

    try:
        # Get and validate client data
        logger.info("Waiting for initial client position data...")
        try:
            raw_data = await websocket.receive_json()
            logger.info(f"Successfully received JSON data: {raw_data}")
        except Exception as e:
            logger.error(f"Failed to receive JSON data: {str(e)}", exc_info=True)
            await websocket.close(code=1003, reason="Failed to receive valid JSON data")
            return
        
        try:
            client_data = ClientPosition(**raw_data)
            client_h3 = client_data.to_h3()
            logger.info(f"Successfully validated client position. H3 index: {client_h3}")

        except Exception as e:
            logger.error(f"Failed to process client data: {str(e)}", exc_info=True)
            await websocket.close(code=1003, reason=str(e))
            return  # Exit early on validation failure

        # Debug: Check last messages with more detail
        logger.info("Attempting to fetch initial messages from Redis...")
        last_messages = redis_client.xrevrange(stream_key, count=1)
        logger.info(f"Fetched initial messages from Redis: {len(last_messages)}")

        if not last_messages:
            logger.warning("No messages found in Redis stream!")
        
        if last_messages:
            message_id, message_data = last_messages[0]
            logger.debug(f"Processing message ID: {message_id}")
            # Only log message metadata, not the full data
            logger.debug(f"Message timestamp: {message_data.get('timestamp')}")
            
            try:
                positions = json.loads(message_data['data'])
                logger.debug(f"Number of positions in message: {len(positions)}")
                # Log just the first position as a sample, with limited fields
                if positions:
                    sample = positions[0]
                    logger.debug(f"Sample position - Vehicle: {sample.get('vehicle_label')}, "
                               f"Route: {sample.get('route_id')}")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse positions JSON: {str(e)}")
                raise e

            # H3_7 with 4 k_ring is roughly 5km radius
            neighbor_indexes = h3.k_ring(client_h3, 4)
            logger.debug(f"Generated neighbor H3 indexes: {len(neighbor_indexes)} cells")
            
            filtered_positions = [
                pos for pos in positions 
                if pos.get('h3_7') in neighbor_indexes
            ]
            logger.info(f"Filtered positions count: {len(filtered_positions)}")
            
            if filtered_positions:
                await websocket.send_json({
                    "timestamp": message_data['timestamp'],
                    "data": filtered_positions
                })
                logger.debug("Sent filtered positions to client")

        latest_id = '$'
        logger.info("Starting continuous message monitoring")
        connection_active = True
        
        while connection_active:
            try:
                logger.debug(f"Waiting for new messages after ID: {latest_id}")
                messages = redis_client.xread(
                    {stream_key: latest_id},
                    count=100,
                    block=2000  # 2 second timeout
                )
                
                if messages and connection_active:
                    stream_name, stream_messages = messages[0]
                    logger.debug(f"Received {len(stream_messages)} new messages")
                    
                    for message_id, message_data in stream_messages:
                        if not connection_active:
                            break
                            
                        latest_id = message_id
                        try:
                            positions = json.loads(message_data['data'])
                            logger.debug(f"Processing message {message_id} - Contains {len(positions)} positions")
                            
                            neighbor_indexes = h3.k_ring(client_h3, 4)
                            filtered_positions = [
                                pos for pos in positions 
                                if pos.get('h3_7') in neighbor_indexes
                            ]
                            
                            if filtered_positions:
                                logger.info(f"Sending {len(filtered_positions)} positions to client")
                                try:
                                    await websocket.send_json({
                                        "timestamp": message_data['timestamp'],
                                        "data": filtered_positions
                                    })
                                except RuntimeError as e:
                                    if "close message has been sent" in str(e):
                                        logger.info("WebSocket connection was closed, stopping message processing")
                                        connection_active = False
                                        break
                                    raise
                        except Exception as e:
                            logger.error(f"Error processing message: {str(e)}")
                            continue
                            
                else:
                    await asyncio.sleep(0.1)  # Small sleep to prevent tight loop
                    
            except WebSocketDisconnect:
                logger.info("Client disconnected")
                connection_active = False
                break
            except redis.RedisError as e:
                logger.error(f"Redis error: {str(e)}")
                if connection_active:
                    await asyncio.sleep(1)  # Back off on Redis errors
                continue
            except Exception as e:
                logger.error(f"Error processing messages: {str(e)}", exc_info=True)
                if connection_active:
                    await asyncio.sleep(1)
                continue
                
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"Error in websocket: {str(e)}", exc_info=True)
    finally:
        logger.info("Closing WebSocket connection")
        try:
            if not websocket.client_state.DISCONNECTED:
                await websocket.close()
        except Exception as e:
            logger.error(f"Error closing WebSocket: {str(e)}", exc_info=True)
