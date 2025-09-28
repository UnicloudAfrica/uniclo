import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useUploadProductPricingFile } from "../../../hooks/adminHooks/adminproductPricingHook";
import ToastUtils from "../../../utils/toastUtil";
import { FileInput } from "../../../utils/fileInput";

const UploadPricingFileModal = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDryRun, setIsDryRun] = useState(false);
  const [error, setError] = useState("");

  const { mutate: uploadFile, isPending } = useUploadProductPricingFile();

  const handleFileChange = (file) => {
    setSelectedFile(file);
    setError("");
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    uploadFile(
      { file: selectedFile, dry_run: isDryRun },
      {
        onSuccess: () => {
          ToastUtils.success(
            `File "${selectedFile.name}" uploaded successfully.`
          );
          onClose();
          setSelectedFile(null);
          setIsDryRun(false);
        },
        onError: (err) => {
          // The error toast is already handled by the `multipartApi` utility
          console.error("Upload failed:", err);
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[500px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Upload Pricing File
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <FileInput
            id="pricing-file-upload"
            label="Pricing Spreadsheet"
            onChange={handleFileChange}
            selectedFile={selectedFile}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            outputAs="file" // Tell the component to give us the File object
            error={error}
          />
          <div className="flex items-center mt-6">
            <input
              id="dry-run"
              type="checkbox"
              checked={isDryRun}
              onChange={(e) => setIsDryRun(e.target.checked)}
              className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
            />
            <label
              htmlFor="dry-run"
              className="ml-2 block text-sm text-gray-700"
            >
              Perform a dry run (validate file without importing)
            </label>
          </div>
        </div>

        {/* Footer */}
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
              disabled={isPending || !selectedFile}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending ? "Uploading..." : "Upload File"}
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

export default UploadPricingFileModal;
