import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Loader2 } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import {
  ModernButton,
  SurfaceCard,
  SectionHeader,
  LoadingState,
  ErrorState,
  ResourceEmptyState,
} from "@/shared/components/ui";
import AfricaMap from "@/shared/components/noc/AfricaMap";
import NocKpiStrip from "@/shared/components/noc/NocKpiStrip";
import NocRegionCard from "@/shared/components/noc/NocRegionCard";
import NocAlarmsFeed from "@/shared/components/noc/NocAlarmsFeed";
import {
  useFetchNocRegions,
  useFetchNocAlarms,
  useForceRefreshNocRegion,
  type NocRegionSummary,
} from "@/hooks/adminHooks/nocHooks";

const AdminNocDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [highlighted, setHighlighted] = useState<string | undefined>();
  const { data, isLoading, isError, refetch, isFetching } = useFetchNocRegions();
  const { data: alarms } = useFetchNocAlarms(null, "open");
  const refresh = useForceRefreshNocRegion();

  const regions = data?.data ?? [];
  const summary = data?.summary ?? {
    region_count: 0,
    total_vms: 0,
    total_tenants: 0,
    total_open_alarms: 0,
    regions_red: 0,
    regions_amber: 0,
    regions_green: 0,
  };

  const handleRegionClick = (region: NocRegionSummary) => {
    setHighlighted(region.code);
    navigate(`/admin-dashboard/noc/regions/${region.code}`);
  };

  const handleRefreshAll = () => {
    regions
      .filter((r) => r.has_live_credentials)
      .forEach((r) => refresh.mutate(r.code));
    refetch();
  };

  return (
    <AdminPageShell
      title="Network Operations Center"
      description="Multi-region health, capacity, and alarms across all active clouds."
      actions={
        <ModernButton
          variant="outline"
          onClick={handleRefreshAll}
          leftIcon={
            isFetching || refresh.isPending ? (
              <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )
          }
          disabled={isFetching || refresh.isPending}
        >
          Refresh all
        </ModernButton>
      }
    >
      <div className="space-y-6" aria-busy={isFetching || refresh.isPending}>
        {/* Hero — KPI strip + Africa map on a brand signal panel */}
        <SurfaceCard variant="signal-panel" padding="lg" radius="xl">
          <NocKpiStrip
            regionCount={summary.region_count}
            totalVms={summary.total_vms}
            totalTenants={summary.total_tenants}
            totalOpenAlarms={summary.total_open_alarms}
            regionsGreen={summary.regions_green}
            regionsAmber={summary.regions_amber}
            regionsRed={summary.regions_red}
            loading={isLoading}
          />
          <div className="mt-6 aspect-[6/5] max-h-[600px] rounded-xl overflow-hidden">
            {isLoading ? (
              <div
                role="status"
                aria-live="polite"
                className="flex h-full items-center justify-center text-white/60"
              >
                <Loader2 className="h-6 w-6 motion-safe:animate-spin" aria-hidden="true" />
                <span className="sr-only">Loading regions</span>
              </div>
            ) : regions.length === 0 ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
                No NOC-enabled regions yet. Add provider MSP credentials to a region's
                primary AZ to light it up here.
              </div>
            ) : (
              <AfricaMap
                regions={regions}
                onRegionClick={handleRegionClick}
                highlightedCode={highlighted}
              />
            )}
          </div>
        </SurfaceCard>

        {/* Regions + alarms split */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-3">
            <SectionHeader title="Regions" count={regions.length} />
            {isLoading ? (
              <LoadingState message="Loading region snapshots…" />
            ) : isError ? (
              <ErrorState
                title="Couldn't load regions"
                message="The NOC API didn't respond. This is usually transient — try again."
                onRetry={() => refetch()}
              />
            ) : regions.length === 0 ? (
              <ResourceEmptyState
                title="No regions yet"
                message="Once credentials land they'll appear here."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {regions.map((r) => (
                  <NocRegionCard key={r.code} region={r} />
                ))}
              </div>
            )}
          </section>
          <section className="space-y-3">
            <SectionHeader title="Open alarms" count={alarms?.length ?? 0} />
            <NocAlarmsFeed alarms={alarms ?? []} />
          </section>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AdminNocDashboard;
