import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import { ModernCard, ModernButton, ModernInput } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import {
  useFetchTenantPartnerById,
  useUpdateTenantPartner,
} from "@/hooks/tenantHooks/partnerHooks";

const defaultForm = {
  name: "",
  registration_number: "",
  company_type: "",
  industry: "",
  address: "",
  city: "",
  state: "",
  verified: false,
};

interface PartnerRecord {
  name?: string;
  verified?: boolean;
  business?: {
    name?: string;
    registration_number?: string;
    company_type?: string;
    industry?: string;
    address?: string;
    city?: string;
    state?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);

export default function EditPartnerPage() {
  const navigate = useNavigate();
  const { partnerId } = useParams();
  const [form, setForm] = useState(defaultForm);
  const [isDirty, setIsDirty] = useState(false);

  const { data: partner, isFetching: isLoading } = useFetchTenantPartnerById(partnerId);
  const { mutateAsync: updatePartner, isPending: isSaving } = useUpdateTenantPartner();

  useEffect(() => {
    if (partner) {
      const p = partner as PartnerRecord;
      setForm({
        name: p.business?.name ?? p.name ?? "",
        registration_number: p.business?.registration_number ?? "",
        company_type: p.business?.company_type ?? "",
        industry: p.business?.industry ?? "",
        address: p.business?.address ?? "",
        city: p.business?.city ?? "",
        state: p.business?.state ?? "",
        verified: Boolean(p.verified),
      });
    }
  }, [partner]);

  const updateField =
    (key: keyof typeof defaultForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setIsDirty(true);
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partnerId) return;

    const payload = {
      business: {
        name: form.name,
        registration_number: form.registration_number || null,
        company_type: form.company_type || null,
        industry: form.industry || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
      },
      verified: form.verified,
    };

    try {
      await updatePartner({ id: partnerId, data: payload });
      ToastUtils.success("Partner updated.");
      navigate(`/dashboard/partners/${partnerId}`);
    } catch (error) {
      ToastUtils.error((error as Error)?.message || "Failed to update partner.");
    }
  };

  return (
    <TenantPageShell
      title="Edit partner"
      description="Update partner workspace details."
      homeHref="/dashboard/clients"
      actions={
        <ModernButton variant="outline" onClick={() => navigate(-1)}>
          Back
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <ModernCard padding="lg" className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <span className="text-sm text-slate-500">Loading partner…</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company name">
                <ModernInput value={form.name} onChange={updateField("name")} required />
              </Field>
              <Field label="Company type">
                <ModernInput value={form.company_type} onChange={updateField("company_type")} />
              </Field>
              <Field label="Registration number">
                <ModernInput
                  value={form.registration_number}
                  onChange={updateField("registration_number")}
                />
              </Field>
              <Field label="Industry">
                <ModernInput value={form.industry} onChange={updateField("industry")} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Address">
                <ModernInput value={form.address} onChange={updateField("address")} />
              </Field>
              <Field label="City">
                <ModernInput value={form.city} onChange={updateField("city")} />
              </Field>
              <Field label="State">
                <ModernInput value={form.state} onChange={updateField("state")} />
              </Field>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={form.verified}
                onChange={updateField("verified")}
              />
              Mark partner as verified
            </label>

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
        )}
      </ModernCard>
    </TenantPageShell>
  );
}
