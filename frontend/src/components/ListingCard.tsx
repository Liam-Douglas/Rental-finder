import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Listing } from "../types/listing";
import SourceBadge from "./SourceBadge";
import ListingDetail from "./ListingDetail";

interface Props {
  listing: Listing;
  onLike?: () => void;
  onDislike?: () => void;
}

function PhotoCarousel({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length)
    return (
      <div className="w-full h-52 bg-slate-700 flex items-center justify-center text-slate-400 text-sm rounded-t-2xl">
        No photos
      </div>
    );
  return (
    <div className="relative w-full h-52 bg-slate-800 rounded-t-2xl overflow-hidden select-none">
      <img
        src={photos[idx]}
        alt="property"
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23334155'/%3E%3Ctext x='200' y='110' text-anchor='middle' fill='%2394a3b8' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";
        }}
      />
      {photos.length > 1 && (
        <>
          <button
            aria-label="Previous photo"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + photos.length) % photos.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full w-7 h-7 flex items-center justify-center text-white hover:bg-black/70"
          >
            ‹
          </button>
          <button
            aria-label="Next photo"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % photos.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full w-7 h-7 flex items-center justify-center text-white hover:bg-black/70"
          >
            ›
          </button>
          <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white">
            {idx + 1}/{photos.length}
          </div>
        </>
      )}
    </div>
  );
}

export default function ListingCard({ listing, onLike, onDislike }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer select-none"
        onClick={() => setExpanded(true)}
        role="button"
        aria-label={`View details for ${listing.address}`}
      >
        <PhotoCarousel photos={listing.photos} />

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white leading-tight">{listing.address}</p>
              {listing.suburb && (
                <p className="text-slate-400 text-sm">{listing.suburb}</p>
              )}
            </div>
            {listing.price_week && (
              <div className="text-right shrink-0">
                <span className="text-brand-500 font-bold text-lg">${listing.price_week}</span>
                <span className="text-slate-400 text-xs">/wk</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 text-slate-300 text-sm">
            {listing.beds != null && <span>🛏 {listing.beds}</span>}
            {listing.baths != null && <span>🚿 {listing.baths}</span>}
            {listing.parking != null && <span>🚗 {listing.parking}</span>}
            {listing.pet_friendly && <span title="Pet friendly">🐾</span>}
            {listing.furnished && <span title="Furnished">🛋</span>}
          </div>

          <div className="flex items-center justify-between">
            <SourceBadge source={listing.primary_source} sourceUrls={listing.source_urls} />
            {listing.available_date && (
              <span className="text-xs text-slate-400">
                Avail {new Date(listing.available_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>

          {(onLike || onDislike) && (
            <div className="flex gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onDislike}
                className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition font-medium text-sm"
                aria-label="Dislike"
              >
                ✕ Pass
              </button>
              <button
                onClick={onLike}
                className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition font-medium text-sm"
                aria-label="Like"
              >
                ♥ Like
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <ListingDetail listing={listing} onClose={() => setExpanded(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
