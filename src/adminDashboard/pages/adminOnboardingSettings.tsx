import React, { useEffect, useMemo, useState } from "react";
import {
  useFetchOnboardingSettings,
  useCreateOnboardingSetting,
  useUpdateOnboardingSetting,
  useDeleteOnboardingSetting,
} from "../../hooks/adminHooks/onboardingSettingsHooks";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import ToastUtils from "../../utils/toastUtil";
import AdminPageShell from "../components/AdminPageShell";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useFetchCountries as useAdminFetchCountries } from "../../hooks/adminHooks/countriesHooks";
import { STEP_CONFIG } from "../../dashboard/onboarding/stepConfig";
import ModernTable from "../../shared/components/ui/ModernTable";

type EnforcementMode = "required" | "grace" | "optional";

interface OnboardingSettingForm {
  persona: string;
  step_id: string;
  country_code: string;
  enforcement: EnforcementMode;
  grace_period_days: string;
}

interface OnboardingSetting {
  id: string | number;
  persona: string;
  step_id: string;
  country_code?: string | null;
  enforcement: EnforcementMode;
  grace_period_days?: number | string | null;
}

interface CountryRecord extends Record<string, unknown> {
  id?: string | number;
  name?: string;
  iso2?: string;
  iso3?: string;
  numeric_code?: string | number;
}

const enforcementOptions = [
  { value: "required", label: "Required" },
  { value: "grace", label: "Grace Period" },
  { value: "optional", label: "Optional" },
];

const emptyForm: OnboardingSettingForm = {
  persona: "",
  step_id: "",
  country_code: "",
  enforcement: "required",
  grace_period_days: "",
};
const AdminOnboardingSettings = () => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const { isLoading } = useAuthRedirect();

  const {
    data: settingsData,
    isFetching: isSettingsFetching,
    isError,
    refetch,
  } = useFetchOnboardingSettings();

  const { data: countriesData = [], isFetching: isCountriesFetching } = useAdminFetchCountries();
  const settings = useMemo<OnboardingSetting[]>(
    () => (Array.isArray(settingsData) ? (settingsData as OnboardingSetting[]) : []),
    [settingsData]
  );
  const countries = useMemo<CountryRecord[]>(
    () => (Array.isArray(countriesData) ? (countriesData as unknown as CountryRecord[]) : []),
    [countriesData]
  );

  const createMutation = useCreateOnboardingSetting();
  const updateMutation = useUpdateOnboardingSetting();
  const deleteMutation = useDeleteOnboardingSetting();

  useEffect(() => {
    if (isError) {
      ToastUtils.error("Unable to load onboarding step settings.");
    }
  }, [isError]);

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const stepConfigMap = STEP_CONFIG as Record<string, Array<{ id: string; label?: string }>>;

  const sortedSettings = useMemo(() => {
    return [...settings].sort((a, b) => {
      if (a.persona === b.persona) {
        if (a.step_id === b.step_id) {
          return (a.country_code || "").localeCompare(b.country_code || "");
        }
        return a.step_id.localeCompare(b.step_id);
      }
      return a.persona.localeCompare(b.persona);
    });
  }, [settings]);

  const handleChange = <K extends keyof OnboardingSettingForm>(
    field: K,
    value: OnboardingSettingForm[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const personaOptions = useMemo(() => Object.keys(stepConfigMap), [stepConfigMap]);

  const stepOptions = useMemo(() => {
    const stepDefinitions = stepConfigMap[form.persona];
    if (!form.persona || !stepDefinitions) return [];
    return stepDefinitions.map((definition) => ({
      value: definition.id,
      label: definition.label ?? definition.id,
    }));
  }, [form.persona, stepConfigMap]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };
  const handleEdit = (setting: OnboardingSetting) => {
    setEditingId(setting.id);
    setForm({
      persona: setting.persona,
      step_id: setting.step_id,
      country_code: setting.country_code ?? "",
      enforcement: setting.enforcement ?? "required",
      grace_period_days:
        setting.grace_period_days === null || setting.grace_period_days === undefined
          ? ""
          : String(setting.grace_period_days),
    });
  };
  const handleDelete = async (id: string | number) => {
    try {
      await deleteMutation.mutateAsync(id);
      ToastUtils.success("Setting deleted");
    } catch (error) {
      console.error(error);
      ToastUtils.error(error instanceof Error ? error.message : "Failed to delete setting.");
    }
  };
  useEffect(() => {
    if (!form.persona) return;
    if (!stepOptions.length) {
      setForm((prev) => ({ ...prev, step_id: "" }));
      return;
    }
    const exists = stepOptions.some((option) => option.value === form.step_id);
    if (!exists) {
      const nextStepId = stepOptions[0]?.value ?? "";
      setForm((prev) => ({ ...prev, step_id: nextStepId }));
    }
  }, [form.persona, stepOptions]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      persona: form.persona.trim(),
      step_id: form.step_id.trim(),
      country_code: form.country_code.trim() || null,
      enforcement: form.enforcement,
      grace_period_days:
        form.enforcement === "grace" && form.grace_period_days !== ""
          ? Number(form.grace_period_days)
          : null,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
        ToastUtils.success("Onboarding setting updated");
      } else {
        await createMutation.mutateAsync(payload);
        ToastUtils.success("Onboarding setting created");
      }
      resetForm();
      refetch();
    } catch (error) {
      console.error(error);
      ToastUtils.error(error instanceof Error ? error.message : "Unable to save setting.");
    }
  };
  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 animate-spin text-[var(--theme-color)]" />
      </div>
    );
  }

  return (
    <>
      <AdminPageShell
        title="Onboarding Step Settings"
        description="Control which onboarding steps are required, optional, or grace-based for each persona."
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Onboarding" },
          { label: "Settings" },
        ]}
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Persona <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.persona}
                    onChange={(event) => handleChange("persona", event.target.value)}
                    className="input-field mt-1"
                    required
                  >
                    <option value="">Select persona</option>
                    {personaOptions.map((persona) => (
                      <option key={persona} value={persona}>
                        {persona}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Step ID <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.step_id}
                    onChange={(event) => handleChange("step_id", event.target.value)}
                    className="input-field mt-1"
                    required
                    disabled={!form.persona}
                  >
                    <option value="">
                      {form.persona ? "Select step" : "Select persona first"}
                    </option>
                    {stepOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Country Code</label>
                  <select
                    value={form.country_code}
                    onChange={(event) => handleChange("country_code", event.target.value)}
                    className="input-field mt-1"
                  >
                    <option value="">All countries</option>
                    {isCountriesFetching ? (
                      <option value="" disabled>
                        Loading countries...
                      </option>
                    ) : (
                      countries.map((country) => {
                        const code = (
                          country.iso2 ||
                          country.iso3 ||
                          country.numeric_code ||
                          country.id ||
                          ""
                        )
                          .toString()
                          .toUpperCase();

                        return (
                          <option key={`${country.id}-${code}`} value={code}>
                            {country.name} {code ? `(${code})` : ""}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Enforcement <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.enforcement}
                    onChange={(event) =>
                      handleChange("enforcement", event.target.value as EnforcementMode)
                    }
                    className="input-field mt-1"
                  >
                    {enforcementOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {form.enforcement === "grace" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Grace Period (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.grace_period_days}
                      onChange={(event) => handleChange("grace_period_days", event.target.value)}
                      className="input-field mt-1"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[rgb(var(--theme-color-600))] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : editingId ? (
                    <>
                      <Save className="h-4 w-4" />
                      Update Setting
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Setting
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configured Steps</h2>
            {isSettingsFetching ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading settings…
              </div>
            ) : (
              <ModernTable<OnboardingSetting>
                data={sortedSettings}
                columns={[
                  {
                    key: "persona",
                    header: "Persona",
                    sortable: true,
                    render: (val) => (
                      <span className="font-medium text-gray-900">{val as any}</span>
                    ),
                  },
                  {
                    key: "step_id",
                    header: "Step",
                    sortable: true,
                  },
                  {
                    key: "country_code",
                    header: "Country",
                    sortable: true,
                    render: (val) => (val as any) || <span className="text-gray-400">—</span>,
                  },
                  {
                    key: "enforcement",
                    header: "Enforcement",
                    sortable: true,
                    render: (val) =>
                      (enforcementOptions.find((opt) => opt.value === val)?.label ?? val) as any,
                  },
                  {
                    key: "grace_period_days",
                    header: "Grace Days",
                    sortable: true,
                    render: (val, row) => (row.enforcement === "grace" ? ((val ?? 0) as any) : "—"),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    align: "right",
                    render: (_value, setting) => (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(setting)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(setting.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                          disabled={
                            deleteMutation.isPending && deleteMutation.variables === setting.id
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    ),
                  },
                ]}
                searchable={true}
                searchKeys={["persona", "step_id", "country_code"]}
                emptyMessage="No overrides configured yet. Add your first rule above."
              />
            )}
          </div>
        </div>
      </AdminPageShell>
    </>
  );
};
export default AdminOnboardingSettings;
