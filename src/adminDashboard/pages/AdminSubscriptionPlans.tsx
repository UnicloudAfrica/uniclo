// @ts-nocheck
import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Package,
  Check,
  X,
  Clock,
  Star,
  Zap,
  MoreVertical,
  Search,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernButton } from "../../shared/components/ui";
import { designTokens } from "../../styles/designTokens";
import {
  useFetchSubscriptionPlans,
  useDeleteSubscriptionPlan,
} from "../../hooks/subscriptionHooks";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  billing_interval: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  billing_interval_count: number;
  base_price: number;
  currency: string;
  max_instances?: number;
  max_vcpus?: number;
  max_memory_gb?: number;
  max_storage_gb?: number;
  features?: Record<string, boolean>;
  trial_days: number;
  is_active: boolean;
  is_public: boolean;
  subscriptions_count?: number;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// PLAN CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════

const PlanCard: React.FC<{
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
  onView: (plan: SubscriptionPlan) => void;
}> = ({ plan, onEdit, onDelete, onView }) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = {
      NGN: "₦",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    return `${symbols[currency] || currency}${Number(price).toLocaleString()}`;
  };

  const formatInterval = (interval: string, count: number) => {
    if (count === 1) return `/${interval.replace("ly", "")}`;
    return `/${count} ${interval.replace("ly", "")}s`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all relative group">
      {/* Status badges */}
      <div className="flex items-center gap-2 mb-4">
        {plan.is_active ? (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <Check size={10} /> Active
          </span>
        ) : (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
            <X size={10} /> Inactive
          </span>
        )}
        {plan.is_public && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            Public
          </span>
        )}
        {plan.trial_days > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
            <Star size={10} /> {plan.trial_days}d trial
          </span>
        )}
      </div>

      {/* Plan name */}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{plan.name}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {plan.description || "No description"}
      </p>

      {/* Price */}
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900">
          {formatPrice(plan.base_price, plan.currency)}
        </span>
        <span className="text-gray-500 text-sm">
          {formatInterval(plan.billing_interval, plan.billing_interval_count)}
        </span>
      </div>

      {/* Limits */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        {plan.max_instances && (
          <div className="flex items-center gap-1 text-gray-600">
            <Package size={12} />
            <span>{plan.max_instances} instances</span>
          </div>
        )}
        {plan.max_vcpus && (
          <div className="flex items-center gap-1 text-gray-600">
            <Zap size={12} />
            <span>{plan.max_vcpus} vCPUs</span>
          </div>
        )}
        {plan.max_memory_gb && (
          <div className="flex items-center gap-1 text-gray-600">
            <span className="w-3 h-3 font-bold text-[10px]">GB</span>
            <span>{plan.max_memory_gb} GB RAM</span>
          </div>
        )}
        {plan.max_storage_gb && (
          <div className="flex items-center gap-1 text-gray-600">
            <span className="w-3 h-3 font-bold text-[10px]">TB</span>
            <span>{plan.max_storage_gb} GB storage</span>
          </div>
        )}
      </div>

      {/* Subscribers count */}
      <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t border-gray-100">
        <Users size={14} />
        <span>{plan.subscriptions_count || 0} subscribers</span>
      </div>

      {/* Actions menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical size={16} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36 z-10">
            <button
              onClick={() => {
                onView(plan);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye size={14} /> View details
            </button>
            <button
              onClick={() => {
                onEdit(plan);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit2 size={14} /> Edit plan
            </button>
            <button
              onClick={() => {
                onDelete(plan);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              disabled={(plan.subscriptions_count || 0) > 0}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function AdminSubscriptionPlans() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const { data: plansData, isLoading } = useFetchSubscriptionPlans();
  const { mutate: deletePlan, isPending: isDeleting } = useDeleteSubscriptionPlan();

  const plans: SubscriptionPlan[] = plansData?.data || [];

  // Filter plans
  const filteredPlans = plans.filter(
    (plan: any) =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: plans.length,
    active: plans.filter((p: any) => p.is_active).length,
    public: plans.filter((p: any) => p.is_public).length,
    withTrial: plans.filter((p: any) => p.trial_days > 0).length,
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowCreateModal(true);
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    if ((plan.subscriptions_count || 0) > 0) {
      alert("Cannot delete plan with active subscribers");
      return;
    }
    if (window.confirm(`Delete plan "${plan.name}"?`)) {
      (deletePlan as any)(plan.id);
    }
  };

  const handleView = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    // Open detail drawer/modal
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Subscription Plans"
        description="Create and manage billing plans for your customers"
        actions={
          <ModernButton
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Create Plan
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ModernStatsCard
            title="Total Plans"
            value={stats.total}
            icon={<Package size={24} />}
            color="primary"
            description="All subscription plans"
          />
          <ModernStatsCard
            title="Active Plans"
            value={stats.active}
            icon={<Check size={24} />}
            color="success"
            description="Currently available"
          />
          <ModernStatsCard
            title="Public Plans"
            value={stats.public}
            icon={<Users size={24} />}
            color="info"
            description="Visible to customers"
          />
          <ModernStatsCard
            title="With Trial"
            value={stats.withTrial}
            icon={<Clock size={24} />}
            color="warning"
            description="Include trial period"
          />
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i: any) => (
              <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No plans found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery ? "Try a different search term" : "Create your first subscription plan"}
            </p>
            {!searchQuery && (
              <ModernButton onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> Create Plan
              </ModernButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan: any) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </AdminPageShell>

      {/* TODO: Create/Edit Modal */}
    </>
  );
}
