from apscheduler.schedulers.asyncio import AsyncIOScheduler
from translink.get_position import get_position
from translink.get_realtime import get_realtime
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def start_scheduler():
    scheduler = AsyncIOScheduler()
    
    # Schedule your fetch jobs
    scheduler.add_job(get_position, 'interval', 
                     seconds=30,
                     id='fetch_position',
                     name='Fetch bus positions')
    
    scheduler.add_job(get_realtime, 'interval', 
                     seconds=60,
                     id='fetch_realtime',
                     name='Fetch realtime data')
    
    scheduler.start()
    logger.info("Scheduler started")
    
    try:
        # Keep the scheduler running
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        logger.info("Scheduler shutdown")

if __name__ == "__main__":
    asyncio.run(start_scheduler())