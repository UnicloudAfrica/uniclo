import { useParams } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import RequirementBuilder from "@/shared/components/gate/RequirementBuilder";

const BASE = "/dashboard/requirements";

const TenantRequirementBuilder = () => {
  const { id } = useParams<{ id?: string }>();
  return (
    <TenantPageShell
      title={id ? "Edit form" : "Build a form"}
      description="Create the form your clients fill in. Every submission is recorded for audit."
      contentClassName="space-y-6"
    >
      <RequirementBuilder basePath={BASE} context="tenant" />
    </TenantPageShell>
  );
};

export default TenantRequirementBuilder;
