from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Listing, UserAction, ScrapeLog
from schemas import StatsOut, ScrapeLogOut

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/", response_model=StatsOut)
def get_stats(
    last_visit: datetime = Query(default=None),
    db: Session = Depends(get_db),
):
    total = db.query(func.count(Listing.id)).filter(Listing.is_active == True).scalar() or 0
    liked = (
        db.query(func.count(UserAction.id))
        .filter(UserAction.status == "liked")
        .scalar() or 0
    )
    disliked = (
        db.query(func.count(UserAction.id))
        .filter(UserAction.status == "disliked")
        .scalar() or 0
    )
    unseen = total - liked - disliked

    new_since = 0
    if last_visit:
        new_since = (
            db.query(func.count(Listing.id))
            .filter(Listing.is_active == True, Listing.first_seen >= last_visit)
            .scalar() or 0
        )

    # Latest scrape log per source
    sources = ["domain", "rea", "allhomes"]
    last_scrape: dict = {}
    for source in sources:
        log = (
            db.query(ScrapeLog)
            .filter(ScrapeLog.source == source)
            .order_by(ScrapeLog.started_at.desc())
            .first()
        )
        last_scrape[source] = ScrapeLogOut.model_validate(log) if log else None

    return StatsOut(
        total=total,
        liked=liked,
        disliked=disliked,
        unseen=max(unseen, 0),
        new_since_last_visit=new_since,
        last_scrape=last_scrape,
    )
