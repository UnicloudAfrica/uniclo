import React from "react";
import IntegrationPricingPane from "./IntegrationPricingPane";
import type { PricingRole } from "../PricingShell";

const AnyCloudFlowPane: React.FC<{ role: PricingRole }> = ({ role }) => (
  <IntegrationPricingPane
    role={role}
    integrationKey="anycloudflow"
    title="AnyCloudFlow services"
    description="Migration, replication, DR and backup-orchestration rates. Set per-service price; each service is platform-wide (no region split)."
  />
);

export default AnyCloudFlowPane;
