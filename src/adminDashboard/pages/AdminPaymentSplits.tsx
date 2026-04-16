import AdminPageShell from "../components/AdminPageShell";
import AdminIntegrationSplits from "@/shared/components/payment/AdminIntegrationSplits";

const AdminPaymentSplits = () => {
  return (
    <AdminPageShell
      title="Payment Splits"
      description="Manage revenue splits with integration partners. Configure Paystack subaccounts for automatic settlement."
    >
      <AdminIntegrationSplits />
    </AdminPageShell>
  );
};

export default AdminPaymentSplits;
