import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import SecurityGroupRulesView from "@/shared/components/infrastructure/SecurityGroupRulesView";
import ModifySecurityGroupModal from "@/shared/components/infrastructure/modals/ModifySecurityGroupModal";
import {
  useSecurityGroups,
  useSecurityGroupRules,
  useUpdateSecurityGroup,
  useAddSecurityGroupRule,
  useRemoveSecurityGroupRule,
} from "@/shared/hooks/vpcInfraHooks";
import type { SecurityGroupRule } from "@/shared/components/infrastructure/types";

const AdminSecurityGroupRules: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";
  const securityGroupId = searchParams.get("sg") || "";
  const securityGroupName = searchParams.get("name") || "Security Group";
  const securityGroupDescription = searchParams.get("desc") || "";

  const [showModify, setShowModify] = useState(false);

  // Fetch all SGs for this project (needed for "Group" remote type + modify modal)
  const { data: allSecurityGroups = [] } = useSecurityGroups(projectId, region);
  const { data: rulesData } = useSecurityGroupRules(projectId, securityGroupId, region);
  const { mutate: updateSg } = useUpdateSecurityGroup();
  const { mutateAsync: addRule } = useAddSecurityGroupRule();
  const { mutateAsync: removeRule } = useRemoveSecurityGroupRule();

  const currentSg = allSecurityGroups.find((sg) => sg.id === securityGroupId) || {
    id: securityGroupId,
    name: securityGroupName,
    description: securityGroupDescription,
  };

  const ingressRules: SecurityGroupRule[] = rulesData?.ingress_rules || [];
  const egressRules: SecurityGroupRule[] = rulesData?.egress_rules || [];

  return (
    <AdminPageShell
      title="Security Group Rules"
      description={`${securityGroupName} (${securityGroupId})`}
      icon={<Shield className="h-6 w-6 text-purple-600" />}
      breadcrumbs={[
        { label: "Home", href: "/admin-dashboard" },
        { label: "Infrastructure", href: "/admin-dashboard/projects" },
        { label: "Security Group Rules" },
      ]}
    >
      <SecurityGroupRulesView
        projectId={projectId}
        region={region}
        securityGroupId={securityGroupId}
        securityGroupName={securityGroupName}
        securityGroupDescription={securityGroupDescription}
        onBack={() => navigate(-1)}
        onModify={() => setShowModify(true)}
        availableSecurityGroups={allSecurityGroups}
      />

      <ModifySecurityGroupModal
        isOpen={showModify}
        onClose={() => setShowModify(false)}
        securityGroup={currentSg}
        ingressRules={ingressRules}
        egressRules={egressRules}
        availableSecurityGroups={allSecurityGroups}
        onUpdateSg={(name, description) => {
          updateSg({
            projectId,
            region,
            securityGroupId,
            payload: { name, description },
          });
        }}
        onAddRule={async (payload) => {
          await addRule({ projectId, region, securityGroupId, payload });
        }}
        onRemoveRule={async (rule, direction) => {
          await removeRule({
            projectId,
            region,
            securityGroupId,
            payload: {
              direction,
              protocol: String(rule.ip_protocol),
              port_range_min: rule.from_port,
              port_range_max: rule.to_port,
              cidr: rule.ip_ranges?.[0]?.cidr_ip,
            },
          });
        }}
      />
    </AdminPageShell>
  );
};

export default AdminSecurityGroupRules;
