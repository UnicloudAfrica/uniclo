import AdminPageShell from "../components/AdminPageShell";
import AcfDirectProvision from "@/shared/components/anycloudflow/AcfDirectProvision";

const AdminAcfDirectProvision = () => (
  <AdminPageShell title="Direct Provision" description="Admin backdoor — provision AnyCloudFlow services without billing.">
    <AcfDirectProvision />
  </AdminPageShell>
);

export default AdminAcfDirectProvision;
