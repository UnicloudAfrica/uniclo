import React from "react";
import { Check } from "lucide-react";
import adminRegionApi from "@/services/adminRegionApi";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import logger from "@/utils/logger";
import type { FastTrackConfigCardProps } from "./regionEditTypes";

type TenantShape = {
  id: string | number;
  name?: string;
  email?: string;
};

type GrantShape = {
  tenant_id?: string | number;
  tenant?: TenantShape;
};

const FastTrackModeOption = ({
  region,
  setRegion,
  value,
  label,
  description,
  activeColor,
}: {
  region: Record<string, unknown>;
  setRegion: React.Dispatch<React.SetStateAction<unknown>>;
  value: string;
  label: string;
  description: string;
  activeColor: string;
}) => {
  const isActive = region?.fast_track_mode === value;
  const borderClass = isActive
    ? `border-${activeColor}-500 bg-${activeColor}-50`
    : "border-gray-200";

  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isActive ? borderClass : "border-gray-200"}`}
      style={
        isActive
          ? {
              borderColor:
                activeColor === "red" ? "#ef4444" : activeColor === "blue" ? "#3b82f6" : "#a855f7",
              backgroundColor:
                activeColor === "red" ? "#fef2f2" : activeColor === "blue" ? "#eff6ff" : "#faf5ff",
            }
          : undefined
      }
    >
      <input
        type="radio"
        name="fast_track_mode"
        value={value}
        checked={isActive}
        onChange={async () => {
          try {
            await adminRegionApi.updateFastTrackSettings(String(region.id ?? ""), {
              fast_track_mode: value,
            });
            setRegion((prev) => ({ ...(prev as Record<string, unknown>), fast_track_mode: value }));
            ToastUtils.success(
              value === "disabled"
                ? "Fast Track disabled"
                : value === "owner_only"
                  ? "Set to Owner Only"
                  : "Set to Grant Based"
            );
          } catch (e) {
            logger.error(e);
          }
        }}
        className="mt-1"
      />
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </label>
  );
};

const TenantGrantList = ({
  region,
  tenants,
  selectedTenantsToGrant,
  setSelectedTenantsToGrant,
  tenantSearch,
  setTenantSearch,
  onRevokeFastTrack,
  fetchRegionDetail,
}: Omit<FastTrackConfigCardProps, "setRegion">) => {
  const searchLower = tenantSearch.toLowerCase();
  const tenantsList = tenants as TenantShape[];
  const grants = (region.fast_track_grants ?? []) as GrantShape[];
  const filteredTenants = tenantsList.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchLower) || t.email?.toLowerCase().includes(searchLower)
  );

  const sortedTenants = [...filteredTenants].sort((a, b) => {
    const aGranted = grants.some((g) => g.tenant_id === a.id);
    const bGranted = grants.some((g) => g.tenant_id === b.id);
    if (aGranted && !bGranted) return -1;
    if (!aGranted && bGranted) return 1;
    return 0;
  });

  return (
    <div className="pt-4 border-t border-gray-100">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Active Grants</h4>
      <div className="space-y-3">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search tenants..."
          value={tenantSearch}
          onChange={(e) => setTenantSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />

        {/* Multi-select tenant list */}
        <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto">
          {tenants.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">No tenants available</p>
          ) : sortedTenants.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">No tenants match your search</p>
          ) : (
            sortedTenants.map((t) => {
              const isAlreadyGranted = grants.some((g) => g.tenant_id === t.id);
              const isSelected = selectedTenantsToGrant.includes(String(t.id));

              return (
                <label
                  key={t.id}
                  className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                    isAlreadyGranted
                      ? "bg-green-50"
                      : isSelected
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                  }`}
                >
                  {isAlreadyGranted ? (
                    <div className="h-4 w-4 rounded border-green-500 bg-green-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTenantsToGrant((prev) => [...prev, String(t.id)]);
                        } else {
                          setSelectedTenantsToGrant((prev) =>
                            prev.filter((id) => id !== String(t.id))
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                    <p className="text-xs text-gray-500 truncate">{t.email}</p>
                  </div>
                  {isAlreadyGranted && (
                    <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {selectedTenantsToGrant.length} tenant(s) selected
          </span>
          <ModernButton
            type="button"
            variant="secondary"
            disabled={selectedTenantsToGrant.length === 0}
            onClick={async () => {
              if (selectedTenantsToGrant.length === 0) return;
              try {
                for (const tenantId of selectedTenantsToGrant) {
                  await adminRegionApi.grantFastTrack(
                    String(region.id ?? ""),
                    tenantId,
                    "Manual Grant via Admin UI"
                  );
                }
                setSelectedTenantsToGrant([]);
                fetchRegionDetail();
                ToastUtils.success(`Granted access to ${selectedTenantsToGrant.length} tenant(s)`);
              } catch (e) {
                logger.error(e);
                ToastUtils.error("Failed to grant access");
              }
            }}
          >
            Grant Access
          </ModernButton>
        </div>
      </div>

      {grants.length > 0 ? (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          {(grants as Array<GrantShape & { id?: string | number; created_at?: string }>).map((grant) => (
            <div
              key={String(grant.id ?? grant.tenant_id ?? "")}
              className="flex justify-between items-center text-sm p-2 bg-white rounded border border-gray-200 shadow-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">
                  {grant.tenant?.name || grant.tenant_id}
                </span>
                <span className="text-xs text-gray-500">
                  Granted: {grant.created_at ? new Date(grant.created_at).toLocaleDateString() : ""}
                </span>
              </div>
              <ModernButton
                title="Revoke Access"
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                onClick={async () => {
                  if (
                    globalThis.window.confirm(
                      "Are you sure you want to revoke Fast Track access for this tenant?"
                    )
                  ) {
                    onRevokeFastTrack(String(grant.tenant_id ?? ""));
                  }
                  fetchRegionDetail();
                }}
              >
                Revoke
              </ModernButton>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No active grants found.</p>
      )}
    </div>
  );
};

const FastTrackConfigCard = ({
  region,
  setRegion,
  tenants,
  selectedTenantsToGrant,
  setSelectedTenantsToGrant,
  tenantSearch,
  setTenantSearch,
  onRevokeFastTrack,
  fetchRegionDetail,
}: FastTrackConfigCardProps) => {
  return (
    <ModernCard title="Fast Track Configuration" className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Fast Track Access Mode
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Control how tenants can bypass standard visibility rules or access restricted/private
            regions.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <FastTrackModeOption
              region={region}
              setRegion={setRegion}
              value="disabled"
              label="Disabled"
              description="No fast track access allowed."
              activeColor="red"
            />
            <FastTrackModeOption
              region={region}
              setRegion={setRegion}
              value="owner_only"
              label="Owner Only"
              description="Only the tenant who owns this region has access."
              activeColor="blue"
            />
            <FastTrackModeOption
              region={region}
              setRegion={setRegion}
              value="grant_only"
              label="Grant Based"
              description="Specific tenants must be explicitly granted access."
              activeColor="purple"
            />
          </div>
        </div>

        {region?.fast_track_mode === "grant_only" && (
          <TenantGrantList
            region={region}
            tenants={tenants}
            selectedTenantsToGrant={selectedTenantsToGrant}
            setSelectedTenantsToGrant={setSelectedTenantsToGrant}
            tenantSearch={tenantSearch}
            setTenantSearch={setTenantSearch}
            onRevokeFastTrack={onRevokeFastTrack}
            fetchRegionDetail={fetchRegionDetail}
          />
        )}
      </div>
    </ModernCard>
  );
};

export default FastTrackConfigCard;
