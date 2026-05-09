import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  KeyRound,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import adminRegionApi from "@/services/adminRegionApi";
import ToastUtils from "@/utils/toastUtil";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ProviderBadge } from "@/shared/components/ui";
import ModernStatsCard from "@/shared/components/ui/ModernStatsCard";
import { ModernButton } from "@/shared/components/ui";
import StatusPill from "@/shared/components/ui/StatusPill";
import { designTokens } from "@/styles/designTokens";
import logger from "@/utils/logger";
import { useFetchAvailabilityZones } from "@/hooks/adminHooks/regionHooks";
import type { AvailabilityZone } from "@/shared/types/resource";
import { AZCredentialPanel } from "@/shared/domains/regions/components";

const statusToneMap = {
  healthy: "success",
  degraded: "warning",
  down: "danger",
};
const statusLabelMap = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};
const formatSegment = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "";
  return String(value)
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment: string) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};
const formatDateTime = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).toLocaleString();
  }
  return "—";
};

const AttributeTile = ({ label, value, hint, icon: Icon }: { label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode; icon: React.ComponentType<{ size?: number }> }) => {
  const resolvedValue = value !== null && value !== undefined && value !== "" ? value : "—";
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      {Icon && (
        <div className="rounded-xl bg-white/90 p-2 text-gray-500 shadow-sm">
          <Icon size={18} />
        </div>
      )}
      <div className="flex-1 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <div className="text-sm font-semibold text-gray-900 break-words">{resolvedValue}</div>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  );
};

const RegionDetail = () => {
  const { id: code } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // Track which AZ rows have their credential panel expanded. Each AZ stays
  // collapsed by default so admins only render heavy schema/credential reads
  // for the AZ they're actively configuring.
  const [expandedAzCodes, setExpandedAzCodes] = useState<Set<string>>(new Set());

  const toggleAzExpanded = (azCode: string): void => {
    setExpandedAzCodes((prev) => {
      const next = new Set(prev);
      if (next.has(azCode)) {
        next.delete(azCode);
      } else {
        next.add(azCode);
      }
      return next;
    });
  };

  const { data: availabilityZones = [], isLoading: azLoading } = useFetchAvailabilityZones(
    typeof region?.code === "string" ? region.code : ""
  );

  const fetchRegionDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionByCode(code as string);
      setRegion(response.data);
    } catch (error) {
      logger.error("Error fetching region:", error);
      ToastUtils.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchRegionDetail();
  }, [fetchRegionDetail]);

  const locationLabel = useMemo(() => {
    if (!region) return "";
    const segments = [region.city, region.country_code].filter(Boolean);
    return segments.join(", ");
  }, [region]);

  /** Derive unique provider labels from the AZs */
  const azProvidersSummary = useMemo(() => {
    if (!availabilityZones || availabilityZones.length === 0) return null;
    const unique = [...new Set(availabilityZones.map((az: AvailabilityZone) => az.provider))];
    return unique;
  }, [availabilityZones]);

  const headerMeta = useMemo(() => {
    if (!region) return null;
    const pills = [
      region.status && (
        <StatusPill
          key="status"
          label={
            statusLabelMap[region.status as keyof typeof statusLabelMap] ||
            formatSegment(region.status)
          }
          tone={
            (statusToneMap[region.status as keyof typeof statusToneMap] || "info") as
              | "success"
              | "warning"
              | "danger"
              | "info"
              | "neutral"
          }
        />
      ),
      <StatusPill
        key="active"
        label={region.is_active ? "Active" : "Inactive"}
        tone={region.is_active ? "success" : "warning"}
      />,
    ];

    if (region.ownership_type) {
      pills.push(
        <StatusPill
          key="ownership"
          label={`${formatSegment(region.ownership_type)} Ownership`}
          tone="neutral"
        />
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {pills}
        {azProvidersSummary && azProvidersSummary.length > 0 && (
          <>
            {azProvidersSummary.map((p: string) => (
              <ProviderBadge key={p} provider={p} size="sm" />
            ))}
          </>
        )}
      </div>
    );
  }, [region, azProvidersSummary]);

  const headerActions = useMemo(() => {
    if (!region) return null;

    return (
      <div className="flex flex-wrap gap-2">
        <ModernButton
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          onClick={fetchRegionDetail}
          isDisabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </ModernButton>

        <Link to={`/admin-dashboard/regions/${region.code}/edit`}>
          <ModernButton variant="secondary" size="sm" className="flex items-center gap-2">
            <Edit size={16} />
            Edit Region
          </ModernButton>
        </Link>
      </div>
    );
  }, [region, loading, fetchRegionDetail]);

  const statsCards = useMemo(() => {
    if (!region) return [];

    const cards = [
      {
        key: "health",
        title: "Operational Health",
        value: formatSegment(region.status) || "Unknown",
        color: (statusToneMap[region.status as keyof typeof statusToneMap] || "info") as
          | "success"
          | "warning"
          | "danger"
          | "info"
          | "neutral",
        icon: <Activity size={24} />,
        description:
          region.status === "healthy"
            ? "All systems performing normally"
            : region.status === "degraded"
              ? "Performance degradation observed"
              : region.status === "down"
                ? "Region is currently unavailable"
                : "Health status not reported",
      },
      {
        key: "active-state",
        title: "Activation",
        value: region.is_active ? "Active" : "Inactive",
        color: region.is_active ? "success" : "warning",
        icon: <CheckCircle size={24} />,
        description: region.is_active
          ? "Region can serve workloads"
          : "Region has been deactivated",
      },
    ];

    if (region.az_selection_mode) {
      cards.push({
        key: "az-selection",
        title: "AZ Selection Mode",
        value: formatSegment(region.az_selection_mode),
        color: region.az_selection_mode === "auto" ? "primary" : "info",
        icon: <Layers size={24} />,
        description:
          region.az_selection_mode === "auto"
            ? "Platform selects the best AZ automatically"
            : region.az_selection_mode === "user_selectable"
              ? "Users can choose their availability zone"
              : "AZ selection is disabled",
      });
    }

    if (region.ownership_type) {
      cards.push({
        key: "ownership",
        title: "Ownership",
        value: formatSegment(region.ownership_type),
        color: "info",
        icon: <Users size={24} />,
        description:
          region.ownership_type === "platform"
            ? "Managed by platform team"
            : "Owned by tenant partner",
      });
    }

    return cards;
  }, [region]);

  const renderLoadingShell = () => (
    <AdminPageShell
      title="Region"
      description="Detailed operational overview."
      contentClassName="flex min-h-[60vh] items-center justify-center"
    >
      <Loader2
        className="h-10 w-10 animate-spin"
        style={{ color: designTokens.colors.primary[500] }}
      />
    </AdminPageShell>
  );

  const renderNotFoundShell = () => (
    <AdminPageShell
      title="Region"
      description="Detailed operational overview."
      contentClassName="flex min-h-[60vh] items-center justify-center"
      actions={
        <ModernButton variant="outline" onClick={() => navigate("/admin-dashboard/regions")}>
          Back to Regions
        </ModernButton>
      }
    >
      <ModernCard className="max-w-md text-center space-y-3">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="text-sm text-gray-600">
          We could not find this region. It may have been removed.
        </p>
      </ModernCard>
    </AdminPageShell>
  );

  if (loading) {
    return <>{renderLoadingShell()}</>;
  }

  if (!region) {
    return <>{renderNotFoundShell()}</>;
  }

  const ownershipTenant = region.owner_tenant as { name?: string; email?: string; id?: string | number } | null | undefined;
  const platformFee =
    region.platform_fee_percentage !== null && region.platform_fee_percentage !== undefined
      ? `${region.platform_fee_percentage}%`
      : "—";

  return (
    <>
      <AdminPageShell
        title={String(region.name || "Region")}
        description={
          locationLabel ? `${locationLabel} • ${region.code}` : `Region Code: ${region.code}`
        }
        subHeaderContent={headerMeta}
        actions={headerActions}
        contentClassName="space-y-8"
      >
        <div className="space-y-8">
          <div className="brand-hero rounded-[32px] text-white shadow-2xl">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                    <Sparkles size={14} />
                    Region Spotlight
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      {String(region.name ?? "")}
                    </h2>
                    <p className="text-sm text-white/80 sm:text-base">
                      {locationLabel || "Location not specified"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Region Code
                    </p>
                    <p className="mt-2 font-mono text-lg font-semibold text-white">{String(region.code ?? "")}</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Last Updated
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formatDateTime(region.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {statsCards.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(statsCards as Array<{
                key: string;
                title: string;
                value: string | number;
                icon: React.ReactElement;
                color: "info" | "warning" | "error" | "success" | "primary";
                description: string;
              }>).map((card) => (
                <ModernStatsCard
                  key={card.key}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                  description={card.description}
                />
              ))}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.7fr,1fr]">
            {/* Left Column: Core Attributes + Operational Profile */}
            <div className="space-y-6">
              <ModernCard title="Core Attributes" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AttributeTile
                    label="Region Code"
                    value={<span className="font-mono">{String(region.code || "—")}</span>}
                    icon={KeyRound}
                  />
                  <AttributeTile
                    label="Location"
                    value={locationLabel || "—"}
                    icon={MapPin}
                    hint={region.country_code ? `Country: ${region.country_code}` : undefined}
                  />
                </div>
              </ModernCard>

              <ModernCard title="Operational Profile" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AttributeTile
                    label="Health Status"
                    value={formatSegment(region.status) || "Unknown"}
                    icon={Activity}
                  />
                  <AttributeTile
                    label="Active"
                    value={region.is_active ? "Yes" : "No"}
                    icon={CheckCircle}
                  />
                  <AttributeTile
                    label="AZ Selection Mode"
                    value={
                      region.az_selection_mode ? formatSegment(region.az_selection_mode) : "—"
                    }
                    icon={Layers}
                  />
                  <AttributeTile
                    label="Platform Fee"
                    value={platformFee}
                    icon={DollarSign}
                    hint="Applied to revenue generated in this region"
                  />
                  <AttributeTile
                    label="Created"
                    value={formatDateTime(region.created_at)}
                    icon={Clock}
                  />
                  <AttributeTile
                    label="Last Updated"
                    value={formatDateTime(region.updated_at)}
                    icon={RefreshCw}
                  />
                </div>
              </ModernCard>
            </div>

            {/* Right Column: Ownership & Access + Availability Zones */}
            <div className="space-y-6">
              <ModernCard title="Ownership & Access" className="space-y-4">
                <div className="grid gap-4">
                  <AttributeTile
                    label="Ownership Type"
                    value={region.ownership_type ? formatSegment(region.ownership_type) : "—"}
                    icon={Building2}
                  />
                  {ownershipTenant && (
                    <AttributeTile
                      label="Owning Tenant"
                      value={ownershipTenant.name || "—"}
                      icon={Users}
                      hint={[ownershipTenant.email, ownershipTenant.id].filter(Boolean).join(" • ")}
                    />
                  )}
                </div>
              </ModernCard>

              {/* Availability Zones */}
              <ModernCard title="Availability Zones" className="space-y-4">
                <div className="grid gap-3">
                  {azLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2
                        className="h-5 w-5 animate-spin text-gray-400"
                      />
                      <span className="ml-2 text-sm text-gray-500">Loading zones...</span>
                    </div>
                  ) : availabilityZones.length > 0 ? (
                    availabilityZones.map((az: AvailabilityZone) => {
                      const azStatus = az.status || "down";
                      const isVerified = az.is_verified;
                      const isExpanded = expandedAzCodes.has(az.code);

                      return (
                        <div
                          key={az.code}
                          className={`rounded-xl border ${
                            azStatus === "healthy"
                              ? "border-green-200 bg-green-50"
                              : azStatus === "degraded"
                                ? "border-yellow-200 bg-yellow-50"
                                : azStatus === "maintenance"
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleAzExpanded(az.code)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/40"
                            aria-expanded={isExpanded}
                            aria-controls={`az-credentials-${az.code}`}
                          >
                            <span className="text-gray-400">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </span>
                            <div
                              className={`rounded-lg p-1.5 ${
                                azStatus === "healthy"
                                  ? "bg-green-100 text-green-600"
                                  : azStatus === "degraded"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              <Layers size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {az.name || az.code}
                                </p>
                                {isVerified && (
                                  <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                                    <ShieldCheck size={10} />
                                    Verified
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs text-gray-500">{az.code}</span>
                                <ProviderBadge provider={az.provider} size="sm" />
                              </div>
                            </div>
                            <StatusPill
                              label={
                                statusLabelMap[azStatus as keyof typeof statusLabelMap] ||
                                formatSegment(azStatus)
                              }
                              tone={
                                (statusToneMap[azStatus as keyof typeof statusToneMap] ||
                                  (azStatus === "maintenance" ? "info" : "neutral")) as
                                  | "success"
                                  | "warning"
                                  | "danger"
                                  | "info"
                                  | "neutral"
                              }
                            />
                          </button>
                          {isExpanded && (
                            <div
                              id={`az-credentials-${az.code}`}
                              className="border-t border-white/60 bg-white/60 px-4 py-4"
                            >
                              <AZCredentialPanel
                                regionCode={String(region.code ?? "")}
                                az={az}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 py-2">
                      No availability zones configured for this region.
                    </p>
                  )}
                </div>
              </ModernCard>
            </div>
          </div>

          {region.admin_notes && (
            <ModernCard title="Admin Notes">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{String(region.admin_notes)}</p>
            </ModernCard>
          )}
        </div>
      </AdminPageShell>
    </>
  );
};
export default RegionDetail;
