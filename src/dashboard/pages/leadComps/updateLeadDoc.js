import React, { useState, useEffect } from "react";
import { X, Loader2, Upload } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { FileInput } from "../../../utils/fileInput";
import { useUpdateDoc } from "../../../hooks/tenantHooks/leadsHook";

const documentTypeOptions = [
  "identity",
  "business_registration",
  "tax_certificate",
  "bank_statement",
  "contract",
  "proposal",
  "other",
];

const UpdateLeadDoc = ({ isOpen, onClose, document }) => {
  const [formData, setFormData] = useState({
    document_type: "",
    name: "",
    file: null,
  });
  const [errors, setErrors] = useState({});

  const { mutate, isPending } = useUpdateDoc();

  useEffect(() => {
    if (isOpen && document) {
      setFormData({
        document_type: document.document_type || "",
        name: document.name || "",
        file: null,
      });
      setErrors({});
    }
  }, [isOpen, document]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.document_type) {
      newErrors.document_type = "Please select a document type.";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Document name is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFileChange = (event) => {
    const fileBase64 = event.target.files[0];
    updateFormData("file", fileBase64 || null);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    if (!document?.id) {
      ToastUtils.error("Document ID is missing. Cannot update.");
      return;
    }

    const docData = {
      document_type: formData.document_type,
      name: formData.name,
    };

    if (formData.file) {
      docData.file = formData.file;
    }

    mutate(
      {
        id: document.id,
        docData,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Lead document updated successfully!");
          onClose();
        },
        onError: (error) => {
          ToastUtils.error(error?.message || "Failed to update lead document.");
        },
      }
    );
  };

  if (!isOpen) return null;

  const formatDocumentNameForDisplay = (name) =>
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Update Lead Document
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            <div>
              <label
                htmlFor="documentTypeUpdate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Type<span className="text-red-500">*</span>
              </label>
              <select
                id="documentTypeUpdate"
                value={formData.document_type}
                onChange={(e) =>
                  updateFormData("document_type", e.target.value)
                }
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.document_type ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="" disabled>
                  Select a document type
                </option>
                {documentTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {formatDocumentNameForDisplay(type)}
                  </option>
                ))}
              </select>
              {errors.document_type && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.document_type}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="documentNameUpdate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Name<span className="text-red-500">*</span>
              </label>
              <input
                id="documentNameUpdate"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Updated bank statement"
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
                htmlFor="documentFileUpdate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Replace File (optional)
              </label>
              <FileInput
                id="documentFileUpdate"
                icon={Upload}
                accept=".pdf,.png,.jpg,.jpeg,.svg,.webp"
                label={
                  formData.file
                    ? `Selected: ${formData.file.name}`
                    : "Click to upload a new file"
                }
                onChange={handleFileChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to keep the existing file.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateLeadDoc;
