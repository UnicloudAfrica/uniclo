import AdminPageShell from "../components/AdminPageShell";
import AcfFastTrackManager from "@/shared/components/anycloudflow/AcfFastTrackManager";

const AdminAcfFastTrack = () => (
  <AdminPageShell title="Fast Track Grants" description="Grant temporary service access to tenants without payment.">
    <AcfFastTrackManager />
  </AdminPageShell>
);

export default AdminAcfFastTrack;
