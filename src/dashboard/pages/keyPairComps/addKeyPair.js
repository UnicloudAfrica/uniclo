import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateTenantKeyPair } from "../../../hooks/keyPairsHook";

const AddTenantKeyPair = ({ isOpen, onClose, projectId = "" }) => {
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { mutate, isPending } = useCreateTenantKeyPair();
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    public_key: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.region) newErrors.region = "Region is required";
    if (!formData.public_key.trim())
      newErrors.public_key = "Public Key is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const keyPairData = {
      project_id: projectId,
      region: formData.region,
      name: formData.name,
      public_key: formData.public_key,
    };

    mutate(keyPairData, {
      onSuccess: () => {
        ToastUtils.success("Key Pair added successfully");
        onClose();
      },
      onError: (err) => {
        console.error("Failed to create key pair:", err);
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Add New Key Pair
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Name<span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., MyKeyPair"
                className={`w-full input-field ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Region<span className="text-red-500">*</span>
              </label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => updateFormData("region", e.target.value)}
                className={`w-full input-field ${
                  errors.region ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isRegionsFetching}
              >
                <option value="" disabled>
                  {isRegionsFetching ? "Loading regions..." : "Select a region"}
                </option>
                {regions?.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.region && (
                <p className="text-red-500 text-xs mt-1">{errors.region}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="public_key"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Public Key<span className="text-red-500">*</span>
              </label>
              <input
                id="public_key"
                type="text"
                value={formData.public_key}
                onChange={(e) => updateFormData("public_key", e.target.value)}
                placeholder="e.g., ssh-rsa AAAAB3NzaC1yc2E..."
                className={`w-full input-field ${
                  errors.public_key ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.public_key && (
                <p className="text-red-500 text-xs mt-1">{errors.public_key}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || isRegionsFetching}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create Key Pair
              {isPending && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTenantKeyPair;
