from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis
import json
from datetime import datetime
import h3

from app.models.client_position import ClientPosition
from app.core.auth import verify_websocket_api_key, WebSocketAuthError

router = APIRouter()

def get_redis_client():
    return redis.Redis(
        host="redis",
        port=6379,
        decode_responses=True
    )

@router.websocket("")
async def bus_positions_websocket(websocket: WebSocket):

    print("Bus positions WebSocket connection attempt received")

    # headers = dict(websocket.headers)
    # api_key = headers.get("x-api-key")
    # print(f"Received headers: {headers}")
    # print(f"Extracted API key: {api_key}")
    # print(f"Expected API key: {API_KEY}") 

    
    # if not await verify_websocket_api_key(api_key):
    #     await websocket.close(code=4003, reason="Invalid API key")
    #     return 

    await websocket.accept()

    print("WebSocket connection accepted")

    redis_client = get_redis_client()
    stream_key = "translink:position:stream"

    try:
        # Get and validate client data
        raw_data = await websocket.receive_json()
        try:
            client_data = ClientPosition(**raw_data)
            client_h3 = client_data.to_h3()

        except ValueError as e:
            await websocket.close(code=1003, reason=str(e))
            return
        

        last_messages = redis_client.xrevrange(stream_key, count=1)
        if last_messages:
            message_id, message_data = last_messages[0]
            positions = json.loads(message_data['data'])
            
            # H3_7 with 4 k_ring is roughly 5km radius
            neighbor_indexes = h3.k_ring(client_h3, 4)
            filtered_positions = [
                pos for pos in positions 
                if pos.get('h3_7') in neighbor_indexes
            ]
            
            if filtered_positions:
                await websocket.send_json({
                    "timestamp": message_data['timestamp'],
                    "data": filtered_positions
                })
        latest_id = '$'
        
        while True:
            messages = redis_client.xread(
                {stream_key: latest_id},
                count=100,
                block=60_000
            )
            
            if messages:
                stream_name, stream_messages = messages[0]
                
                for message_id, message_data in stream_messages:
                    latest_id = message_id
                    positions = json.loads(message_data['data'])
                    
                    # H3_7 with 4 k_ring is roughly 5km radius
                    neighbor_indexes = h3.k_ring(client_h3, 4)
                    filtered_positions = [
                        pos for pos in positions 
                        if pos.get('h3_7') in neighbor_indexes
                    ]
                    
                    if filtered_positions:
                        await websocket.send_json({
                            "timestamp": message_data['timestamp'],
                            "data": filtered_positions
                        })
                
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in websocket: {str(e)}")
    finally:
        await websocket.close()
