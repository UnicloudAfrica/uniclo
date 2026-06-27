import { describe, it, expect } from "vitest";

import { mergeHistorySeries } from "@/shared/components/monitoring/InstanceMetricsHistory";
import type { InstanceMetricsHistory } from "@/shared/hooks/useInstanceMetricsHistory";

describe("mergeHistorySeries", () => {
  it("returns an empty array for null metrics", () => {
    expect(mergeHistorySeries(null)).toEqual([]);
  });

  it("merges the three series by timestamp, leaving gaps as null (never 0)", () => {
    const metrics: InstanceMetricsHistory = {
      cpu_percent: [
        { timestamp: "2026-06-27T00:00:00Z", value: 10 },
        { timestamp: "2026-06-27T00:05:00Z", value: 20 },
      ],
      memory_percent: [{ timestamp: "2026-06-27T00:00:00Z", value: 30 }],
      disk_percent: [{ timestamp: "2026-06-27T00:05:00Z", value: 40 }],
    };

    expect(mergeHistorySeries(metrics)).toEqual([
      { t: "2026-06-27T00:00:00Z", cpu: 10, memory: 30, disk: null },
      { t: "2026-06-27T00:05:00Z", cpu: 20, memory: null, disk: 40 },
    ]);
  });

  it("sorts points chronologically regardless of input order", () => {
    const metrics: InstanceMetricsHistory = {
      cpu_percent: [
        { timestamp: "2026-06-27T02:00:00Z", value: 2 },
        { timestamp: "2026-06-27T01:00:00Z", value: 1 },
      ],
      memory_percent: [],
      disk_percent: [],
    };

    expect(mergeHistorySeries(metrics).map((p) => p.t)).toEqual([
      "2026-06-27T01:00:00Z",
      "2026-06-27T02:00:00Z",
    ]);
  });
});
