from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SourceURLs(BaseModel):
    domain: Optional[str] = None
    rea: Optional[str] = None
    allhomes: Optional[str] = None


class ListingOut(BaseModel):
    id: int
    address: str
    suburb: Optional[str]
    postcode: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    price_week: Optional[int]
    beds: Optional[int]
    baths: Optional[int]
    parking: Optional[int]
    property_type: Optional[str]
    pet_friendly: Optional[bool]
    furnished: Optional[bool]
    available_date: Optional[datetime]
    photos: list[str] = []
    description: Optional[str]
    primary_source: str
    primary_url: str
    source_urls: dict = {}
    first_seen: datetime
    last_seen: datetime
    # User action (joined)
    status: Optional[str] = None
    notes: Optional[str] = None
    liked_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ActionIn(BaseModel):
    status: str  # liked / disliked / applied / inspected
    notes: Optional[str] = None


class ActionOut(BaseModel):
    listing_id: int
    status: str
    notes: Optional[str]
    liked_at: Optional[datetime]
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScrapeLogOut(BaseModel):
    id: int
    source: str
    started_at: datetime
    finished_at: Optional[datetime]
    listings_found: int
    listings_new: int
    listings_updated: int
    status: str
    error_message: Optional[str]

    model_config = {"from_attributes": True}


class StatsOut(BaseModel):
    total: int
    liked: int
    disliked: int
    unseen: int
    new_since_last_visit: int
    last_scrape: dict[str, Optional[ScrapeLogOut]]
