import React from "react";
import DynamicDocPage from "@/docs/renderer/DynamicDocPage";
import { loadTenantDoc } from "@/docs/config/tenantDocs";

const TenantDocPage: React.FC = () => <DynamicDocPage loadDoc={loadTenantDoc} scope="tenant" />;

export default TenantDocPage;
