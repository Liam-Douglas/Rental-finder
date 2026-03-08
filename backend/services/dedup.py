"""
Address normalisation and fuzzy deduplication using rapidfuzz.
"""
import re
from rapidfuzz import fuzz
from sqlalchemy.orm import Session
from models import Listing

SIMILARITY_THRESHOLD = 85

# Common abbreviation expansions
ABBREV = {
    r"\bst\b": "street",
    r"\bave?\b": "avenue",
    r"\brd\b": "road",
    r"\bdr\b": "drive",
    r"\bcrt?\b": "court",
    r"\bpl\b": "place",
    r"\bcl\b": "close",
    r"\bcct\b": "circuit",
    r"\bhwy\b": "highway",
    r"\bpde\b": "parade",
    r"\blne?\b": "lane",
    r"\bgve?\b": "grove",
    r"\btce\b": "terrace",
    r"\bblvd\b": "boulevard",
    r"\bcresc?\b": "crescent",
    r"\bu\b": "unit",
    r"\bapt\b": "apartment",
    r"\bflr?\b": "floor",
}


def normalise_address(address: str) -> str:
    """Lowercase, expand abbreviations, strip punctuation."""
    addr = address.lower().strip()
    # Remove unit/apt prefixes like "Unit 3/" or "3/"
    addr = re.sub(r"^(unit|apt|apartment|u)\s*\d+[,/\s]+", "", addr)
    # Expand abbreviations
    for pattern, replacement in ABBREV.items():
        addr = re.sub(pattern, replacement, addr, flags=re.IGNORECASE)
    # Remove punctuation except numbers and letters
    addr = re.sub(r"[^\w\s]", " ", addr)
    addr = re.sub(r"\s+", " ", addr).strip()
    return addr


def find_duplicate(db: Session, normalised_address: str, suburb: str | None) -> Listing | None:
    """
    Search existing listings for a fuzzy address match.
    Restricts candidates to same suburb for performance.
    """
    query = db.query(Listing).filter(Listing.is_active == True)
    if suburb:
        query = query.filter(Listing.suburb == suburb)

    candidates = query.all()
    for candidate in candidates:
        score = fuzz.token_sort_ratio(normalised_address, candidate.address_normalised)
        if score >= SIMILARITY_THRESHOLD:
            return candidate
    return None


def merge_listing(existing: Listing, new_data: dict) -> Listing:
    """
    Merge new source data into an existing listing.
    Adds source URL to source_urls dict, updates photos if more available.
    """
    source = new_data.get("primary_source")
    url = new_data.get("primary_url")

    if source and url:
        urls = dict(existing.source_urls or {})
        if source != existing.primary_source:
            urls[source] = url
            existing.source_urls = urls

    # Update photos if new source has more
    existing_photos = existing.photos or []
    new_photos = new_data.get("photos", [])
    if len(new_photos) > len(existing_photos):
        existing.photos = new_photos

    # Update price if changed
    if new_data.get("price_week") and new_data["price_week"] != existing.price_week:
        existing.price_week = new_data["price_week"]

    # Refresh available date
    if new_data.get("available_date"):
        existing.available_date = new_data["available_date"]

    return existing
