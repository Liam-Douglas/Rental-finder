export type ListingStatus = "liked" | "disliked" | "applied" | "inspected";

export interface Listing {
  id: number;
  address: string;
  suburb: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  price_week: number | null;
  beds: number | null;
  baths: number | null;
  parking: number | null;
  property_type: string | null;
  pet_friendly: boolean | null;
  furnished: boolean | null;
  available_date: string | null;
  photos: string[];
  description: string | null;
  primary_source: "domain" | "rea" | "allhomes";
  primary_url: string;
  source_urls: Record<string, string>;
  first_seen: string;
  last_seen: string;
  status: ListingStatus | null;
  notes: string | null;
  liked_at: string | null;
}

export interface Stats {
  total: number;
  liked: number;
  disliked: number;
  unseen: number;
  new_since_last_visit: number;
  last_scrape: Record<string, ScrapeLog | null>;
}

export interface ScrapeLog {
  id: number;
  source: string;
  started_at: string;
  finished_at: string | null;
  listings_found: number;
  listings_new: number;
  listings_updated: number;
  status: "running" | "success" | "error";
  error_message: string | null;
}

export interface Filters {
  priceMin: number | null;
  priceMax: number | null;
  bedsMin: number | null;
  bathsMin: number | null;
  suburbs: string[];
  petFriendly: boolean | null;
  furnished: boolean | null;
  parkingMin: number | null;
}
