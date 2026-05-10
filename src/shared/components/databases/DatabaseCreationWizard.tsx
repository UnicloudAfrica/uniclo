/**
 * DatabaseCreationWizard — Multi-step wizard for creating a managed database.
 *
 * Steps: Engine → Configure → Review → Payment (conditional) → Success
 * Uses ProvisioningWizardLayout + PaymentModal.
 */
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  Server,
  Shield,
  Cloud,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  Info,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import ProvisioningWizardLayout from "@/shared/components/instance-wizard/ProvisioningWizardLayout";
import PaymentModal from "@/shared/components/ui/payment/PaymentModal";
import CustomerContextSelector from "@/shared/components/common/CustomerContextSelector";
import ProjectMembershipSelector from "@/shared/components/instance-wizard/ProjectMembershipSelector";
import EngineIcon, { getEngineLabel } from "./EngineIcon";
import {
  useDatabaseProvisioningLogic,
  ENGINE_METADATA,
  PLAN_SPECS,
  getRegionLabel,
} from "@/hooks/useDatabaseProvisioningLogic";
import type { DatabaseEngine, PlanSize, CloudAccount } from "@/types/managedDatabase";
import { useFetchCloudAccounts } from "@/shared/hooks/resources/managedDatabaseHooks";
import { sanitizeProviderLabel } from "@/utils/sanitizeProviderLabel";

interface DatabaseCreationWizardProps {
  context: "admin" | "tenant" | "client";
  listPath?: string;
}

const PLAN_SIZES: PlanSize[] = ["micro", "small", "medium", "large", "xlarge"];

/** Engine categories for the wizard grid display. */
const ENGINE_CATEGORIES: { key: string; label: string; description: string }[] = [
  { key: "relational", label: "Relational (SQL)", description: "ACID-compliant relational databases" },
  { key: "document", label: "Document", description: "Flexible schema document stores" },
  { key: "key_value", label: "Key-Value / Cache", description: "In-memory and cache stores" },
  { key: "timeseries", label: "Time-Series", description: "Optimized for metrics and events" },
  { key: "wide_column", label: "Wide-Column", description: "Distributed column stores" },
  { key: "search", label: "Search", description: "Full-text search and analytics" },
  { key: "vector", label: "Vector", description: "AI and similarity search" },
  { key: "graph", label: "Graph", description: "Relationship-focused databases" },
  { key: "messaging", label: "Messaging / Streaming", description: "Event streaming and message brokers" },
  { key: "analytics", label: "Analytics", description: "OLAP and real-time analytics" },
  { key: "infrastructure", label: "Infrastructure", description: "Service discovery and coordination" },
  { key: "object_storage", label: "Object Storage", description: "S3-compatible storage" },
];

// ─── Engine Selection Step ───────────────────────────────────────────

const EngineStep: React.FC<{
  selectedEngine: string;
  onSelect: (engine: DatabaseEngine) => void;
  engines: typeof ENGINE_METADATA;
  form: ReturnType<typeof useDatabaseProvisioningLogic>["form"];
  updateForm: ReturnType<typeof useDatabaseProvisioningLogic>["updateForm"];
  context: "admin" | "tenant" | "client";
  profileCountry: string;
  countryOptions: { value: string; label: string }[];
  isCountriesLoading: boolean;
  isCountryLocked: boolean;
  tenants: unknown;
  isTenantsFetching: boolean;
  userPool: unknown;
  isUsersFetching: boolean;
  customerContextType: string;
  onContextTypeChange: (type: string) => void;
  selectedTenantId: string;
  onTenantChange: (id: string) => void;
  selectedUserId: string;
  onUserChange: (id: string) => void;
  // Membership
  assignmentScope: string;
  shouldFetchMembers: boolean;
  isMembersFetching: boolean;
  selectedMembers: unknown[];
  selectedMemberIds: Set<number>;
  suggestedMembers: unknown[];
  showRestoreMembers: boolean;
  onToggleMember: (member: unknown) => void;
  onRestoreMembers: () => void;
}> = ({
  selectedEngine,
  onSelect,
  engines,
  form,
  updateForm,
  context,
  countryOptions,
  isCountriesLoading,
  isCountryLocked,
  tenants,
  isTenantsFetching,
  userPool,
  isUsersFetching,
  customerContextType,
  onContextTypeChange,
  selectedTenantId,
  onTenantChange,
  selectedUserId,
  onUserChange,
  assignmentScope,
  shouldFetchMembers,
  isMembersFetching,
  selectedMembers,
  selectedMemberIds,
  suggestedMembers,
  showRestoreMembers,
  onToggleMember,
  onRestoreMembers,
}) => (
  <div className="space-y-6">
    {/* ── Workflow & Assignment (top) ── */}
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Workflow & Assignment
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose who this resource is for and set billing details.
        </p>
      </div>

      {/* Customer Context Selector — admin only */}
      {context === "admin" && (
        <CustomerContextSelector
          contextType={customerContextType as never}
          setContextType={onContextTypeChange}
          selectedTenantId={selectedTenantId}
          setSelectedTenantId={onTenantChange}
          selectedUserId={selectedUserId}
          setSelectedUserId={onUserChange}
          tenants={tenants as never}
          isTenantsFetching={isTenantsFetching}
          userPool={userPool as never}
          isUsersFetching={isUsersFetching}
        />
      )}

      {/* Billing Country */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Billing Country
        </label>
        {isCountryLocked ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-700 dark:text-gray-300 shadow-sm">
            {countryOptions.find((c) => c.value === form.billingCountry)?.label ||
              form.billingCountry ||
              "Not set"}
            <span className="ml-2 inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 ring-1 ring-inset ring-gray-500/10">
              Default from profile
            </span>
          </div>
        ) : (
          <select
            value={form.billingCountry}
            onChange={(e) => updateForm({ billingCountry: e.target.value })}
            disabled={isCountriesLoading}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Select billing country</option>
            {countryOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {isCountryLocked
            ? "Country is mandated by your account settings."
            : "Used for tax calculation and currency selection."}
        </p>
      </div>

      {/* Fast-Track Toggle (admin/tenant only) */}
      {context !== "client" && (
        <div className="space-y-3">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Provisioning Mode
          </label>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => updateForm({ fastTrack: false, fastTrackEndsAt: "" })}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                !form.fastTrack
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Standard</p>
              <p className="text-xs text-gray-500">Configure, price, and pay.</p>
            </button>
            <button
              type="button"
              onClick={() => updateForm({ fastTrack: true })}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                form.fastTrack
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Fast-Track</p>
              <p className="text-xs text-gray-500">Provision now, pay later.</p>
            </button>
          </div>

          {form.fastTrack && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                End of Fast-Track
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                After this date, a renewal transaction is created and the user must pay to continue the service.
              </p>
              <input
                type="date"
                value={form.fastTrackEndsAt}
                onChange={(e) => updateForm({ fastTrackEndsAt: e.target.value })}
                min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {form.fastTrackEndsAt && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Billing starts on{" "}
                  <span className="font-semibold">
                    {new Date(form.fastTrackEndsAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>

    {/* ── Project Members ── */}
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <ProjectMembershipSelector
        assignmentScope={assignmentScope}
        lockAssignmentScope={context === "admin"}
        shouldFetchMembers={shouldFetchMembers}
        isMembersFetching={isMembersFetching}
        selectedMembers={selectedMembers}
        selectedMemberIds={selectedMemberIds}
        suggestedMembers={suggestedMembers}
        showRestoreMembers={showRestoreMembers}
        onAssignmentScopeChange={(scope) => updateForm({ assignmentScope: scope as "internal" | "tenant" | "client" })}
        onToggleMember={onToggleMember}
        onRestoreMembers={onRestoreMembers}
      />
    </div>

    {/* ── Engine Selection (search + collapsible categories) ──
        Previously every category was expanded by default — with 12
        categories and ~50 engines the list ran several screens long.
        Now we render a search box at the top and collapse every
        category by default; click a header to expand. The category
        of the currently-selected engine auto-expands so the user
        sees their pick. Typing in search overrides collapsed state
        and shows every matching engine flat. */}
    <EngineSelector
      engines={engines}
      selectedEngine={selectedEngine}
      onSelect={onSelect}
    />
  </div>
);

interface EngineSelectorProps {
  engines: typeof ENGINE_METADATA;
  selectedEngine: string;
  onSelect: (engine: DatabaseEngine) => void;
}

const CATEGORY_ACCENT_COLORS: Record<string, string> = {
  relational: "border-l-blue-500",
  document: "border-l-emerald-500",
  key_value: "border-l-red-500",
  timeseries: "border-l-amber-500",
  wide_column: "border-l-violet-500",
  search: "border-l-cyan-500",
  vector: "border-l-fuchsia-500",
  graph: "border-l-rose-500",
  messaging: "border-l-orange-500",
  analytics: "border-l-teal-500",
  infrastructure: "border-l-slate-500",
  object_storage: "border-l-lime-500",
};

const EngineSelector: React.FC<EngineSelectorProps> = ({
  engines,
  selectedEngine,
  onSelect,
}) => {
  const [searchInput, setSearchInput] = React.useState("");
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>(
    () => {
      // Auto-expand whichever category contains the currently-selected
      // engine so the user lands looking at their pick. Everything
      // else stays collapsed by default.
      const selectedMeta = selectedEngine ? engines[selectedEngine as DatabaseEngine] : undefined;
      if (selectedMeta?.category) return { [selectedMeta.category]: true };
      // No selection yet — open Relational so the page isn't a wall
      // of collapsed headers.
      return { relational: true };
    },
  );

  const search = searchInput.trim().toLowerCase();
  const isSearching = search.length > 0;

  const toggleCategory = (key: string) =>
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));

  // Pre-group engines by category once so each render doesn't re-walk
  // the metadata.
  const enginesByCategory = React.useMemo(() => {
    const grouped: Record<string, Array<[string, (typeof engines)[DatabaseEngine]]>> = {};
    Object.entries(engines).forEach(([engine, meta]) => {
      const cat = meta.category || "other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push([engine, meta]);
    });
    return grouped;
  }, [engines]);

  // When searching we ignore collapsed state and just filter every
  // category in the same order as ENGINE_CATEGORIES.
  const matchesSearch = (
    engine: string,
    meta: (typeof engines)[DatabaseEngine],
  ): boolean => {
    if (!isSearching) return true;
    const haystack = `${meta.label} ${engine} ${meta.description ?? ""} ${(meta.versions ?? []).join(" ")}`.toLowerCase();
    return haystack.includes(search);
  };

  const totalEngines = Object.values(enginesByCategory).reduce((n, list) => n + list.length, 0);
  const totalMatches = isSearching
    ? Object.values(enginesByCategory).reduce(
        (n, list) => n + list.filter(([engine, meta]) => matchesSearch(engine, meta)).length,
        0,
      )
    : totalEngines;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Select Database Engine
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSearching
              ? `${totalMatches} of ${totalEngines} engines match "${search}"`
              : `Pick a category to expand — or search across all ${totalEngines} engines.`}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Postgres, Redis, kafka…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
      </div>

      {ENGINE_CATEGORIES.map((cat) => {
        const all = enginesByCategory[cat.key] ?? [];
        if (all.length === 0) return null;
        const filtered = all.filter(([engine, meta]) => matchesSearch(engine, meta));
        if (isSearching && filtered.length === 0) return null;

        const accent = CATEGORY_ACCENT_COLORS[cat.key] || "border-l-gray-400";
        // While searching, force-expand every category that has matches
        // so the user can see all results at once. Otherwise honour the
        // local toggle state.
        const isExpanded = isSearching ? true : !!expandedCategories[cat.key];

        return (
          <div
            key={cat.key}
            className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/50"
          >
            <button
              type="button"
              onClick={() => !isSearching && toggleCategory(cat.key)}
              className={`flex w-full items-center justify-between gap-3 border-l-[3px] px-3 py-2.5 text-left ${accent} ${
                isSearching ? "cursor-default" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {cat.label}
                  </h4>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {isSearching ? `${filtered.length}/${all.length}` : all.length}
                  </span>
                </div>
                <p className="text-xs italic text-gray-400/80 dark:text-gray-500/80">
                  {cat.description}
                </p>
              </div>
              {!isSearching &&
                (isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                ))}
            </button>

            {isExpanded && (
              <div className="grid grid-cols-1 gap-3 border-t border-gray-100 p-3 dark:border-gray-800 lg:grid-cols-2 xl:grid-cols-3">
                {filtered.map(([engine, meta]) => {
                  const isSelected = selectedEngine === engine;
                  return (
                    <button
                      key={engine}
                      onClick={() => onSelect(engine as DatabaseEngine)}
                      className={`group relative flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 shadow-md shadow-blue-500/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50/50 dark:hover:from-gray-800/50 dark:hover:to-slate-800/30 hover:shadow-sm"
                      }`}
                    >
                      {isSelected && (
                        <span className="pointer-events-none absolute inset-0 rounded-xl animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] border-2 border-blue-400/30" />
                      )}
                      <div className="shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110">
                        <EngineIcon engine={engine} iconUrl={meta.iconUrl} size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {meta.label}
                          </span>
                          {meta.license === "free_edition" && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                              Free
                            </span>
                          )}
                          {meta.license === "commercial" && (
                            <span className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                              BYOL
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500/90 dark:text-gray-400/90 mt-0.5 line-clamp-2 leading-relaxed">
                          {meta.description}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {meta.versions.slice(0, 3).join(", ")}
                          {meta.versions.length > 3 ? ` +${meta.versions.length - 3}` : ""}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2
                          className="absolute top-2 right-2 text-blue-500"
                          size={16}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {isSearching && totalMatches === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No engines match "{search}". Try "postgres", "redis", "kafka", or clear the search to
          browse by category.
        </p>
      )}
    </div>
  );
};

// ─── Version Selector ─────────────────────────────────────────────

/** Known LTS versions per engine. */
const LTS_VERSIONS: Record<string, string[]> = {
  mariadb: ["11.4", "10.11", "10.6"],
  postgresql: ["17", "16", "15", "14"],
  mysql: ["8.4", "8.0"],
  mongodb: ["8.0", "7.0"],
  elasticsearch: ["7.17"],
  neo4j: ["4.4"],
  redis: ["7.4", "7.2", "7.0"],
  rabbitmq: ["3.13"],
  nodejs: ["22", "20", "18"],
};

const VersionSelector: React.FC<{
  versions: string[];
  selected: string;
  onChange: (v: string) => void;
  defaultVersion?: string;
  engine?: string;
}> = ({ versions, selected, onChange, defaultVersion, engine }) => {
  const latestVersion = versions[0];
  const engineLts = engine ? LTS_VERSIONS[engine] || [] : [];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Engine Version
      </label>
      <div className="flex flex-wrap gap-2">
        {versions.map((v) => {
          const isSelected = selected === v;
          const isLatest = v === latestVersion;
          const isDefault = v === defaultVersion;
          const isLts = engineLts.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`relative inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 shadow-sm shadow-blue-500/10"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              {isLatest && (
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 shrink-0" title="Latest version" />
              )}
              <span>{v}</span>
              {isDefault && (
                <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                  Recommended
                </span>
              )}
              {isLts && !isDefault && (
                <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  LTS
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Feature Card (reusable toggle with friendly explanation) ────────

const FeatureCard: React.FC<{
  title: string;
  tag: string;
  tagColor: "green" | "gray" | "amber" | "blue";
  pricingNote?: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: () => void;
  explanation: string;
  whyItMatters: string;
  alwaysOnNote?: string;
  extraNote?: string;
}> = ({ title, tag, tagColor, pricingNote, icon, enabled, onToggle, explanation, whyItMatters, alwaysOnNote, extraNote }) => {
  const tagColors = {
    green: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    gray: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    amber: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    blue: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  };
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      enabled
        ? "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10"
        : "border-gray-200 dark:border-gray-700"
    }`}>
      {/* Header row */}
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tagColors[tagColor]}`}>
                {tag}
              </span>
              {pricingNote && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">({pricingNote})</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-3 shrink-0 sm:w-auto sm:justify-normal">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {expanded ? "Hide details" : "What's this?"}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expandable explanation */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-2.5 border-t border-gray-100 dark:border-gray-700/50 mt-0">
          <div className="pt-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {explanation}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-3 py-2">
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <strong>Why it matters:</strong> {whyItMatters}
            </p>
          </div>
          {alwaysOnNote && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 px-3 py-2">
              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                {alwaysOnNote}
              </p>
            </div>
          )}
          {extraNote && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 px-3 py-2">
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                {extraNote}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Configure Step ──────────────────────────────────────────────────

const ConfigureStep: React.FC<{
  form: ReturnType<typeof useDatabaseProvisioningLogic>["form"];
  updateForm: ReturnType<typeof useDatabaseProvisioningLogic>["updateForm"];
  selectedEngineMeta: ReturnType<typeof useDatabaseProvisioningLogic>["selectedEngineMeta"];
  projects: { value: number; label: string }[];
  regions: { value: string; label: string }[];
  availabilityZones: { value: string; label: string }[];
  maxReplicaCount: number;
  replicaAvailableAzs: { value: string; label: string }[];
  toggleReplicaAz: (azCode: string) => void;
  cloudAccounts?: { id: number; name: string; provider: string; provider_label: string; status: string }[];
}> = ({ form, updateForm, selectedEngineMeta, projects, regions, availabilityZones, maxReplicaCount, replicaAvailableAzs, toggleReplicaAz, cloudAccounts }) => (
  <div className="space-y-6">
    {/* Name */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Database Name <span className="text-gray-400">(optional)</span>
      </label>
      <input
        type="text"
        value={form.name}
        onChange={(e) => updateForm({ name: e.target.value })}
        placeholder="my-database"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>

    {/* Version */}
    {selectedEngineMeta && (
      <VersionSelector
        versions={selectedEngineMeta.versions}
        selected={form.engineVersion}
        onChange={(v) => updateForm({ engineVersion: v })}
        defaultVersion={selectedEngineMeta.defaultVersion}
        engine={form.engine}
      />
    )}

    {/* License — shown for commercial BYOL engines */}
    {selectedEngineMeta?.requiresLicenseKey && (
      <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-purple-600" />
          <span className="text-sm font-semibold text-purple-900 dark:text-purple-200">
            Commercial License Required
          </span>
        </div>

        {/* Explicit step-by-step explanation */}
        <div className="rounded-md bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900 p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            How licensing works:
          </p>
          <ol className="list-decimal list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>
              <strong>{selectedEngineMeta.label}</strong> is commercial software — you need a valid license to use it.
            </li>
            <li>
              If you <strong>already have a license key</strong>, choose &quot;I Have a License&quot; below and paste it in.
            </li>
            <li>
              If you <strong>don&apos;t have one</strong>, you&apos;ll soon be able to buy a license directly through us (coming soon).
            </li>
            <li>
              We store your key securely. It&apos;s passed to the database engine during setup — <strong>we never share it externally</strong>.
            </li>
          </ol>
        </div>

        {/* License mode selection */}
        <div className="flex gap-3">
          <button
            onClick={() => updateForm({ licenseMode: "byol", licenseKey: form.licenseKey })}
            className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
              form.licenseMode === "byol"
                ? "border-purple-500 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300"
            }`}
          >
            <div className="text-sm font-semibold">I Have a License</div>
            <div className="text-[10px] mt-0.5 opacity-75">Enter your existing license key</div>
          </button>
          <button
            disabled
            className="flex-1 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed relative"
          >
            <div className="text-sm font-semibold">Buy a License</div>
            <div className="text-[10px] mt-0.5 opacity-75">Purchase through our partners</div>
            <span className="absolute -top-2 -right-2 rounded-full bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700">
              COMING SOON
            </span>
          </button>
        </div>

        {/* License key input */}
        {form.licenseMode === "byol" && (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-purple-800 dark:text-purple-300">
              License Key
            </label>
            <input
              type="password"
              value={form.licenseKey}
              onChange={(e) => updateForm({ licenseKey: e.target.value })}
              placeholder="Paste your license key here..."
              className="w-full rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
            />
            <p className="text-[10px] text-purple-600 dark:text-purple-400">
              This is the product key or serial number you received when you purchased the software.
            </p>
          </div>
        )}
      </div>
    )}

    {/* Plan Size */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Plan Size
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {PLAN_SIZES.map((size) => {
          const spec = PLAN_SPECS[size];
          const isSelected = form.planSize === size;
          return (
            <button
              key={size}
              onClick={() => updateForm({ planSize: size })}
              className={`rounded-lg border-2 p-3 text-center transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {spec.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{spec.vcpu} vCPU</div>
              <div className="text-xs text-gray-500">
                {spec.memoryMb >= 1024
                  ? `${Math.round(spec.memoryMb / 1024)} GB RAM`
                  : `${spec.memoryMb} MB RAM`}
              </div>
              <div className="text-xs text-gray-500">{spec.storageGb} GB SSD</div>
            </button>
          );
        })}
      </div>
    </div>

    {/* Region */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Region
      </label>
      <select
        value={form.region}
        onChange={(e) => updateForm({ region: e.target.value, availabilityZone: "" })}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select region...</option>
        {regions.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </div>

    {/* Availability Zone */}
    {form.region && availabilityZones.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Availability Zone
        </label>
        <select
          value={form.availabilityZone}
          onChange={(e) => updateForm({ availabilityZone: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Auto-select (recommended)</option>
          {availabilityZones.map((az) => (
            <option key={az.value} value={az.value}>
              {az.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {availabilityZones.length} availability zone{availabilityZones.length !== 1 ? "s" : ""} available in this region.
        </p>
      </div>
    )}

    {/* Read Replicas — select AZs to place replicas in */}
    {form.region && form.availabilityZone && replicaAvailableAzs.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Read Replicas
        </label>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Select availability zones to place read replicas. Each selected AZ gets one replica for high availability.
        </p>
        <div className="space-y-2">
          {replicaAvailableAzs.map((az) => {
            const isSelected = form.replicaAzs.includes(az.value);
            const isDisabled = !isSelected && form.replicaAzs.length >= maxReplicaCount;
            return (
              <button
                key={az.value}
                onClick={() => toggleReplicaAz(az.value)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : isDisabled
                      ? "border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                  isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                }`}>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{az.label}</div>
                </div>
              </button>
            );
          })}
        </div>
        {form.replicaAzs.length > 0 && (
          <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            {form.replicaAzs.length} read replica{form.replicaAzs.length !== 1 ? "s" : ""} will be created ({form.replicaCount} total nodes including primary)
          </p>
        )}
      </div>
    )}

    {/* BYOC — Bring Your Own Cloud */}
    {cloudAccounts && cloudAccounts.length > 0 && (
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Cloud size={16} className="text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Deploy on Your Own Cloud (BYOC)
          </span>
          <span className="text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-300">
            OPTIONAL
          </span>
        </div>
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          Choose one of your connected cloud accounts to deploy this database on your own infrastructure.
          Leave empty to use our managed infrastructure.
        </p>
        <select
          value={form.cloudAccountId ?? ""}
          onChange={(e) => updateForm({ cloudAccountId: e.target.value ? Number(e.target.value) : null })}
          className="w-full rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Use managed infrastructure (default)</option>
          {cloudAccounts
            .filter((ca) => ca.status === "active")
            .map((ca) => (
              <option key={ca.id} value={ca.id}>
                {ca.name} — {ca.provider_label}
              </option>
            ))}
        </select>
        {form.cloudAccountId && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
            Your database will be provisioned using your cloud account credentials. Platform fee applies.
          </p>
        )}
      </div>
    )}

    {/* Project (optional) */}
    {projects.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project <span className="text-gray-400">(optional)</span>
        </label>
        <select
          value={form.projectId ?? ""}
          onChange={(e) =>
            updateForm({ projectId: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    )}

    {/* Billing Period */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Billing Period
      </label>
      <select
        value={form.months}
        onChange={(e) => updateForm({ months: Number(e.target.value) })}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <option value={1}>1 month</option>
        <option value={3}>3 months</option>
        <option value={6}>6 months</option>
        <option value={12}>12 months</option>
        <option value={24}>24 months</option>
      </select>
    </div>

    {/* ── Database Credentials ── */}
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Database Credentials
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Customize your database name, username and password, or let the system generate secure defaults.
          </p>
        </div>
        <button
          type="button"
          onClick={() => updateForm({
            useDefaultCredentials: !form.useDefaultCredentials,
            ...(!form.useDefaultCredentials ? { dbName: "", dbUser: "", dbPassword: "" } : {}),
          })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.useDefaultCredentials ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              form.useDefaultCredentials ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {form.useDefaultCredentials ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Info size={14} />
            <span>System will auto-generate secure credentials:</span>
          </div>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 ml-6 list-disc">
            <li>Database: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">defaultdb</code></li>
            <li>Username: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">dbadmin</code></li>
            <li>Password: <span className="italic">Auto-generated (32-char secure hash)</span></li>
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Database Name
            </label>
            <input
              type="text"
              value={form.dbName}
              onChange={(e) => updateForm({ dbName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
              placeholder="defaultdb"
              maxLength={63}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, underscores only. Max 63 characters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={form.dbUser}
              onChange={(e) => updateForm({ dbUser: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
              placeholder="dbadmin"
              maxLength={32}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={form.dbPassword}
              onChange={(e) => updateForm({ dbPassword: e.target.value })}
              placeholder="Leave empty to auto-generate"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Min 8 characters. Leave empty for a secure auto-generated password.
            </p>
          </div>
        </div>
      )}
    </div>

    {/* ═══════════════════════════════════════════════════════════════
         Security, Networking & Performance
         ═══════════════════════════════════════════════════════════════ */}
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Security, Networking & Performance
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Choose how your database is protected, accessed, and optimized. Features marked <span className="font-medium text-green-600 dark:text-green-400">FREE</span> are included at no extra cost.
        </p>
      </div>

      {/* ── 1. Automated Backups ── */}
      <FeatureCard
        title="Automated Backups"
        tag={form.backupEnabled ? "Enabled" : "Disabled"}
        tagColor={form.backupEnabled ? "green" : "gray"}
        pricingNote="10% of base plan"
        icon={<Shield size={18} className="text-blue-500" />}
        enabled={form.backupEnabled}
        onToggle={() => updateForm({ backupEnabled: !form.backupEnabled })}
        explanation="Think of this as a safety net. Every day, we take a snapshot of your entire database — like photocopying every page of a notebook. If something goes wrong (accidental delete, bad update, server crash), we can restore your data to any point in the last 7 days."
        whyItMatters="Without backups, if your data is lost, it's gone forever. With backups, you can always go back in time."
      />

      {/* ── 2. TLS Encryption ── */}
      <FeatureCard
        title="TLS Encryption"
        tag="FREE"
        tagColor="green"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        }
        enabled={form.tlsEnabled}
        onToggle={() => updateForm({ tlsEnabled: !form.tlsEnabled })}
        explanation="Every time your app talks to the database, the conversation is sealed in an encrypted envelope. Even if someone intercepts the traffic, they can't read your data. This is the same technology that protects your bank's website (the padlock icon in your browser)."
        whyItMatters="Without TLS, your database credentials and data travel in plain text — anyone on the network path could read them."
        alwaysOnNote="We strongly recommend keeping this enabled. It's free and protects your data in transit."
      />

      {/* ── 3. Connection Pooling ── */}
      <FeatureCard
        title="Connection Pooling"
        tag="FREE"
        tagColor="green"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        }
        enabled={form.connectionPooling}
        onToggle={() => updateForm({ connectionPooling: !form.connectionPooling })}
        explanation="Imagine your database is a restaurant with 100 seats. Without a pooler, every visitor grabs a seat and never leaves — even when they're not eating. The pooler acts like a host who seats people when they need to eat and frees up the table when they're done. This way, 500 visitors can share 100 seats efficiently."
        whyItMatters="Databases have a limited number of connections. Without pooling, your app can run out of connections and crash under load."
      />

      {/* ── 4. Network Access Mode ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Network Access</h4>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-[26px]">
            Choose whether your database can be reached from the public internet or only from within your private network.
          </p>
        </div>
        <div className="p-4 space-y-3">
          {/* Explanation box */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>How it works:</strong> Your database lives inside a private network (like a house inside a gated community). <strong>Public IP</strong> puts a mailbox on the main road so anyone with the address can reach it — but your firewall rules decide who gets through the gate. <strong>Private IP</strong> keeps everything inside the community — only other services in the same network can connect.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Public */}
            <button
              type="button"
              onClick={() => updateForm({ networkMode: "public" })}
              className={`relative flex flex-col gap-1.5 rounded-xl border-2 p-4 text-left transition-all ${
                form.networkMode === "public"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-200"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Public IP</span>
                <span className="ml-auto inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Connect from anywhere — your laptop, DBeaver, external apps. We assign a public address and a DNS name you can use from any network.
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <Shield size={11} />
                <span>Firewall rules still protect your database</span>
              </div>
              {form.networkMode === "public" && (
                <CheckCircle2 className="absolute top-3 right-3 text-blue-500" size={16} />
              )}
            </button>

            {/* Private */}
            <button
              type="button"
              onClick={() => updateForm({ networkMode: "private" })}
              className={`relative flex flex-col gap-1.5 rounded-xl border-2 p-4 text-left transition-all ${
                form.networkMode === "private"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-200"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Private IP</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Only reachable from inside your private network. Best when your app runs on the same platform and doesn't need outside access.
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400">
                <Shield size={11} />
                <span>Maximum isolation — invisible to the internet</span>
              </div>
              {form.networkMode === "private" && (
                <CheckCircle2 className="absolute top-3 right-3 text-blue-500" size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Dedicated Proxy VM (paid add-on) ── */}
      <FeatureCard
        title="Dedicated Connection Proxy"
        tag="Paid Add-on"
        tagColor="amber"
        pricingNote="Additional VM charge"
        icon={<Server size={18} className="text-amber-500" />}
        enabled={form.dedicatedProxy}
        onToggle={() => updateForm({ dedicatedProxy: !form.dedicatedProxy })}
        explanation="We place a separate security guard (a small server) in front of your database. All connections go through this guard first. The guard manages the queue, checks credentials, encrypts traffic, and hides your database's real location. Even if the guard gets overloaded, your actual database stays safe and untouched."
        whyItMatters="Without a proxy, your app connects directly to the database. If too many connections arrive at once, or an attacker finds your database, there's nothing in between. The proxy absorbs the load and adds an extra layer of protection."
        extraNote="This adds a small dedicated VM to your infrastructure. It handles connection pooling, TLS termination, and acts as a shield. Recommended for production workloads with many concurrent users."
      />

      {/* ── 6. VPN Gateway (paid add-on, enterprise) ── */}
      <FeatureCard
        title="Private VPN Access"
        tag="Enterprise Add-on"
        tagColor="amber"
        pricingNote="Additional VM charge"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        }
        enabled={form.vpnGateway}
        onToggle={() => updateForm({ vpnGateway: !form.vpnGateway })}
        explanation="We place a private VPN server in the same data center as your database. You download a small config file, import it into a free app (WireGuard) on your laptop or server, and click connect. Now your computer has a secret, encrypted tunnel directly into the data center — as if you were physically sitting next to the database. Nobody on the internet can see your traffic or even know the database exists."
        whyItMatters="With a public IP, your database is visible on the internet (even though it's firewalled). Some industries — banking, healthcare, fintech — require that databases are not publicly reachable at all. A VPN makes your database completely invisible to the outside world while still letting authorized users connect securely."
        extraNote="This adds a small WireGuard VPN server to your infrastructure. You'll get downloadable client configs for your team. Recommended for compliance-sensitive workloads, remote DBA access, and enterprise environments where 'no public internet exposure' is a requirement."
      />

      {/* ── 7. Disaster Recovery (coming soon) ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden opacity-60">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-gray-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Disaster Recovery</span>
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Coming soon
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                A full copy of your database in a different location. If your primary region goes down (power outage, natural disaster), the copy takes over automatically. Like having a spare key to your house stored at a trusted neighbor's place — in a different city.
              </p>
            </div>
          </div>
          <button
            disabled
            className="shrink-0 relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
          >
            <span className="inline-block h-4 w-4 rounded-full bg-white translate-x-1" />
          </button>
        </div>
      </div>
    </div>

  </div>
);

// ─── Review Step Content ─────────────────────────────────────────────

const ReviewContent: React.FC<{
  form: ReturnType<typeof useDatabaseProvisioningLogic>["form"];
  regions: { value: string; label: string }[];
  quoteResult: ReturnType<typeof useDatabaseProvisioningLogic>["quoteResult"];
  pricingSummary: ReturnType<typeof useDatabaseProvisioningLogic>["pricingSummary"];
  isQuoteLoading: boolean;
  onCreateOrder: () => void;
  isSubmitting: boolean;
  submissionErrorMessage: string | null;
  onBack: () => void;
}> = ({
  form,
  regions,
  quoteResult,
  pricingSummary,
  isQuoteLoading,
  onCreateOrder,
  isSubmitting,
  submissionErrorMessage,
  onBack,
}) => (
  <div className="mx-auto max-w-2xl space-y-6">
    {/* Configuration Summary */}
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Database size={18} />
          Database Configuration
        </h3>
      </div>
      <div className="p-5 space-y-3">
        <SummaryRow
          label="Engine"
          value={form.engine ? getEngineLabel(form.engine as DatabaseEngine) : "—"}
        />
        <SummaryRow label="Version" value={form.engineVersion || "—"} />
        <SummaryRow
          label="Plan"
          value={
            form.planSize ? PLAN_SPECS[form.planSize as PlanSize]?.label || form.planSize : "—"
          }
        />
        {form.planSize && (
          <SummaryRow
            label="Resources"
            value={`${PLAN_SPECS[form.planSize as PlanSize]?.vcpu} vCPU · ${Math.round((PLAN_SPECS[form.planSize as PlanSize]?.memoryMb || 0) / 1024)} GB RAM · ${PLAN_SPECS[form.planSize as PlanSize]?.storageGb} GB SSD`}
          />
        )}
        <SummaryRow label="Region" value={getRegionLabel(regions, form.region) || "—"} />
        {form.availabilityZone && (
          <SummaryRow label="Availability Zone" value={sanitizeProviderLabel(form.availabilityZone)} />
        )}
        {form.replicaCount > 1 && (
          <SummaryRow
            label="Read Replicas"
            value={`${form.replicaCount - 1} — ${form.replicaAzs.map(sanitizeProviderLabel).join(", ")}`}
          />
        )}
        <SummaryRow
          label="Billing Period"
          value={`${form.months} month${form.months > 1 ? "s" : ""}`}
        />
        <SummaryRow label="Backups" value={form.backupEnabled ? "Enabled (10% surcharge)" : "Disabled"} />
        <SummaryRow label="TLS Encryption" value={form.tlsEnabled ? "Enabled (Free)" : "Disabled"} />
        <SummaryRow label="Connection Pooling" value={form.connectionPooling ? "Enabled (Free)" : "Disabled"} />
        <SummaryRow
          label="Network Access"
          value={form.networkMode === "public" ? "Public IP (Elastic IP)" : "Private IP (VPC only)"}
        />
        {form.dedicatedProxy && (
          <SummaryRow label="Dedicated Proxy" value="Enabled (Paid add-on)" />
        )}
        {form.vpnGateway && (
          <SummaryRow label="VPN Gateway" value="Enabled (Enterprise add-on)" />
        )}
        {form.name && <SummaryRow label="Name" value={form.name} />}
        {form.licenseMode === "byol" && form.licenseKey && (
          <SummaryRow label="License" value="BYOL — Key provided" />
        )}
        {form.cloudAccountId && (
          <SummaryRow label="Cloud Account" value="BYOC — Customer infrastructure" />
        )}
        <SummaryRow
          label="DB Credentials"
          value={
            form.useDefaultCredentials
              ? "System defaults (dbadmin / auto-generated)"
              : `${form.dbUser || "dbadmin"} @ ${form.dbName || "defaultdb"}`
          }
        />
        {form.memberUserIds.length > 0 && (
          <SummaryRow label="Project Members" value={`${form.memberUserIds.length} member(s)`} />
        )}
      </div>
    </div>

    {/* Pricing */}
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Pricing Breakdown</h3>
      </div>
      <div className="p-5">
        {isQuoteLoading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
            <Loader2 className="animate-spin" size={18} />
            Calculating pricing...
          </div>
        ) : quoteResult ? (
          <div className="space-y-3">
            {quoteResult.lines.map((line, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{line.name}</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {quoteResult.currency} {line.total.toFixed(2)}
                </span>
              </div>
            ))}
            {quoteResult.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Discount{quoteResult.discount_label ? ` (${quoteResult.discount_label})` : ""}
                </span>
                <span>
                  -{quoteResult.currency} {quoteResult.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">
                  {pricingSummary.currency} {pricingSummary.subtotal.toFixed(2)}
                </span>
              </div>
              {pricingSummary.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="font-medium">
                    {pricingSummary.currency} {pricingSummary.tax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base border-t border-gray-200 dark:border-gray-700 pt-2">
                <span>Total</span>
                <span>
                  {pricingSummary.currency} {pricingSummary.grandTotal.toFixed(2)}
                </span>
              </div>
              {pricingSummary.monthlyCost > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Monthly cost</span>
                  <span>
                    {pricingSummary.currency} {pricingSummary.monthlyCost.toFixed(2)}/mo
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-600 py-4">
            <Info size={16} />
            Pricing will be calculated when you create the order.
          </div>
        )}
      </div>
    </div>

    {/* Error */}
    {submissionErrorMessage && (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
        {submissionErrorMessage}
      </div>
    )}

    {/* Actions */}
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      <button
        onClick={onCreateOrder}
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Creating Order...
          </>
        ) : (
          <>
            Create Lattice Database
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  </div>
);

// ─── Success Content ─────────────────────────────────────────────────

const SuccessContent: React.FC<{
  submissionResult: ReturnType<typeof useDatabaseProvisioningLogic>["submissionResult"];
  regions: { value: string; label: string }[];
  onViewDatabases: () => void;
}> = ({ submissionResult, regions, onViewDatabases }) => {
  const db = submissionResult?.data?.database;

  return (
    <div className="mx-auto max-w-lg text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
          <CheckCircle2 className="text-green-600 dark:text-green-400" size={48} />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Database Created Successfully
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Your Lattice database is being provisioned. This typically takes 5-10 minutes.
        </p>
      </div>
      {db && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-left space-y-3">
          <SummaryRow label="Identifier" value={db.identifier} copyable />
          <SummaryRow label="Engine" value={`${getEngineLabel(db.engine)} v${db.engine_version}`} />
          <SummaryRow label="Plan" value={db.plan_size} />
          <SummaryRow label="Region" value={getRegionLabel(regions, db.region)} />
          {db.replica_count > 1 && (
            <SummaryRow label="Replicas" value={`${db.replica_count - 1} read replica(s)`} />
          )}
          <SummaryRow label="Status" value={db.status} />
        </div>
      )}
      <button
        onClick={onViewDatabases}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Database size={16} />
        View Databases
      </button>
    </div>
  );
};

// ─── Sidebar (Pricing Summary) ──────────────────────────────────────

const WizardSidebar: React.FC<{
  form: ReturnType<typeof useDatabaseProvisioningLogic>["form"];
  regions: { value: string; label: string }[];
  quoteResult: ReturnType<typeof useDatabaseProvisioningLogic>["quoteResult"];
  pricingSummary: ReturnType<typeof useDatabaseProvisioningLogic>["pricingSummary"];
}> = ({ form, regions, quoteResult, pricingSummary }) => (
  <div className="space-y-4">
    {/* Selected Configuration */}
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Server size={16} />
        Configuration
      </h4>
      <div className="space-y-2 text-sm">
        {form.engine && (
          <div className="flex items-center gap-2">
            <EngineIcon engine={form.engine as DatabaseEngine} size={14} />
            <span className="text-gray-700 dark:text-gray-300">
              {getEngineLabel(form.engine as DatabaseEngine)} {form.engineVersion}
            </span>
          </div>
        )}
        {form.planSize && (
          <div className="text-gray-600 dark:text-gray-400">
            {PLAN_SPECS[form.planSize as PlanSize]?.label} —{" "}
            {PLAN_SPECS[form.planSize as PlanSize]?.vcpu} vCPU,{" "}
            {Math.round((PLAN_SPECS[form.planSize as PlanSize]?.memoryMb || 0) / 1024)} GB RAM
          </div>
        )}
        {form.region && (
          <div className="text-gray-600 dark:text-gray-400">
            Region: {getRegionLabel(regions, form.region)}
          </div>
        )}
        {form.replicaCount > 1 && (
          <div className="text-gray-600 dark:text-gray-400">
            Replicas: {form.replicaCount - 1} ×{" "}
            {form.replicaAzs.map(sanitizeProviderLabel).join(", ")}
          </div>
        )}
      </div>
    </div>

    {/* Pricing Estimate */}
    {(quoteResult || pricingSummary.grandTotal > 0) && (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Estimated Cost
        </h4>
        <div className="space-y-2">
          {pricingSummary.subtotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900 dark:text-gray-100">
                {pricingSummary.currency} {pricingSummary.subtotal.toFixed(2)}
              </span>
            </div>
          )}
          {pricingSummary.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span>
                {pricingSummary.currency} {pricingSummary.tax.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
            <span>Total</span>
            <span>
              {pricingSummary.currency} {pricingSummary.grandTotal.toFixed(2)}
            </span>
          </div>
          {pricingSummary.monthlyCost > 0 && (
            <div className="text-xs text-gray-500 text-right">
              {pricingSummary.currency} {pricingSummary.monthlyCost.toFixed(2)}/month
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

// ─── Helper: Summary Row ─────────────────────────────────────────────

const SummaryRow: React.FC<{
  label: string;
  value: string;
  copyable?: boolean;
}> = ({ label, value, copyable }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
      {copyable && (
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Copy size={12} />
        </button>
      )}
    </div>
  </div>
);

// ─── Main Wizard ─────────────────────────────────────────────────────

const DatabaseCreationWizard: React.FC<DatabaseCreationWizardProps> = ({
  listPath = "databases",
}) => {
  const navigate = useNavigate();
  const logic = useDatabaseProvisioningLogic();
  const { data: cloudAccountsRaw } = useFetchCloudAccounts();
  const cloudAccounts = (Array.isArray(cloudAccountsRaw) ? cloudAccountsRaw : []) as CloudAccount[];

  // Fetch quote when entering review step
  useEffect(() => {
    if (logic.currentStepId === "review" && !logic.quoteResult && !logic.isQuoteLoading) {
      logic.fetchQuote();
    }
  }, [logic.currentStepId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build main content based on step
  const mainContent = (() => {
    switch (logic.currentStepId) {
      case "engine":
        return (
          <div className="space-y-6">
            <EngineStep
              selectedEngine={logic.form.engine}
              onSelect={logic.selectEngine}
              engines={logic.engines}
              form={logic.form}
              updateForm={logic.updateForm}
              context={logic.context}
              profileCountry={logic.profileCountry}
              countryOptions={logic.countryOptions}
              isCountriesLoading={logic.isCountriesLoading}
              isCountryLocked={logic.isCountryLocked}
              tenants={logic.tenants}
              isTenantsFetching={logic.isTenantsFetching}
              userPool={logic.userPool}
              isUsersFetching={logic.isUsersFetching}
              customerContextType={logic.customerContextType}
              onContextTypeChange={(type) => {
                logic.setCustomerContextType(type as never);
                logic.updateForm({ customerContext: type as never, assignedTenantId: null, assignedClientId: null });
              }}
              selectedTenantId={logic.selectedTenantId}
              onTenantChange={(id) => {
                logic.setSelectedTenantId(id);
                logic.updateForm({ assignedTenantId: id || null, assignedClientId: null });
              }}
              selectedUserId={logic.selectedUserId}
              onUserChange={(id) => {
                logic.setSelectedUserId(id);
                logic.updateForm({ assignedClientId: id || null });
              }}
              assignmentScope={logic.assignmentScope}
              shouldFetchMembers={logic.shouldFetchMembers}
              isMembersFetching={logic.isMembersFetching}
              selectedMembers={logic.selectedMembers}
              selectedMemberIds={logic.selectedMemberIds}
              suggestedMembers={logic.suggestedMembers}
              showRestoreMembers={logic.showRestoreMembers}
              onToggleMember={logic.toggleMember}
              onRestoreMembers={logic.restoreDefaultMembers}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={logic.nextStep}
                disabled={!logic.isEngineStepValid}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        );

      case "configure":
        return (
          <div className="space-y-6">
            <ConfigureStep
              form={logic.form}
              updateForm={logic.updateForm}
              selectedEngineMeta={logic.selectedEngineMeta}
              projects={logic.projects}
              regions={logic.regions}
              availabilityZones={logic.availabilityZones}
              maxReplicaCount={logic.maxReplicaCount}
              replicaAvailableAzs={logic.replicaAvailableAzs}
              toggleReplicaAz={logic.toggleReplicaAz}
              cloudAccounts={cloudAccounts}
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={logic.prevStep}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={logic.nextStep}
                disabled={!logic.isConfigureStepValid}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review & Create
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="mx-auto max-w-2xl">
            <PaymentModal
              isOpen={true}
              onClose={() => logic.setActiveStep(2)} // Go back to review
              transactionData={{
                data: logic.orderReceipt as Record<string, unknown> & {
                  transaction?: Record<string, unknown>;
                  order?: Record<string, unknown>;
                  payment?: Record<string, unknown>;
                },
              }}
              onPaymentComplete={logic.handlePaymentCompleted}
              mode="inline"
              pricingSummary={{
                subtotal: logic.pricingSummary.subtotal,
                tax: logic.pricingSummary.tax,
                gatewayFees: logic.pricingSummary.gatewayFees,
                grandTotal: logic.pricingSummary.grandTotal,
                currency: logic.pricingSummary.currency,
              }}
            />
          </div>
        );

      default:
        return null;
    }
  })();

  const sidebarContent =
    logic.currentStepId === "engine" || logic.currentStepId === "configure" ? (
      <WizardSidebar
        form={logic.form}
        regions={logic.regions}
        quoteResult={logic.quoteResult}
        pricingSummary={logic.pricingSummary}
      />
    ) : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(listPath)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Create Lattice Database
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Deploy a fully managed Lattice database cluster
          </p>
        </div>
      </div>

      <ProvisioningWizardLayout
        steps={[...logic.steps]}
        activeStep={logic.activeStep}
        onStepChange={logic.setActiveStep}
        currentStepId={logic.currentStepId}
        reviewStepId="review"
        successStepId="success"
        mainContent={mainContent}
        sidebarContent={sidebarContent}
        reviewContent={
          <ReviewContent
            form={logic.form}
            regions={logic.regions}
            quoteResult={logic.quoteResult}
            pricingSummary={logic.pricingSummary}
            isQuoteLoading={logic.isQuoteLoading}
            onCreateOrder={logic.handleCreateOrder}
            isSubmitting={logic.isSubmitting}
            submissionErrorMessage={logic.submissionErrorMessage}
            onBack={logic.prevStep}
          />
        }
        successContent={
          <SuccessContent
            submissionResult={logic.submissionResult}
            regions={logic.regions}
            onViewDatabases={() => navigate(listPath)}
          />
        }
      />
    </div>
  );
};

export default DatabaseCreationWizard;
