// @ts-nocheck
import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateElasticIp } from "../../../hooks/adminHooks/eipHooks";

const AddEip = ({ isOpen, onClose, projectId = "", region = "" }: any) => {
  const { mutate, isPending } = useCreateElasticIp();
  const [formData, setFormData] = useState({
    address: "",
    pool_id: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.pool_id.trim()) newErrors.pool_id = "Pool ID is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: any, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e: any) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const elasticIpData = {
      project_id: projectId,
      region: region,
      address: formData.address,
      pool_id: formData.pool_id,
    };

    mutate(elasticIpData, {
      onSuccess: () => {
        ToastUtils.success("Elastic IP added successfully");
        onClose();
      },
      onError: (err) => {
        console.error("Failed to create elastic IP:", err);
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">Add New Elastic IP</h2>
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
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address<span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="e.g., my-eip-address"
                className={`w-full input-field ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            <div>
              <label htmlFor="pool_id" className="block text-sm font-medium text-gray-700 mb-2">
                Pool ID<span className="text-red-500">*</span>
              </label>
              <input
                id="pool_id"
                type="text"
                value={formData.pool_id}
                onChange={(e) => updateFormData("pool_id", e.target.value)}
                placeholder="Enter Pool ID"
                className={`w-full input-field ${
                  errors.pool_id ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.pool_id && <p className="text-red-500 text-xs mt-1">{errors.pool_id}</p>}
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
              disabled={isPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create Elastic IP
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEip;
