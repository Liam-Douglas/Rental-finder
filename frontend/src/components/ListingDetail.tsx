import { useState } from "react";
import { motion } from "framer-motion";
import type { Listing, ListingStatus } from "../types/listing";
import SourceBadge from "./SourceBadge";
import { listingsApi } from "../api/client";

interface Props {
  listing: Listing;
  onClose: () => void;
  onStatusChange?: (id: number, status: ListingStatus) => void;
}

function PhotoCarousel({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length)
    return (
      <div className="w-full h-64 bg-slate-700 flex items-center justify-center text-slate-400">
        No photos available
      </div>
    );
  return (
    <div className="relative w-full h-64 bg-slate-900">
      <img src={photos[idx]} alt="property" className="w-full h-full object-cover" />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 rounded-full w-9 h-9 flex items-center justify-center text-white text-xl"
          >
            ‹
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % photos.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 rounded-full w-9 h-9 flex items-center justify-center text-white text-xl"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition ${i === idx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ListingDetail({ listing, onClose, onStatusChange }: Props) {
  const [notes, setNotes] = useState(listing.notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleStatus = async (status: ListingStatus) => {
    await listingsApi.setAction(listing.id, status, notes || undefined);
    onStatusChange?.(listing.id, status);
  };

  const saveNotes = async () => {
    setSaving(true);
    await listingsApi.updateNotes(listing.id, notes);
    setSaving(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-slate-800 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="font-semibold text-white truncate pr-2">{listing.address}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center" aria-label="Close">
            ×
          </button>
        </div>

        <PhotoCarousel photos={listing.photos} />

        <div className="p-4 space-y-4">
          {/* Price + suburb */}
          <div className="flex items-center justify-between">
            <div>
              {listing.suburb && <p className="text-slate-400 text-sm">{listing.suburb} {listing.postcode}</p>}
              {listing.property_type && <p className="text-slate-500 text-xs">{listing.property_type}</p>}
            </div>
            {listing.price_week && (
              <div className="text-right">
                <span className="text-brand-500 font-bold text-2xl">${listing.price_week}</span>
                <span className="text-slate-400 text-sm">/wk</span>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="flex gap-4 text-slate-200 text-sm bg-slate-700/50 rounded-xl p-3">
            {listing.beds != null && <span>🛏 <strong>{listing.beds}</strong> bed{listing.beds !== 1 ? "s" : ""}</span>}
            {listing.baths != null && <span>🚿 <strong>{listing.baths}</strong> bath{listing.baths !== 1 ? "s" : ""}</span>}
            {listing.parking != null && <span>🚗 <strong>{listing.parking}</strong> park</span>}
            {listing.pet_friendly && <span>🐾 Pet friendly</span>}
            {listing.furnished && <span>🛋 Furnished</span>}
          </div>

          {/* Available date */}
          {listing.available_date && (
            <p className="text-slate-300 text-sm">
              <span className="text-slate-400">Available:</span>{" "}
              {new Date(listing.available_date).toLocaleDateString("en-AU", {
                weekday: "short", day: "numeric", month: "long", year: "numeric"
              })}
            </p>
          )}

          {/* Description */}
          {listing.description && (
            <div>
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-1">Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}

          {/* Source */}
          <div className="flex items-center justify-between">
            <SourceBadge source={listing.primary_source} sourceUrls={listing.source_urls} />
            <a
              href={listing.primary_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 text-sm hover:underline"
            >
              View listing →
            </a>
          </div>

          {/* Status buttons */}
          <div>
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["liked", "applied", "inspected", "disliked"] as ListingStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className={`py-2 rounded-xl text-sm font-medium transition ${
                    listing.status === s
                      ? s === "disliked"
                        ? "bg-red-500 text-white"
                        : "bg-brand-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes..."
              rows={3}
              className="w-full bg-slate-700 rounded-xl p-3 text-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-2 px-4 py-1.5 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save notes"}
            </button>
          </div>

          <p className="text-slate-500 text-xs">
            First seen: {new Date(listing.first_seen).toLocaleDateString("en-AU")}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
