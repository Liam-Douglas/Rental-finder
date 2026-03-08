"""
Allhomes.com.au Playwright scraper for Canberra rentals.
"""
import re
import asyncio
from typing import Optional
from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeout
from scrapers.base import BaseScraper

SEARCH_URL = "https://www.allhomes.com.au/rent/canberra/?sort=updated_at+desc"
MAX_PAGES = 10


def _parse_price(text: str) -> Optional[int]:
    m = re.search(r"\$?([\d,]+)", text.replace(",", ""))
    if m:
        return int(m.group(1))
    return None


async def _extract_detail(page: Page, url: str) -> dict:
    data: dict = {
        "primary_source": "allhomes",
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
        addr_el = await page.query_selector("h1")
        if addr_el:
            data["address"] = (await addr_el.inner_text()).strip()

        # Suburb from address
        if data.get("address"):
            parts = data["address"].split(",")
            if len(parts) >= 2:
                data["suburb"] = parts[-2].strip().title()
            m = re.search(r"\b(\d{4})\b", data["address"])
            if m:
                data["postcode"] = m.group(1)

        # Price
        price_el = await page.query_selector(".property-price, [class*='price']")
        if price_el:
            data["price_week"] = _parse_price(await price_el.inner_text())

        # Beds/baths/parking
        features_text = ""
        for el in await page.query_selector_all("[class*='feature'], [class*='stat']"):
            features_text += " " + await el.inner_text()
        beds_m = re.search(r"(\d+)\s*bed", features_text, re.IGNORECASE)
        bath_m = re.search(r"(\d+)\s*bath", features_text, re.IGNORECASE)
        park_m = re.search(r"(\d+)\s*(car|park)", features_text, re.IGNORECASE)
        if beds_m:
            data["beds"] = int(beds_m.group(1))
        if bath_m:
            data["baths"] = int(bath_m.group(1))
        if park_m:
            data["parking"] = int(park_m.group(1))

        # Photos
        for img in await page.query_selector_all("img"):
            src = await img.get_attribute("src")
            if src and src.startswith("http") and any(x in src for x in ["photo", "image", "media"]):
                data["photos"].append(src)
        data["photos"] = data["photos"][:15]

        # Description
        desc_el = await page.query_selector("[class*='description'], [class*='body']")
        if desc_el:
            data["description"] = (await desc_el.inner_text()).strip()[:2000]

        full_text = (data.get("description") or "").lower()
        data["pet_friendly"] = any(kw in full_text for kw in ["pet friendly", "pets welcome", "pets allowed"])
        data["furnished"] = "furnished" in full_text

        # Coordinates
        content = await page.content()
        lat_m = re.search(r'"lat(?:itude)?"\s*:\s*([-\d.]+)', content)
        lon_m = re.search(r'"lon(?:gitude|g)?"\s*:\s*([-\d.]+)', content)
        if lat_m:
            data["latitude"] = float(lat_m.group(1))
        if lon_m:
            data["longitude"] = float(lon_m.group(1))

    except (PWTimeout, Exception):
        pass
    return data


class AllhomesScraper(BaseScraper):
    source_name = "allhomes"

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
                url = SEARCH_URL if page_num == 1 else f"{SEARCH_URL}&page={page_num}"
                try:
                    await page.goto(url, timeout=30000, wait_until="domcontentloaded")
                    await page.wait_for_timeout(2000)
                    cards = await page.query_selector_all("a[href*='/rent/']")
                    page_urls = []
                    for card in cards:
                        href = await card.get_attribute("href")
                        if href and "/rent/" in href and "allhomes.com.au" in (href if href.startswith("http") else "allhomes.com.au"):
                            full = href if href.startswith("http") else f"https://www.allhomes.com.au{href}"
                            if full not in listing_urls and full != SEARCH_URL:
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
