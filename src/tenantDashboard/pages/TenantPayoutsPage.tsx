// @ts-nocheck
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Clock, CheckCircle, DollarSign, Edit2, X, Building2 } from "lucide-react";
import TenantHeadbar from "../components/TenantHeadbar";
import TenantSidebar from "../components/TenantSidebar";
import BreadcrumbNav from "../components/clientAciveTab";
import { useTenantBrandingTheme } from "../../hooks/useBrandingTheme";
import {
  BankAccountForm,
  PayoutHistoryTable,
  BankDetails,
  Bank,
  PayoutSummary,
  Payout,
  formatCurrency,
  formatBankAccount,
} from "../../shared/components/banking";
import silentTenantApi from "../../index/tenant/silentTenant";

// API Hooks
const useBankDetails = () => {
  return useQuery({
    queryKey: ["tenant", "bank-details"],
    queryFn: async () => {
      const res = await silentTenantApi("GET", "/admin/bank-details");
      return res.data as BankDetails;
    },
  });
};

const useBanks = () => {
  return useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const res = await silentTenantApi("GET", "/admin/bank-details/banks");
      return res.data as Bank[];
    },
    staleTime: 1000 * 60 * 60, // Cache banks for 1 hour
  });
};

const usePayoutSummary = () => {
  return useQuery({
    queryKey: ["tenant", "payout-summary"],
    queryFn: async () => {
      const res = await silentTenantApi("GET", "/admin/payouts/summary");
      return res.data as PayoutSummary;
    },
  });
};

const usePayoutHistory = () => {
  return useQuery({
    queryKey: ["tenant", "payouts"],
    queryFn: async () => {
      const res = await silentTenantApi("GET", "/admin/payouts");
      return (res.data?.data || res.data || []) as Payout[];
    },
  });
};

const TenantPayoutsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("payouts");

  const { data: theme } = useTenantBrandingTheme();
  const { data: bankDetails, isLoading: isLoadingBankDetails } = useBankDetails();
  const { data: banks = [], isLoading: isLoadingBanks } = useBanks();
  const { data: summary, isLoading: isLoadingSummary } = usePayoutSummary();
  const { data: payouts = [], isLoading: isLoadingPayouts } = usePayoutHistory();

  const tenantData = {
    name: theme?.company?.name || "Tenant",
    logo: theme?.logo || "",
    color: theme?.accentColor || "#1C1C1C",
  };

  const updateBankDetailsMutation = useMutation({
    mutationFn: async (data: {
      bank_name: string;
      account_number: string;
      account_name: string;
      bank_code: string;
    }) => {
      await silentTenantApi("PUT", "/admin/bank-details", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "bank-details"] });
      setIsEditModalOpen(false);
    },
  });

  const verifyAccount = async (accountNumber: string, bankCode: string) => {
    const res = await silentTenantApi("POST", "/admin/bank-details/verify", {
      account_number: accountNumber,
      bank_code: bankCode,
    });
    return res.data;
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <TenantSidebar
        tenantData={tenantData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <TenantHeadbar tenantData={tenantData} onMenuClick={toggleMobileMenu} />
      <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />

      <main className="dashboard-content-shell p-6 md:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts & Banking</h1>
          <p className="text-gray-600 mt-1">
            Manage your payout bank details and view payout history
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payout</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {isLoadingSummary ? "..." : formatCurrency(summary?.pending || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {isLoadingSummary ? "..." : formatCurrency(summary?.this_month || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Received</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {isLoadingSummary ? "..." : formatCurrency(summary?.total_received || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payout Bank Account</h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              {bankDetails?.bank_name ? "Edit" : "Add"} Bank Details
            </button>
          </div>

          {isLoadingBankDetails ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ) : bankDetails?.bank_name ? (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{bankDetails.bank_name}</p>
                <p className="text-gray-600">{bankDetails.account_name}</p>
                <p className="text-sm text-gray-500 font-mono mt-1">
                  •••• {bankDetails.account_number?.slice(-4)}
                </p>
                {bankDetails.is_verified ? (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    Pending verification
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No bank account configured</p>
              <p className="text-sm mt-1">Add your bank details to receive payouts</p>
            </div>
          )}
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout History</h2>
          <PayoutHistoryTable
            payouts={payouts}
            isLoading={isLoadingPayouts}
            showBankDetails={false}
            emptyMessage="No payouts yet. Payouts are processed weekly based on your revenue share."
          />
        </div>
      </main>

      {/* Edit Bank Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {bankDetails?.bank_name ? "Edit" : "Add"} Bank Details
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <BankAccountForm
                initialData={bankDetails}
                banks={banks}
                isLoadingBanks={isLoadingBanks}
                onVerify={verifyAccount}
                onSave={async (data) => {
                  await updateBankDetailsMutation.mutateAsync(data);
                }}
                onCancel={() => setIsEditModalOpen(false)}
                isSaving={updateBankDetailsMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TenantPayoutsPage;
