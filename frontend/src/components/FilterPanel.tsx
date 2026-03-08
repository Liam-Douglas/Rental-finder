import { useFiltersStore } from "../store/filters";

export default function FilterPanel() {
  const { filters, setFilters, resetFilters } = useFiltersStore();

  return (
    <div className="bg-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Filters</h2>
        <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-white">
          Reset all
        </button>
      </div>

      {/* Price */}
      <div>
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Price / week</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ""}
            onChange={(e) => setFilters({ priceMin: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ""}
            onChange={(e) => setFilters({ priceMax: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Beds */}
      <div>
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Min bedrooms</label>
        <div className="flex gap-2">
          {[null, 1, 2, 3, 4].map((n) => (
            <button
              key={n ?? "any"}
              onClick={() => setFilters({ bedsMin: n })}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
                filters.bedsMin === n
                  ? "bg-brand-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {n ?? "Any"}
            </button>
          ))}
        </div>
      </div>

      {/* Baths */}
      <div>
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Min bathrooms</label>
        <div className="flex gap-2">
          {[null, 1, 2, 3].map((n) => (
            <button
              key={n ?? "any"}
              onClick={() => setFilters({ bathsMin: n })}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
                filters.bathsMin === n
                  ? "bg-brand-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {n ?? "Any"}
            </button>
          ))}
        </div>
      </div>

      {/* Suburbs */}
      <div>
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-1">
          Suburbs (comma-separated)
        </label>
        <input
          type="text"
          placeholder="e.g. Braddon, Civic, Kingston"
          value={filters.suburbs.join(", ")}
          onChange={(e) =>
            setFilters({
              suburbs: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Toggles */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilters({ petFriendly: filters.petFriendly ? null : true })}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
            filters.petFriendly ? "bg-brand-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          🐾 Pet friendly
        </button>
        <button
          onClick={() => setFilters({ furnished: filters.furnished ? null : true })}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
            filters.furnished ? "bg-brand-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          🛋 Furnished
        </button>
      </div>

      {/* Parking */}
      <div>
        <label className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Min parking</label>
        <div className="flex gap-2">
          {[null, 1, 2].map((n) => (
            <button
              key={n ?? "any"}
              onClick={() => setFilters({ parkingMin: n })}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
                filters.parkingMin === n
                  ? "bg-brand-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {n ?? "Any"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
