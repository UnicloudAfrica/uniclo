import React from "react";
import IntegrationPricingPane from "./IntegrationPricingPane";
import type { PricingRole } from "../PricingShell";

const ShieldPane: React.FC<{ role: PricingRole }> = ({ role }) => (
  <IntegrationPricingPane
    role={role}
    integrationKey="shield"
    title="Shield packages"
    description="DDoS, WAF, SSL and bandwidth-overage rates per provider. Each provider — StormWall and Cloudflare — has its own published price."
    groupByProvider
  />
);

export default ShieldPane;
