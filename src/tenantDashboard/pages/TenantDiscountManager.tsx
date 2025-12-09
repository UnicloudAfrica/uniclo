// @ts-nocheck
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Trash2,
  Calculator,
  Download,
} from "lucide-react";
import TenantHeadbar from "../components/TenantHeadbar";
import TenantSidebar from "../components/TenantSidebar";
import tenantApi from "../../services/tenantRegionApi";

// Helper
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// API hooks
const useTenantSettlementSummary = () => {
  return useQuery({
    queryKey: ["tenant-settlements", "summary"],
    queryFn: async () => {
      const response = await tenantApi.get("/admin/settlements/summary");
      return response.data.data;
    },
  });
};

const useOwnDiscount = () => {
  return useQuery({
    queryKey: ["tenant-own-discount"],
    queryFn: async () => {
      const response = await tenantApi.get("/admin/settlements/own-discount");
      return response.data;
    },
  });
};

const useClientDiscounts = () => {
  return useQuery({
    queryKey: ["tenant-client-discounts"],
    queryFn: async () => {
      const response = await tenantApi.get("/admin/client-discounts");
      return response.data.data;
    },
  });
};

const useMarginPreview = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await tenantApi.get("/admin/settlements/margin-preview", {
        params: { base_amount: data.baseAmount, discount_percent: data.discountPercent },
      });
      return response.data.data;
    },
  });
};

const useRemoveClientDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const response = await tenantApi.delete("/admin/client-discounts/" + userId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-client-discounts"] });
    },
  });
};

// Margin Preview Component
const MarginCalculator = () => {
  const [baseAmount, setBaseAmount] = useState("100");
  const [discountPercent, setDiscountPercent] = useState("30");
  const marginPreview = useMarginPreview();
  const ownDiscountQuery = useOwnDiscount();

  const handleCalculate = () => {
    marginPreview.mutate({
      baseAmount: parseFloat(baseAmount),
      discountPercent: parseFloat(discountPercent),
    });
  };

  const preview = marginPreview.data;
  const ownDiscount = ownDiscountQuery.data;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-600" />
        Margin Calculator
      </h3>

      {ownDiscount && ownDiscount.has_discount && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Your discount from admin:{" "}
            <span className="font-bold">
              {ownDiscount.data.discount_type === "percent"
                ? ownDiscount.data.value + "%"
                : "$" + ownDiscount.data.value}
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Amount ($)</label>
          <input
            type="number"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount to Client (%)
          </label>
          <input
            type="number"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="30"
            min="0"
            max="100"
          />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        disabled={marginPreview.isPending}
        className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {marginPreview.isPending ? "Calculating..." : "Calculate Margin"}
      </button>

      {preview && (
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Amount:</span>
            <span className="font-medium">{formatCurrency(preview.base_amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Your Discount (from admin):</span>
            <span className="font-medium text-green-600">{preview.tenant_discount_percent}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Client Discount:</span>
            <span className="font-medium text-blue-600">
              {preview.proposed_client_discount_percent}%
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Client Pays:</span>
              <span className="font-medium">{formatCurrency(preview.client_pays)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">You Owe Admin:</span>
              <span className="font-medium">{formatCurrency(preview.tenant_owes)}</span>
            </div>
          </div>
          <div
            className={
              "p-3 rounded-lg " +
              (preview.is_profitable
                ? "bg-green-50 border border-green-200"
                : preview.is_loss
                  ? "bg-red-50 border border-red-200"
                  : "bg-gray-50 border border-gray-200")
            }
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Your Margin:</span>
              <span
                className={
                  "text-lg font-bold " +
                  (preview.is_profitable
                    ? "text-green-600"
                    : preview.is_loss
                      ? "text-red-600"
                      : "text-gray-600")
                }
              >
                {preview.margin >= 0 ? "+" : ""}
                {formatCurrency(preview.margin)} ({preview.margin_percent}%)
              </span>
            </div>
            {preview.is_loss && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                This discount results in a loss. You will still owe admin{" "}
                {formatCurrency(preview.tenant_owes)}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Client Discounts List
const ClientDiscountsList = () => {
  const { data: discounts, isLoading } = useClientDiscounts();
  const removeDiscount = useRemoveClientDiscount();

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Loading client discounts...</div>;
  }

  if (!discounts || discounts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No client discounts configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {discounts.map((discount) => (
        <div
          key={discount.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div>
            <p className="font-medium text-gray-900">
              {discount.applies_to?.first_name} {discount.applies_to?.last_name}
            </p>
            <p className="text-sm text-gray-500">
              {discount.discount_type === "percent" ? discount.value + "%" : "$" + discount.value}{" "}
              discount
              {discount.ends_at
                ? " - Expires " + new Date(discount.ends_at).toLocaleDateString()
                : ""}
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Remove this discount?")) {
                removeDiscount.mutate(discount.applies_to_id);
              }
            }}
            disabled={removeDiscount.isPending}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// Main Component
const TenantDiscountManager = () => {
  const { data: summary } = useTenantSettlementSummary();

  const handleExport = () => {
    // Open export URL in new tab (will download CSV)
    const baseUrl = tenantApi.defaults.baseURL || "";
    window.open(baseUrl + "/admin/settlements/export", "_blank");
  };

  return (
    <div>
      <TenantHeadbar />
      <TenantSidebar />
      <main className="ml-64 pt-16 min-h-screen bg-gray-50">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Discount and Settlement Manager</h1>
              <p className="text-gray-500">
                Manage client discounts and track your financial margins
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding to Admin</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(summary.as_payer?.outstanding || 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Profit</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(summary.margins?.total_profit || 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-full">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Loss</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(summary.margins?.total_loss || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarginCalculator />

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Client Discounts
                </h3>
              </div>
              <ClientDiscountsList />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenantDiscountManager;
