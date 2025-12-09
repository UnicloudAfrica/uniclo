// @ts-nocheck
import React, { useState } from "react";
import { Loader2, X } from "lucide-react";

import { useCreateClientSecurityGroup } from "../../../hooks/clientHooks/securityGroupHooks";
import { useFetchGeneralRegions } from "../../../hooks/resource";

interface AddSGProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  region?: string;
}

interface FormData {
  name: string;
  region: string;
  description: string;
}

const AddSG: React.FC<AddSGProps> = ({ isOpen, onClose, projectId = "", region = "" }) => {
  const { isFetching: isRegionsFetching, data: regions } = useFetchGeneralRegions();
  const { mutate, isPending } = useCreateClientSecurityGroup();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    region: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!region && !formData.region) newErrors.region = "Region is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const securityGroupData = {
      project_id: projectId,
      region: region || formData.region,
      name: formData.name,
      description: formData.description,
    };

    mutate(securityGroupData, {
      onSuccess: () => {
        onClose();
      },
      onError: (err: any) => {
        console.error("Failed to create security group:", err);
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">Add New Security Group</h2>
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name<span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., MySecurityGroup"
                className={`w-full input-field ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            {!region && (
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
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
                  {regions?.map((r: any) => (
                    <option key={r.region} value={r.region}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
              </div>
            )}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description<span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="e.g., Security group for web servers"
                className={`w-full input-field min-h-[100px] resize-y ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
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
              className="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create Security Group
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSG;
