import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { statsApi, scrapeApi } from "../api/client";
import { useFiltersStore } from "../store/filters";
import type { Stats } from "../types/listing";

const SOURCE_LABEL: Record<string, string> = { domain: "Domain", rea: "REA", allhomes: "Allhomes" };

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-1">
      <span className={`text-3xl font-bold ${accent ?? "text-white"}`}>{value}</span>
      <span className="text-slate-400 text-sm">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [scraping, setScraping] = useState<string | null>(null);
  const { lastVisit, setLastVisit } = useFiltersStore();

  useEffect(() => {
    statsApi.get(lastVisit).then(setStats);
    setLastVisit(new Date().toISOString());
  }, []);

  const handleScrape = async (source: "all" | "domain" | "rea" | "allhomes") => {
    setScraping(source);
    await scrapeApi.trigger(source);
    setScraping(null);
    const updated = await statsApi.get(null);
    setStats(updated);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 space-y-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-white text-2xl font-bold">RentSweep</h1>
          <p className="text-slate-400 text-sm">Canberra rental aggregator</p>
        </div>
        <Link to="/settings" className="text-slate-400 hover:text-white text-xl" aria-label="Settings">
          ⚙
        </Link>
      </div>

      {stats?.new_since_last_visit ? (
        <div className="bg-brand-600/20 border border-brand-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-brand-400 text-2xl font-bold">{stats.new_since_last_visit}</span>
          <span className="text-brand-300 text-sm">new listing{stats.new_since_last_visit !== 1 ? "s" : ""} since your last visit</span>
        </div>
      ) : null}

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total listings" value={stats.total} />
          <StatCard label="Unseen" value={stats.unseen} accent="text-brand-400" />
          <StatCard label="Liked" value={stats.liked} accent="text-green-400" />
          <StatCard label="Hidden" value={stats.disliked} accent="text-red-400" />
        </div>
      )}

      {/* Main actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/swipe"
          className="col-span-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 rounded-2xl text-center text-lg transition"
        >
          Start Swiping →
        </Link>
        <Link
          to="/liked"
          className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-2xl text-center transition"
        >
          ♥ Liked
        </Link>
        <Link
          to="/settings"
          className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-2xl text-center transition"
        >
          ⚙ Settings
        </Link>
      </div>

      {/* Scrape status */}
      <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Data sources</h2>
          <button
            onClick={() => handleScrape("all")}
            disabled={!!scraping}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg transition disabled:opacity-50"
          >
            {scraping === "all" ? "Scraping…" : "Scrape all"}
          </button>
        </div>

        {stats &&
          Object.entries(stats.last_scrape).map(([source, log]) => (
            <div key={source} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    !log ? "bg-slate-600" : log.status === "success" ? "bg-green-500" : log.status === "running" ? "bg-yellow-400 animate-pulse" : "bg-red-500"
                  }`}
                />
                <span className="text-slate-300 font-medium">{SOURCE_LABEL[source]}</span>
              </div>
              <div className="text-right">
                {log ? (
                  <>
                    <span className="text-slate-400 text-xs">
                      {log.finished_at
                        ? new Date(log.finished_at).toLocaleString("en-AU", { timeStyle: "short", dateStyle: "short" })
                        : "Running…"}
                    </span>
                    {log.error_message && (
                      <p className="text-red-400 text-xs">{log.error_message.slice(0, 50)}</p>
                    )}
                    {log.status === "success" && (
                      <p className="text-slate-500 text-xs">{log.listings_new} new · {log.listings_updated} updated</p>
                    )}
                  </>
                ) : (
                  <span className="text-slate-500 text-xs">Never scraped</span>
                )}
                <button
                  onClick={() => handleScrape(source as "domain" | "rea" | "allhomes")}
                  disabled={!!scraping}
                  className="ml-2 text-brand-400 hover:text-brand-300 text-xs disabled:opacity-40"
                >
                  Scrape
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
