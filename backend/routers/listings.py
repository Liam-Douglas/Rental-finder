from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import Listing, UserAction
from schemas import ListingOut

router = APIRouter(prefix="/api/listings", tags=["listings"])


def _build_query(
    db: Session,
    price_min: Optional[int],
    price_max: Optional[int],
    beds_min: Optional[int],
    baths_min: Optional[int],
    suburbs: Optional[list[str]],
    pet_friendly: Optional[bool],
    furnished: Optional[bool],
    available_before: Optional[datetime],
    parking_min: Optional[int],
    status: Optional[str],
    exclude_status: Optional[list[str]],
):
    q = db.query(Listing).filter(Listing.is_active == True)

    if price_min is not None:
        q = q.filter(Listing.price_week >= price_min)
    if price_max is not None:
        q = q.filter(Listing.price_week <= price_max)
    if beds_min is not None:
        q = q.filter(Listing.beds >= beds_min)
    if baths_min is not None:
        q = q.filter(Listing.baths >= baths_min)
    if suburbs:
        q = q.filter(Listing.suburb.in_(suburbs))
    if pet_friendly is not None:
        q = q.filter(Listing.pet_friendly == pet_friendly)
    if furnished is not None:
        q = q.filter(Listing.furnished == furnished)
    if available_before is not None:
        q = q.filter(
            or_(Listing.available_date == None, Listing.available_date <= available_before)
        )
    if parking_min is not None:
        q = q.filter(Listing.parking >= parking_min)

    if status:
        q = q.join(UserAction, Listing.id == UserAction.listing_id).filter(
            UserAction.status == status
        )
    elif exclude_status:
        subq = (
            db.query(UserAction.listing_id)
            .filter(UserAction.status.in_(exclude_status))
            .subquery()
        )
        q = q.filter(~Listing.id.in_(subq))

    return q


@router.get("/", response_model=list[ListingOut])
def get_listings(
    price_min: Optional[int] = Query(None),
    price_max: Optional[int] = Query(None),
    beds_min: Optional[int] = Query(None),
    baths_min: Optional[int] = Query(None),
    suburbs: Optional[list[str]] = Query(None),
    pet_friendly: Optional[bool] = Query(None),
    furnished: Optional[bool] = Query(None),
    available_before: Optional[datetime] = Query(None),
    parking_min: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    exclude_status: Optional[list[str]] = Query(None),
    sort: str = Query("first_seen_desc"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    q = _build_query(
        db, price_min, price_max, beds_min, baths_min, suburbs,
        pet_friendly, furnished, available_before, parking_min,
        status, exclude_status,
    )

    sort_map = {
        "first_seen_desc": Listing.first_seen.desc(),
        "first_seen_asc": Listing.first_seen.asc(),
        "price_asc": Listing.price_week.asc(),
        "price_desc": Listing.price_week.desc(),
        "suburb_asc": Listing.suburb.asc(),
    }
    q = q.order_by(sort_map.get(sort, Listing.first_seen.desc()))
    q = q.offset(offset).limit(limit)

    results = q.all()
    out = []
    for listing in results:
        item = ListingOut.model_validate(listing)
        if listing.user_action:
            item.status = listing.user_action.status
            item.notes = listing.user_action.notes
            item.liked_at = listing.user_action.liked_at
        out.append(item)
    return out


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    item = ListingOut.model_validate(listing)
    if listing.user_action:
        item.status = listing.user_action.status
        item.notes = listing.user_action.notes
        item.liked_at = listing.user_action.liked_at
    return item
