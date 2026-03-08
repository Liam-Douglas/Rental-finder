import axios from "axios";
import type { Listing, Stats, Filters } from "../types/listing";

const api = axios.create({ baseURL: "/api" });

export function buildListingParams(filters: Filters, extra: Record<string, unknown> = {}) {
  const params: Record<string, unknown> = { ...extra };
  if (filters.priceMin != null) params.price_min = filters.priceMin;
  if (filters.priceMax != null) params.price_max = filters.priceMax;
  if (filters.bedsMin != null) params.beds_min = filters.bedsMin;
  if (filters.bathsMin != null) params.baths_min = filters.bathsMin;
  if (filters.suburbs.length) params.suburbs = filters.suburbs;
  if (filters.petFriendly != null) params.pet_friendly = filters.petFriendly;
  if (filters.furnished != null) params.furnished = filters.furnished;
  if (filters.parkingMin != null) params.parking_min = filters.parkingMin;
  return params;
}

export const listingsApi = {
  getAll: (params: Record<string, unknown>) =>
    api.get<Listing[]>("/listings/", { params }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Listing>(`/listings/${id}`).then((r) => r.data),

  setAction: (id: number, status: string, notes?: string) =>
    api.post(`/listings/${id}/action`, { status, notes }).then((r) => r.data),

  clearAction: (id: number) =>
    api.delete(`/listings/${id}/action`).then((r) => r.data),

  updateNotes: (id: number, notes: string) =>
    api.patch(`/listings/${id}/notes`, null, { params: { notes } }).then((r) => r.data),

  exportCsv: () => {
    window.open("/api/listings/export/csv", "_blank");
  },
};

export const statsApi = {
  get: (lastVisit?: string | null) =>
    api
      .get<Stats>("/stats/", { params: lastVisit ? { last_visit: lastVisit } : {} })
      .then((r) => r.data),
};

export const scrapeApi = {
  trigger: (source: "domain" | "rea" | "allhomes" | "all") =>
    api.post(`/scrape/${source}`).then((r) => r.data),
  status: () => api.get("/scrape/status").then((r) => r.data),
};
