import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Filters } from "../types/listing";

interface FiltersStore {
  filters: Filters;
  lastVisit: string | null;
  scrapeInterval: number;
  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;
  setLastVisit: (d: string) => void;
  setScrapeInterval: (m: number) => void;
}

const defaultFilters: Filters = {
  priceMin: null,
  priceMax: null,
  bedsMin: null,
  bathsMin: null,
  suburbs: [],
  petFriendly: null,
  furnished: null,
  parkingMin: null,
};

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      lastVisit: null,
      scrapeInterval: 60,
      setFilters: (f) =>
        set((state) => ({ filters: { ...state.filters, ...f } })),
      resetFilters: () => set({ filters: defaultFilters }),
      setLastVisit: (d) => set({ lastVisit: d }),
      setScrapeInterval: (m) => set({ scrapeInterval: m }),
    }),
    { name: "rentsweep-filters" }
  )
);
