// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Building2, Loader2, Pencil } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchColocationSettings,
  useCreateColocationSettings,
} from "../../../hooks/adminHooks/colocationHooks";
import { ModernButton } from "../../../shared/components/ui";

const ColocationSetting = ({ selectedRegion, onMetricsChange }: any) => {
  const {
    data: fetchedSetting,
    isFetching: isSettingFetching,
    error: fetchError,
  } = useFetchColocationSettings(selectedRegion);
  const { mutate: updateSetting, isPending: isUpdating } = useCreateColocationSettings();
  const [percentage, setPercentage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (fetchedSetting) {
      setPercentage(fetchedSetting.percentage?.toString() ?? "");
    }
  }, [fetchedSetting]);

  useEffect(() => {
    if (!isEditing && fetchedSetting) {
      setPercentage(fetchedSetting.percentage?.toString() ?? "");
      setErrors({});
    }
  }, [isEditing, fetchedSetting]);

  useEffect(() => {
    onMetricsChange?.({
      metrics: [
        {
          label: "Colocation rate",
          value:
            fetchedSetting?.percentage !== undefined && fetchedSetting?.percentage !== null
              ? `${fetchedSetting.percentage}%`
              : "—",
          description: "Current markup applied",
          icon: <Building2 className="h-5 w-5" />,
        },
      ],
      description:
        "Adjust the markup applied to colocation workloads to account for power and rack space costs.",
    });
  }, [fetchedSetting, onMetricsChange]);

  const validateInput = () => {
    const nextErrors = {};
    const value = Number(percentage);

    if (percentage.trim() === "" || Number.isNaN(value)) {
      nextErrors.percentage = "Enter a valid percentage.";
    } else if (value < 0 || value > 100) {
      nextErrors.percentage = "Percentage must be between 0 and 100.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateInput()) return;

    updateSetting(
      { percentage: Number(percentage) },
      {
        onSuccess: () => {
          ToastUtils.success("Colocation percentage updated successfully!");
          setIsEditing(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (fetchedSetting) {
      setPercentage(fetchedSetting.percentage?.toString() ?? "");
    } else {
      setPercentage("");
    }
    setErrors({});
  };

  if (isSettingFetching) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
          Loading colocation configuration...
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
        Failed to load colocation settings: {fetchError.message}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Colocation markup</h3>
          <p className="text-sm text-slate-500">
            Adjust the infrastructure markup applied to colocated workloads in this region.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
              title="Edit colocation rate"
              aria-label="Edit colocation rate"
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Current markup</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">
            {fetchedSetting?.percentage !== undefined && fetchedSetting?.percentage !== null
              ? `${fetchedSetting.percentage}%`
              : "0%"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6">
          <p className="text-xs uppercase tracking-wide text-slate-500">Adjustment</p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="number"
              step="0.01"
              value={percentage}
              onChange={(event) => setPercentage(event.target.value)}
              className={`flex-1 rounded-xl border px-4 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-300 focus:bg-white ${
                errors.percentage ? "border-red-300 focus:border-red-400" : "border-slate-200"
              }`}
              placeholder="Enter percentage (0-100)"
              disabled={isUpdating || !isEditing}
            />
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              %
            </span>
          </div>
          {errors.percentage && <p className="mt-2 text-xs text-red-500">{errors.percentage}</p>}

          {isEditing && (
            <div className="mt-6 flex flex-wrap gap-3">
              <ModernButton
                onClick={handleSave}
                className="flex items-center gap-2"
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </ModernButton>
              <ModernButton variant="outline" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </ModernButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColocationSetting;
