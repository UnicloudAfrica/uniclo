// @ts-nocheck
import React, { useState } from "react";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  CreditCard,
  Settings,
  TrendingUp,
  Clock,
  DollarSign,
  Gift,
  AlertCircle,
  ChevronRight,
  Filter,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernButton } from "../../shared/components/ui";
import ModernTable from "../../shared/components/ui/ModernTable";
import { designTokens } from "../../styles/designTokens";
import {
  useFetchWalletBalance,
  useFetchWalletTransactions,
  useTopUpWallet,
} from "../../hooks/walletHooks";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface WalletTransaction {
  id: number;
  uuid: string;
  type:
    | "credit"
    | "debit"
    | "refund"
    | "adjustment"
    | "transfer_in"
    | "transfer_out"
    | "promotional";
  amount: number;
  balance_before: number;
  balance_after: number;
  currency: string;
  source?: string;
  reference?: string;
  description?: string;
  status: "pending" | "completed" | "failed" | "reversed";
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// BILLING MODE SELECTOR
// ═══════════════════════════════════════════════════════════════════

const BillingModeCard: React.FC<{
  mode: string;
  title: string;
  description: string;
  isActive: boolean;
  onSelect: () => void;
}> = ({ mode, title, description, isActive, onSelect }) => (
  <button
    onClick={onSelect}
    className={`p-4 rounded-xl border-2 text-left transition-all ${
      isActive
        ? "border-blue-500 bg-blue-50"
        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
    }`}
  >
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {isActive && (
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}
    </div>
  </button>
);

// ═══════════════════════════════════════════════════════════════════
// TOP-UP MODAL
// ═══════════════════════════════════════════════════════════════════

const TopUpModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onTopUp: (amount: number) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, currency, onTopUp, isLoading }) => {
  const [amount, setAmount] = useState<number>(5000);
  const presets = [5000, 10000, 25000, 50000, 100000];

  if (!isOpen) return null;

  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-4">Top Up Wallet</h3>

        <div className="mb-4">
          <label className="text-sm text-gray-600 block mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">{symbol}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-3 text-xl font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {presets.map((preset: any) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                amount === preset
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {symbol}
              {preset.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onTopUp(amount)}
            disabled={!amount || isLoading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : `Pay ${symbol}${amount.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function WalletDashboard() {
  const [showTopUp, setShowTopUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const { data: wallet, isLoading: walletLoading } = useFetchWalletBalance();
  const { data: transactionsData, isLoading: txLoading } = useFetchWalletTransactions();
  const { mutate: topUp, isPending: topUpLoading } = useTopUpWallet();

  const transactions: WalletTransaction[] = transactionsData?.data || [];
  const balance = wallet?.balance || 0;
  const currency = wallet?.currency || "NGN";
  const billingMode = wallet?.billing_mode || "prepaid";

  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency;

  // Filter transactions
  const filteredTx =
    filterType === "all" ? transactions : transactions.filter((tx: any) => tx.type === filterType);

  // Calculate stats
  const totalCredits = transactions
    .filter((tx: any) => ["credit", "refund", "promotional", "transfer_in"].includes(tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDebits = transactions
    .filter((tx: any) => ["debit", "transfer_out"].includes(tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const handleTopUp = (amount: number) => {
    (topUp as any)(
      { amount, currency, payment_method: "paystack" },
      {
        onSuccess: () => setShowTopUp(false),
      }
    );
  };

  const txTypeConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    credit: { color: "#10B981", bg: "#D1FAE5", icon: ArrowDownCircle, label: "Credit" },
    debit: { color: "#EF4444", bg: "#FEE2E2", icon: ArrowUpCircle, label: "Debit" },
    refund: { color: "#3B82F6", bg: "#DBEAFE", icon: RefreshCw, label: "Refund" },
    adjustment: { color: "#8B5CF6", bg: "#EDE9FE", icon: Settings, label: "Adjustment" },
    promotional: { color: "#F59E0B", bg: "#FEF3C7", icon: Gift, label: "Promo" },
    transfer_in: { color: "#10B981", bg: "#D1FAE5", icon: ArrowDownCircle, label: "Transfer In" },
    transfer_out: { color: "#EF4444", bg: "#FEE2E2", icon: ArrowUpCircle, label: "Transfer Out" },
  };

  const columns = [
    {
      key: "type",
      header: "Type",
      render: (value: string) => {
        const config = txTypeConfig[value] || txTypeConfig.credit;
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: config.bg }}>
              <Icon size={14} style={{ color: config.color }} />
            </div>
            <span className="text-sm font-medium">{config.label}</span>
          </div>
        );
      },
    },
    {
      key: "description",
      header: "Description",
      render: (value: string) => (
        <span className="text-sm text-gray-600 truncate max-w-[200px] block">{value || "—"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (value: number, tx: WalletTransaction) => {
        const isCredit = ["credit", "refund", "promotional", "transfer_in"].includes(tx.type);
        return (
          <span className={`font-semibold ${isCredit ? "text-green-600" : "text-red-600"}`}>
            {isCredit ? "+" : "-"}
            {symbol}
            {Number(value).toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "balance_after",
      header: "Balance",
      render: (value: number) => (
        <span className="text-sm text-gray-600">
          {symbol}
          {Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => {
        const statusColors: Record<string, string> = {
          completed: "bg-green-100 text-green-700",
          pending: "bg-yellow-100 text-yellow-700",
          failed: "bg-red-100 text-red-700",
          reversed: "bg-gray-100 text-gray-700",
        };
        return (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[value] || statusColors.pending}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "created_at",
      header: "Date",
      render: (value: string) => (
        <span className="text-xs text-gray-500">
          {new Date(value).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminPageShell
        title="Wallet & Billing"
        description="Manage your account balance and billing preferences"
        actions={
          <ModernButton onClick={() => setShowTopUp(true)} className="flex items-center gap-2">
            <CreditCard size={16} />
            Top Up
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Available Balance</p>
              <h2 className="text-4xl font-bold">
                {symbol}
                {Number(balance).toLocaleString()}
              </h2>
              <p className="text-blue-200 text-sm mt-2 flex items-center gap-1">
                <Clock size={12} />
                Billing mode: {billingMode}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {wallet?.isLowBalance && (
            <div className="mt-4 p-3 bg-orange-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm">
                Low balance warning — top up to avoid service interruption
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModernStatsCard
            title="Total Credits"
            value={`${symbol}${totalCredits.toLocaleString()}`}
            icon={<ArrowDownCircle size={24} />}
            color="success"
            description="All time"
          />
          <ModernStatsCard
            title="Total Spent"
            value={`${symbol}${totalDebits.toLocaleString()}`}
            icon={<ArrowUpCircle size={24} />}
            color="error"
            description="All time"
          />
          <ModernStatsCard
            title="Transactions"
            value={transactions.length}
            icon={<TrendingUp size={24} />}
            color="primary"
            description="Total history"
          />
        </div>

        {/* Billing Mode */}
        {showSettings && (
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h3 className="font-semibold mb-4">Billing Mode</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BillingModeCard
                mode="prepaid"
                title="Prepaid"
                description="Pay upfront, deduct from balance"
                isActive={billingMode === "prepaid"}
                onSelect={() => {}}
              />
              <BillingModeCard
                mode="postpaid"
                title="Postpaid"
                description="Pay at end of billing cycle"
                isActive={billingMode === "postpaid"}
                onSelect={() => {}}
              />
              <BillingModeCard
                mode="hybrid"
                title="Hybrid"
                description="Use balance + credit limit"
                isActive={billingMode === "hybrid"}
                onSelect={() => {}}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
            <option value="refund">Refunds</option>
            <option value="promotional">Promotional</option>
          </select>
        </div>

        {/* Transactions Table */}
        <ModernTable
          data={filteredTx}
          columns={columns as any}
          title="Transaction History"
          searchable
          searchKeys={["description", "reference"]}
          loading={txLoading}
          emptyMessage="No transactions yet"
        />
      </AdminPageShell>

      <TopUpModal
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
        currency={currency}
        onTopUp={handleTopUp}
        isLoading={topUpLoading}
      />
    </>
  );
}
