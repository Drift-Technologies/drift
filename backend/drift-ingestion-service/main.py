from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.translink.get_position import get_position
from app.translink.get_realtime import get_realtime
import asyncio
import redis

def check_redis_connection():
    try:
        redis_client = redis.Redis(
            host="redis",
            port=6379
        )
        redis_client.ping()
    except redis.ConnectionError as e:
        raise e

async def start_scheduler():

    check_redis_connection()

    scheduler = AsyncIOScheduler()
    
    # Schedule your fetch jobs
    scheduler.add_job(get_position, 'interval', 
                     seconds=60,
                     id='fetch_position',
                     name='Fetch bus positions')
    
    # scheduler.add_job(get_realtime, 'interval', 
    #                  seconds=60,
    #                  id='fetch_realtime',
    #                  name='Fetch realtime data')
    
    scheduler.start()
    
    try:
        # Keep the scheduler running
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt):
        scheduler.shutdown()

if __name__ == "__main__":
    asyncio.run(start_scheduler())