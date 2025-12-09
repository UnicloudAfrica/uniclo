// @ts-nocheck
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import adminApi from "../../index/admin/api";

// Types
interface AnalyticsData {
  revenue: {
    total: number;
    this_month: number;
    last_month: number;
    growth_percent: number;
  };
  users: {
    total: number;
    new_this_month: number;
    active: number;
  };
  subscriptions: {
    active: number;
    canceled: number;
    revenue: number;
  };
  payouts: {
    pending: number;
    completed: number;
    total_amount: number;
  };
  top_tenants: Array<{
    id: number;
    name: string;
    revenue: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
  }>;
}

// API hook
const useAnalytics = () => {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: async () => {
      // TODO: Create actual analytics endpoint
      // For now, return mock data
      return {
        revenue: {
          total: 15750000,
          this_month: 2450000,
          last_month: 2100000,
          growth_percent: 16.7,
        },
        users: {
          total: 1245,
          new_this_month: 89,
          active: 876,
        },
        subscriptions: {
          active: 342,
          canceled: 23,
          revenue: 1850000,
        },
        payouts: {
          pending: 5,
          completed: 47,
          total_amount: 8500000,
        },
        top_tenants: [
          { id: 1, name: "Acme Corp", revenue: 2500000 },
          { id: 2, name: "TechStart Ltd", revenue: 1800000 },
          { id: 3, name: "Cloud Solutions", revenue: 1500000 },
          { id: 4, name: "DataFlow Inc", revenue: 1200000 },
          { id: 5, name: "WebServices Pro", revenue: 950000 },
        ],
        monthly_revenue: [
          { month: "Jul", revenue: 1200000 },
          { month: "Aug", revenue: 1450000 },
          { month: "Sep", revenue: 1600000 },
          { month: "Oct", revenue: 1850000 },
          { month: "Nov", revenue: 2100000 },
          { month: "Dec", revenue: 2450000 },
        ],
      } as AnalyticsData;
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
  const { data: analytics, isLoading } = useAnalytics();

  // Summary cards
  const summaryCards = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: formatCurrency(analytics?.revenue?.total || 0),
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
    ],
    [analytics]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeadbar />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...(analytics?.monthly_revenue || []).map((m) => m.revenue));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeadbar />
        <AdminPageShell
          title="Analytics Dashboard"
          description="Platform performance metrics and insights"
        >
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
                    {card.subtitle && <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>}
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
                {analytics?.monthly_revenue?.map((month, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all hover:from-blue-600 hover:to-blue-500"
                      style={{ height: (month.revenue / maxRevenue) * 160 + "px" }}
                    />
                    <span className="text-xs text-gray-500 mt-2">{month.month}</span>
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
                {analytics?.top_tenants?.map((tenant, index) => (
                  <div key={tenant.id} className="flex items-center justify-between">
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
                      <span className="text-sm font-medium">{tenant.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{formatCurrency(tenant.revenue)}</span>
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
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">New subscription</p>
                  <p className="text-xs text-gray-500">Acme Corp upgraded to Enterprise plan</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">2 hours ago</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">New tenant onboarded</p>
                  <p className="text-xs text-gray-500">TechStart Ltd completed setup</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">5 hours ago</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Payout processed</p>
                  <p className="text-xs text-gray-500">₦185,000 sent to Cloud Solutions</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">1 day ago</span>
              </div>
            </div>
          </div>
        </AdminPageShell>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
