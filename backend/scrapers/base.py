"""Abstract base scraper."""
from abc import ABC, abstractmethod
from datetime import datetime
from sqlalchemy.orm import Session
from models import Listing, ScrapeLog
from services.dedup import normalise_address, find_duplicate, merge_listing


class BaseScraper(ABC):
    source_name: str = ""

    def __init__(self, db: Session):
        self.db = db

    @abstractmethod
    async def scrape(self) -> list[dict]:
        """Return list of raw listing dicts."""
        ...

    async def run(self) -> ScrapeLog:
        log = ScrapeLog(source=self.source_name, started_at=datetime.utcnow())
        self.db.add(log)
        self.db.commit()

        try:
            raw_listings = await self.scrape()
            log.listings_found = len(raw_listings)
            new_count = 0
            updated_count = 0

            for data in raw_listings:
                normalised = normalise_address(data.get("address", ""))
                data["address_normalised"] = normalised

                existing = find_duplicate(self.db, normalised, data.get("suburb"))
                if existing:
                    merge_listing(existing, data)
                    updated_count += 1
                else:
                    listing = Listing(**{k: v for k, v in data.items() if hasattr(Listing, k)})
                    listing.address_normalised = normalised
                    self.db.add(listing)
                    new_count += 1

            self.db.commit()
            log.listings_new = new_count
            log.listings_updated = updated_count
            log.status = "success"

        except Exception as e:
            log.status = "error"
            log.error_message = str(e)
            self.db.rollback()

        finally:
            log.finished_at = datetime.utcnow()
            self.db.commit()

        return log
