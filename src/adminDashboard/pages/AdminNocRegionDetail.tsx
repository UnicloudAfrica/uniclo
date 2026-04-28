import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader2, Server, Activity, BookOpen } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import {
  ModernButton,
  SectionHeader,
  InfoCallout,
} from "@/shared/components/ui";
import NocAlarmsFeed from "@/shared/components/noc/NocAlarmsFeed";
import NocNodesGrid from "@/shared/components/noc/NocNodesGrid";
import NocCapacityGauges from "@/shared/components/noc/NocCapacityGauges";
import NocVmTable from "@/shared/components/noc/NocVmTable";
import NocVpcList from "@/shared/components/noc/NocVpcList";
import {
  useFetchNocRegions,
  useFetchNocAlarms,
  useFetchNocNodes,
  useFetchNocVms,
  useFetchNocVpcs,
  useForceRefreshNocRegion,
} from "@/hooks/adminHooks/nocHooks";

const AdminNocRegionDetail: React.FC = () => {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const refresh = useForceRefreshNocRegion();

  const { data: regions } = useFetchNocRegions();
  const region = regions?.data.find((r) => r.code === code);
  const isLive = Boolean(region?.has_live_credentials);

  const { data: alarms } = useFetchNocAlarms(code, "open", { enabled: isLive });
  const { data: nodes = [] } = useFetchNocNodes(code, { enabled: isLive });
  const { data: vms = [] } = useFetchNocVms(code, { enabled: isLive });
  const { data: vpcs = [] } = useFetchNocVpcs(code, { enabled: isLive });

  const description = (() => {
    if (!region) return "Region detail";
    if (!isLive) return `${region.city ?? region.name} • Placeholder region (no credentials yet)`;
    const parts = [
      region.city ?? region.country_code,
      region.cluster.name ? `Cluster ${region.cluster.name}` : null,
      region.cluster.version ?? null,
    ].filter(Boolean);
    return parts.join(" • ");
  })();

  return (
    <AdminPageShell
      title={region?.name ?? `Region ${code}`}
      description={description}
      actions={
        <div className="flex items-center gap-2">
          <ModernButton
            variant="ghost"
            onClick={() => navigate("/admin-dashboard/noc")}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to NOC
          </ModernButton>
          {isLive && (
            <ModernButton
              variant="outline"
              onClick={() => refresh.mutate(code)}
              leftIcon={
                refresh.isPending ? (
                  <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )
              }
              disabled={refresh.isPending}
            >
              Refresh
            </ModernButton>
          )}
          <Link to="/admin-dashboard/noc/docs/grafana">
            <ModernButton variant="ghost" leftIcon={<BookOpen className="h-4 w-4" />}>
              Grafana setup
            </ModernButton>
          </Link>
        </div>
      }
    >
      {!isLive ? (
        <InfoCallout
          tone="warning"
          title="Placeholder region — awaiting credentials"
        >
          This region is visible on the NOC map but has no active MSP credentials
          yet, so we can't query live cluster state. Once the partner hands over
          API access and credentials are stored on the primary availability zone,
          live data will appear here automatically.
          {region?.status_reason && (
            <p className="mt-2 italic opacity-80">{region.status_reason}</p>
          )}
        </InfoCallout>
      ) : (
        <div className="space-y-6">
          {region && (
            <NocCapacityGauges
              cpu={region.capacity.cpu_used_pct}
              memory={region.capacity.memory_used_pct}
              openAlarms={region.counts.open_alarms}
              nodes={{
                active: region.cluster.nodes_active ?? 0,
                total: region.cluster.nodes_total ?? 0,
              }}
              counts={region.counts}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <section className="space-y-3">
                <SectionHeader
                  title="Hypervisor nodes"
                  count={nodes.length}
                  icon={<Server className="h-4 w-4" />}
                />
                <NocNodesGrid nodes={nodes} />
              </section>

              <section className="space-y-3">
                <SectionHeader
                  title="Virtual machines"
                  count={vms.length}
                  icon={<Activity className="h-4 w-4" />}
                />
                <NocVmTable vms={vms} />
              </section>

              <section className="space-y-3">
                <SectionHeader title="VPCs" count={vpcs.length} />
                <NocVpcList vpcs={vpcs} regionCode={code} />
              </section>
            </div>

            <section className="space-y-3">
              <SectionHeader title="Alarms" count={alarms?.length ?? 0} />
              <NocAlarmsFeed alarms={alarms ?? []} />
            </section>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
};

export default AdminNocRegionDetail;
