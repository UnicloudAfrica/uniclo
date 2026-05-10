import TenantPageShell from "@/shared/layouts/TenantPageShell";
import FlowBilling from "@/shared/components/flow/FlowBilling";

const TenantFlowBilling = () => {
  return (
    <TenantPageShell
      title="SlimDeploy Billing"
      description="Manage your payment method, renew the subscription, or fix a stuck payment."
    >
      <FlowBilling paystackPublicKey={import.meta.env.VITE_PAYSTACK_PUBLIC_KEY} />
    </TenantPageShell>
  );
};

export default TenantFlowBilling;
