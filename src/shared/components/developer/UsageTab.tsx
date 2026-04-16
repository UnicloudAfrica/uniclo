import { useState } from "react";
import { BarChart3, TrendingUp, AlertCircle, Zap, Loader2, Activity } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { useFetchApiUsage } from "@/hooks/developerHooks";

const UsageTab = () => {
  const [period, setPeriod] = useState(30);
  const { data: usage, isLoading } = useFetchApiUsage(period);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: designTokens.colors.primary[500] }} />
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="rounded-xl border-2 border-dashed py-16 text-center" style={{ borderColor: designTokens.colors.neutral[200] }}>
        <Activity className="mx-auto mb-3 h-10 w-10" style={{ color: designTokens.colors.neutral[300] }} />
        <h3 className="text-base font-semibold" style={{ color: designTokens.colors.neutral[600] }}>No usage data yet</h3>
        <p className="text-sm" style={{ color: designTokens.colors.neutral[400] }}>
          Start making API calls to see your usage analytics
        </p>
      </div>
    );
  }

  const maxRequests = Math.max(1, ...usage.daily.map((d) => d.requests));

  return (
    <div className="space-y-6">
      {/* Period Selector + Stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
          API Usage
        </h2>
        <div className="flex gap-1 rounded-lg border p-0.5" style={{ borderColor: designTokens.colors.neutral[200] }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                backgroundColor: period === d ? designTokens.colors.primary[600] : "transparent",
                color: period === d ? "#fff" : designTokens.colors.neutral[500],
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: "#fff" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: designTokens.colors.primary[100] }}
            >
              <Zap className="h-5 w-5" style={{ color: designTokens.colors.primary[600] }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: designTokens.colors.neutral[900] }}>
                {usage.total_requests.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                Total Requests
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: "#fff" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: usage.error_rate > 5 ? designTokens.colors.error[100] : designTokens.colors.success[100] }}
            >
              <AlertCircle
                className="h-5 w-5"
                style={{ color: usage.error_rate > 5 ? designTokens.colors.error[600] : designTokens.colors.success[600] }}
              />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: designTokens.colors.neutral[900] }}>
                {usage.error_rate}%
              </div>
              <div className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                Error Rate
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: "#fff" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: designTokens.colors.warning[100] }}
            >
              <TrendingUp className="h-5 w-5" style={{ color: designTokens.colors.warning[600] }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: designTokens.colors.neutral[900] }}>
                {usage.total_errors.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                Total Errors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Chart (CSS-based bar chart) */}
      <div
        className="rounded-xl border p-5"
        style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: "#fff" }}
      >
        <h3 className="mb-4 text-sm font-semibold" style={{ color: designTokens.colors.neutral[700] }}>
          Daily Requests
        </h3>
        <div className="flex items-end gap-1" style={{ height: "160px" }}>
          {usage.daily.map((day, i) => {
            const height = Math.max(2, (day.requests / maxRequests) * 100);
            const errorHeight = day.errors > 0 ? Math.max(1, (day.errors / maxRequests) * 100) : 0;
            return (
              <div
                key={day.date || i}
                className="group relative flex flex-1 flex-col items-center justify-end"
                style={{ height: "100%" }}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-14 z-10 hidden rounded-lg border bg-white px-3 py-2 text-xs shadow-lg group-hover:block">
                  <div className="font-semibold">{day.date}</div>
                  <div>{day.requests} requests</div>
                  {day.errors > 0 && (
                    <div style={{ color: designTokens.colors.error[600] }}>{day.errors} errors</div>
                  )}
                </div>
                {/* Error bar */}
                {errorHeight > 0 && (
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${errorHeight}%`,
                      backgroundColor: designTokens.colors.error[400],
                    }}
                  />
                )}
                {/* Success bar */}
                <div
                  className="w-full rounded-t transition-all group-hover:opacity-80"
                  style={{
                    height: `${height - errorHeight}%`,
                    backgroundColor: designTokens.colors.primary[500],
                    borderTopLeftRadius: errorHeight > 0 ? 0 : undefined,
                    borderTopRightRadius: errorHeight > 0 ? 0 : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px]" style={{ color: designTokens.colors.neutral[400] }}>
          <span>{usage.daily[0]?.date}</span>
          <span>{usage.daily[usage.daily.length - 1]?.date}</span>
        </div>
      </div>

      {/* Top Endpoints */}
      {usage.top_endpoints.length > 0 && (
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: "#fff" }}
        >
          <h3 className="mb-4 text-sm font-semibold" style={{ color: designTokens.colors.neutral[700] }}>
            Top Endpoints
          </h3>
          <div className="space-y-2">
            {usage.top_endpoints.map((ep, i) => {
              const maxCount = usage.top_endpoints[0]?.count || 1;
              const pct = (ep.count / maxCount) * 100;
              return (
                <div key={ep.endpoint || i} className="flex items-center gap-3">
                  <span
                    className="w-6 text-right text-xs font-bold"
                    style={{ color: designTokens.colors.neutral[400] }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="truncate font-mono text-xs"
                        style={{ color: designTokens.colors.neutral[700] }}
                      >
                        {ep.endpoint}
                      </span>
                      <span
                        className="ml-2 shrink-0 text-xs font-bold"
                        style={{ color: designTokens.colors.neutral[900] }}
                      >
                        {ep.count.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-1.5 rounded-full"
                      style={{ backgroundColor: designTokens.colors.neutral[100] }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: designTokens.colors.primary[500],
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageTab;
