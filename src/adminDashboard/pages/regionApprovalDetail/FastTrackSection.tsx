import React from "react";
import { ModernCard, ModernButton, ModernTable } from "@/shared/components/ui";
import type { FastTrackMode, FastTrackGrant, TenantOption } from "./types";

interface FastTrackSectionProps {
  fastTrackMode: FastTrackMode;
  fastTrackNotes: string;
  updatingFastTrack: boolean;
  grantTenantId: string;
  grantingFastTrack: boolean;
  fastTrackGrants: FastTrackGrant[];
  grantOptions: TenantOption[];
  onModeChange: (mode: FastTrackMode) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onGrantTenantChange: (tenantId: string) => void;
  onGrantAccess: () => void;
  onRevoke: (tenantId: string | number | null | undefined) => void;
}

const FastTrackSection: React.FC<FastTrackSectionProps> = ({
  fastTrackMode,
  fastTrackNotes,
  updatingFastTrack,
  grantTenantId,
  grantingFastTrack,
  fastTrackGrants,
  grantOptions,
  onModeChange,
  onNotesChange,
  onSave,
  onGrantTenantChange,
  onGrantAccess,
  onRevoke,
}) => {
  return (
    <ModernCard padding="lg" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Fast-track Controls</h2>
          <p className="text-sm text-gray-500">
            Decide who can skip payments when provisioning through this region.
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <label
            htmlFor="fast-track-mode"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Fast-track mode
          </label>
          <select
            id="fast-track-mode"
            value={fastTrackMode}
            onChange={(event) => onModeChange(event.target.value as FastTrackMode)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:border-primary-300 focus:ring-primary-200"
          >
            <option value="owner_only">Owner only</option>
            <option value="grant_only">Grants only</option>
            <option value="disabled">Disabled</option>
          </select>
          <label htmlFor="fast-track-notes" className="sr-only">
            Fast-track notes
          </label>
          <textarea
            id="fast-track-notes"
            value={fastTrackNotes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Notes for ops teams (optional)"
            className="mt-2 h-20 w-full resize-none rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:border-primary-300 focus:ring-primary-200"
          />
          <ModernButton
            variant="primary"
            size="sm"
            isLoading={updatingFastTrack}
            onClick={onSave}
            className="mt-2"
          >
            Save fast-track settings
          </ModernButton>
        </div>
        <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <label
            htmlFor="fast-track-grant"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Add fast-track grant
          </label>
          <select
            id="fast-track-grant"
            value={grantTenantId}
            onChange={(event) => onGrantTenantChange(event.target.value)}
            disabled={fastTrackMode === "disabled"}
            className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:border-primary-300 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Select tenant</option>
            {grantOptions.map((tenant: TenantOption) => (
              <option key={String(tenant.id ?? "")} value={tenant.id ?? ""}>
                {tenant.name || tenant.slug || tenant.identifier || tenant.id}
              </option>
            ))}
          </select>
          <ModernButton
            variant="outline"
            size="sm"
            disabled={!grantTenantId || fastTrackMode === "disabled"}
            isLoading={grantingFastTrack}
            onClick={onGrantAccess}
          >
            Grant access
          </ModernButton>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Current grants</h3>
        {fastTrackGrants.length === 0 ? (
          <p className="text-sm text-gray-500">No tenants have explicit fast-track access.</p>
        ) : (
          <ModernTable<FastTrackGrant>
            data={fastTrackGrants.map((grant: FastTrackGrant, index: number) => ({
              ...grant,
              id: grant.id ?? `${grant.tenant_id ?? "grant"}-${index}`,
            }))}
            columns={[
              {
                key: "tenant_name",
                header: "TENANT",
                render: (_: unknown, grant: FastTrackGrant) => (
                  <span className="text-gray-800">{grant.tenant_name || grant.tenant_id}</span>
                ),
              },
              {
                key: "granted_at",
                header: "GRANTED AT",
                render: (val: unknown) => (
                  <span className="text-gray-600">
                    {val ? new Date(val as string | number | Date).toLocaleString() : "\u2014"}
                  </span>
                ),
              },
              {
                key: "notes",
                header: "NOTES",
                render: (val: unknown) => (
                  <span className="text-gray-600">{String(val || "\u2014")}</span>
                ),
              },
              {
                key: "actions",
                header: "ACTIONS",
                render: (_: unknown, grant: FastTrackGrant) => (
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    onClick={() => onRevoke(grant.tenant_id)}
                  >
                    Revoke
                  </button>
                ),
              },
            ]}
            searchable={false}
            filterable={false}
            exportable={false}
            paginated={false}
            enableAnimations={false}
          />
        )}
      </div>
    </ModernCard>
  );
};

export default FastTrackSection;
