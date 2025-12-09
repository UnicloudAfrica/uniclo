import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import { ModernCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";
import { ModernInput } from "../../../shared/components/ui";
import ToastUtils from "../../../utils/toastUtil.ts";
import { useCreateClient } from "../../../hooks/clientHooks";

const defaultForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
};

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);

const useTenantIdParam = () => {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tenantId") || null;
  }, [location.search]);
};

export default function NewClientPage() {
  const navigate = useNavigate();
  const tenantId = useTenantIdParam();
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: createClient } = useCreateClient();

  const updateField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm_password) {
      ToastUtils.error("Passwords do not match.");
      return;
    }

    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      email: form.email,
      password: form.password,
      password_confirmation: form.confirm_password,
      role: "client",
    };

    if (tenantId) {
      payload.tenant_id = tenantId;
    }

    setIsSubmitting(true);

    try {
      const response = await createClient(payload);
      const identifier = response?.data?.identifier || response?.identifier || null;

      ToastUtils.success("Client created.");
      if (identifier) {
        navigate(`/dashboard/clients/${identifier}`);
      } else {
        navigate("/dashboard/clients");
      }
    } catch (error) {
      ToastUtils.error(
        error?.response?.data?.message || error?.message || "Failed to create client."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TenantPageShell
      title={tenantId ? "Add partner client" : "Create client"}
      description={
        tenantId
          ? "Provision a customer under the selected partner workspace."
          : "Create a new client workspace under this tenant."
      }
      homeHref="/dashboard/clients"
      actions={
        <ModernButton variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <ModernCard padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="First name">
              <ModernInput value={form.first_name} onChange={updateField("first_name")} required />
            </Field>
            <Field label="Last name">
              <ModernInput value={form.last_name} onChange={updateField("last_name")} required />
            </Field>
            <Field label="Email address">
              <ModernInput
                type="email"
                value={form.email}
                onChange={updateField("email")}
                required
              />
            </Field>
            <Field label="Phone number">
              <ModernInput value={form.phone} onChange={updateField("phone")} required />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Temporary password">
              <ModernInput
                type="password"
                value={form.password}
                onChange={updateField("password")}
                required
              />
            </Field>
            <Field label="Confirm password">
              <ModernInput
                type="password"
                value={form.confirm_password}
                onChange={updateField("confirm_password")}
                required
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3">
            <ModernButton
              type="submit"
              variant="primary"
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {tenantId ? "Create partner client" : "Create client"}
            </ModernButton>
          </div>
        </form>
      </ModernCard>
    </TenantPageShell>
  );
}
