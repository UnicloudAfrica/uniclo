import { describe, it, expect } from "vitest";

import {
  appendSample,
  toTrendPoint,
  TREND_CAP,
  type TrendPoint,
} from "@/shared/components/monitoring/InstanceMetricsTrend";
import type { InstanceLiveMetrics } from "@/shared/hooks/useInstanceLiveMetrics";

const sample = (over: Partial<InstanceLiveMetrics> = {}): InstanceLiveMetrics => ({
  cpu_percent: 12,
  memory_percent: 34,
  disk_percent: 56,
  network_in_mbps: 1,
  network_out_mbps: 2,
  collected_at: "2026-06-26T10:00:00Z",
  ...over,
});

describe("toTrendPoint", () => {
  it("returns null when metrics is null/undefined", () => {
    expect(toTrendPoint(null)).toBeNull();
    expect(toTrendPoint(undefined)).toBeNull();
  });

  it("returns null when there is no collected_at timestamp", () => {
    expect(toTrendPoint(sample({ collected_at: null }))).toBeNull();
  });

  it("returns null when cpu, memory and disk are all null (nothing real to plot)", () => {
    expect(
      toTrendPoint(sample({ cpu_percent: null, memory_percent: null, disk_percent: null }))
    ).toBeNull();
  });

  it("builds a point and preserves individual nulls (never fabricates a 0)", () => {
    const point = toTrendPoint(sample({ memory_percent: null }));
    expect(point).toEqual({ t: "2026-06-26T10:00:00Z", cpu: 12, memory: null, disk: 56 });
  });
});

describe("appendSample", () => {
  const p = (t: string, cpu = 1): TrendPoint => ({ t, cpu, memory: null, disk: null });

  it("ignores a null point", () => {
    const history = [p("a")];
    expect(appendSample(history, null)).toBe(history);
  });

  it("appends a new point", () => {
    expect(appendSample([p("a")], p("b")).map((x) => x.t)).toEqual(["a", "b"]);
  });

  it("dedups a repeated collected_at (no new CuberWatch report)", () => {
    const history = [p("a"), p("b")];
    expect(appendSample(history, p("b", 99))).toBe(history);
  });

  it("caps the rolling window, dropping the oldest", () => {
    let history: TrendPoint[] = [];
    for (let i = 0; i < TREND_CAP + 5; i++) {
      history = appendSample(history, p(`t${i}`));
    }
    expect(history).toHaveLength(TREND_CAP);
    expect(history[0].t).toBe("t5");
    expect(history[history.length - 1].t).toBe(`t${TREND_CAP + 4}`);
  });
});
