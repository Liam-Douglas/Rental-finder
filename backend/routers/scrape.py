from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import ScrapeLogOut

router = APIRouter(prefix="/api/scrape", tags=["scrape"])

_running: dict[str, bool] = {}


async def _run_scraper(source: str, db: Session):
    from scrapers.domain import DomainScraper
    from scrapers.realestate import RealEstateScraper
    from scrapers.allhomes import AllhomesScraper

    scraper_map = {
        "domain": DomainScraper,
        "rea": RealEstateScraper,
        "allhomes": AllhomesScraper,
    }
    cls = scraper_map.get(source)
    if cls:
        scraper = cls(db)
        await scraper.run()
    _running[source] = False


@router.post("/{source}")
async def trigger_scrape(
    source: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    valid = {"domain", "rea", "allhomes", "all"}
    if source not in valid:
        raise HTTPException(status_code=422, detail=f"source must be one of {valid}")

    if source == "all":
        sources = ["domain", "rea", "allhomes"]
    else:
        sources = [source]

    triggered = []
    for src in sources:
        if not _running.get(src):
            _running[src] = True
            background_tasks.add_task(_run_scraper, src, db)
            triggered.append(src)

    return {"triggered": triggered, "already_running": [s for s in sources if s not in triggered]}


@router.get("/status")
def scrape_status():
    return {src: running for src, running in _running.items()}
