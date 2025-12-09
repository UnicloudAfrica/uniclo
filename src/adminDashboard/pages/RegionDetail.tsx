// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import adminRegionApi from "../../services/adminRegionApi";
import ToastUtils from "../../utils/toastUtil";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { ModernCard } from "../../shared/components/ui";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernButton } from "../../shared/components/ui";
import StatusPill from "../../shared/components/ui/StatusPill";
import { designTokens } from "../../styles/designTokens";

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
const formatSegment = (value: any) => {
  if (!value) return "";
  return value
    .toString()
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment: any) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};
const formatDateTime = (value: any) => (value ? new Date(value).toLocaleString() : "—");

const AttributeTile = ({ label, value, hint, icon: Icon }: any) => {
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
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegionDetail();
  }, [code]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionByCode(code);
      setRegion(response.data);
    } catch (error) {
      console.error("Error fetching region:", error);
      ToastUtils.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  };
  const locationLabel = useMemo(() => {
    if (!region) return "";
    const segments = [region.city, region.country_code].filter(Boolean);
    return segments.join(", ");
  }, [region]);

  const headerMeta = useMemo(() => {
    if (!region) return null;
    const pills = [
      region.status && (
        <StatusPill
          key="status"
          label={statusLabelMap[region.status] || formatSegment(region.status)}
          tone={statusToneMap[region.status] || "info"}
        />
      ),
      <StatusPill
        key="active"
        label={region.is_active ? "Active" : "Inactive"}
        tone={region.is_active ? "success" : "warning"}
      />,
    ];

    if (region.fulfillment_mode) {
      pills.push(
        <StatusPill
          key="fulfillment"
          label={`${formatSegment(region.fulfillment_mode)} Fulfillment`}
          tone="info"
        />
      );
    }

    if (region.ownership_type) {
      pills.push(
        <StatusPill
          key="ownership"
          label={`${formatSegment(region.ownership_type)} Ownership`}
          tone="neutral"
        />
      );
    }

    return <div className="flex flex-wrap items-center gap-2">{pills}</div>;
  }, [region]);

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

        {region.fulfillment_mode === "automated" ? (
          <ModernButton
            key="credentials"
            variant={region.msp_credentials_verified_at ? "outline" : "primary"}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => navigate(`/admin-dashboard/regions/${region.code}/credentials`)}
          >
            <ShieldCheck size={16} />
            {region.msp_credentials_verified_at ? "Update Credentials" : "Verify Credentials"}
          </ModernButton>
        ) : null}

        <Link to={`/admin-dashboard/regions/${region.code}/edit`}>
          <ModernButton variant="secondary" size="sm" className="flex items-center gap-2">
            <Edit size={16} />
            Edit Region
          </ModernButton>
        </Link>
      </div>
    );
  }, [region, loading]);

  const statsCards = useMemo(() => {
    if (!region) return [];

    const cards = [
      {
        key: "health",
        title: "Operational Health",
        value: formatSegment(region.status) || "Unknown",
        color: statusToneMap[region.status] || "info",
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

    if (region.fulfillment_mode) {
      cards.push({
        key: "fulfillment",
        title: "Fulfillment Mode",
        value: formatSegment(region.fulfillment_mode),
        color: region.fulfillment_mode === "automated" ? "primary" : "info",
        icon: <Settings size={24} />,
        description:
          region.fulfillment_mode === "automated"
            ? "Provisioning handled automatically"
            : "Provisioning requires manual steps",
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
    return (
      <>
        <AdminHeadbar />
        <AdminSidebar />
        {renderLoadingShell()}
      </>
    );
  }

  if (!region) {
    return (
      <>
        <AdminHeadbar />
        <AdminSidebar />
        {renderNotFoundShell()}
      </>
    );
  }

  const ownershipTenant = region.owner_tenant;
  const platformFee =
    region.platform_fee_percentage !== null && region.platform_fee_percentage !== undefined
      ? `${region.platform_fee_percentage}%`
      : "—";

  const shouldShowAutomationCard = region.fulfillment_mode === "automated";

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title={region.name || "Region"}
        description={
          locationLabel ? `${locationLabel} • ${region.code}` : `Region Code: ${region.code}`
        }
        subHeaderContent={headerMeta}
        actions={headerActions}
        contentClassName="space-y-8"
      >
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F172A] via-[#1D4ED8] to-[#38BDF8] text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                    <Sparkles size={14} />
                    Region Spotlight
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      {region.name}
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
                    <p className="mt-2 font-mono text-lg font-semibold text-white">{region.code}</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Base URL
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold text-white/90">
                      {region.base_url || "Not configured"}
                    </p>
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
              {statsCards.map((card: any) => (
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
            <div className="space-y-6">
              <ModernCard title="Core Attributes" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AttributeTile
                    label="Region Code"
                    value={<span className="font-mono">{region.code || "—"}</span>}
                    icon={KeyRound}
                  />
                  <AttributeTile
                    label="Base URL"
                    value={<span className="break-all">{region.base_url || "—"}</span>}
                    icon={LinkIcon}
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
                    label="Fulfillment Mode"
                    value={region.fulfillment_mode ? formatSegment(region.fulfillment_mode) : "—"}
                    icon={Settings}
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

              {shouldShowAutomationCard && (
                <ModernCard title="Automation & Credentials" className="space-y-4">
                  <div
                    className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 ${
                      region.msp_credentials_verified_at
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-yellow-200 bg-yellow-50 text-yellow-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {region.msp_credentials_verified_at ? (
                        <CheckCircle size={20} />
                      ) : (
                        <AlertCircle size={20} />
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          {region.msp_credentials_verified_at
                            ? "Credentials Verified"
                            : "Credentials Not Verified"}
                        </p>
                        <p className="text-xs">
                          {region.msp_credentials_verified_at
                            ? `Last verified ${formatDateTime(region.msp_credentials_verified_at)}`
                            : "Automated provisioning requires verified MSP admin credentials."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ModernButton
                        variant={region.msp_credentials_verified_at ? "outline" : "primary"}
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() =>
                          navigate(`/admin-dashboard/regions/${region.code}/credentials`)
                        }
                      >
                        <ShieldCheck size={16} />
                        {region.msp_credentials_verified_at
                          ? "Update Credentials"
                          : "Verify Credentials"}
                      </ModernButton>
                      <ModernButton
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={fetchRegionDetail}
                      >
                        <RefreshCw size={16} />
                        Refresh Status
                      </ModernButton>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Credentials are stored securely and used to orchestrate workloads in this
                    region. Contact platform engineering if you need to rotate credentials.
                  </p>
                </ModernCard>
              )}
            </div>
          </div>

          {region.admin_notes && (
            <ModernCard title="Admin Notes">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{region.admin_notes}</p>
            </ModernCard>
          )}
        </div>
      </AdminPageShell>
    </>
  );
};
export default RegionDetail;
