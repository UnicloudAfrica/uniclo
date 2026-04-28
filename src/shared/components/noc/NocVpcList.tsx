import React from "react";
import { useNavigate } from "react-router-dom";
import { Network, ArrowRight } from "lucide-react";
import { SurfaceCard, IconTile, ResourceEmptyState } from "@/shared/components/ui";
import type { NocVpc } from "@/hooks/adminHooks/nocHooks";

interface Props {
  vpcs: NocVpc[];
  regionCode: string;
}

const NocVpcList: React.FC<Props> = ({ vpcs, regionCode }) => {
  const navigate = useNavigate();

  if (!vpcs.length) {
    return (
      <ResourceEmptyState
        title="No VPCs in this region"
        message="Once tenants provision a VPC it will appear here."
      />
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2" role="list">
      {vpcs.map((vpc) => (
        <li key={vpc.id}>
          <SurfaceCard
            as="button"
            variant="card"
            padding="sm"
            radius="lg"
            className="group flex w-full items-center justify-between gap-3 text-left"
            onClick={() =>
              navigate(`/admin-dashboard/noc/regions/${regionCode}/topology/${vpc.id}`)
            }
            aria-label={`Open topology graph for ${vpc.name ?? "VPC"} ${vpc.cidr_block ?? ""}`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <IconTile icon={<Network className="h-4 w-4" />} tone="primary" size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {vpc.name || "VPC"}
                  </span>
                  {vpc.is_default && (
                    <span className="db-brand-pill rounded-full px-1.5 py-0.5 text-[9px] font-semibold">
                      default
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-mono truncate">
                  {vpc.cidr_block ?? "—"} • {vpc.id.slice(0, 8)}…
                </div>
              </div>
            </div>
            <ArrowRight
              className="h-4 w-4 text-gray-300 shrink-0 group-hover:translate-x-0.5 motion-safe:transition-transform"
              aria-hidden="true"
            />
          </SurfaceCard>
        </li>
      ))}
    </ul>
  );
};

export default NocVpcList;
