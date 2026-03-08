import csv
import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Listing, UserAction
from schemas import ActionIn, ActionOut

router = APIRouter(prefix="/api/listings", tags=["actions"])


@router.post("/{listing_id}/action", response_model=ActionOut)
def set_action(listing_id: int, body: ActionIn, db: Session = Depends(get_db)):
    allowed = {"liked", "disliked", "applied", "inspected"}
    if body.status not in allowed:
        raise HTTPException(status_code=422, detail=f"status must be one of {allowed}")

    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    action = db.query(UserAction).filter(UserAction.listing_id == listing_id).first()
    if action:
        action.status = body.status
        action.notes = body.notes
        if body.status == "liked" and not action.liked_at:
            action.liked_at = datetime.utcnow()
        action.updated_at = datetime.utcnow()
    else:
        action = UserAction(
            listing_id=listing_id,
            status=body.status,
            notes=body.notes,
            liked_at=datetime.utcnow() if body.status == "liked" else None,
        )
        db.add(action)

    db.commit()
    db.refresh(action)
    return action


@router.delete("/{listing_id}/action")
def clear_action(listing_id: int, db: Session = Depends(get_db)):
    action = db.query(UserAction).filter(UserAction.listing_id == listing_id).first()
    if action:
        db.delete(action)
        db.commit()
    return {"ok": True}


@router.patch("/{listing_id}/notes")
def update_notes(listing_id: int, notes: Optional[str] = None, db: Session = Depends(get_db)):
    action = db.query(UserAction).filter(UserAction.listing_id == listing_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="No action record for this listing")
    action.notes = notes
    action.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.get("/export/csv")
def export_liked_csv(db: Session = Depends(get_db)):
    """Export all liked listings as CSV."""
    from models import Listing as L
    rows = (
        db.query(L, UserAction)
        .join(UserAction, L.id == UserAction.listing_id)
        .filter(UserAction.status.in_(["liked", "applied", "inspected"]))
        .order_by(UserAction.liked_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Address", "Suburb", "Price/wk", "Beds", "Baths", "Parking",
        "Pet Friendly", "Furnished", "Available", "Status", "Notes",
        "Source", "URL", "First Seen",
    ])
    for listing, action in rows:
        writer.writerow([
            listing.address,
            listing.suburb or "",
            listing.price_week or "",
            listing.beds or "",
            listing.baths or "",
            listing.parking or "",
            "Yes" if listing.pet_friendly else "No" if listing.pet_friendly is False else "",
            "Yes" if listing.furnished else "No" if listing.furnished is False else "",
            listing.available_date.strftime("%Y-%m-%d") if listing.available_date else "",
            action.status,
            action.notes or "",
            listing.primary_source,
            listing.primary_url,
            listing.first_seen.strftime("%Y-%m-%d"),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rentsweep-liked.csv"},
    )
