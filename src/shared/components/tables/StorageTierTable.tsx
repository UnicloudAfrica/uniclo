import React from "react";
import { Pencil, Trash2, HardDrive } from "lucide-react";

/**
 * StorageTierTable - Reusable component for displaying storage tier/pricing data
 * Can be used across Admin, Tenant, and Client dashboards
 */
interface StorageTier {
  id: string | number;
  name?: string;
  region?: string;
  quota?: number;
  pricePerGiB?: number;
  totalPrice?: number;
  providerId?: string;
}

interface StorageTierTableProps {
  data: StorageTier[];
  loading?: boolean;
  onEdit?: (tier: StorageTier) => void;
  onDelete?: (tier: StorageTier) => void;
  showActions?: boolean;
  emptyMessage?: string;
}

const formatNumber = (value: number | undefined, suffix = "") =>
  typeof value === "number" && !Number.isNaN(value) ? `${value.toLocaleString()}${suffix}` : "—";

const StorageTierTable: React.FC<StorageTierTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
  emptyMessage = "No storage tiers available",
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <HardDrive className="h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/80">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              SKU
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Region
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quota (GiB)
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Per GiB (USD)
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total (USD)
            </th>
            {showActions && (
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((tier) => (
            <tr key={tier.id} className="transition hover:bg-slate-50/70">
              <td className="px-6 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {tier.name || "Unnamed tier"}
                  </p>
                  {tier.providerId && (
                    <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">
                      {tier.providerId}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-700">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {tier.region || "Global"}
                </span>
              </td>
              <td className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                {formatNumber(tier.quota)}
              </td>
              <td className="px-6 py-4 text-right text-sm text-slate-700">
                {tier.pricePerGiB ? `$${tier.pricePerGiB.toFixed(4)}` : "—"}
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                {tier.totalPrice ? `$${tier.totalPrice.toFixed(4)}` : "—"}
              </td>
              {showActions && (
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(tier)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(tier)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StorageTierTable;
