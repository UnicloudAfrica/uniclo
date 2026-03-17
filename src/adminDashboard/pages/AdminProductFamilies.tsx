import { useCallback, useMemo, useState } from "react";
import {
  Loader2,
  Package,
  Search,
  ChevronDown,
  ChevronRight,
  GitMerge,
  Wand2,
} from "lucide-react";

import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton, ProviderBadge } from "@/shared/components/ui";
import ModernTable from "@/shared/components/ui/ModernTable";

import { useFetchProductFamilies } from "@/hooks/adminHooks/adminProductFamilyHooks";
import useAuthRedirect from "@/utils/adminAuthRedirect";
import ToastUtils from "@/utils/toastUtil";
import api from "../../index/admin/api";

interface FamilyRow {
  family_code: string;
  count: number;
  product_type?: string;
  products?: ProductMember[];
  providers?: string[];
  [key: string]: unknown;
}

interface ProductMember {
  id: string | number;
  name?: string;
  identifier?: string;
  provider?: string;
  region?: string;
  productable_type?: string;
  [key: string]: unknown;
}

const AdminProductFamilies = () => {
  const { isLoading: isAuthLoading } = useAuthRedirect();
  const { isFetching, data: familiesData, refetch } = useFetchProductFamilies();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [isAutoDerivePending, setIsAutoDerivePending] = useState(false);

  const families = useMemo<FamilyRow[]>(() => {
    const payload: any = familiesData;
    const rows = payload?.data ?? [];
    return rows.map((item: any) => {
      const providers = Array.isArray(item.products)
        ? [...new Set(item.products.map((p: any) => p.provider).filter(Boolean))]
        : item.providers ?? [];
      return {
        ...item,
        providers,
      };
    });
  }, [familiesData]);

  const filteredFamilies = useMemo(() => {
    if (!searchQuery.trim()) return families;
    const query = searchQuery.trim().toLowerCase();
    return families.filter((row) => {
      const code = (row.family_code || "").toLowerCase();
      const type = (row.product_type || "").toLowerCase();
      return code.includes(query) || type.includes(query);
    });
  }, [families, searchQuery]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleAutoDerive = async () => {
    setIsAutoDerivePending(true);
    try {
      await api("POST", "/product-families/auto-derive", {});
      ToastUtils.success("Auto-derive process has been triggered. Families will update shortly.");
      refetch();
    } catch {
      ToastUtils.error("Failed to trigger auto-derive. Please try again.");
    } finally {
      setIsAutoDerivePending(false);
    }
  };

  const toggleExpand = (familyCode: string) => {
    setExpandedFamily((prev) => (prev === familyCode ? null : familyCode));
  };

  const columns = useMemo(
    () => [
      {
        key: "family_code",
        header: "Family Code",
        render: (_cellValue: unknown, row: FamilyRow) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(row.family_code);
              }}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              {expandedFamily === row.family_code ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <GitMerge className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{row.family_code}</p>
            </div>
          </div>
        ),
      },
      {
        key: "product_type",
        header: "Product Type",
        align: "center" as const,
        render: (_cellValue: unknown, row: FamilyRow) => (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {row.product_type || "Mixed"}
          </span>
        ),
      },
      {
        key: "count",
        header: "Member Count",
        align: "center" as const,
        render: (_cellValue: unknown, row: FamilyRow) => (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            {row.count ?? row.products?.length ?? 0}
          </span>
        ),
      },
      {
        key: "providers",
        header: "Providers",
        align: "center" as const,
        render: (_cellValue: unknown, row: FamilyRow) => {
          const providers = row.providers ?? [];
          if (!providers.length) {
            return <span className="text-xs text-slate-400">None</span>;
          }
          return (
            <div className="flex flex-wrap items-center justify-center gap-1">
              {providers.map((provider: string) => (
                <ProviderBadge key={provider} provider={provider} />
              ))}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "",
        align: "right" as const,
        render: (_cellValue: unknown, row: FamilyRow) => (
          <ModernButton
            variant="outline"
            onClick={() => toggleExpand(row.family_code)}
            className="text-xs"
          >
            {expandedFamily === row.family_code ? "Collapse" : "View Members"}
          </ModernButton>
        ),
      },
    ],
    [expandedFamily]
  );

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--theme-color)]" />
      </div>
    );
  }

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell
        title="Product Families"
        description="Manage product family codes and equivalence mappings across providers and regions."
        actions={
          <ModernButton
            onClick={handleAutoDerive}
            isDisabled={isAutoDerivePending}
            className="flex items-center gap-2"
          >
            {isAutoDerivePending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wand2 size={16} />
            )}
            {isAutoDerivePending ? "Deriving..." : "Auto-derive"}
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        {/* Search bar */}
        <ModernCard className="border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3 p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search families by code or product type..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-600 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </ModernCard>

        {/* Table */}
        <ModernCard className="border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
          {isFetching && filteredFamilies.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              <span className="ml-3 text-sm text-slate-500">Loading product families...</span>
            </div>
          ) : filteredFamilies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                <GitMerge className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-700">No product families found</p>
              <p className="mt-1 text-xs text-slate-500">
                Use the Auto-derive button to generate family codes, or assign them manually on the
                Products page.
              </p>
            </div>
          ) : (
            <>
              <ModernTable
                data={filteredFamilies}
                columns={columns}
                searchable={false}
                paginated={true}
                pageSize={15}
                onRowClick={(row: FamilyRow) => toggleExpand(row.family_code)}
              />

              {/* Expanded row detail */}
              {expandedFamily && (
                <ExpandedFamilyDetail
                  familyCode={expandedFamily}
                  families={filteredFamilies}
                />
              )}
            </>
          )}
        </ModernCard>
      </AdminPageShell>
    </>
  );
};

interface ExpandedFamilyDetailProps {
  familyCode: string;
  families: FamilyRow[];
}

const ExpandedFamilyDetail = ({ familyCode, families }: ExpandedFamilyDetailProps) => {
  const family = families.find((f) => f.family_code === familyCode);
  const products = family?.products ?? [];

  if (!products.length) {
    return (
      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
        <p className="text-sm text-slate-500">
          No products found in family <strong>{familyCode}</strong>. Product details may not be
          included in the summary endpoint.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-700">
        Members of <span className="text-indigo-600">{familyCode}</span>
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="pb-2 pr-4">Product</th>
              <th className="pb-2 pr-4">Provider</th>
              <th className="pb-2 pr-4">Region</th>
              <th className="pb-2 pr-4">Type</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <tr
                key={product.id ?? idx}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="py-2 pr-4">
                  <p className="font-medium text-slate-800">{product.name || "Unnamed"}</p>
                  {product.identifier && (
                    <p className="text-xs text-slate-400">{product.identifier}</p>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {product.provider ? (
                    <ProviderBadge provider={product.provider} />
                  ) : (
                    <span className="text-xs text-slate-400">--</span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {product.region || "Global"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span className="text-xs text-slate-500">
                    {product.productable_type || "--"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductFamilies;
