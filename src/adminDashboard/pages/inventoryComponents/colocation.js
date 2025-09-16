import React, { useState, useEffect } from "react";
import { Loader2, Pencil } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchColocationSettings,
  useCreateColocationSettings,
} from "../../../hooks/adminHooks/colocationHooks";

const ColocationSetting = ({ selectedRegion }) => {
  const {
    data: fetchedSetting,
    isFetching: isSettingFetching,
    error: fetchError,
  } = useFetchColocationSettings(selectedRegion);
  const { mutate: updateSetting, isPending: isUpdating } =
    useCreateColocationSettings();
  const [percentage, setPercentage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (fetchedSetting) {
      setPercentage(fetchedSetting.percentage?.toString());
    }
  }, [fetchedSetting]);

  useEffect(() => {
    if (!isEditing && fetchedSetting) {
      setPercentage(fetchedSetting.percentage?.toString());
      setErrors({});
    }
  }, [isEditing, fetchedSetting]);

  const validateInput = () => {
    const newErrors = {};
    const numPercentage = parseFloat(percentage);

    if (percentage.trim() === "") {
      newErrors.percentage = "Percentage is required.";
    } else if (isNaN(numPercentage)) {
      newErrors.percentage = "Percentage must be a valid number.";
    } else if (numPercentage < 0 || numPercentage > 100) {
      newErrors.percentage = "Percentage must be between 0 and 100.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateInput()) {
      return;
    }

    if (fetchedSetting?.id) {
      updateSetting(
        { percentage: parseFloat(percentage) },
        {
          onSuccess: () => {
            ToastUtils.success("Colocation percentage updated successfully!");
            setIsEditing(false);
          },
        }
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isSettingFetching) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
        <p className="ml-2 text-gray-700">Loading colocation setting...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center text-red-500 min-h-[200px] flex items-center justify-center">
        <p>Error loading setting: {fetchError.message}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-8 font-Outfit">
      <h2 className="text-base font-medium text-[#575758] mb-4">
        Colocation Percentage
      </h2>
      <div className="flex items-center gap-4">
        {isEditing ? (
          <div className="flex flex-col w-full max-w-xs">
            <input
              type="number"
              step="0.01"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#288DD1] ${
                errors.percentage ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isUpdating}
              placeholder="Enter percentage (0-100)"
            />
            {errors.percentage && (
              <p className="text-red-500 text-xs mt-1">{errors.percentage}</p>
            )}
          </div>
        ) : (
          <p className="text-lg font-medium text-gray-900">
            {fetchedSetting?.percentage !== undefined &&
            fetchedSetting?.percentage !== null
              ? `${fetchedSetting.percentage}%`
              : "N/A"}
          </p>
        )}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-md hover:bg-[#1976D2] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUpdating}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColocationSetting;
