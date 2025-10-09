import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateVpc } from "../../../hooks/adminHooks/vcpHooks";

const AddVpc = ({ isOpen, onClose, projectId = "" }) => {
  const queryClient = useQueryClient();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { mutate, isPending } = useCreateVpc();
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    cidr_block: "",
    is_default: false,
  });
  const [errors, setErrors] = useState({});

  // Provider derived server-side; do nothing here

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.region) newErrors.region = "Region is required";
    // Provider derived from region/project server-side
    if (!formData.cidr_block.trim()) {
      newErrors.cidr_block = "CIDR Block is required";
    } else if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(formData.cidr_block)) {
      newErrors.cidr_block =
        "CIDR Block must be a valid CIDR notation (e.g., 10.0.0.0/16)";
    }
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

    const vpcData = {
      project_id: projectId,
      // provider omitted; derived server-side
      region: formData.region,
      name: formData.name,
      cidr_block: formData.cidr_block,
      is_default: formData.is_default,
    };

    console.log("Submitting VPC Payload:", vpcData);

    mutate(vpcData, {
      onSuccess: () => {
        // ToastUtils.success("VPC added successfully");
        queryClient.invalidateQueries({ queryKey: ["vpcs", projectId] });
        onClose();
      },
      onError: (err) => {
        console.error("Failed to create VPC:", err);
        // ToastUtils.error("Failed to add VPC. Please try again.");
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">Add New VPC</h2>
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
                placeholder="e.g., MyVPC"
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
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
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
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
                htmlFor="cidr_block"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                CIDR Block<span className="text-red-500">*</span>
              </label>
              <input
                id="cidr_block"
                type="text"
                value={formData.cidr_block}
                onChange={(e) => updateFormData("cidr_block", e.target.value)}
                placeholder="e.g., 10.0.0.0/16"
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.cidr_block ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cidr_block && (
                <p className="text-red-500 text-xs mt-1">{errors.cidr_block}</p>
              )}
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  id="is_default"
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) =>
                    updateFormData("is_default", e.target.checked)
                  }
                  className="rounded border-gray-300 text-[#288DD1] focus:ring-[#288DD1]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Set as default VPC
                </span>
              </label>
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
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create VPC
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

export default AddVpc;
