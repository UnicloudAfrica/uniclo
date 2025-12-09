import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import { ModernCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";
import { ModernInput } from "../../../shared/components/ui";
import ToastUtils from "../../../utils/toastUtil.ts";
import { useCreateTenantAdmin } from "../../../hooks/adminUserHooks";

const defaultForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "admin",
  password: "",
  confirm_password: "",
  force_password_reset: true,
};

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);

export default function InviteTenantUserPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: inviteUser } = useCreateTenantAdmin();

  const updateField = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
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
      role: form.role,
      force_password_reset: form.force_password_reset,
    };

    setIsSubmitting(true);

    try {
      await inviteUser(payload);
      ToastUtils.success("Invitation sent.");
      navigate("/dashboard/clients");
    } catch (error) {
      ToastUtils.error(
        error?.response?.data?.message || error?.message || "Failed to invite tenant user."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TenantPageShell
      title="Invite tenant user"
      description="Grant collaborators access to manage this tenant workspace."
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
            <Field label="Email">
              <ModernInput
                type="email"
                value={form.email}
                onChange={updateField("email")}
                required
              />
            </Field>
            <Field label="Phone">
              <ModernInput value={form.phone} onChange={updateField("phone")} />
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

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Role">
              <select
                value={form.role}
                onChange={updateField("role")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="admin">Administrator</option>
                <option value="member">Member</option>
              </select>
            </Field>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={form.force_password_reset}
                  onChange={updateField("force_password_reset")}
                />
                Require password reset on first login
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <ModernButton
              type="submit"
              variant="primary"
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Send invitation
            </ModernButton>
          </div>
        </form>
      </ModernCard>
    </TenantPageShell>
  );
}
