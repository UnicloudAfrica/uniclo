import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import { ModernCard } from "@/shared/components/ui";
import { ModernButton } from "@/shared/components/ui";
import { ModernInput } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { useFetchClientById, useUpdateClient } from "@/hooks/clientHooks";

/** Minimal shape of the client record returned by the API. */
interface ClientRecord {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
}

/** Payload sent to the update endpoint, optionally including password fields. */
interface UpdatePayload {
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  address: string;
  password?: string;
  password_confirmation?: string;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);

export default function EditClientPage() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    address: "",
    password: "",
    confirm_password: "",
  });
  const [isDirty, setIsDirty] = useState(false);

  const { data: rawClient, isFetching: isLoading } = useFetchClientById(clientId);
  const { mutateAsync: updateClient, isPending: isSaving } = useUpdateClient();

  // Cast the untyped API response once
  const client = rawClient as ClientRecord | undefined;

  useEffect(() => {
    if (client) {
      setForm((prev) => ({
        ...prev,
        first_name: client.first_name ?? "",
        last_name: client.last_name ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        country: client.country ?? "",
        state: client.state ?? "",
        city: client.city ?? "",
        address: client.address ?? "",
      }));
    }
  }, [client]);

  const updateField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientId) return;

    if (form.password !== form.confirm_password) {
      ToastUtils.error("Passwords do not match.");
      return;
    }

    const payload: UpdatePayload = {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      country: form.country,
      state: form.state,
      city: form.city,
      address: form.address,
    };

    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.confirm_password;
    }

    try {
      await updateClient({ id: clientId, clientData: payload });
      ToastUtils.success("Client updated.");
      navigate(`/dashboard/clients/${clientId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to update client.";
      ToastUtils.error(msg);
    }
  };

  return (
    <TenantPageShell
      title="Edit client"
      description="Update client contact details or reset their password."
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
          <div className="py-10 text-center text-sm text-slate-500">Loading client…</div>
        ) : client ? (
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
              <Field label="Email address">
                <ModernInput value={form.email} disabled />
              </Field>
              <Field label="Phone number">
                <ModernInput value={form.phone} onChange={updateField("phone")} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Country">
                <ModernInput value={form.country} onChange={updateField("country")} />
              </Field>
              <Field label="State">
                <ModernInput value={form.state} onChange={updateField("state")} />
              </Field>
              <Field label="City">
                <ModernInput value={form.city} onChange={updateField("city")} />
              </Field>
              <Field label="Address">
                <ModernInput value={form.address} onChange={updateField("address")} />
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
          <div className="py-10 text-center text-sm text-slate-500">Client not found.</div>
        )}
      </ModernCard>
    </TenantPageShell>
  );
}
