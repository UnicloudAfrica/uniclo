import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useUploadProductPricingFile } from "../../../hooks/adminHooks/adminproductPricingHook";
import ToastUtils from "../../../utils/toastUtil";
import { FileInput } from "../../../utils/fileInput";

const UploadPricingFileModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDryRun, setIsDryRun] = useState(false);
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);

  const { mutate: uploadFile, isPending } = useUploadProductPricingFile();

  const handleFileChange = (file) => {
    setSelectedFile(file);
    setError("");
  };

  const resetState = () => {
    setSelectedFile(null);
    setIsDryRun(false);
    setError("");
    setUploadResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    uploadFile(
      { file: selectedFile, dry_run: isDryRun },
      {
        onSuccess: (res) => {
          setUploadResult(res.data);
        },
        onError: (err) => {
          // The error toast is already handled by the `multipartApi` utility
          console.error("Upload failed:", err);
        },
      }
    );
  };

  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    handleClose();
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (uploadResult) {
      const {
        total_rows,
        processed,
        created,
        updated,
        skipped,
        errors,
        dry_run,
      } = uploadResult;
      const successCount = created + updated;
      const hasErrors = errors && errors.length > 0;

      return (
        <>
          <div className="px-6 py-6 max-h-[450px] overflow-y-auto">
            <h3 className="text-md font-semibold text-gray-800 mb-4">
              Import {dry_run ? "Dry Run " : ""}Results
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-600">Total Rows:</div>
              <div className="text-gray-800">{total_rows}</div>
              <div className="font-medium text-gray-600">
                {dry_run ? "Would Process:" : "Processed:"}
              </div>
              <div className="text-gray-800">{processed}</div>
              <div className="font-medium text-gray-600">
                {dry_run ? "Would Create/Update:" : "Succeeded:"}
              </div>
              <div className="text-green-600 font-medium">{successCount}</div>
              <div className="font-medium text-gray-600">Skipped:</div>
              <div className="text-yellow-600 font-medium">{skipped}</div>
              <div className="font-medium text-gray-600">Errors:</div>
              <div className="text-red-600 font-medium">
                {errors?.length || 0}
              </div>
            </div>

            {hasErrors && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Error Details
                </h4>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-3 bg-red-50">
                  {errors.map((err, index) => (
                    <div key={index} className="text-xs">
                      <p className="font-bold text-red-700">Row {err.row}:</p>
                      <ul className="list-disc list-inside pl-2 text-red-600">
                        {err.messages.map((msg, msgIndex) => (
                          <li key={msgIndex}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
            >
              Finish
            </button>
          </div>
        </>
      );
    }

    // Default upload view
    return (
      <div className="max-h-[450px] overflow-y-auto">
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
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
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
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[500px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            {uploadResult ? "Upload Summary" : "Upload Pricing File"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default UploadPricingFileModal;
