import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Listing } from "../types/listing";

// Fix default marker icons
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const statusIcon = (status: string | null) => {
  const color = status === "liked" ? "#6366f1" : status === "applied" ? "#22c55e" : "#f59e0b";
  return L.divIcon({
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

interface Props {
  listings: Listing[];
}

// Canberra centre
const CANBERRA: [number, number] = [-35.2809, 149.1300];

export default function MapView({ listings }: Props) {
  const mapped = listings.filter((l) => l.latitude && l.longitude);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700" style={{ height: 420 }}>
      <MapContainer
        center={mapped.length ? [mapped[0].latitude!, mapped[0].longitude!] : CANBERRA}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapped.map((l) => (
          <Marker
            key={l.id}
            position={[l.latitude!, l.longitude!]}
            icon={statusIcon(l.status)}
          >
            <Popup>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{l.address}</p>
                {l.price_week && <p className="text-brand-600">${l.price_week}/wk</p>}
                <div className="flex gap-2 text-xs text-slate-600">
                  {l.beds != null && <span>{l.beds}bd</span>}
                  {l.baths != null && <span>{l.baths}ba</span>}
                </div>
                <a href={l.primary_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                  View listing →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
