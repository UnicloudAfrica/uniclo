import ClientPageShell from "../components/ClientPageShell";
import FlowBilling from "@/shared/components/flow/FlowBilling";

const ClientFlowBilling = () => {
  return (
    <ClientPageShell
      title="SlimDeploy Billing"
      description="Manage your payment method, renew the subscription, or fix a stuck payment."
    >
      <FlowBilling paystackPublicKey={import.meta.env.VITE_PAYSTACK_PUBLIC_KEY} />
    </ClientPageShell>
  );
};

export default ClientFlowBilling;
