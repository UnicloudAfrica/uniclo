// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  useFetchOnboardingSettings,
  useCreateOnboardingSetting,
  useUpdateOnboardingSetting,
  useDeleteOnboardingSetting,
} from "../../hooks/adminHooks/onboardingSettingsHooks";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import ToastUtils from "../../utils/toastUtil";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useFetchCountries as useAdminFetchCountries } from "../../hooks/adminHooks/countriesHooks";
import { STEP_CONFIG } from "../../dashboard/onboarding/stepConfig";
import ModernTable from "../../shared/components/ui/ModernTable";

const enforcementOptions = [
  { value: "required", label: "Required" },
  { value: "grace", label: "Grace Period" },
  { value: "optional", label: "Optional" },
];

const emptyForm = {
  persona: "",
  step_id: "",
  country_code: "",
  enforcement: "required",
  grace_period_days: "",
};
const AdminOnboardingSettings = () => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const { isLoading } = useAuthRedirect();

  const {
    data: settings,
    isFetching: isSettingsFetching,
    isError,
    refetch,
  } = useFetchOnboardingSettings();

  const { data: countries = [], isFetching: isCountriesFetching } = useAdminFetchCountries();

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

  const sortedSettings = useMemo(() => {
    if (!settings) return [];
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

  const handleChange = (field: any, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const personaOptions = useMemo(() => Object.keys(STEP_CONFIG), []);

  const stepOptions = useMemo(() => {
    if (!form.persona || !STEP_CONFIG[form.persona]) return [];
    return STEP_CONFIG[form.persona].map((definition: any) => ({
      value: definition.id,
      label: definition.label ?? definition.id,
    }));
  }, [form.persona]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };
  const handleEdit = (setting: any) => {
    setEditingId(setting.id);
    setForm({
      persona: setting.persona,
      step_id: setting.step_id,
      country_code: setting.country_code ?? "",
      enforcement: setting.enforcement ?? "required",
      grace_period_days: setting.grace_period_days ?? "",
    });
  };
  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      ToastUtils.success("Setting deleted");
    } catch (error) {
      console.error(error);
      ToastUtils.error(error?.message ?? "Failed to delete setting.");
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
      setForm((prev) => ({ ...prev, step_id: stepOptions[0].value }));
    }
  }, [form.persona, stepOptions]);

  const handleSubmit = async (event) => {
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
      ToastUtils.error(error?.message ?? "Unable to save setting.");
    }
  };
  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 animate-spin text-[#288DD1]" />
      </div>
    );
  }

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
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
                    {personaOptions.map((persona: any) => (
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
                    {stepOptions.map((option: any) => (
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
                      countries.map((country: any) => {
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
                    onChange={(event) => handleChange("enforcement", event.target.value)}
                    className="input-field mt-1"
                  >
                    {enforcementOptions.map((option: any) => (
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
                  className="inline-flex items-center gap-2 rounded-lg bg-[#288DD1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f6ea7] disabled:opacity-60"
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
              <ModernTable
                data={sortedSettings}
                columns={[
                  {
                    key: "persona",
                    header: "Persona",
                    sortable: true,
                    render: (val) => <span className="font-medium text-gray-900">{val}</span>,
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
                    render: (val) => val || <span className="text-gray-400">—</span>,
                  },
                  {
                    key: "enforcement",
                    header: "Enforcement",
                    sortable: true,
                    render: (val) =>
                      enforcementOptions.find((opt) => opt.value === val)?.label ?? val,
                  },
                  {
                    key: "grace_period_days",
                    header: "Grace Days",
                    sortable: true,
                    render: (val, row) => (row.enforcement === "grace" ? (val ?? 0) : "—"),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    align: "right",
                    render: (_, setting) => (
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
