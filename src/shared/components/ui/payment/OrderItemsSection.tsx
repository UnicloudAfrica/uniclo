import { Server } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import type { StorageProfile, InstanceSummary } from "./types";

interface OrderItemsSectionProps {
  storageProfiles: StorageProfile[];
  instances: InstanceSummary[] | undefined;
}

const OrderItemsSection = ({ storageProfiles, instances }: OrderItemsSectionProps) => {
  const hasStorageProfiles = storageProfiles.length > 0;
  const hasInstances = (instances?.length ?? 0) > 0;

  if (!hasStorageProfiles && !hasInstances) return null;

  return (
    <>
      {hasStorageProfiles && (
        <div className="space-y-4">
          <h4
            className="flex items-center font-semibold"
            style={{ color: designTokens.colors.neutral[900] }}
          >
            <Server className="mr-2 h-5 w-5" />
            Storage profiles ({storageProfiles.length})
          </h4>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {storageProfiles.map((profile, index) => (
              <div
                key={profile.id || index}
                className="rounded-lg p-3 text-sm"
                style={{ backgroundColor: designTokens.colors.neutral[50] }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium" style={{ color: designTokens.colors.neutral[900] }}>
                    {profile.name ||
                      profile.tierName ||
                      profile.tier_key ||
                      profile.tierKey ||
                      `Storage line ${index + 1}`}
                  </span>
                  <span
                    className="rounded px-2 py-1 text-xs"
                    style={{
                      backgroundColor: designTokens.colors.primary[100],
                      color: designTokens.colors.primary[800],
                    }}
                  >
                    {profile.region || profile.regionLabel || "Region"} {"\u2022"}{" "}
                    {profile.currency || ""}
                  </span>
                </div>
                <div className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                  {profile.months ? `${profile.months} month term` : "Object storage"} {"\u2022"}{" "}
                  {profile.subtotal
                    ? `Total ${(profile.currency || "").toUpperCase()} ${Number(profile.subtotal).toLocaleString()}`
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasInstances && (
        <div className="space-y-4">
          <h4
            className="flex items-center font-semibold"
            style={{ color: designTokens.colors.neutral[900] }}
          >
            <Server className="mr-2 h-5 w-5" />
            Instances ({instances?.length || 0})
          </h4>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {Array.isArray(instances) &&
              instances.map((instance, index) => (
                <div
                  key={instance.id}
                  className="rounded-lg p-3 text-sm"
                  style={{ backgroundColor: designTokens.colors.neutral[50] }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className="font-medium"
                      style={{ color: designTokens.colors.neutral[900] }}
                    >
                      {instance.name || `Instance ${index + 1}`}
                    </span>
                    <span
                      className="rounded px-2 py-1 text-xs"
                      style={{
                        backgroundColor: designTokens.colors.primary[100],
                        color: designTokens.colors.primary[800],
                      }}
                    >
                      {/* Customer-facing payment UI \u2014 never display vendor key.
                          Show the AZ + region instead. */}
                      {(instance as { availability_zone?: string }).availability_zone || instance.region}{" "}
                      {"\u2022"} {instance.region}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                    Status: <span className="font-medium">{instance.status}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
};

export default OrderItemsSection;
