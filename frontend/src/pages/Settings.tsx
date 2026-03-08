import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterPanel from "../components/FilterPanel";
import { scrapeApi } from "../api/client";
import { useFiltersStore } from "../store/filters";

export default function Settings() {
  const navigate = useNavigate();
  const { scrapeInterval, setScrapeInterval } = useFiltersStore();
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);

  const handleScrape = async () => {
    setScraping(true);
    setScrapeResult(null);
    try {
      const res = await scrapeApi.trigger("all");
      setScrapeResult(`Triggered: ${res.triggered.join(", ") || "none"}`);
    } catch {
      setScrapeResult("Error triggering scrape");
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 space-y-6">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-2xl w-8">
          ←
        </button>
        <h1 className="text-white text-xl font-bold">Settings</h1>
      </div>

      {/* Filters */}
      <section className="space-y-2">
        <h2 className="text-slate-400 text-xs uppercase tracking-wider px-1">Search filters</h2>
        <FilterPanel />
      </section>

      {/* Scrape controls */}
      <section className="bg-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-white">Scraping</h2>

        <div>
          <label className="text-slate-400 text-xs uppercase tracking-wider block mb-2">
            Auto-scrape interval
          </label>
          <div className="flex gap-2">
            {[15, 30, 60, 120, 360].map((m) => (
              <button
                key={m}
                onClick={() => setScrapeInterval(m)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                  scrapeInterval === m ? "bg-brand-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Changes take effect after restart (set via SCRAPE_INTERVAL_MINUTES env var).
          </p>
        </div>

        <div>
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            {scraping ? "Triggering scrape…" : "Scrape now (all sources)"}
          </button>
          {scrapeResult && (
            <p className="text-slate-400 text-sm mt-2 text-center">{scrapeResult}</p>
          )}
        </div>
      </section>

      {/* About */}
      <section className="bg-slate-800 rounded-2xl p-4 space-y-2">
        <h2 className="font-semibold text-white">About</h2>
        <p className="text-slate-400 text-sm">RentSweep v1.0 — Local-first Canberra rental aggregator.</p>
        <p className="text-slate-400 text-sm">All data stored locally. No accounts required.</p>
        <p className="text-slate-500 text-xs">Sources: Domain.com.au · RealEstate.com.au · Allhomes.com.au</p>
      </section>
    </div>
  );
}
