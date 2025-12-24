// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  AlertTriangle,
  Plus,
  RefreshCw,
  Loader2,
  BarChart3,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
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
  accountName: string;
  onExtendStorage: () => void;
}

const ObjectStorageAnalytics: React.FC<ObjectStorageAnalyticsProps> = ({
  accountId,
  accountName,
  onExtendStorage,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [accountId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await objectStorageApi.getAnalytics(accountId);
      setData(result);
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
        <p>Unable to load analytics data</p>
        <button onClick={loadAnalytics} className="mt-4 text-primary-500 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const { current, trend, forecast } = data;
  const isGrowing = forecast.avg_daily_growth_gb > 0;
  const isCritical = forecast.days_until_full !== null && forecast.days_until_full <= 7;
  const isWarning = forecast.days_until_full !== null && forecast.days_until_full <= 30;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Storage Analytics</h2>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Used Storage */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-primary-500" />
            <span className="text-sm text-slate-500">Used Storage</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{current.used_gb} GB</p>
          <p className="text-xs text-slate-400">
            of {current.quota_gb} GB ({current.usage_percent}%)
          </p>
        </div>

        {/* Daily Growth */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            {isGrowing ? (
              <TrendingUp className="h-4 w-4 text-amber-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            )}
            <span className="text-sm text-slate-500">Daily Growth</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {isGrowing ? "+" : ""}
            {forecast.avg_daily_growth_gb.toFixed(2)} GB
          </p>
          <p className="text-xs text-slate-400">average per day</p>
        </div>

        {/* Days Until Full */}
        <div
          className={`p-4 rounded-xl border shadow-sm ${
            isCritical
              ? "bg-red-50 border-red-200"
              : isWarning
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock
              className={`h-4 w-4 ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-slate-500"}`}
            />
            <span
              className={`text-sm ${isCritical ? "text-red-600" : isWarning ? "text-amber-600" : "text-slate-500"}`}
            >
              Days Until Full
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${isCritical ? "text-red-700" : isWarning ? "text-amber-700" : "text-slate-800"}`}
          >
            {forecast.days_until_full !== null ? `${forecast.days_until_full} days` : "∞"}
          </p>
          <p
            className={`text-xs ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-slate-400"}`}
          >
            {isCritical
              ? "Critical - extend now!"
              : isWarning
                ? "Consider extending"
                : "at current growth rate"}
          </p>
        </div>

        {/* Recommended Extension */}
        <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="h-4 w-4 text-primary-500" />
            <span className="text-sm text-primary-600">Recommended</span>
          </div>
          <p className="text-2xl font-bold text-primary-700">
            +{forecast.recommended_extension_gb} GB
          </p>
          <p className="text-xs text-primary-500">for 60 days headroom</p>
        </div>
      </div>

      {/* Usage Trend Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Usage Over Time</h3>
          <span className="text-xs text-slate-400">Last 30 days</span>
        </div>

        {!forecast.has_sufficient_data ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Info className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-center">
              Gathering data... ({forecast.data_points} of 7 days collected)
            </p>
            <p className="text-xs text-slate-400 mt-1">Trends will appear after 7+ days of data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={(value) => `${value}GB`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number) => [`${value.toFixed(2)} GB`, "Usage"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="used_gb"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUsage)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Extend Storage CTA */}
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

      {/* Objects & Buckets Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-slate-50 rounded-lg">
          <span className="text-slate-500">Total Objects:</span>
          <span className="ml-2 font-medium text-slate-700">
            {current.object_count.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <span className="text-slate-500">Buckets:</span>
          <span className="ml-2 font-medium text-slate-700">{current.bucket_count}</span>
        </div>
      </div>
    </div>
  );
};

export default ObjectStorageAnalytics;
