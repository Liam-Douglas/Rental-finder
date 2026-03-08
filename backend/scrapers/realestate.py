"""
RealEstate.com.au Playwright scraper for Canberra rentals.
"""
import re
import asyncio
from datetime import datetime
from typing import Optional
from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeout
from scrapers.base import BaseScraper

SEARCH_URL = (
    "https://www.realestate.com.au/rent/in-canberra,+act/"
    "list-1?sortType=date-desc&includePropertiesWithin=includeUnit"
)
MAX_PAGES = 10


def _parse_price(text: str) -> Optional[int]:
    m = re.search(r"\$?([\d,]+)", text.replace(",", ""))
    if m:
        val = int(m.group(1))
        if "month" in text.lower():
            val = round(val / 4.33)
        return val
    return None


async def _extract_detail(page: Page, url: str) -> dict:
    data: dict = {
        "primary_source": "rea",
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
        addr_el = await page.query_selector("h1.property-info-address")
        if not addr_el:
            addr_el = await page.query_selector("[data-testid='listing-details-address']")
        if addr_el:
            data["address"] = (await addr_el.inner_text()).strip()

        # Suburb
        if data.get("address"):
            parts = data["address"].split(",")
            if len(parts) >= 2:
                data["suburb"] = parts[-2].strip().title()
            postcode_m = re.search(r"\b(\d{4})\b", data["address"])
            if postcode_m:
                data["postcode"] = postcode_m.group(1)

        # Price
        price_el = await page.query_selector("[data-testid='listing-details-price']")
        if not price_el:
            price_el = await page.query_selector(".property-price")
        if price_el:
            data["price_week"] = _parse_price(await price_el.inner_text())

        # Beds/baths/parking
        for feature in await page.query_selector_all("[data-testid='listing-detail-feature-value']"):
            label_el = await feature.query_selector("[data-testid='listing-detail-feature-label']")
            val_el = await feature.query_selector("[data-testid='listing-detail-feature-value']")
            if label_el and val_el:
                label = (await label_el.inner_text()).lower()
                val = await val_el.inner_text()
                try:
                    if "bed" in label:
                        data["beds"] = int(val)
                    elif "bath" in label:
                        data["baths"] = int(val)
                    elif "car" in label or "park" in label:
                        data["parking"] = int(val)
                except ValueError:
                    pass

        # Photos
        for img in await page.query_selector_all("img[src*='realestate.com.au']"):
            src = await img.get_attribute("src")
            if src and "photo" in src:
                data["photos"].append(src)
        data["photos"] = data["photos"][:15]

        # Description
        desc_el = await page.query_selector("[data-testid='listing-details-description']")
        if desc_el:
            data["description"] = (await desc_el.inner_text()).strip()[:2000]

        full_text = (data.get("description") or "").lower()
        data["pet_friendly"] = any(kw in full_text for kw in ["pet friendly", "pets welcome", "pets allowed"])
        data["furnished"] = "furnished" in full_text

        # Coordinates from page source
        content = await page.content()
        lat_m = re.search(r'"latitude"\s*:\s*([-\d.]+)', content)
        lon_m = re.search(r'"longitude"\s*:\s*([-\d.]+)', content)
        if lat_m:
            data["latitude"] = float(lat_m.group(1))
        if lon_m:
            data["longitude"] = float(lon_m.group(1))

    except (PWTimeout, Exception):
        pass
    return data


class RealEstateScraper(BaseScraper):
    source_name = "rea"

    async def scrape(self) -> list[dict]:
        listings = []
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                )
            )
            page = await context.new_page()
            listing_urls: list[str] = []

            for page_num in range(1, MAX_PAGES + 1):
                url = SEARCH_URL.replace("list-1", f"list-{page_num}")
                try:
                    await page.goto(url, timeout=30000, wait_until="domcontentloaded")
                    await page.wait_for_timeout(2000)
                    cards = await page.query_selector_all("a[href*='/property-']")
                    page_urls = []
                    for card in cards:
                        href = await card.get_attribute("href")
                        if href and "/property-" in href:
                            full = href if href.startswith("http") else f"https://www.realestate.com.au{href}"
                            if full not in listing_urls:
                                page_urls.append(full)
                    if not page_urls:
                        break
                    listing_urls.extend(page_urls)
                    await asyncio.sleep(1.5)
                except PWTimeout:
                    break

            detail_page = await context.new_page()
            for url in listing_urls[:100]:
                data = await _extract_detail(detail_page, url)
                if data.get("address"):
                    listings.append(data)
                await asyncio.sleep(1.0)

            await context.close()
            await browser.close()
        return listings
