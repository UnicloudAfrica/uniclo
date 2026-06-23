import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Lock,
  Pencil,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import ModernButton from "@/shared/components/ui/ModernButton";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernTextarea from "@/shared/components/ui/ModernTextarea";
import { Skeleton } from "@/shared/components/ui/Skeleton";

// ──────────────────────────────────────────────────────────────────────────
// Types + small helpers
// ──────────────────────────────────────────────────────────────────────────

/** Scope-agnostic role shape shared by the admin and tenant roles pages. */
export interface RoleLike {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  permissions: string[];
  is_system: boolean;
  member_count: number;
}

export interface RoleFormState {
  name: string;
  description: string;
  permissions: Set<string>;
}

/** Permission catalogue grouped by section, e.g. { "Projects": ["projects.view", …] }. */
export type RoleCatalog = Record<string, string[]>;

const EMPTY_FORM: RoleFormState = {
  name: "",
  description: "",
  permissions: new Set<string>(),
};

const accent = "var(--theme-color)";

/** Stable per-group coverage segments used by the "fingerprint" bars. */
export const buildSegments = (
  granted: Set<string>,
  catalogGroups: [string, string[]][]
) =>
  catalogGroups.map(([group, perms]) => {
    const hit = perms.filter((p) => granted.has(p)).length;
    return { group, hit, total: perms.length, ratio: perms.length ? hit / perms.length : 0 };
  });

// ──────────────────────────────────────────────────────────────────────────
// Permission "fingerprint" — radial ring + per-group segment bars
// ──────────────────────────────────────────────────────────────────────────

export const RadialCoverage: React.FC<{
  granted: number;
  total: number;
  size?: number;
}> = ({ granted, total, size = 78 }) => {
  const pct = total > 0 ? granted / total : 0;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={accent}
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none text-gray-900 dark:text-white">
          {granted}
        </span>
        <span className="text-[10px] font-medium leading-none text-gray-400 dark:text-gray-500">
          / {total}
        </span>
      </div>
    </div>
  );
};

export const SegmentBars: React.FC<{
  segments: { group: string; hit: number; total: number; ratio: number }[];
}> = ({ segments }) => (
  <div className="flex flex-wrap gap-[3px]" aria-hidden="true">
    {segments.map((seg) => (
      <div
        key={seg.group}
        title={`${seg.group}: ${seg.hit}/${seg.total}`}
        className="h-7 w-[7px] overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/60"
      >
        <div
          className="w-full rounded-full"
          style={{
            height: `${Math.max(seg.ratio * 100, seg.hit > 0 ? 14 : 0)}%`,
            marginTop: "auto",
            background: accent,
            opacity: seg.hit > 0 ? 0.45 + seg.ratio * 0.55 : 0,
            transition: "height 500ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    ))}
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// Stat tile (local — lets the accent ring + dark mode read consistently)
// ──────────────────────────────────────────────────────────────────────────

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  loading?: boolean;
}> = ({ label, value, hint, icon, loading }) => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
    <div
      className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.07]"
      style={{ background: accent }}
    />
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: "var(--theme-color-10)", color: accent }}
      >
        {icon}
      </span>
    </div>
    {loading ? (
      <Skeleton className="mt-3 h-8 w-16" />
    ) : (
      <div className="mt-2 text-3xl font-bold leading-none text-gray-900 dark:text-white">
        {value}
      </div>
    )}
    {hint ? <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p> : null}
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// Role card
// ──────────────────────────────────────────────────────────────────────────

export const RoleCard = <T extends RoleLike>({
  role,
  totalPermissions,
  segments,
  itemNoun = "permission",
  memberNoun = "member",
  onEdit,
  onDelete,
}: {
  role: T;
  totalPermissions: number;
  segments: { group: string; hit: number; total: number; ratio: number }[];
  /** Singular noun for a granted item, e.g. "permission" (roles) or "entitlement" (account types). */
  itemNoun?: string;
  /** Singular noun for an assignee, e.g. "member" (tenant) or "admin" (admin). */
  memberNoun?: string;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
            {role.name}
          </h3>
          {role.is_system ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              <Lock size={11} />
              System
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: "var(--theme-color-10)", color: accent }}
            >
              <Sparkles size={11} />
              Custom
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500 dark:text-gray-400">
          {role.description || "No description provided."}
        </p>
      </div>
      <RadialCoverage granted={role.permissions.length} total={totalPermissions} />
    </div>

    {/* Fingerprint — per-group coverage */}
    <div className="mt-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-900/40">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Coverage fingerprint
        </span>
        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
          {segments.filter((s) => s.hit > 0).length}/{segments.length} groups
        </span>
      </div>
      <SegmentBars segments={segments} />
    </div>

    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck size={15} className="text-gray-400 dark:text-gray-500" />
        <span className="font-semibold text-gray-900 dark:text-white">
          {role.permissions.length}
        </span>
        {itemNoun}
        {role.permissions.length === 1 ? "" : "s"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users size={15} className="text-gray-400 dark:text-gray-500" />
        <span className="font-semibold text-gray-900 dark:text-white">{role.member_count}</span>
        {memberNoun}
        {role.member_count === 1 ? "" : "s"}
      </span>
    </div>

    <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
      {role.is_system ? (
        <span className="text-xs text-gray-400 dark:text-gray-500">Read-only preset</span>
      ) : (
        <>
          <ModernButton
            variant="outline"
            size="sm"
            leftIcon={<Pencil size={14} />}
            onClick={onEdit}
          >
            Edit
          </ModernButton>
          <ModernButton
            variant="outlineDanger"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={onDelete}
          >
            Delete
          </ModernButton>
        </>
      )}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// Slide-over drawer — create / edit role
// ──────────────────────────────────────────────────────────────────────────

export const RoleDrawer = <T extends RoleLike>({
  open,
  editing,
  catalog,
  totalPermissions,
  saving,
  itemNoun = "permission",
  namePlaceholder = "e.g. Billing Manager",
  entityNoun = "role",
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: T | null;
  catalog: RoleCatalog | undefined;
  totalPermissions: number;
  saving: boolean;
  /** Singular noun for a granted item, e.g. "permission" (roles) or "entitlement" (account types). */
  itemNoun?: string;
  /** Placeholder for the name field, e.g. "e.g. Billing Manager" (roles) or "e.g. Premium" (tiers). */
  namePlaceholder?: string;
  /** Singular noun for the thing being created, e.g. "role" (roles) or "tier" (account types). */
  entityNoun?: string;
  onClose: () => void;
  onSubmit: (form: RoleFormState) => void;
}) => {
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);
  const [search, setSearch] = useState("");

  const itemNounCap = itemNoun.charAt(0).toUpperCase() + itemNoun.slice(1);

  const catalogGroups = useMemo<[string, string[]][]>(
    () => Object.entries(catalog ?? {}),
    [catalog]
  );

  // Reset/seed the form each time the drawer opens for a target.
  useEffect(() => {
    if (!open) return;
    setSearch("");
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description ?? "",
        permissions: new Set(editing.permissions),
      });
    } else {
      setForm({ name: "", description: "", permissions: new Set<string>() });
    }
  }, [open, editing]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const togglePermission = useCallback((permission: string) => {
    setForm((prev) => {
      const next = new Set(prev.permissions);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return { ...prev, permissions: next };
    });
  }, []);

  const toggleGroup = useCallback((perms: string[], allOn: boolean) => {
    setForm((prev) => {
      const next = new Set(prev.permissions);
      if (allOn) perms.forEach((p) => next.delete(p));
      else perms.forEach((p) => next.add(p));
      return { ...prev, permissions: next };
    });
  }, []);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogGroups;
    return catalogGroups
      .map(([group, perms]) => {
        const matched =
          group.toLowerCase().includes(q)
            ? perms
            : perms.filter((p) => p.toLowerCase().includes(q));
        return [group, matched] as [string, string[]];
      })
      .filter(([, perms]) => perms.length > 0);
  }, [catalogGroups, search]);

  const selectedCount = form.permissions.size;
  const submitDisabled = form.name.trim() === "" || saving;

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Scrim */}
      <div
        className={`absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? `Edit ${entityNoun}` : `Create ${entityNoun}`}
        className={`absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-gray-800 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--theme-color-10)", color: accent }}
              >
                <ShieldCheck size={18} />
              </span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editing ? `Edit ${entityNoun}` : `Create ${entityNoun}`}
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Name the role and pick the permissions it grants.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <ModernInput
            label="Role name"
            required
            value={form.name}
            placeholder={namePlaceholder}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <ModernTextarea
            label="Description"
            value={form.description}
            rows={2}
            placeholder="What is this role responsible for?"
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          {/* Live density preview */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {itemNounCap} density
              </span>
              <span className="text-sm font-bold" style={{ color: accent }}>
                {selectedCount}
                <span className="font-medium text-gray-400 dark:text-gray-500">
                  {" "}
                  / {totalPermissions}
                </span>
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${totalPermissions ? (selectedCount / totalPermissions) * 100 : 0}%`,
                  background: accent,
                  transition: "width 350ms cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
          </div>

          {/* Permission search */}
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${itemNoun}s…`}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Grouped permission toggles */}
          <div className="space-y-3">
            {catalogGroups.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading permission catalogue…
              </p>
            ) : filteredGroups.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No permissions match “{search}”.
              </p>
            ) : (
              filteredGroups.map(([group, perms]) => {
                const selectedInGroup = perms.filter((p) => form.permissions.has(p)).length;
                const allOn = selectedInGroup === perms.length && perms.length > 0;
                return (
                  <div
                    key={group}
                    className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-2.5 dark:bg-gray-900/40">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {group}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            background:
                              selectedInGroup > 0 ? "var(--theme-color-10)" : "transparent",
                            color:
                              selectedInGroup > 0 ? accent : "rgb(156 163 175)",
                          }}
                        >
                          {selectedInGroup} selected
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGroup(perms, allOn)}
                        className="text-xs font-semibold transition-colors hover:underline"
                        style={{ color: accent }}
                      >
                        {allOn ? "Clear all" : "Select all"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
                      {perms.map((permission) => {
                        const checked = form.permissions.has(permission);
                        return (
                          <button
                            type="button"
                            key={permission}
                            onClick={() => togglePermission(permission)}
                            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                              checked
                                ? "bg-primary/10"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                          >
                            <span
                              className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                              style={{
                                background: checked ? accent : "transparent",
                                borderColor: checked ? accent : "rgb(209 213 219)",
                              }}
                            >
                              {checked ? <Check size={12} className="text-white" /> : null}
                            </span>
                            <span className="truncate font-mono text-xs text-gray-700 dark:text-gray-300">
                              {permission}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{selectedCount}</span>{" "}
            {itemNoun}{selectedCount === 1 ? "" : "s"} selected
          </span>
          <div className="flex gap-2">
            <ModernButton variant="ghost" onClick={onClose}>
              Cancel
            </ModernButton>
            <ModernButton
              variant="primary"
              disabled={submitDisabled}
              onClick={() => onSubmit(form)}
            >
              {saving ? "Saving…" : editing ? "Save changes" : `Create ${entityNoun}`}
            </ModernButton>
          </div>
        </div>
      </div>
    </div>
  );
};
