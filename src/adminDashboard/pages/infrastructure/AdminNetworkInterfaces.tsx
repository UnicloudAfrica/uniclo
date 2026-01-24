// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Cable } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import NetworkInterfacesContainer from "../../../shared/components/infrastructure/containers/NetworkInterfacesContainer";
import {
  useFetchNetworkInterfaces,
  syncNetworkInterfacesFromProvider,
} from "../../../hooks/adminHooks/networkHooks";
import ToastUtils from "../../../utils/toastUtil";

const AdminNetworkInterfaces: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useFetchNetworkInterfaces,
    onSync: async () => {
      await syncNetworkInterfacesFromProvider({ project_id: projectId, region });
      ToastUtils.success("Network Interfaces synced from provider");
    },
  };

  return (
    <>
      <NetworkInterfacesContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="Network Interfaces"
            description="Virtual network cards attached to instances"
            icon={<Cable className="w-6 h-6 text-orange-500" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "Network Interfaces" },
            ]}
            actions={headerActions}
          >
            {children}
          </AdminPageShell>
        )}
      />
    </>
  );
};

export default AdminNetworkInterfaces;
