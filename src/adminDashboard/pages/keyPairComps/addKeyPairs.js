import React, { useState, useEffect } from "react";
import { Loader2, X, Clipboard, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateKeyPair } from "../../../hooks/adminHooks/keyPairHooks";

const AddKeyPair = ({ isOpen, onClose, projectId = "" }) => {
  const queryClient = useQueryClient();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { mutate, isPending } = useCreateKeyPair();
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    public_key: "",
  });
  const [errors, setErrors] = useState({});
  const [successState, setSuccessState] = useState({
    isSuccess: false,
    material: "",
  });

  // Debug state changes
  useEffect(() => {
    // console.log("Modal State - isOpen:", isOpen, "successState:", successState);
  }, [isOpen, successState]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.region) newErrors.region = "Region is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(successState.material);
      ToastUtils.success("Private key copied to clipboard!");
    } catch (err) {
      ToastUtils.error("Failed to copy private key.");
      // console.error("Copy error:", err);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([successState.material], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        formData.name.replace(/[^a-zA-Z0-9]/g, "_") || "keypair"
      }.txt`;
      a.click();
      URL.revokeObjectURL(url);
      ToastUtils.success("Private key downloaded!");
    } catch (err) {
      ToastUtils.error("Failed to download private key.");
      // console.error("Download error:", err);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const keyPairData = {
      project_id: projectId,
      region: formData.region,
      name: formData.name,
      public_key: formData.public_key.trim() || null,
    };

    // console.log("Submitting KeyPair Payload:", keyPairData);

    mutate(keyPairData, {
      onSuccess: (response) => {
        // console.log("Success Response:", response);
        setSuccessState({
          isSuccess: true,
          material: response.material || "No private key provided",
        });
        // ToastUtils.success("Key Pair created successfully!");
      },
      onError: (err) => {
        // console.error("Failed to create key pair:", err);
        // ToastUtils.error("Failed to add key pair. Please try again.");
      },
    });
  };

  const handleDone = () => {
    setFormData({ name: "", region: "", public_key: "" });
    setSuccessState({ isSuccess: false, material: "" });
    queryClient.invalidateQueries({ queryKey: ["keyPairs"] });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            {successState.isSuccess ? "Key Pair Created" : "Add New Key Pair"}
          </h2>
          <button
            onClick={handleDone}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            {successState.isSuccess ? (
              <>
                <p className="text-green-600 text-sm mb-4">
                  Your key pair has been created successfully. Please copy or
                  download the private key and keep it in a safe place.
                </p>
                <div>
                  <label
                    htmlFor="material"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Private Key
                  </label>
                  <textarea
                    id="material"
                    value={successState.material}
                    readOnly
                    className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field resize-y min-h-[150px] bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors"
                  >
                    <Clipboard className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </>
            ) : (
              <>
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
                      {isRegionsFetching
                        ? "Loading regions..."
                        : "Select a region"}
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
                    Public Key
                  </label>
                  <textarea
                    id="public_key"
                    value={formData.public_key}
                    onChange={(e) =>
                      updateFormData("public_key", e.target.value)
                    }
                    placeholder="e.g., ssh-rsa AAAAB3NzaC1yc2E..."
                    className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field resize-y min-h-[100px] ${
                      errors.public_key ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.public_key && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.public_key}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={handleDone}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            disabled={isPending}
          >
            {successState.isSuccess ? "Done" : "Close"}
          </button>
          {!successState.isSuccess && (
            <button
              onClick={handleSubmit}
              disabled={isPending || isRegionsFetching}
              className="ml-3 px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create Key Pair
              {isPending && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddKeyPair;
