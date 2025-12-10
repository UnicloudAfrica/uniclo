import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import useAuthRedirect from "../../utils/authRedirect";
import ProductForm from "../components/productform";

export default function Requests() {
  const { isLoading } = useAuthRedirect();

  return (
    <TenantPageShell
      title="Request Instance"
      description="Use our configurator to build and price a storage solution by data type, capacity, and term. Once completed, your results will be sent to a team member who will contact you with quote."
    >
      <ProductForm />
    </TenantPageShell>
  );
}
