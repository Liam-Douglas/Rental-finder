"""
Domain.com.au Playwright scraper for Canberra rentals.
Targets: https://www.domain.com.au/rent/canberra-act/
"""
import re
import asyncio
from datetime import datetime
from typing import Optional
from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeout
from scrapers.base import BaseScraper

SEARCH_URL = (
    "https://www.domain.com.au/rent/"
    "canberra-act/?sort=dateupdated-desc&excludedeposittaken=1"
)
MAX_PAGES = 10


def _parse_price(text: str) -> Optional[int]:
    """Extract weekly rent as integer from strings like '$450 per week'."""
    match = re.search(r"\$?([\d,]+)", text.replace(",", ""))
    if match:
        val = int(match.group(1).replace(",", ""))
        # Domain sometimes shows monthly — heuristic: if > 5000 divide by 4.33
        if val > 5000:
            val = round(val / 4.33)
        return val
    return None


def _parse_date(text: str) -> Optional[datetime]:
    """Parse 'Available now' or 'Available DD Mon YYYY'."""
    text = text.strip().lower()
    if "now" in text or "immediately" in text:
        return datetime.utcnow()
    match = re.search(r"(\d{1,2}\s+\w+\s+\d{4})", text, re.IGNORECASE)
    if match:
        try:
            return datetime.strptime(match.group(1), "%d %b %Y")
        except ValueError:
            pass
    return None


def _parse_features(text: str) -> dict:
    """Extract beds/baths/parking counts from feature string."""
    result = {"beds": None, "baths": None, "parking": None}
    beds = re.search(r"(\d+)\s*bed", text, re.IGNORECASE)
    baths = re.search(r"(\d+)\s*bath", text, re.IGNORECASE)
    parking = re.search(r"(\d+)\s*(car|parking|garage)", text, re.IGNORECASE)
    if beds:
        result["beds"] = int(beds.group(1))
    if baths:
        result["baths"] = int(baths.group(1))
    if parking:
        result["parking"] = int(parking.group(1))
    return result


async def _extract_listing_detail(page: Page, url: str) -> dict:
    """Visit a listing detail page and extract full data."""
    data: dict = {
        "primary_source": "domain",
        "primary_url": url,
        "source_urls": {},
        "photos": [],
        "pet_friendly": None,
        "furnished": None,
        "available_date": None,
        "description": None,
        "property_type": None,
        "latitude": None,
        "longitude": None,
        "postcode": None,
    }

    try:
        await page.goto(url, timeout=30000, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)

        # Address
        addr_el = await page.query_selector("h1[data-testid='listing-details__button-copy-wrapper']")
        if not addr_el:
            addr_el = await page.query_selector("h1.css-164r41r")
        if addr_el:
            data["address"] = (await addr_el.inner_text()).strip()

        # Suburb / postcode from breadcrumb or address
        suburb_el = await page.query_selector("a[href*='/rent/'][data-testid]")
        if suburb_el:
            suburb_text = (await suburb_el.inner_text()).strip()
            parts = suburb_text.split()
            if parts:
                data["suburb"] = suburb_text.title()

        # Try to get suburb from address
        if not data.get("suburb") and data.get("address"):
            parts = data["address"].split(",")
            if len(parts) >= 2:
                suburb_part = parts[-2].strip() if len(parts) > 2 else parts[-1].strip()
                match = re.match(r"^([\w\s]+?)\s+ACT\s*(\d{4})?", suburb_part, re.IGNORECASE)
                if match:
                    data["suburb"] = match.group(1).strip().title()
                    if match.group(2):
                        data["postcode"] = match.group(2)
                else:
                    data["suburb"] = suburb_part.title()

        # Price
        price_el = await page.query_selector("[data-testid='listing-details__price']")
        if not price_el:
            price_el = await page.query_selector(".css-1y9l4rl")
        if price_el:
            data["price_week"] = _parse_price(await price_el.inner_text())

        # Beds / baths / parking
        features_el = await page.query_selector("[data-testid='property-features']")
        if not features_el:
            features_el = await page.query_selector(".css-zjnkev")
        if features_el:
            features_text = await features_el.inner_text()
            data.update(_parse_features(features_text))

        # Property type
        type_el = await page.query_selector("[data-testid='listing-summary-property-type']")
        if type_el:
            data["property_type"] = (await type_el.inner_text()).strip()

        # Photos
        photo_els = await page.query_selector_all("img[data-testid='listing-details__gallery-image']")
        if not photo_els:
            photo_els = await page.query_selector_all(".listing-gallery__image img")
        photos = []
        for el in photo_els[:15]:
            src = await el.get_attribute("src")
            if src and src.startswith("http"):
                photos.append(src)
        data["photos"] = photos

        # Description
        desc_el = await page.query_selector("[data-testid='listing-details__description']")
        if desc_el:
            data["description"] = (await desc_el.inner_text()).strip()[:2000]

        # Pet friendly + furnished from description/features
        full_text = (data.get("description") or "").lower()
        data["pet_friendly"] = any(
            kw in full_text for kw in ["pet friendly", "pets welcome", "pets considered", "pets allowed"]
        )
        data["furnished"] = any(
            kw in full_text for kw in ["furnished", "fully furnished"]
        )

        # Available date
        avail_els = await page.query_selector_all("[data-testid='listing-details__available-date']")
        for el in avail_els:
            text = await el.inner_text()
            parsed = _parse_date(text)
            if parsed:
                data["available_date"] = parsed
                break

        # Latitude / longitude from page script tags
        content = await page.content()
        lat_match = re.search(r'"lat(?:itude)?"\s*:\s*([-\d.]+)', content)
        lng_match = re.search(r'"lon(?:gitude|g)?"\s*:\s*([-\d.]+)', content)
        if lat_match:
            data["latitude"] = float(lat_match.group(1))
        if lng_match:
            data["longitude"] = float(lng_match.group(1))

    except PWTimeout:
        pass
    except Exception:
        pass

    return data


class DomainScraper(BaseScraper):
    source_name = "domain"

    async def scrape(self) -> list[dict]:
        listings = []

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 900},
            )
            page = await context.new_page()

            # Collect listing URLs from search pages
            listing_urls: list[str] = []
            for page_num in range(1, MAX_PAGES + 1):
                url = SEARCH_URL if page_num == 1 else f"{SEARCH_URL}&page={page_num}"
                try:
                    await page.goto(url, timeout=30000, wait_until="domcontentloaded")
                    await page.wait_for_timeout(2000)

                    cards = await page.query_selector_all(
                        "a[href*='/rent/'][data-testid='listing-card-wrapper-premiumplus'],"
                        "a[href*='/rent/'][data-testid='listing-card-wrapper-standard'],"
                        "a[data-testid='listing-card-figure']"
                    )
                    if not cards:
                        # Fallback: grab all domain.com.au/rent/ links
                        cards = await page.query_selector_all("a[href*='domain.com.au/rent/']")

                    page_urls = []
                    for card in cards:
                        href = await card.get_attribute("href")
                        if href and "/rent/" in href and href not in listing_urls:
                            full = href if href.startswith("http") else f"https://www.domain.com.au{href}"
                            page_urls.append(full)

                    if not page_urls:
                        break

                    listing_urls.extend(page_urls)

                    # Check for next page
                    next_btn = await page.query_selector("[data-testid='paginator-navigate-next']")
                    if not next_btn:
                        break

                    await asyncio.sleep(1.5)

                except PWTimeout:
                    break

            # Scrape each listing detail
            detail_page = await context.new_page()
            for url in listing_urls[:100]:  # cap at 100 per run
                data = await _extract_listing_detail(detail_page, url)
                if data.get("address"):
                    listings.append(data)
                await asyncio.sleep(1.0)  # polite delay

            await context.close()
            await browser.close()

        return listings
