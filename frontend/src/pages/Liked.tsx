import { useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import type { Listing, ListingStatus } from "../types/listing";
import { listingsApi } from "../api/client";
import ListingCard from "../components/ListingCard";
import ListingDetail from "../components/ListingDetail";
import MapView from "../components/MapView";

type SortKey = "liked_at" | "price_asc" | "price_desc" | "suburb";

const STATUS_LABELS: Record<string, string> = {
  liked: "Liked",
  applied: "Applied",
  inspected: "Inspected",
};

const STATUS_COLORS: Record<string, string> = {
  liked: "bg-brand-600",
  applied: "bg-green-600",
  inspected: "bg-amber-500",
};

export default function LikedPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("liked_at");
  const [showMap, setShowMap] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [filterStatus, setFilterStatus] = useState<ListingStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sortMap: Record<SortKey, string> = {
        liked_at: "first_seen_desc",
        price_asc: "price_asc",
        price_desc: "price_desc",
        suburb: "suburb_asc",
      };
      const data = await listingsApi.getAll({
        status: "liked",
        sort: sortMap[sortKey],
        limit: 200,
      });
      // Also fetch applied + inspected
      const applied = await listingsApi.getAll({ status: "applied", limit: 200 });
      const inspected = await listingsApi.getAll({ status: "inspected", limit: 200 });
      setListings([...data, ...applied, ...inspected]);
    } finally {
      setLoading(false);
    }
  }, [sortKey]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = (id: number, newStatus: ListingStatus) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
  };

  const filtered = filterStatus === "all"
    ? listings
    : listings.filter((l) => l.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-white font-bold text-lg">Liked ({listings.length})</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMap(!showMap)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${showMap ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            >
              {showMap ? "List" : "Map"}
            </button>
            <button
              onClick={() => listingsApi.exportCsv()}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              CSV ↓
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {/* Status filter */}
          {(["all", "liked", "applied", "inspected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${
                filterStatus === s ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}

          <div className="w-px bg-slate-700 mx-1" />

          {/* Sort */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="shrink-0 bg-slate-800 text-slate-300 text-xs rounded-full px-3 py-1 focus:outline-none"
          >
            <option value="liked_at">Date liked</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="suburb">Suburb</option>
          </select>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center text-slate-400 py-12 animate-pulse">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-slate-300 text-lg font-semibold">No liked listings yet</p>
            <p className="text-slate-500 text-sm">Start swiping to save properties here.</p>
          </div>
        ) : (
          <>
            {showMap && <MapView listings={filtered} />}

            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((listing) => (
                <div key={listing.id} className="relative">
                  {/* Status tag */}
                  {listing.status && listing.status !== "liked" && (
                    <div className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLORS[listing.status] ?? "bg-slate-600"}`}>
                      {STATUS_LABELS[listing.status] ?? listing.status}
                    </div>
                  )}
                  <div
                    className="cursor-pointer"
                    onClick={() => setSelectedListing(listing)}
                  >
                    <ListingCard listing={listing} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedListing && (
          <ListingDetail
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onStatusChange={(id, status) => {
              handleStatusChange(id, status);
              setSelectedListing((l) => (l?.id === id ? { ...l, status } : l));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
