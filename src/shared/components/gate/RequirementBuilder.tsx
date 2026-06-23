import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  CheckSquare,
  ChevronDown,
  Eye,
  FileUp,
  Settings2,
  Trash2,
  Type,
  Users,
} from "lucide-react";
import { ModernButton, ModernCard, DashboardSkeleton } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import SearchableSelect from "@/shared/components/ui/SearchableSelect";
import {
  useFetchRequirements,
  useCreateRequirement,
  useUpdateRequirement,
  useRequirementTargets,
} from "@/hooks/requirementHooks";
import { type RequirementField, type RequirementRecord } from "@/shared/types/requirement";

/**
 * Requirement Builder — a friendly, no-code way to build an onboarding form.
 * SHARED by the admin and tenant builders: the role-agnostic hooks target the
 * right API base from the session, and `basePath` points navigation at the
 * correct list (`/admin-dashboard/requirements` or `/dashboard/requirements`).
 * Plain language + a live preview; technical knobs are tucked under "Advanced".
 */

const QUESTION_TYPES = [
  { value: "checkbox", label: "Agreement", hint: "A tick box to accept something", icon: CheckSquare },
  { value: "text", label: "Short answer", hint: "A line of text", icon: Type },
  { value: "file", label: "Upload a file", hint: "A document or photo", icon: FileUp },
  { value: "verification", label: "ID check", hint: "Verify identity — auto by country", icon: BadgeCheck },
  { value: "group", label: "Repeatable section", hint: "Collect many, e.g. each founder", icon: Users },
] as const;
const SUB_TYPES = QUESTION_TYPES.filter((t) => ["text", "checkbox", "file"].includes(t.value));
const typeMeta = (t: string) => QUESTION_TYPES.find((q) => q.value === t) ?? QUESTION_TYPES[1];

type FieldDraft = RequirementField & { _uid: string };

const uid = () => `f_${Math.random().toString(36).slice(2, 9)}`;
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
function mkSub(): FieldDraft {
  return { _uid: uid(), key: "", type: "text", label: "", required: false };
}
const newField = (type = "text"): FieldDraft => ({
  _uid: uid(),
  key: "",
  type,
  label: "",
  required: type === "checkbox",
  ...(type === "group" ? { item_label: "Item", min: 1, max: 5, fields: [mkSub()] } : {}),
});

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";
const labelCls = "mb-1 block text-sm font-medium text-slate-700";

const Step = ({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) => (
  <ModernCard>
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {n}
      </span>
      <div>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      </div>
    </div>
    <div className="space-y-4 pl-0 sm:pl-11">{children}</div>
  </ModernCard>
);

const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button type="button" onClick={() => onChange(!on)} className="flex items-center gap-2 text-sm font-medium text-slate-700">
    <span className={`relative h-5 w-9 rounded-full transition ${on ? "bg-blue-600" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${on ? "left-4" : "left-0.5"}`} />
    </span>
    {label}
  </button>
);

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
            value === o.value
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const RequirementBuilder = ({
  basePath,
  context = "admin",
}: {
  basePath: string;
  context?: "admin" | "tenant";
}) => {
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

  const [seeded, setSeeded] = useState(false);
  const [advanced, setAdvanced] = useState(false);
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
  const [fields, setFields] = useState<FieldDraft[]>([newField("checkbox")]);
  const [targetKind, setTargetKind] = useState<"none" | "client" | "tenant">("none");
  const [targetId, setTargetId] = useState("");
  const { data: targetOptions } = useRequirementTargets(
    targetKind === "none" ? "client" : targetKind,
    targetKind !== "none"
  );

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
    setTargetKind((existing.target_type as "client" | "tenant") || "none");
    setTargetId(existing.target_id || "");
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
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">This form may have been removed.</p>
          <ModernButton variant="outline" className="mt-3" onClick={() => navigate(basePath)}>
            Back to forms
          </ModernButton>
        </div>
      );
    }
    return <DashboardSkeleton />;
  }

  const patchField = (i: number, patch: Partial<FieldDraft>) =>
    setFields((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const addField = (type: string) => setFields((fs) => [...fs, newField(type)]);
  const removeField = (i: number) => setFields((fs) => fs.filter((_, j) => j !== i));
  const patchSub = (fi: number, si: number, patch: Partial<RequirementField>) =>
    setFields((fs) =>
      fs.map((f, j) =>
        j === fi ? { ...f, fields: (f.fields || []).map((sf, k) => (k === si ? { ...sf, ...patch } : sf)) } : f
      )
    );
  const addSub = (fi: number, type: string) =>
    setFields((fs) => fs.map((f, j) => (j === fi ? { ...f, fields: [...(f.fields || []), { ...mkSub(), type }] } : f)));
  const removeSub = (fi: number, si: number) =>
    setFields((fs) => fs.map((f, j) => (j === fi ? { ...f, fields: (f.fields || []).filter((_, k) => k !== si) } : f)));

  const serializeFields = (list: FieldDraft[]): RequirementField[] => {
    const taken = new Set<string>();
    return list.map((f, i) => {
      const base = f.key.trim() || slug(f.label) || `field_${i + 1}`;
      let k = base;
      let n = 2;
      while (taken.has(k)) k = `${base}_${n++}`;
      taken.add(k);
      const out: RequirementField = { key: k, type: f.type, label: f.label.trim(), required: Boolean(f.required) };
      if (f.type === "checkbox" && f.consent_text) out.consent_text = f.consent_text;
      if (f.type === "group") {
        out.item_label = (f.item_label || "Item").trim();
        out.min = Number(f.min ?? 1);
        out.max = Number(f.max ?? 5);
        out.fields = serializeFields((f.fields || []).map((sf) => ({ ...(sf as FieldDraft) })));
      }
      return out;
    });
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Give your form a name.";
    if (!fields.length) return "Add at least one question.";
    for (const f of fields) {
      if (!f.label.trim()) return "Every question needs a label.";
      if (f.type === "group") {
        if (!(f.fields || []).length) return `“${f.label}” needs at least one sub-question.`;
        for (const sf of f.fields || []) if (!sf.label.trim()) return `Sub-questions of “${f.label}” need a label.`;
      }
    }
    if (scope === "tenant" && !tenantId.trim()) return "Choose a tenant in Advanced settings.";
    if (targetKind !== "none" && !targetId) return `Pick the specific ${targetKind} this form is for.`;
    return null;
  };

  const onSave = () => {
    const err = validate();
    if (err) return ToastUtils.error(err);
    const payload: Partial<RequirementRecord> = {
      key: slug(key) || slug(title),
      title: title.trim(),
      description: description.trim() || null,
      placement: placement.trim() || "onboarding",
      scope,
      tenant_id: scope === "tenant" ? tenantId.trim() : null,
      persona,
      account_type: accountType,
      country_code: countryCode.trim() ? countryCode.trim().toUpperCase().slice(0, 2) : null,
      target_type: targetKind === "none" ? null : targetKind,
      target_id: targetKind === "none" ? null : targetId,
      enforcement,
      grace_period_days: Number(graceDays) || 0,
      is_active: isActive,
      fields: serializeFields(fields),
    };
    const done = () => navigate(basePath);
    if (isEdit && existing) {
      update.mutate({ id: existing.id, data: payload }, { onSuccess: () => { ToastUtils.success("Form saved."); done(); } });
    } else {
      create.mutate(payload, { onSuccess: () => { ToastUtils.success("Form created."); done(); } });
    }
  };

  const QuestionCard = (f: FieldDraft, i: number) => {
    const meta = typeMeta(f.type);
    const Icon = meta.icon;
    return (
      <div key={f._uid} className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            <Icon size={14} />
            {meta.label}
          </span>
          <button
            type="button"
            onClick={() => removeField(i)}
            disabled={fields.length === 1}
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
            title="Remove question"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <label className={labelCls}>{f.type === "checkbox" ? "What are they agreeing to?" : "Question"}</label>
        <input
          className={inputCls}
          value={f.label}
          placeholder={
            f.type === "checkbox"
              ? "e.g. I accept the Terms & Conditions"
              : f.type === "file"
                ? "e.g. Upload your ID document"
                : f.type === "verification"
                  ? "e.g. Verify your identity"
                  : f.type === "group"
                    ? "e.g. Founders / Directors"
                    : "e.g. What is your full name?"
          }
          onChange={(e) => patchField(i, { label: e.target.value })}
        />

        {f.type === "checkbox" && (
          <div className="mt-3">
            <label className={labelCls}>Wording shown next to the tick box (optional)</label>
            <input
              className={inputCls}
              value={f.consent_text || ""}
              placeholder="I agree to the Terms & Conditions."
              onChange={(e) => patchField(i, { consent_text: e.target.value })}
            />
          </div>
        )}

        {f.type === "verification" && (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            We’ll automatically ask for the right ID based on the person’s country (e.g. CAC in Nigeria, NIN for
            individuals) and verify it where possible.
          </p>
        )}

        {f.type === "group" && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Name of each one</label>
                <input className={inputCls} value={f.item_label || ""} placeholder="Founder" onChange={(e) => patchField(i, { item_label: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>At least</label>
                <input className={inputCls} type="number" min={0} value={f.min ?? 1} onChange={(e) => patchField(i, { min: Number(e.target.value) })} />
              </div>
              <div>
                <label className={labelCls}>At most</label>
                <input className={inputCls} type="number" min={1} value={f.max ?? 5} onChange={(e) => patchField(i, { max: Number(e.target.value) })} />
              </div>
            </div>

            <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              What to collect for each {(f.item_label || "item").toLowerCase()}
            </p>
            <div className="space-y-2">
              {(f.fields || []).map((sf, si) => (
                <div key={(sf as FieldDraft)._uid || si} className="flex items-center gap-2">
                  <select
                    className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    value={sf.type}
                    onChange={(e) => patchSub(i, si, { type: e.target.value })}
                  >
                    {SUB_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    className={`${inputCls} flex-1`}
                    value={sf.label}
                    placeholder="e.g. Full name"
                    onChange={(e) => patchSub(i, si, { label: e.target.value })}
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input type="checkbox" checked={Boolean(sf.required)} onChange={(e) => patchSub(i, si, { required: e.target.checked })} />
                    Req
                  </label>
                  <button type="button" onClick={() => removeSub(i, si)} className="rounded-md p-1.5 text-slate-400 hover:text-red-600" title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addSub(i, "text")} className="mt-2 text-sm font-medium text-blue-600 hover:underline">
              + Add something to collect
            </button>
          </div>
        )}

        {f.type !== "checkbox" && (
          <div className="mt-3">
            <Toggle on={Boolean(f.required)} onChange={(v) => patchField(i, { required: v })} label="People must answer this" />
          </div>
        )}
      </div>
    );
  };

  const PreviewField = (f: RequirementField, depth = 0): ReactNode => {
    const label = (f.label || "Untitled question") + (f.required ? " *" : "");
    if (f.type === "checkbox") {
      return (
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" disabled className="mt-1" />
          <span>{f.consent_text || f.label || "I agree"}{f.required ? " *" : ""}</span>
        </label>
      );
    }
    if (f.type === "group") {
      return (
        <div className="rounded-lg border border-slate-200 p-2">
          <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
          <div className="rounded-md bg-slate-50 p-2">
            <p className="mb-1 text-[11px] font-semibold text-slate-500">{f.item_label || "Item"} 1</p>
            <div className="space-y-2">{(f.fields || []).map((sf, k) => <div key={k}>{PreviewField(sf, depth + 1)}</div>)}</div>
          </div>
          <p className="mt-1 text-xs font-medium text-blue-600">+ Add {(f.item_label || "item").toLowerCase()}</p>
        </div>
      );
    }
    return (
      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">{label}</p>
        {f.type === "file" ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-400">Choose a file…</div>
        ) : (
          <input disabled className={`${inputCls} bg-slate-50`} placeholder={f.type === "verification" ? "ID number" : ""} />
        )}
        {f.type === "verification" && <p className="mt-1 text-xs text-slate-400">Verified automatically where available.</p>}
      </div>
    );
  };

  const enforceHint =
    enforcement === "required"
      ? "People can’t continue until they complete this form."
      : enforcement === "optional"
        ? "People are asked, but can skip it."
        : "Hidden — nobody is asked.";

  const targetOpts: { value: "none" | "client" | "tenant"; label: string }[] = [
    { value: "none", label: "No — use the above" },
    ...(context === "admin" ? [{ value: "tenant" as const, label: "A specific tenant" }] : []),
    { value: "client", label: "A specific client" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Add your questions, choose who it’s for, and watch the live preview.
        </p>
        <div className="flex items-center gap-2">
          <ModernButton variant="outline" onClick={() => navigate(basePath)}>
            Cancel
          </ModernButton>
          <ModernButton variant="primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save form" : "Create form"}
          </ModernButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(300px,360px)]">
        <div className="space-y-6">
          <Step n={1} title="Name your form" hint="Give it a name people will recognise.">
            <div>
              <label className={labelCls}>Form name</label>
              <input
                className={inputCls}
                value={title}
                placeholder="e.g. New Hire Agreement"
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!keyDirty) setKey(slug(e.target.value));
                }}
              />
            </div>
            <div>
              <label className={labelCls}>Add a short note (optional)</label>
              <textarea
                className={inputCls}
                rows={2}
                value={description}
                placeholder="Shown under the title so people know what to do."
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </Step>

          <Step n={2} title="Add your questions" hint="Pick what you want people to fill in.">
            <div className="space-y-3">{fields.map((f, i) => QuestionCard(f, i))}</div>

            <div className="rounded-xl border border-dashed border-slate-300 p-3">
              <p className="mb-2 text-sm font-medium text-slate-600">Add a question</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {QUESTION_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => addField(t.value)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-3 text-center transition hover:border-blue-400 hover:bg-blue-50"
                      title={t.hint}
                    >
                      <Icon size={20} className="text-blue-600" />
                      <span className="text-xs font-medium text-slate-700">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Step>

          <Step n={3} title="Who is it for, and do they have to?" hint="Sensible defaults are picked for you.">
            <div>
              <label className={labelCls}>Who fills this in?</label>
              <Segmented
                value={persona}
                onChange={(v) => setPersona(v)}
                options={[
                  { value: "any", label: "Everyone" },
                  { value: "tenant", label: "Tenants" },
                  { value: "client", label: "Clients" },
                ]}
              />
            </div>
            <div>
              <label className={labelCls}>What kind of account?</label>
              <Segmented
                value={accountType}
                onChange={(v) => setAccountType(v)}
                options={[
                  { value: "any", label: "Anyone" },
                  { value: "individual", label: "Individuals" },
                  { value: "business", label: "Businesses" },
                ]}
              />
            </div>
            <div>
              <label className={labelCls}>Assign to one specific person? (optional)</label>
              <Segmented
                value={targetKind}
                onChange={(v) => {
                  setTargetKind(v);
                  setTargetId("");
                }}
                options={targetOpts}
              />
              {targetKind !== "none" && (
                <div className="mt-2">
                  <SearchableSelect
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    options={(targetOptions || []).map((o) => ({ value: o.id, label: o.label }))}
                    placeholder={`Select a ${targetKind}…`}
                    searchPlaceholder={`Search ${targetKind}s…`}
                    emptyMessage={`No ${targetKind}s found.`}
                  />
                  <p className="mt-1 text-xs text-slate-500">Only the chosen {targetKind} will get this form.</p>
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Do they have to complete it?</label>
              <Segmented
                value={enforcement}
                onChange={(v) => setEnforcement(v)}
                options={[
                  { value: "required", label: "Yes, required" },
                  { value: "optional", label: "Optional" },
                  { value: "off", label: "Turn off" },
                ]}
              />
              <p className="mt-1 text-xs text-slate-500">{enforceHint}</p>
            </div>
          </Step>

          <ModernCard>
            <button
              type="button"
              onClick={() => setAdvanced((a) => !a)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Settings2 size={16} /> Advanced settings
              </span>
              <ChevronDown size={18} className={`text-slate-400 transition ${advanced ? "rotate-180" : ""}`} />
            </button>
            {advanced && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Key (unique id)</label>
                    <input
                      className={`${inputCls} font-mono`}
                      value={key}
                      placeholder="auto-generated"
                      onChange={(e) => { setKey(e.target.value); setKeyDirty(true); }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Placement</label>
                    <input className={inputCls} value={placement} placeholder="onboarding" onChange={(e) => setPlacement(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Only this country (ISO-2)</label>
                    <input className={`${inputCls} uppercase`} maxLength={2} value={countryCode} placeholder="any" onChange={(e) => setCountryCode(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Grace period (days)</label>
                    <input className={inputCls} type="number" min={0} value={graceDays} onChange={(e) => setGraceDays(e.target.value)} />
                  </div>
                  {/* Visibility is admin-only — a tenant's forms are always scoped to itself. */}
                  {context === "admin" && (
                    <>
                      <div>
                        <label className={labelCls}>Visibility</label>
                        <Segmented
                          value={scope}
                          onChange={(v) => setScope(v)}
                          options={[
                            { value: "platform", label: "All tenants" },
                            { value: "tenant", label: "One tenant" },
                          ]}
                        />
                      </div>
                      {scope === "tenant" && (
                        <div>
                          <label className={labelCls}>Tenant ID</label>
                          <input className={inputCls} value={tenantId} placeholder="tenant uuid" onChange={(e) => setTenantId(e.target.value)} />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <Toggle on={isActive} onChange={setIsActive} label="Form is on" />
              </div>
            )}
          </ModernCard>
        </div>

        <div>
          <div className="lg:sticky lg:top-4">
            <div className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
              <Eye size={16} /> Live preview
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">{title || "Your form name"}</h2>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
                <div className="mt-4 space-y-4">
                  {fields.length === 0 && <p className="text-sm text-slate-400">Add questions to see them here.</p>}
                  {fields.map((f) => (
                    <div key={f._uid}>{PreviewField(f)}</div>
                  ))}
                </div>
                <button type="button" disabled className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white opacity-90">
                  Continue
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">This is exactly what people will see.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementBuilder;
