import React, { useState, useEffect, useCallback } from "react";
import { HardDrive, TrendingUp, BarChart3, RefreshCw, Loader2, Plus, Info } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import objectStorageApi from "../../../services/objectStorageApi";
import ToastUtils from "../../../utils/toastUtil";
import { ModernCard } from "@/shared/components/ui";

interface AnalyticsData {
  current: {
    used_bytes: number;
    used_gb: number;
    quota_gb: number;
    object_count: number;
    bucket_count: number;
    usage_percent: number;
  };
  trend: Array<{
    date: string;
    used_gb: number;
    object_count: number;
  }>;
  forecast: {
    avg_daily_growth_gb: number;
    days_until_full: number | null;
    recommended_extension_gb: number;
    data_points: number;
    has_sufficient_data: boolean;
  };
}

interface ObjectStorageAnalyticsProps {
  accountId: string;
  accountName?: string;
  onExtendStorage: () => void;
  [key: string]: any;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && (error as any)["message"]) return (error as any)["message"];
  if (typeof error === "string" && error.trim()) return error;
  if (isRecord(error) && typeof error["message"] === "string" && String(error["message"]).trim()) {
    return String(error["message"]);
  }
  return fallback;
};

interface AnalyticsStatsGridProps {
  current: AnalyticsData["current"];
  forecast: AnalyticsData["forecast"];
}

const AnalyticsStatsGrid: React.FC<AnalyticsStatsGridProps> = ({ current, forecast }) => {
  // Use current values instead of non-existent stats
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ModernCard variant="outlined" padding="lg" className="relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Current Usage</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {current.used_gb || 0}
              <span className="ml-1 text-sm font-medium text-slate-400">GB</span>
            </h3>
          </div>
        </div>
      </ModernCard>

      <ModernCard variant="outlined" padding="lg" className="relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Daily growth</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {(forecast.avg_daily_growth_gb ?? 0).toFixed(2)}
              <span className="ml-1 text-sm font-medium text-slate-400">GB</span>
            </h3>
          </div>
        </div>
      </ModernCard>

      <ModernCard variant="outlined" padding="lg" className="relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Recommended</p>
            <h3 className="text-2xl font-bold text-slate-900">
              +{forecast.recommended_extension_gb || 0}
              <span className="ml-1 text-sm font-medium text-slate-400">GB</span>
            </h3>
          </div>
        </div>
      </ModernCard>
    </div>
  );
};

interface UsageTrendChartProps {
  trend: AnalyticsData["trend"];
  forecast: AnalyticsData["forecast"];
}

const UsageTrendChart: React.FC<UsageTrendChartProps> = ({ trend, forecast }) => {
  if (!forecast.has_sufficient_data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4" />
          Gathering data... ({forecast.data_points} of 7 days collected)
        </p>
        <p className="text-xs mt-1">Trends will appear after 7+ days of data</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={trend}>
        <defs>
          <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--theme-color)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--theme-color)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border-color)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "var(--theme-muted-color)" }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--theme-muted-color)" }}
          tickFormatter={(value) => `${value}GB`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--theme-heading-color)",
            border: "none",
            borderRadius: "8px",
            color: "var(--theme-card-bg)",
          }}
          formatter={(value: number | undefined) => [(value || 0).toFixed(2) + " GB", "Usage"]}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Area
          type="monotone"
          dataKey="used_gb"
          stroke="var(--theme-color)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorUsage)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const ObjectStorageAnalytics: React.FC<ObjectStorageAnalyticsProps> = ({
  accountId,
  onExtendStorage,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await objectStorageApi.getAnalytics(accountId);
      setData(result as AnalyticsData);
    } catch (err) {
      ToastUtils.error(getErrorMessage(err, "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
        <p>Unable to load analytics data</p>
        <button onClick={loadAnalytics} className="mt-4 text-primary-500 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const { current, trend, forecast } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Storage Analytics</h2>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <AnalyticsStatsGrid current={current} forecast={forecast} />

      <div className="bg-[--theme-card-bg] rounded-xl border border-[--theme-border-color] shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[--theme-heading-color]">Usage Over Time</h3>
          <span className="text-xs text-[--theme-muted-color]">Last 30 days</span>
        </div>
        <UsageTrendChart trend={trend} forecast={forecast} />
      </div>

      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white">
        <div>
          <h3 className="font-semibold">Need more storage?</h3>
          <p className="text-sm text-primary-100">
            Add {forecast.recommended_extension_gb} GB for optimal headroom
          </p>
        </div>
        <button
          onClick={onExtendStorage}
          className="flex items-center gap-2 px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Extend Storage
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-[--theme-surface-alt] rounded-lg">
          <span className="text-[--theme-muted-color]">Total Objects:</span>
          <span className="ml-2 font-medium text-[--theme-text-color]">
            {current.object_count.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-[--theme-surface-alt] rounded-lg">
          <span className="text-[--theme-muted-color]">Silos:</span>
          <span className="ml-2 font-medium text-[--theme-text-color]">{current.bucket_count}</span>
        </div>
      </div>
    </div>
  );
};

export default ObjectStorageAnalytics;
