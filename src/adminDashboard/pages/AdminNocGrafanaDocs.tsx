import React from "react";
import { ArrowLeft, ExternalLink, Terminal, Cloud, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton, SurfaceCard, InfoCallout, IconTile } from "@/shared/components/ui";

const CodeBlock: React.FC<{ children: string }> = ({ children }) => (
  <pre
    className="rounded-lg p-3 text-[11px] font-mono overflow-x-auto"
    style={{
      background: "rgb(var(--theme-neutral-900))",
      color: "rgb(var(--theme-neutral-100))",
    }}
  >
    {children}
  </pre>
);

const StepCard: React.FC<{
  step: number;
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}> = ({ step, title, children, icon }) => (
  <SurfaceCard variant="card" padding="lg" radius="lg">
    <div className="flex items-start gap-3">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm shrink-0"
        style={{
          background: "var(--theme-color-10)",
          color: "var(--theme-color)",
        }}
        aria-hidden="true"
      >
        {step}
      </span>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <IconTile icon={icon} tone="neutral" size="sm" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="text-xs text-gray-600 space-y-2">{children}</div>
      </div>
    </div>
  </SurfaceCard>
);

const AdminNocGrafanaDocs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AdminPageShell
      title="Monitoring handoff — Prometheus + Grafana"
      description="Per-instance deep monitoring using our node_exporter agent. This is the customer-facing side; the NOC dashboard handles the fleet view."
      actions={
        <ModernButton
          variant="ghost"
          onClick={() => navigate("/admin-dashboard/noc")}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to NOC
        </ModernButton>
      }
    >
      <div className="space-y-6 max-w-3xl">
        <InfoCallout
          tone="info"
          title="What this is"
        >
          A three-step setup for customers who need deeper VM-level metrics than the
          NOC snapshot provides. The NOC dashboard you just came from shows fleet
          health from provider MSP APIs; this pipeline gives you per-VM
          CPU/disk/network/app metrics via a Prometheus scrape from the{" "}
          <code>node_exporter</code> we install on every provisioned instance.
        </InfoCallout>

        <StepCard
          step={1}
          title="node_exporter is already installed"
          icon={<Terminal className="h-4 w-4" />}
        >
          <p>
            Every instance provisioned through the standard pipeline ships with{" "}
            <code>node_exporter</code> listening on <code>:9100</code>. Verify with:
          </p>
          <CodeBlock>
{`# on the VM
systemctl status node_exporter
curl http://localhost:9100/metrics | head -20`}
          </CodeBlock>
          <p className="text-[11px] text-gray-500">
            If it's missing (e.g. a bring-your-own-image), install with the standard
            Prometheus node_exporter tarball and run as a systemd service.
          </p>
        </StepCard>

        <StepCard
          step={2}
          title="Configure Prometheus to scrape the fleet"
          icon={<Cloud className="h-4 w-4" />}
        >
          <p>
            Add a static config per region, or use file-based service discovery
            pointing at a JSON exported from the NOC API
            (<code>/admin/v1/noc/regions/:code/vms</code>).
          </p>
          <CodeBlock>
{`# prometheus.yml
scrape_configs:
  - job_name: unicloud-lagos
    scrape_interval: 30s
    static_configs:
      - targets:
          - 172.31.0.184:9100
          - 172.31.0.190:9100
        labels:
          region: lagos-1
          provider: zadara`}
          </CodeBlock>
          <p>
            For production, prefer <code>http_sd_configs</code> pointing at a small
            service that queries the NOC API and returns target JSON — that way new
            VMs are picked up without a Prometheus reload.
          </p>
        </StepCard>

        <StepCard
          step={3}
          title="Point Grafana at Prometheus + import dashboards"
          icon={<ShieldCheck className="h-4 w-4" />}
        >
          <p>
            In Grafana, add Prometheus as a data source (the URL is your Prometheus
            endpoint). Then import these community dashboards as a starting point:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li>
              <strong>Node Exporter Full</strong> — Grafana ID <code>1860</code>
            </li>
            <li>
              <strong>Node Exporter Quickstart</strong> — Grafana ID <code>14513</code>
            </li>
          </ul>
          <CodeBlock>
{`# Grafana CLI (if running locally)
grafana-cli plugins install grafana-piechart-panel
# Then: Dashboards → Import → paste ID 1860`}
          </CodeBlock>
          <p className="text-[11px] text-gray-500">
            Share the dashboard URL with the tenant. For tenant-isolated Grafana, use
            Grafana orgs keyed on <code>tenant_id</code> and scope Prometheus queries
            with a <code>tenant</code> label on each target.
          </p>
        </StepCard>

        <InfoCallout
          tone="success"
          title="Need help?"
          actions={
            <a
              href="https://grafana.com/grafana/dashboards/1860-node-exporter-full/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-xs font-semibold underline"
              style={{ color: "rgb(var(--theme-success-700))" }}
            >
              node_exporter dashboard 1860 <ExternalLink className="h-3 w-3" />
            </a>
          }
        >
          Spencer from the provider partner team has the Grafana integration guides
          on <code>dr.dora.com</code>. Reach out if you want them posted here inline.
        </InfoCallout>
      </div>
    </AdminPageShell>
  );
};

export default AdminNocGrafanaDocs;
