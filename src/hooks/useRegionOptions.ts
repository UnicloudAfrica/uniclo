/**
 * Region option list for `ModernSelect`. Pulls from the backend
 * `/regions` endpoint via the existing `useFetchTenantRegions` query
 * — no hardcoded region lists in feature pages.
 *
 * Returns:
 *   - `options`        — `{ label, value }[]` ready to drop into a select
 *   - `optionsWithAll` — same plus a leading `{ label: "All regions", value: "" }`
 *   - `isLoading`      — spinner while the first fetch is in flight
 *
 * Usage:
 *   const { options, isLoading } = useRegionOptions();
 *   <ModernSelect options={options} ... />
 */
import { useMemo } from "react";
import { useFetchTenantRegions } from "./regionHooks";

interface RegionRecord {
  code: string;
  name?: string;
  display_name?: string;
}

export interface RegionSelectOptions {
  options: { label: string; value: string }[];
  optionsWithAll: { label: string; value: string }[];
  isLoading: boolean;
  /**
   * `true` when the backend returned an empty region list. Pages should
   * render an InfoCallout pointing the operator at the admin UI instead
   * of leaving the user staring at an empty dropdown.
   */
  isEmpty: boolean;
  /**
   * Customer-facing message to show when `isEmpty` is true.
   * Operators see this; customers shouldn't normally hit it (we ship
   * with at least one region seeded).
   */
  emptyMessage: string;
}

export function useRegionOptions(): RegionSelectOptions {
  const q = useFetchTenantRegions();

  const options = useMemo<{ label: string; value: string }[]>(() => {
    const raw = q.data as { data?: RegionRecord[] } | RegionRecord[] | undefined;
    const list: RegionRecord[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

    return list
      .filter((r) => !!r?.code)
      .map((r) => ({
        label: r.display_name ?? r.name ?? r.code,
        value: r.code,
      }));
  }, [q.data]);

  const optionsWithAll = useMemo(
    () => [{ label: "All regions", value: "" }, ...options],
    [options]
  );

  return {
    options,
    optionsWithAll,
    isLoading: q.isLoading,
    isEmpty: !q.isLoading && options.length === 0,
    emptyMessage:
      "No regions are configured yet. Ask an admin to add one in Admin → Regions.",
  };
}
