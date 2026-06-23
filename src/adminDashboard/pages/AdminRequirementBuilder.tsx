import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { ModernButton, ModernCard, DashboardSkeleton } from "@/shared/components/ui";
import AdminPageShell from "../components/AdminPageShell";
import ToastUtils from "@/utils/toastUtil";
import {
  useFetchRequirements,
  useCreateRequirement,
  useUpdateRequirement,
} from "@/hooks/adminHooks/requirementHooks";
import { type RequirementField, type RequirementRecord } from "@/shared/types/requirement";

// Field types the renderer (RequirementGate) meaningfully supports today.
const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "checkbox", label: "Consent checkbox" },
  { value: "file", label: "File upload" },
  { value: "verification", label: "ID / KYC verification (country-aware)" },
  { value: "group", label: "Repeatable group (e.g. Founder 1, 2 …)" },
] as const;
const SUBFIELD_TYPES = FIELD_TYPES.filter((t) => t.value === "text" || t.value === "checkbox" || t.value === "file");

type FieldDraft = RequirementField & { _uid: string };

const uid = () => `f_${Math.random().toString(36).slice(2, 9)}`;
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);

const newField = (type = "text"): FieldDraft => ({ _uid: uid(), key: "", type, label: "", required: false });

const labelCls = "mb-1 block text-sm font-medium text-slate-700";
const inputCls = "w-full input-field";

const Section = ({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) => (
  <ModernCard>
    <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </ModernCard>
);

const AdminRequirementBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const { data: all, isFetching } = useFetchRequirements({ enabled: isEdit });
  const existing = useMemo<RequirementRecord | undefined>(
    () => (isEdit ? (all || []).find((r) => String(r.id) === String(id)) : undefined),
    [all, id, isEdit]
  );

  const create = useCreateRequirement();
  const update = useUpdateRequirement();
  const saving = create.isPending || update.isPending;

  // ── Form state (seeded once from `existing` when editing) ──────────────
  const [seeded, setSeeded] = useState(false);
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [keyDirty, setKeyDirty] = useState(false);
  const [description, setDescription] = useState("");
  const [placement, setPlacement] = useState("onboarding");
  const [scope, setScope] = useState<"platform" | "tenant">("platform");
  const [tenantId, setTenantId] = useState("");
  const [persona, setPersona] = useState<"any" | "tenant" | "client">("any");
  const [accountType, setAccountType] = useState<"any" | "individual" | "business">("any");
  const [countryCode, setCountryCode] = useState("");
  const [enforcement, setEnforcement] = useState<"required" | "optional" | "off">("required");
  const [graceDays, setGraceDays] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState<FieldDraft[]>([newField()]);

  // Seed the form once when editing and the record has loaded.
  useEffect(() => {
    if (!isEdit || seeded || !existing) return;
    setTitle(existing.title || "");
    setKey(existing.key || "");
    setKeyDirty(true);
    setDescription(existing.description || "");
    setPlacement(existing.placement || "onboarding");
    setScope(existing.scope === "tenant" ? "tenant" : "platform");
    setTenantId(existing.tenant_id || "");
    setPersona((existing.persona as typeof persona) || "any");
    setAccountType((existing.account_type as typeof accountType) || "any");
    setCountryCode(existing.country_code || "");
    setEnforcement((existing.enforcement as typeof enforcement) || "required");
    setGraceDays(String(existing.grace_period_days ?? 0));
    setIsActive(existing.is_active !== false);
    setFields(
      (existing.fields || []).map((f) => ({
        ...f,
        _uid: uid(),
        fields: (f.fields || []).map((sf) => ({ ...sf, _uid: uid() })),
      }))
    );
    setSeeded(true);
  }, [isEdit, seeded, existing]);

  if (isEdit && !seeded) {
    if (!existing) {
      if (isFetching) return <DashboardSkeleton />;
      return (
        <AdminPageShell title="Requirement not found" description="This requirement may have been removed.">
          <ModernButton variant="outline" onClick={() => navigate("/admin-dashboard/requirements")}>
            Back to Requirements
          </ModernButton>
        </AdminPageShell>
      );
    }
    return <DashboardSkeleton />;
  }

  // ── Field editing helpers ──────────────────────────────────────────────
  const patchField = (i: number, patch: Partial<FieldDraft>) =>
    setFields((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const removeField = (i: number) => setFields((fs) => fs.filter((_, j) => j !== i));
  const patchSub = (fi: number, si: number, patch: Partial<RequirementField>) =>
    setFields((fs) =>
      fs.map((f, j) =>
        j === fi ? { ...f, fields: (f.fields || []).map((sf, k) => (k === si ? { ...sf, ...patch } : sf)) } : f
      )
    );
  const addSub = (fi: number) =>
    setFields((fs) =>
      fs.map((f, j) => (j === fi ? { ...f, fields: [...(f.fields || []), { ...newField(), _uid: uid() }] } : f))
    );
  const removeSub = (fi: number, si: number) =>
    setFields((fs) =>
      fs.map((f, j) => (j === fi ? { ...f, fields: (f.fields || []).filter((_, k) => k !== si) } : f))
    );

  // ── Serialize draft → API payload ──────────────────────────────────────
  const serializeField = (f: RequirementField): RequirementField => {
    const out: RequirementField = {
      key: f.key.trim(),
      type: f.type,
      label: f.label.trim(),
      required: Boolean(f.required),
    };
    if (f.type === "checkbox" && f.consent_text) out.consent_text = f.consent_text;
    if (f.type === "group") {
      out.item_label = (f.item_label || "Entry").trim();
      out.min = Number(f.min ?? 1);
      out.max = Number(f.max ?? 5);
      out.fields = (f.fields || []).map((sf) => serializeField(sf));
    }
    return out;
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Give the requirement a title.";
    if (!key.trim()) return "Give the requirement a key.";
    if (!placement.trim()) return "Set a placement (where the gate appears).";
    if (scope === "tenant" && !tenantId.trim()) return "Tenant-scoped requirements need a tenant id.";
    if (!fields.length) return "Add at least one field.";
    for (const f of fields) {
      if (!f.key.trim() || !f.label.trim()) return "Every field needs a key and a label.";
      if (f.type === "group" && !(f.fields || []).length) return `Group "${f.label || f.key}" needs at least one sub-field.`;
      for (const sf of f.fields || []) {
        if (!sf.key.trim() || !sf.label.trim()) return `Sub-fields of "${f.label || f.key}" need a key and a label.`;
      }
    }
    return null;
  };

  const onSave = () => {
    const err = validate();
    if (err) {
      ToastUtils.error(err);
      return;
    }
    const payload: Partial<RequirementRecord> = {
      key: slug(key) || key.trim(),
      title: title.trim(),
      description: description.trim() || null,
      placement: placement.trim(),
      scope,
      tenant_id: scope === "tenant" ? tenantId.trim() : null,
      persona,
      account_type: accountType,
      country_code: countryCode.trim() ? countryCode.trim().toUpperCase().slice(0, 2) : null,
      enforcement,
      grace_period_days: Number(graceDays) || 0,
      is_active: isActive,
      fields: fields.map((f) => serializeField(f)),
    };

    const done = () => navigate("/admin-dashboard/requirements");
    if (isEdit && existing) {
      update.mutate({ id: existing.id, data: payload }, { onSuccess: () => { ToastUtils.success("Requirement saved."); done(); } });
    } else {
      create.mutate(payload, { onSuccess: () => { ToastUtils.success("Requirement created."); done(); } });
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <AdminPageShell
      title={isEdit ? "Edit Requirement" : "New Requirement"}
      description="Define a form and gate. Subjects must satisfy it before the gated action; every submission is recorded for audit."
      breadcrumbs={[
        { label: "Home", href: "/admin-dashboard" },
        { label: "Requirements", href: "/admin-dashboard/requirements" },
        { label: isEdit ? "Edit" : "New" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <ModernButton variant="outline" onClick={() => navigate("/admin-dashboard/requirements")}>
            Cancel
          </ModernButton>
          <ModernButton variant="primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create requirement"}
          </ModernButton>
        </div>
      }
      contentClassName="space-y-6"
    >
      <Section title="Details" desc="What this requirement is and where its gate appears.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              className={inputCls}
              value={title}
              placeholder="e.g. Terms & Conditions"
              onChange={(e) => {
                setTitle(e.target.value);
                if (!keyDirty) setKey(slug(e.target.value));
              }}
            />
          </div>
          <div>
            <label className={labelCls}>Key *</label>
            <input
              className={`${inputCls} font-mono`}
              value={key}
              placeholder="terms_consent"
              onChange={(e) => {
                setKey(e.target.value);
                setKeyDirty(true);
              }}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={inputCls}
            rows={2}
            value={description}
            placeholder="Shown under the title in the gate."
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={labelCls}>Placement *</label>
            <input
              className={inputCls}
              value={placement}
              placeholder="onboarding"
              onChange={(e) => setPlacement(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Enforcement *</label>
            <select className={inputCls} value={enforcement} onChange={(e) => setEnforcement(e.target.value as typeof enforcement)}>
              <option value="required">Required (blocks)</option>
              <option value="optional">Optional (asks, never blocks)</option>
              <option value="off">Off (hidden)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Grace period (days)</label>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={graceDays}
              onChange={(e) => setGraceDays(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
      </Section>

      <Section title="Audience" desc="Who sees this gate. Leave on ‘any’ to apply broadly.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Scope</label>
            <select className={inputCls} value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
              <option value="platform">Platform (all tenants)</option>
              <option value="tenant">Tenant (one tenant only)</option>
            </select>
          </div>
          {scope === "tenant" && (
            <div>
              <label className={labelCls}>Tenant ID *</label>
              <input className={inputCls} value={tenantId} placeholder="tenant uuid" onChange={(e) => setTenantId(e.target.value)} />
            </div>
          )}
          <div>
            <label className={labelCls}>Persona</label>
            <select className={inputCls} value={persona} onChange={(e) => setPersona(e.target.value as typeof persona)}>
              <option value="any">Any</option>
              <option value="tenant">Tenants</option>
              <option value="client">Clients</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Account type</label>
            <select className={inputCls} value={accountType} onChange={(e) => setAccountType(e.target.value as typeof accountType)}>
              <option value="any">Any</option>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Country (ISO-2, optional)</label>
            <input
              className={`${inputCls} uppercase`}
              maxLength={2}
              value={countryCode}
              placeholder="NG"
              onChange={(e) => setCountryCode(e.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section title="Fields" desc="The inputs collected behind the gate. Verification fields adapt the ID label to the subject’s country.">
        <div className="space-y-4">
          {fields.map((f, i) => (
            <div key={f._uid} className="rounded-lg border border-slate-200 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-3">
                  <label className={labelCls}>Type</label>
                  <select className={inputCls} value={f.type} onChange={(e) => patchField(i, { type: e.target.value })}>
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className={labelCls}>Key</label>
                  <input className={`${inputCls} font-mono`} value={f.key} placeholder="field_key" onChange={(e) => patchField(i, { key: e.target.value })} />
                </div>
                <div className="md:col-span-5">
                  <label className={labelCls}>Label</label>
                  <input className={inputCls} value={f.label} placeholder="Field label" onChange={(e) => patchField(i, { label: e.target.value })} />
                </div>
                <div className="flex items-end md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    disabled={fields.length === 1}
                    className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    title="Remove field"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={Boolean(f.required)} onChange={(e) => patchField(i, { required: e.target.checked })} />
                Required
              </label>

              {f.type === "checkbox" && (
                <div className="mt-3">
                  <label className={labelCls}>Consent text</label>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={f.consent_text || ""}
                    placeholder="I agree to the Terms & Conditions."
                    onChange={(e) => patchField(i, { consent_text: e.target.value })}
                  />
                </div>
              )}

              {f.type === "group" && (
                <div className="mt-3 rounded-md bg-slate-50 p-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <label className={labelCls}>Item label</label>
                      <input className={inputCls} value={f.item_label || ""} placeholder="Founder" onChange={(e) => patchField(i, { item_label: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Min</label>
                      <input className={inputCls} type="number" min={0} value={f.min ?? 1} onChange={(e) => patchField(i, { min: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelCls}>Max</label>
                      <input className={inputCls} type="number" min={1} value={f.max ?? 5} onChange={(e) => patchField(i, { max: Number(e.target.value) })} />
                    </div>
                  </div>

                  <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Sub-fields</p>
                  <div className="space-y-2">
                    {(f.fields || []).map((sf, si) => (
                      <div key={(sf as FieldDraft)._uid || si} className="grid grid-cols-1 gap-2 md:grid-cols-12">
                        <select className={`${inputCls} md:col-span-3`} value={sf.type} onChange={(e) => patchSub(i, si, { type: e.target.value })}>
                          {SUBFIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <input className={`${inputCls} font-mono md:col-span-3`} value={sf.key} placeholder="key" onChange={(e) => patchSub(i, si, { key: e.target.value })} />
                        <input className={`${inputCls} md:col-span-4`} value={sf.label} placeholder="Label" onChange={(e) => patchSub(i, si, { label: e.target.value })} />
                        <label className="flex items-center gap-1 text-xs text-slate-600 md:col-span-1">
                          <input type="checkbox" checked={Boolean(sf.required)} onChange={(e) => patchSub(i, si, { required: e.target.checked })} />
                          Req
                        </label>
                        <button type="button" onClick={() => removeSub(i, si)} className="rounded-md p-2 text-slate-400 hover:text-red-600 md:col-span-1" title="Remove sub-field">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addSub(i)} className="mt-2 text-sm font-medium text-blue-600 hover:underline">
                    + Add sub-field
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <ModernButton variant="outline" className="flex items-center gap-2" onClick={() => setFields((fs) => [...fs, newField()])}>
          <Plus size={16} />
          Add field
        </ModernButton>
      </Section>
    </AdminPageShell>
  );
};

export default AdminRequirementBuilder;
