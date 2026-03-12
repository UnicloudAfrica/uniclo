import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import { ModernCard, ModernButton, ModernInput } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { useFetchTenantAdminById, useUpdateTenantAdmin } from "@/hooks/adminUserHooks";

interface TenantUserRecord {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  pivot?: { role?: string; accepted_at?: string; [key: string]: unknown };
  [key: string]: unknown;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);

export default function EditTenantUserPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "admin",
    password: "",
    confirm_password: "",
  });
  const [isDirty, setIsDirty] = useState(false);

  const { data: user, isFetching: isLoading } = useFetchTenantAdminById(userId ?? "");
  const { mutateAsync: updateUser, isPending: isSaving } = useUpdateTenantAdmin();

  useEffect(() => {
    if (user) {
      const u = user as TenantUserRecord;
      setForm((prev) => ({
        ...prev,
        first_name: u.first_name ?? "",
        last_name: u.last_name ?? "",
        email: u.email ?? "",
        phone: u.phone ?? "",
        role: u.pivot?.role ?? u.role ?? "admin",
      }));
    }
  }, [user]);

  const updateField =
    (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setIsDirty(true);
      setForm((prev) => ({
        ...prev,
        [key]:
          (event.target as HTMLInputElement).type === "checkbox"
            ? (event.target as HTMLInputElement).checked
            : event.target.value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;

    if (form.password && form.password !== form.confirm_password) {
      ToastUtils.error("Passwords do not match.");
      return;
    }

    const payload: Record<string, unknown> = {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      role: form.role,
    };

    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.confirm_password;
    }

    try {
      await updateUser({ id: userId, adminData: payload });
      ToastUtils.success("Tenant user updated.");
      navigate(`/dashboard/tenant-users/${userId}`);
    } catch (error) {
      ToastUtils.error((error as Error)?.message || "Failed to update tenant user.");
    }
  };

  return (
    <TenantPageShell
      title="Edit tenant user"
      description="Adjust roles, contact information, or reset credentials."
      homeHref="/dashboard/clients"
      actions={
        <ModernButton variant="outline" onClick={() => navigate(-1)}>
          Back
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <ModernCard padding="lg">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-slate-500">Loading tenant user…</div>
        ) : user ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="First name">
                <ModernInput
                  value={form.first_name}
                  onChange={updateField("first_name")}
                  required
                />
              </Field>
              <Field label="Last name">
                <ModernInput value={form.last_name} onChange={updateField("last_name")} required />
              </Field>
              <Field label="Email">
                <ModernInput value={form.email} disabled />
              </Field>
              <Field label="Phone">
                <ModernInput value={form.phone} onChange={updateField("phone")} />
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
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">Reset password (optional)</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <Field label="New password">
                  <ModernInput
                    type="password"
                    value={form.password}
                    onChange={updateField("password")}
                  />
                </Field>
                <Field label="Confirm password">
                  <ModernInput
                    type="password"
                    value={form.confirm_password}
                    onChange={updateField("confirm_password")}
                  />
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <ModernButton
                type="submit"
                variant="primary"
                isDisabled={isSaving || !isDirty}
                isLoading={isSaving}
              >
                Save changes
              </ModernButton>
            </div>
          </form>
        ) : (
          <div className="py-10 text-center text-sm text-slate-500">Tenant user not found.</div>
        )}
      </ModernCard>
    </TenantPageShell>
  );
}
