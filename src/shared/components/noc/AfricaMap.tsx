import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import type { NocRegionSummary, NocStatus } from "@/hooks/adminHooks/nocHooks";

/**
 * NOC region map — a real, interactive slippy map (Leaflet + OpenStreetMap/CARTO
 * tiles). Operators can pan and zoom; each active region/data-centre is a
 * status-coloured marker with an always-on label showing its health + VM count.
 *
 * The basemap follows the app theme: CARTO dark tiles in dark mode, light tiles
 * in light mode. We read the theme straight off the `.dark` class on <html>
 * (set by useTheme) via a MutationObserver, so the map re-tiles the instant the
 * theme flips regardless of which component triggered the toggle.
 *
 * CircleMarkers (vector) are used instead of icon markers so there are no broken
 * image-path issues under Vite, and the dots double as health indicators.
 */

const STATUS_HEX: Record<NocStatus, string> = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  unknown: "#94a3b8",
  offline: "#64748b",
};

const STATUS_LABEL: Record<NocStatus, string> = {
  green: "Healthy",
  amber: "Degraded",
  red: "Critical",
  unknown: "Unknown",
  offline: "Offline",
};

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Basemap tiles + container background for the active theme. */
export const tileConfigFor = (isDark: boolean): { url: string; background: string } =>
  isDark
    ? { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", background: "#0a1424" }
    : { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", background: "#e8eef4" };

/** Reactively tracks the `.dark` class on <html> so the map follows the theme. */
const useIsDarkTheme = (): boolean => {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

export interface RegionMarker {
  code: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  status: NocStatus;
}

/** Region summaries → renderable markers, dropping any without real coordinates. */
export const buildRegionMarkers = (regions: NocRegionSummary[]): RegionMarker[] =>
  regions
    .filter((r) => Number(r.latitude) !== 0 || Number(r.longitude) !== 0)
    .map((r) => {
      const vms = r.counts?.vms ?? 0;
      return {
        code: r.code,
        lat: Number(r.latitude),
        lng: Number(r.longitude),
        color: STATUS_HEX[r.status] ?? STATUS_HEX.unknown,
        status: r.status,
        label: `${r.city || r.name} · ${STATUS_LABEL[r.status] ?? "Unknown"}${
          vms > 0 ? ` · ${vms} VM${vms > 1 ? "s" : ""}` : ""
        }`,
      };
    });

interface Props {
  regions: NocRegionSummary[];
  onRegionClick?: (region: NocRegionSummary) => void;
  highlightedCode?: string;
  className?: string;
}

const AfricaMap: React.FC<Props> = ({ regions, onRegionClick, highlightedCode, className = "" }) => {
  const isDark = useIsDarkTheme();
  const tiles = tileConfigFor(isDark);
  const markers = buildRegionMarkers(regions);

  return (
    <MapContainer
      center={[2, 20]}
      zoom={3}
      minZoom={2}
      maxZoom={18}
      scrollWheelZoom
      worldCopyJump
      className={`h-full w-full ${className}`}
      style={{ height: "100%", width: "100%", background: tiles.background }}
    >
      <TileLayer
        // key forces a re-tile when the theme flips (TileLayer url is read once on mount).
        key={isDark ? "dark" : "light"}
        url={tiles.url}
        attribution={TILE_ATTRIBUTION}
        subdomains="abcd"
        maxZoom={20}
      />
      {markers.map((m) => {
        const highlighted = highlightedCode === m.code;
        const region = regions.find((r) => r.code === m.code);
        return (
          <CircleMarker
            key={m.code}
            center={[m.lat, m.lng]}
            radius={highlighted ? 13 : 10}
            pathOptions={{
              color: m.color,
              fillColor: m.color,
              fillOpacity: 0.85,
              weight: highlighted ? 4 : 2,
            }}
            eventHandlers={
              onRegionClick && region ? { click: () => onRegionClick(region) } : undefined
            }
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent>
              {m.label}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default AfricaMap;
