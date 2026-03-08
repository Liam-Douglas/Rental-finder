import { useEffect, useRef, useState, useCallback } from "react";
import TinderCard from "react-tinder-card";
import { AnimatePresence, motion } from "framer-motion";
import type { Listing } from "../types/listing";
import { listingsApi, buildListingParams } from "../api/client";
import { useFiltersStore } from "../store/filters";
import ListingCard from "../components/ListingCard";
import ListingDetail from "../components/ListingDetail";
import FilterPanel from "../components/FilterPanel";

export default function SwipePage() {
  const { filters } = useFiltersStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [history, setHistory] = useState<{ id: number; action: string }[]>([]);
  const cardRefs = useRef<{ [id: number]: { swipe: (dir: string) => Promise<void> } }>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listingsApi.getAll({
        ...buildListingParams(filters),
        exclude_status: ["liked", "disliked"],
        limit: 200,
        sort: "first_seen_desc",
      });
      setListings(data);
      setCurrentIdx(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showDetail || showFilters) return;
      if (e.key === "ArrowRight") handleSwipe("right");
      if (e.key === "ArrowLeft") handleSwipe("left");
      if (e.key === "ArrowUp") setShowDetail(true);
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) handleUndo();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const currentListing = listings[currentIdx];
  const remaining = listings.length - currentIdx;

  const handleSwipe = async (direction: string) => {
    if (!currentListing) return;
    const status = direction === "right" ? "liked" : "disliked";
    setHistory((h) => [...h, { id: currentListing.id, action: status }]);
    await listingsApi.setAction(currentListing.id, status);
    setCurrentIdx((i) => i + 1);
  };

  const handleUndo = async () => {
    if (!history.length || currentIdx === 0) return;
    const last = history[history.length - 1];
    await listingsApi.clearAction(last.id);
    setHistory((h) => h.slice(0, -1));
    setCurrentIdx((i) => i - 1);
  };

  const handleCardSwipe = (dir: string, listing: Listing) => {
    if (listing.id === currentListing?.id) {
      handleSwipe(dir);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg animate-pulse">Loading listings…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h1 className="text-white font-bold text-lg">RentSweep</h1>
        <div className="flex gap-2 items-center">
          {remaining > 0 && (
            <span className="text-slate-400 text-sm">{remaining} remaining</span>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${showFilters ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4">
          <FilterPanel />
        </div>
      )}

      {/* Swipe area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {!currentListing ? (
          <div className="text-center space-y-3">
            <p className="text-slate-300 text-xl font-semibold">All caught up!</p>
            <p className="text-slate-500 text-sm">No more listings match your filters.</p>
            <button
              onClick={load}
              className="px-6 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            {/* Card stack */}
            <div className="relative w-full max-w-sm" style={{ height: 480 }}>
              {/* Show next card peeking behind */}
              {listings[currentIdx + 1] && (
                <div className="absolute inset-0 scale-95 opacity-50 pointer-events-none" style={{ zIndex: 0 }}>
                  <ListingCard listing={listings[currentIdx + 1]} />
                </div>
              )}

              <TinderCard
                key={currentListing.id}
                ref={(ref) => {
                  if (ref) cardRefs.current[currentListing.id] = ref as { swipe: (dir: string) => Promise<void> };
                }}
                onSwipe={(dir) => handleCardSwipe(dir, currentListing)}
                preventSwipe={["up", "down"]}
                swipeRequirementType="position"
                swipeThreshold={80}
                className="absolute inset-0"
              >
                <div className="w-full h-full" onClick={() => setShowDetail(true)}>
                  <ListingCard listing={currentListing} />
                </div>
              </TinderCard>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 items-center">
              <button
                onClick={() => cardRefs.current[currentListing.id]?.swipe("left")}
                className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 text-2xl flex items-center justify-center hover:bg-red-500/30 transition shadow-lg"
                aria-label="Dislike (swipe left)"
              >
                ✕
              </button>

              <button
                onClick={handleUndo}
                disabled={!history.length}
                className="w-10 h-10 rounded-full bg-slate-700 text-slate-400 text-lg flex items-center justify-center hover:bg-slate-600 transition disabled:opacity-30"
                aria-label="Undo last swipe"
              >
                ↩
              </button>

              <button
                onClick={() => cardRefs.current[currentListing.id]?.swipe("right")}
                className="w-14 h-14 rounded-full bg-green-500/20 text-green-400 text-2xl flex items-center justify-center hover:bg-green-500/30 transition shadow-lg"
                aria-label="Like (swipe right)"
              >
                ♥
              </button>
            </div>

            <p className="text-slate-600 text-xs">Arrow keys · Up to expand · Ctrl+Z to undo</p>
          </>
        )}
      </div>

      <AnimatePresence>
        {showDetail && currentListing && (
          <ListingDetail
            listing={currentListing}
            onClose={() => setShowDetail(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
