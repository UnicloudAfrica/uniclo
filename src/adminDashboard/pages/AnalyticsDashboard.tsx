import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Users,
  Package,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import adminApi from "../../index/admin/api";

// Types
// API hooks
const useAnalytics = () => {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: async () => {
      const response = await adminApi.get<{ data: Record<string, unknown> }>(
        "/analytics/dashboard"
      );
      return response.data.data;
    },
  });
};

const useTopTenants = () => {
  return useQuery({
    queryKey: ["analytics", "top-tenants"],
    queryFn: async () => {
      const response = await adminApi.get<{ data: Record<string, unknown>[] }>(
        "/analytics/top-tenants"
      );
      return response.data.data;
    },
  });
};

const useMonthlyRevenue = () => {
  return useQuery({
    queryKey: ["analytics", "monthly-revenue"],
    queryFn: async () => {
      const response = await adminApi.get<{ data: Record<string, unknown>[] }>(
        "/analytics/monthly-revenue"
      );
      return response.data.data;
    },
  });
};

const useRecentActivity = () => {
  return useQuery({
    queryKey: ["analytics", "recent-activity"],
    queryFn: async () => {
      const response = await adminApi.get<{ data: Record<string, unknown>[] }>(
        "/analytics/recent-activity"
      );
      return response.data.data;
    },
  });
};

// Helper functions
const formatCurrency = (amount: number): string => {
  return "₦" + (amount / 100).toLocaleString(undefined, { minimumFractionDigits: 0 });
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const AnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading: isAnalyticsLoading } = useAnalytics();
  const { data: topTenants } = useTopTenants();
  const { data: monthlyRevenue } = useMonthlyRevenue();
  const { data: recentActivity } = useRecentActivity();

  // Summary cards
  const summaryCards = useMemo(() => {
    // Format multi-currency revenue
    const formatMultiCurrency = (
      byCurrency: Record<string, { total: number; symbol: string }> | undefined
    ): string => {
      if (!byCurrency || Object.keys(byCurrency).length === 0) {
        return formatCurrency(analytics?.revenue?.total || 0);
      }
      return (
        Object.entries(byCurrency)
          .filter(([_, data]) => data.total > 0)
          .map(([_, data]) => `${data.symbol}${(data.total / 100).toLocaleString()}`)
          .join(" + ") || formatCurrency(0)
      );
    };

    return [
      {
        title: "Total Revenue",
        value: formatMultiCurrency(analytics?.revenue?.by_currency),

        change: analytics?.revenue?.growth_percent || 0,
        changeType: (analytics?.revenue?.growth_percent || 0) >= 0 ? "positive" : "negative",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },

      {
        title: "Active Users",
        value: formatNumber(analytics?.users?.active || 0),
        subtitle: formatNumber(analytics?.users?.new_this_month || 0) + " new this month",
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "Active Subscriptions",
        value: formatNumber(analytics?.subscriptions?.active || 0),
        subtitle: formatCurrency(analytics?.subscriptions?.revenue || 0) + " MRR",
        icon: Package,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "Pending Payouts",
        value: formatNumber(analytics?.payouts?.pending || 0),
        subtitle: formatCurrency(analytics?.payouts?.total_amount || 0) + " total paid",
        icon: CreditCard,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
    ];
  }, [analytics]);

  const isInitialLoading = isAnalyticsLoading && !analytics;

  const maxRevenue = Math.max(
    ...(monthlyRevenue || []).map((m: Record<string, unknown>) => (m.revenue as number) || 1),
    1
  );

  const getActivityIcon = (icon: string) => {
    if (icon === "dollar") return DollarSign;
    if (icon === "users") return Users;
    if (icon === "credit-card") return CreditCard;
    return Activity;
  };

  const getActivityColor = (color: string) => {
    if (color === "green") return { bg: "bg-green-100", text: "text-green-600" };
    if (color === "blue") return { bg: "bg-blue-100", text: "text-blue-600" };
    if (color === "purple") return { bg: "bg-purple-100", text: "text-purple-600" };
    return { bg: "bg-gray-100", text: "text-gray-600" };
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <AdminPageShell
          title="Analytics Dashboard"
          description="Platform performance metrics and insights"
        >
          {isInitialLoading ? (
            <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-10 text-sm text-gray-500">
              Loading analytics...
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {summaryCards.map((card, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">{card.title}</p>
                        <p className="text-2xl font-semibold mt-1">{card.value}</p>
                        {card.change !== undefined && (
                          <div
                            className={
                              "flex items-center mt-1 text-sm " +
                              (card.changeType === "positive" ? "text-green-600" : "text-red-600")
                            }
                          >
                            {card.changeType === "positive" ? (
                              <ArrowUpRight className="w-4 h-4 mr-1" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 mr-1" />
                            )}
                            {Math.abs(card.change)}% from last month
                          </div>
                        )}
                        {card.subtitle && (
                          <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                        )}
                      </div>
                      <div className={card.bgColor + " p-3 rounded-lg"}>
                        <card.icon className={"w-6 h-6 " + card.color} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Monthly Revenue</h3>
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-end gap-4 h-48">
                    {(monthlyRevenue || []).map((month: Record<string, unknown>, index: number) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all hover:from-blue-600 hover:to-blue-500"
                          style={{ height: ((month.revenue as number) / maxRevenue) * 160 + "px" }}
                        />
                        <span className="text-xs text-gray-500 mt-2">{month.month as string}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Tenants */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Top Tenants</h3>
                    <PieChart className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    {(topTenants || []).map((tenant: Record<string, unknown>, index: number) => (
                      <div key={tenant.id as string} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium " +
                              (index === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : index === 1
                                  ? "bg-gray-100 text-gray-700"
                                  : index === 2
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-50 text-gray-500")
                            }
                          >
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{tenant.name as string}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(tenant.revenue as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                  <Activity className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {(recentActivity || []).length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No recent activity</div>
                  ) : (
                    (recentActivity || []).map(
                      (activity: Record<string, unknown>, index: number) => {
                        const IconComponent = getActivityIcon(activity.icon as string);
                        const colors = getActivityColor(activity.color as string);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                          >
                            <div
                              className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}
                            >
                              <IconComponent className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.title as string}</p>
                              <p className="text-xs text-gray-500">
                                {activity.description as string}
                              </p>
                            </div>
                            <span className="ml-auto text-xs text-gray-400">
                              {activity.time_ago as string}
                            </span>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </AdminPageShell>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
