import React from "react";
import { ModernCard, ModernTable } from "@/shared/components/ui";
import type { RevenueShare } from "./types";
import { formatCurrency } from "./utils";

interface RevenueSectionProps {
  recentRevenue: RevenueShare[];
}

const RevenueSection: React.FC<RevenueSectionProps> = ({ recentRevenue }) => {
  if (!recentRevenue.length) return null;

  return (
    <ModernCard padding="lg" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Recent Revenue Shares</h2>
        <p className="text-sm text-gray-500">Latest disbursements recorded for this region.</p>
      </div>
      <ModernTable
        data={recentRevenue.map((r: RevenueShare, index: number) => ({
          ...r,
          id: r.id ?? `revenue-${index}`,
        }))}
        columns={[
          {
            key: "created_at",
            header: "DATE",
            render: (val: unknown) => (
              <span className="text-gray-700">
                {val ? new Date(val as string | number | Date).toLocaleString() : "N/A"}
              </span>
            ),
          },
          {
            key: "gross_amount",
            header: "GROSS",
            render: (val: unknown) => (
              <span className="text-gray-700">{formatCurrency(val as number | string)}</span>
            ),
          },
          {
            key: "platform_fee_amount",
            header: "PLATFORM FEE",
            render: (val: unknown) => (
              <span className="text-gray-700">{formatCurrency(val as number | string)}</span>
            ),
          },
          {
            key: "tenant_share_amount",
            header: "TENANT SHARE",
            render: (val: unknown) => (
              <span className="text-gray-700">{formatCurrency(val as number | string)}</span>
            ),
          },
          {
            key: "status",
            header: "STATUS",
            render: (val: unknown) => (
              <span className="text-gray-700 capitalize">{String(val || "pending")}</span>
            ),
          },
        ]}
        searchable={false}
        filterable={false}
        exportable={false}
        paginated={false}
        enableAnimations={false}
      />
    </ModernCard>
  );
};

export default RevenueSection;
