"""APScheduler setup for periodic scraping."""
import os
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler()


async def scheduled_scrape():
    from database import SessionLocal
    from scrapers.domain import DomainScraper
    from scrapers.realestate import RealEstateScraper
    from scrapers.allhomes import AllhomesScraper

    db = SessionLocal()
    try:
        for ScraperCls in [DomainScraper, RealEstateScraper, AllhomesScraper]:
            scraper = ScraperCls(db)
            await scraper.run()
    finally:
        db.close()


def start_scheduler():
    interval_minutes = int(os.getenv("SCRAPE_INTERVAL_MINUTES", "60"))
    scheduler.add_job(
        scheduled_scrape,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id="scrape_all",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
