from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis
import json
from datetime import datetime

router = APIRouter()

def get_redis_client():
    return redis.Redis(
        host="redis",
        port=6379,
        decode_responses=True
    )

@router.websocket("/bus_positions")
async def bus_positions_websocket(websocket: WebSocket):
    await websocket.accept()
    redis_client = get_redis_client()
    stream_key = "translink:position:stream"
    
    try:
        # Get the latest ID (or use '$' for only new messages)
        latest_id = '$'  # Changed from '0' to '$' to only get new messages
        
        while True:
            # Read new messages from the stream
            messages = redis_client.xread(
                {stream_key: latest_id},
                count=100,  # Increased count to handle potential backlog
                block=60_000  # Block for 5 seconds if no new messages
            )
            
            if messages:
                stream_name, stream_messages = messages[0]
                
                # Process all received messages
                for message_id, message_data in stream_messages:
                    latest_id = message_id  # Update latest_id for next iteration
                    positions = json.loads(message_data['data'])
                    
                    # Send to websocket with timestamp
                    await websocket.send_json({
                        "timestamp": message_data['timestamp'],
                        "data": positions
                    })
                
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in websocket: {str(e)}")
    finally:
        await websocket.close()
