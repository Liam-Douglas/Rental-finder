from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    address_normalised: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    suburb: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    postcode: Mapped[Optional[str]] = mapped_column(String(10))
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)

    price_week: Mapped[Optional[int]] = mapped_column(Integer, index=True)
    beds: Mapped[Optional[int]] = mapped_column(Integer, index=True)
    baths: Mapped[Optional[int]] = mapped_column(Integer)
    parking: Mapped[Optional[int]] = mapped_column(Integer)
    property_type: Mapped[Optional[str]] = mapped_column(String(50))

    pet_friendly: Mapped[Optional[bool]] = mapped_column(Boolean)
    furnished: Mapped[Optional[bool]] = mapped_column(Boolean)
    available_date: Mapped[Optional[datetime]] = mapped_column(DateTime)

    photos: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Source tracking — primary + deduplicated extras
    primary_source: Mapped[str] = mapped_column(String(50), nullable=False)  # domain/rea/allhomes
    primary_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    source_urls: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)  # {"rea": "...", "allhomes": "..."}

    first_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user_action: Mapped[Optional["UserAction"]] = relationship("UserAction", back_populates="listing", uselist=False)


class UserAction(Base):
    __tablename__ = "user_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    listing_id: Mapped[int] = mapped_column(Integer, ForeignKey("listings.id"), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # liked / disliked / applied / inspected
    notes: Mapped[Optional[str]] = mapped_column(Text)
    liked_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    listing: Mapped["Listing"] = relationship("Listing", back_populates="user_action")


class ScrapeLog(Base):
    __tablename__ = "scrape_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    listings_found: Mapped[int] = mapped_column(Integer, default=0)
    listings_new: Mapped[int] = mapped_column(Integer, default=0)
    listings_updated: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="running")  # running / success / error
    error_message: Mapped[Optional[str]] = mapped_column(Text)
