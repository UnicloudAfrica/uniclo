import React, { useState, useEffect } from "react";
import { X, Loader2, Upload, CheckCircle } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useMutation } from "@tanstack/react-query";
import { FileInput } from "../../../utils/fileInput";
import { useAddLeadDocument } from "../../../hooks/adminHooks/leadsHook";

const documentTypeOptions = [
  "identity",
  "business_registration",
  "tax_certificate",
  "bank_statement",
  "contract",
  "proposal",
  "other",
];

const AddLeadDocument = ({ isOpen, onClose, lead }) => {
  const [formData, setFormData] = useState({
    document_type: "",
    name: "",
    file: null,
    stage_id: "",
  });
  const [errors, setErrors] = useState({});

  const { mutate, isPending } = useAddLeadDocument();

  // Reset form state when the modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        document_type: "",
        name: "",
        file: null,
        stage_id: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  // Validates the form data
  const validateForm = () => {
    const newErrors = {};
    if (!formData.document_type) {
      newErrors.document_type = "Please select a document type.";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Document name is required.";
    }
    if (!formData.file) {
      newErrors.file = "Please upload a file.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handles form field changes
  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Handles file input changes
  const handleFileChange = (event) => {
    const fileBase64 = event.target.files[0];
    if (fileBase64) {
      updateFormData("file", fileBase64);
    } else {
      updateFormData("file", null);
    }
  };

  // Handles form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;
    if (!lead || !lead.id) {
      ToastUtils.error("Lead ID is missing. Cannot add document.");
      return;
    }

    const documentData = {
      lead_id: lead.id,
      file: formData.file,
      document_type: formData.document_type,
      name: formData.name,
      stage_id: formData.stage_id || undefined, // Send only if a stage is selected
    };

    mutate(documentData, {
      onSuccess: () => {
        ToastUtils.success("Lead document added successfully!");
        onClose();
      },
      onError: (error) => {
        // ToastUtils.error("Failed to add lead document. Please try again.");
      },
    });
  };

  if (!isOpen) return null;

  const formatDocumentNameForDisplay = (name) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Add Lead Document
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Modal Body */}
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            {/* Document Type Field */}
            <div>
              <label
                htmlFor="documentType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Type<span className="text-red-500">*</span>
              </label>
              <select
                id="documentType"
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

            {/* Document Name Field */}
            <div>
              <label
                htmlFor="documentName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Name<span className="text-red-500">*</span>
              </label>
              <input
                id="documentName"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., John Doe's Passport"
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Stage ID Field (Optional) */}
            <div>
              <label
                htmlFor="stageId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Link to Stage (optional)
              </label>
              <select
                id="stageId"
                value={formData.stage_id}
                onChange={(e) => updateFormData("stage_id", e.target.value)}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.stage_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">No specific stage</option>
                {lead?.stages?.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {formatDocumentNameForDisplay(stage.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* File Input Field */}
            <FileInput
              id="documentFile"
              label="Document File"
              onChange={handleFileChange}
              selectedFile={formData.file}
              error={errors.file}
              accept=".pdf, .jpg, .jpeg, .png"
            />
          </div>
        </div>
        {/* Modal Footer */}
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
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Add Document
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

export default AddLeadDocument;
