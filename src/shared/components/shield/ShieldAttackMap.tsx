/**
 * ShieldAttackMap — Digital Attack Map visualization with world map,
 * animated attack flow arcs, and deep analytics panels.
 *
 * Uses raw SVG + d3-geo for the map (React 19 compatible),
 * recharts for bandwidth timeline.
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Shield,
  ShieldAlert,
  Activity,
  Globe,
  Zap,
  TrendingUp,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
} from "lucide-react";
import {
  useFetchAttackMap,
  type AttackMapData,
  type AttackFlow,
} from "@/shared/hooks/resources/shieldHooks";
import { DashboardSkeleton } from "@/shared/components/ui/Skeleton";

// ─── Country Centroids (ISO Alpha-2 → [lng, lat]) ────────────

const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [-98.5, 39.8],
  CN: [104.2, 35.9],
  RU: [105.3, 61.5],
  DE: [10.5, 51.2],
  FR: [2.2, 46.2],
  GB: [-1.2, 52.9],
  BR: [-51.9, -14.2],
  IN: [78.9, 20.6],
  JP: [138.3, 36.2],
  KR: [127.8, 35.9],
  NG: [8.7, 9.1],
  ZA: [25.1, -30.6],
  AU: [133.8, -25.3],
  CA: [-106.3, 56.1],
  NL: [5.3, 52.1],
  UA: [31.2, 48.4],
  ID: [113.9, -0.8],
  TR: [35.2, 38.9],
  IR: [53.7, 32.4],
  VN: [108.3, 14.1],
  PK: [69.3, 30.4],
  TH: [100.5, 15.9],
  PL: [19.1, 51.9],
  EG: [30.8, 26.8],
  AR: [-63.6, -38.4],
  MX: [-102.6, 23.6],
  IT: [12.6, 41.9],
  ES: [-3.7, 40.5],
  SE: [18.6, 60.1],
  RO: [25.0, 45.9],
  TW: [121.0, 23.7],
  SG: [103.8, 1.4],
  MY: [101.7, 4.2],
  PH: [121.8, 12.9],
  BD: [90.4, 23.7],
  CO: [-74.3, 4.6],
  KE: [37.9, -0.0],
  GH: [-1.0, 7.9],
  unknown: [0, 0],
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ─── Attack Type Colors ────────────────────────────────────────

const ATTACK_COLORS: Record<string, string> = {
  tcp_flood: "#ef4444",
  syn_flood: "#f97316",
  udp_flood: "#eab308",
  http_flood: "#8b5cf6",
  dns_amplification: "#3b82f6",
  ntp_amplification: "#06b6d4",
  volumetric: "#ec4899",
  fragmentation: "#14b8a6",
  application: "#a855f7",
  unknown: "#6b7280",
};

const PIE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#8b5cf6",
  "#3b82f6", "#06b6d4", "#ec4899", "#14b8a6",
];

// ─── Helpers ───────────────────────────────────────────────────

const formatBps = (bps: number): string => {
  if (bps >= 1e12) return `${(bps / 1e12).toFixed(1)} Tbps`;
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(1)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(1)} Kbps`;
  return `${bps} bps`;
};

const formatNumber = (n: number): string => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
};

const getCountryName = (code: string): string => {
  const names: Record<string, string> = {
    US: "United States", CN: "China", RU: "Russia", DE: "Germany",
    FR: "France", GB: "United Kingdom", BR: "Brazil", IN: "India",
    JP: "Japan", KR: "South Korea", NG: "Nigeria", ZA: "South Africa",
    AU: "Australia", CA: "Canada", NL: "Netherlands", UA: "Ukraine",
    ID: "Indonesia", TR: "Turkey", IR: "Iran", VN: "Vietnam",
    PK: "Pakistan", TH: "Thailand", PL: "Poland", EG: "Egypt",
    AR: "Argentina", MX: "Mexico", IT: "Italy", ES: "Spain",
    SE: "Sweden", RO: "Romania", TW: "Taiwan", SG: "Singapore",
    MY: "Malaysia", PH: "Philippines", BD: "Bangladesh", CO: "Colombia",
    KE: "Kenya", GH: "Ghana", unknown: "Unknown",
  };
  return names[code] || code;
};

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ─── Sub-components ────────────────────────────────────────────

const SummaryCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => (
  <div className={`rounded-xl ${color} p-4`}>
    <div className="flex items-center gap-2 text-xs opacity-80">{icon} {label}</div>
    <div className="mt-1 text-2xl font-bold">{value}</div>
    {sub && <div className="mt-0.5 text-xs opacity-60">{sub}</div>}
  </div>
);

// ─── SVG World Map ─────────────────────────────────────────────

const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;

interface WorldMapProps {
  flows: AttackFlow[];
  activeFlows: AttackFlow[];
  sourceMarkers: Array<{ code: string; coords: [number, number]; count: number; size: number }>;
  targetMarkers: Array<{ code: string; coords: [number, number]; count: number }>;
  zoom: number;
  center: [number, number];
  onZoom: (z: number) => void;
  onCenter: (c: [number, number]) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({
  flows, _activeFlows, sourceMarkers, targetMarkers,
  zoom, center, onZoom, onCenter,
}) => {
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [mapLoadError, setMapLoadError] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; center: [number, number] } | null>(null);

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((topo: Topology) => {
        const countries = feature(topo, topo.objects.countries as unknown);
        setGeoData(countries as unknown as GeoJSON.FeatureCollection);
      })
      .catch(() => {
        setMapLoadError(true);
      });
  }, []);

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(130 * zoom)
        .center(center)
        .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]),
    [zoom, center]
  );

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const project = useCallback(
    (coords: [number, number]): [number, number] | null => {
      const p = projection(coords);
      return p ? [p[0], p[1]] : null;
    },
    [projection]
  );

  // Build curved arc path between two projected points
  const buildArc = useCallback(
    (from: [number, number], to: [number, number]): string | null => {
      const p1 = project(from);
      const p2 = project(to);
      if (!p1 || !p2) return null;
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
      return `M${p1[0]},${p1[1]} A${dr},${dr} 0 0,1 ${p2[0]},${p2[1]}`;
    },
    [project]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      onZoom(Math.max(1, Math.min(8, zoom * factor)));
    },
    [zoom, onZoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, center: [...center] as [number, number] };
    },
    [center]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !dragStart.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const scale = 130 * zoom;
      onCenter([
        dragStart.current.center[0] - dx / scale * 50,
        dragStart.current.center[1] + dy / scale * 50,
      ]);
    },
    [dragging, zoom, onCenter]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  if (mapLoadError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl bg-neutral-100 text-[var(--theme-muted-color)] dark:bg-neutral-900">
        <Globe size={32} className="opacity-40" />
        <span className="text-sm font-medium">Map unavailable</span>
        <span className="text-xs opacity-60">Could not load world map data</span>
      </div>
    );
  }

  if (!geoData) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--theme-muted-color)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--theme-color)] border-t-transparent" />
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      className="w-full"
      style={{ aspectRatio: `${MAP_WIDTH}/${MAP_HEIGHT}`, cursor: dragging ? "grabbing" : "grab" }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Ocean background */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0f172a" />

      {/* Country shapes */}
      {geoData.features.map((feat, i) => (
        <path
          key={i}
          d={pathGenerator(feat) || ""}
          fill="#1e293b"
          stroke="#334155"
          strokeWidth={0.4}
        />
      ))}

      {/* Attack flow arcs */}
      {flows.map((flow, i) => {
        const from = COUNTRY_COORDS[flow.source_country] || COUNTRY_COORDS.unknown;
        const to = COUNTRY_COORDS[flow.target_country] || COUNTRY_COORDS.NG;
        if (from[0] === to[0] && from[1] === to[1]) return null;
        const arcPath = buildArc(from, to);
        if (!arcPath) return null;
        const color = ATTACK_COLORS[flow.type] || ATTACK_COLORS.unknown;
        const isActive = !flow.mitigated;
        return (
          <path
            key={`arc-${i}`}
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth={isActive ? 2 : 1}
            strokeOpacity={isActive ? 0.8 : 0.35}
            strokeLinecap="round"
            className={isActive ? "animate-pulse" : ""}
          />
        );
      })}

      {/* Source markers (red) */}
      {sourceMarkers.map((m) => {
        const p = project(m.coords);
        if (!p) return null;
        return (
          <g key={`src-${m.code}`}>
            <circle cx={p[0]} cy={p[1]} r={m.size} fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth={1} />
            <circle cx={p[0]} cy={p[1]} r={2} fill="#ef4444" />
          </g>
        );
      })}

      {/* Target markers (green) */}
      {targetMarkers.map((m) => {
        const p = project(m.coords);
        if (!p) return null;
        return (
          <g key={`tgt-${m.code}`}>
            <circle cx={p[0]} cy={p[1]} r={8} fill="rgba(16,185,129,0.25)" stroke="#10b981" strokeWidth={1.5} />
            <circle cx={p[0]} cy={p[1]} r={3} fill="#10b981" />
          </g>
        );
      })}
    </svg>
  );
};

// ─── Main Component ────────────────────────────────────────────

const ShieldAttackMap: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useFetchAttackMap(undefined, {
    refetchInterval: 30_000,
  });

  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([10, 20]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<string | null>("sources");

  const mapData = data as AttackMapData | undefined;

  const filteredFlows = useMemo(() => {
    if (!mapData?.flows) return [];
    if (!selectedType) return mapData.flows;
    return mapData.flows.filter((f) => f.type === selectedType);
  }, [mapData?.flows, selectedType]);

  const activeFlows = useMemo(
    () => filteredFlows.filter((f) => !f.mitigated),
    [filteredFlows]
  );

  const sourceMarkers = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const flow of filteredFlows) {
      counts[flow.source_country] = (counts[flow.source_country] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([code, count]) => ({
        code,
        coords: COUNTRY_COORDS[code] || COUNTRY_COORDS.unknown,
        count,
        size: Math.min(Math.max(count * 2, 4), 16),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredFlows]);

  const targetMarkers = useMemo(() => {
    const targets: Record<string, number> = {};
    for (const flow of filteredFlows) {
      targets[flow.target_country] = (targets[flow.target_country] || 0) + 1;
    }
    return Object.entries(targets).map(([code, count]) => ({
      code,
      coords: COUNTRY_COORDS[code] || COUNTRY_COORDS.NG,
      count,
    }));
  }, [filteredFlows]);

  const typeChartData = useMemo(() => {
    if (!mapData?.by_type) return [];
    return Object.entries(mapData.by_type).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }));
  }, [mapData?.by_type]);

  const topSources = useMemo(() => {
    if (!mapData?.top_sources) return [];
    const total = Object.values(mapData.top_sources).reduce((s, v) => s + v, 0);
    return Object.entries(mapData.top_sources).map(([code, count]) => ({
      code,
      name: getCountryName(code),
      count,
      pct: total > 0 ? ((count / total) * 100).toFixed(1) : "0",
    }));
  }, [mapData?.top_sources]);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.5, 8)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.5, 1)), []);
  const handleReset = useCallback(() => {
    setZoom(1);
    setCenter([10, 20]);
  }, []);

  const togglePanel = useCallback((panel: string) => {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <ShieldAlert size={40} className="text-red-400" />
        <p className="text-sm text-red-600">
          {error?.message || "Failed to load attack map data."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = mapData?.summary;

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          icon={<Shield size={14} />}
          label="Total Attacks"
          value={formatNumber(summary?.total_attacks ?? 0)}
          color="bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200"
        />
        <SummaryCard
          icon={<ShieldAlert size={14} />}
          label="Active Attacks"
          value={formatNumber(summary?.active_attacks ?? 0)}
          sub={summary?.active_attacks ? "LIVE" : "None"}
          color={
            (summary?.active_attacks ?? 0) > 0
              ? "bg-red-100 text-red-950 dark:bg-red-900/50 dark:text-red-100"
              : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          }
        />
        <SummaryCard
          icon={<Activity size={14} />}
          label="Mitigated"
          value={formatNumber(summary?.mitigated ?? 0)}
          sub={
            summary && summary.total_attacks > 0
              ? `${((summary.mitigated / summary.total_attacks) * 100).toFixed(0)}% rate`
              : undefined
          }
          color="bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        />
        <SummaryCard
          icon={<Zap size={14} />}
          label="Peak Bandwidth"
          value={formatBps(summary?.total_bandwidth_bps ?? 0)}
          color="bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
        />
        <SummaryCard
          icon={<Globe size={14} />}
          label="Protected Domains"
          value={String(summary?.active_domains ?? 0)}
          color="bg-violet-50 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200"
        />
      </div>

      {/* ── Map + Side Panels ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Map Container */}
        <div className="db-surface-card relative overflow-hidden rounded-2xl border">
          {/* Zoom Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            <button
              onClick={handleZoomIn}
              className="rounded-lg bg-white/90 p-2 shadow-md transition hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-700"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              className="rounded-lg bg-white/90 p-2 shadow-md transition hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-700"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg bg-white/90 p-2 shadow-md transition hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-700"
              title="Reset view"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Type Filter */}
          {mapData?.by_type && Object.keys(mapData.by_type).length > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition ${
                    selectedType === null
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-white/90 text-neutral-700 hover:bg-white dark:bg-neutral-800/90 dark:text-neutral-300"
                  }`}
                >
                  <Filter size={10} /> All
                </button>
                {Object.keys(mapData.by_type)
                  .slice(0, 5)
                  .map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setSelectedType(selectedType === type ? null : type)
                      }
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition ${
                        selectedType === type
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                          : "bg-white/90 text-neutral-700 hover:bg-white dark:bg-neutral-800/90 dark:text-neutral-300"
                      }`}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: ATTACK_COLORS[type] || ATTACK_COLORS.unknown,
                        }}
                      />
                      {type.replace(/_/g, " ")}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Active attack banner */}
          {activeFlows.length > 0 && (
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {activeFlows.length} active attack{activeFlows.length > 1 ? "s" : ""}
            </div>
          )}

          {/* The Map */}
          <WorldMap
            flows={filteredFlows}
            activeFlows={activeFlows}
            sourceMarkers={sourceMarkers}
            targetMarkers={targetMarkers}
            zoom={zoom}
            center={center}
            onZoom={setZoom}
            onCenter={setCenter}
          />
        </div>

        {/* ── Right Side Insight Panels ── */}
        <div className="flex flex-col gap-3">
          {/* Top Source Countries */}
          <div className="db-surface-card rounded-2xl border">
            <button
              onClick={() => togglePanel("sources")}
              className="flex w-full items-center justify-between p-4"
            >
              <h4 className="text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
                Top Attack Sources
              </h4>
              {expandedPanel === "sources" ? (
                <ChevronUp size={16} className="text-[var(--theme-muted-color)]" />
              ) : (
                <ChevronDown size={16} className="text-[var(--theme-muted-color)]" />
              )}
            </button>
            {expandedPanel === "sources" && (
              <div className="border-t px-4 pb-4 pt-3">
                {topSources.length === 0 ? (
                  <p className="text-xs text-[var(--theme-muted-color)]">
                    No attack sources detected
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {topSources.slice(0, 10).map((src, i) => (
                      <div key={src.code} className="flex items-center gap-3">
                        <span className="w-5 text-right text-xs font-medium text-[var(--theme-muted-color)]">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[var(--theme-heading-color)]">
                              {src.name}
                            </span>
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                              {src.count}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <div
                              className="h-full rounded-full bg-red-500"
                              style={{ width: `${src.pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-12 text-right text-xs text-[var(--theme-muted-color)]">
                          {src.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attack Type Breakdown */}
          <div className="db-surface-card rounded-2xl border">
            <button
              onClick={() => togglePanel("types")}
              className="flex w-full items-center justify-between p-4"
            >
              <h4 className="text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
                Attack Types
              </h4>
              {expandedPanel === "types" ? (
                <ChevronUp size={16} className="text-[var(--theme-muted-color)]" />
              ) : (
                <ChevronDown size={16} className="text-[var(--theme-muted-color)]" />
              )}
            </button>
            {expandedPanel === "types" && (
              <div className="border-t px-4 pb-4 pt-3">
                {typeChartData.length === 0 ? (
                  <p className="text-xs text-[var(--theme-muted-color)]">
                    No attack data
                  </p>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-48 w-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={typeChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {typeChartData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "rgba(15, 23, 42, 0.9)",
                              border: "none",
                              borderRadius: "8px",
                              color: "#f1f5f9",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-1.5">
                      {typeChartData.map((item, i) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-sm"
                              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                            <span className="capitalize text-[var(--theme-heading-color)]">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-semibold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Attacks List */}
          <div className="db-surface-card rounded-2xl border">
            <button
              onClick={() => togglePanel("active")}
              className="flex w-full items-center justify-between p-4"
            >
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
                <AlertTriangle size={14} className="text-red-500" />
                Live Attacks
                {activeFlows.length > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/50 dark:text-red-300">
                    {activeFlows.length}
                  </span>
                )}
              </h4>
              {expandedPanel === "active" ? (
                <ChevronUp size={16} className="text-[var(--theme-muted-color)]" />
              ) : (
                <ChevronDown size={16} className="text-[var(--theme-muted-color)]" />
              )}
            </button>
            {expandedPanel === "active" && (
              <div className="border-t px-4 pb-4 pt-3">
                {activeFlows.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Shield size={24} className="text-emerald-500" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      All clear
                    </p>
                    <p className="text-xs text-[var(--theme-muted-color)]">
                      No active attacks detected
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeFlows.slice(0, 8).map((flow, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-red-50 p-3 dark:bg-red-950/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold capitalize text-red-800 dark:text-red-300">
                            {flow.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {flow.started_at ? timeAgo(flow.started_at) : "—"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-red-700 dark:text-red-400">
                          <span>
                            {getCountryName(flow.source_country)} →{" "}
                            {flow.target_domain || getCountryName(flow.target_country)}
                          </span>
                          <span className="font-semibold">
                            {formatBps(flow.peak_bps)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bandwidth Timeline ── */}
      {mapData?.timeline && mapData.timeline.length > 0 && (
        <div className="db-surface-card rounded-2xl border p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            <TrendingUp size={14} /> Traffic Timeline
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mapData.timeline}>
                <defs>
                  <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  }
                  stroke="#94a3b8"
                />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#3b82f6"
                  fill="url(#bwGrad)"
                  strokeWidth={2}
                  name="Requests"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stroke="#ef4444"
                  fill="url(#blockedGrad)"
                  strokeWidth={2}
                  name="Blocked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── All Attacks Table ── */}
      {filteredFlows.length > 0 && (
        <div className="db-surface-card rounded-2xl border p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            All Recorded Attacks ({filteredFlows.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase tracking-wider text-[var(--theme-muted-color)]">
                  <th className="pb-3 pr-4">Source</th>
                  <th className="pb-3 pr-4">Target</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Peak BPS</th>
                  <th className="pb-3 pr-4">Peak PPS</th>
                  <th className="pb-3 pr-4">Started</th>
                  <th className="pb-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFlows.slice(0, 50).map((flow, i) => (
                  <tr
                    key={i}
                    className={!flow.mitigated ? "bg-red-50/50 dark:bg-red-950/20" : ""}
                  >
                    <td className="py-2.5 pr-4 font-medium text-[var(--theme-heading-color)]">
                      {getCountryName(flow.source_country)}
                    </td>
                    <td className="py-2.5 pr-4">
                      {flow.target_domain || getCountryName(flow.target_country)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: ATTACK_COLORS[flow.type] || ATTACK_COLORS.unknown }}
                        />
                        {flow.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      {formatBps(flow.peak_bps)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      {flow.peak_pps ? formatNumber(flow.peak_pps) : "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-[var(--theme-muted-color)]">
                      {flow.started_at ? new Date(flow.started_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      {flow.mitigated ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Mitigated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShieldAttackMap;
