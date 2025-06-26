import React, { useState } from "react";
import { Upload, CheckCircle, X } from "lucide-react";

export const FileInput = ({
  id,
  label,
  field,
  onChange,
  error,
  selectedFile,
  accept,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      convertToBase64(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      convertToBase64(file);
    }
  };

  const convertToBase64 = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result; // Contains the base64 string
      onChange({ target: { files: [base64String] } }); // Pass base64 string as the file
    };
    reader.readAsDataURL(file); // Converts file to base64
  };

  const handleRemoveFile = () => {
    onChange({ target: { files: [] } }); // Clear the file by passing an empty files array
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg bg-[#F5F5F4] p-6 text-center transition-colors ${
          isDragging
            ? "border-[#288DD1] bg-[#288DD1] bg-opacity-10"
            : error
            ? "border-red-500"
            : "border-[#ECEDF0] hover:border-[#288DD1]"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id={id}
          type="file"
          onChange={handleFileChange} // Use the new handler
          accept={accept}
          className="hidden"
        />
        <label
          htmlFor={id}
          className="cursor-pointer flex flex-col items-center space-y-2"
        >
          <div className="w-12 h-12 bg-[#288DD1] bg-opacity-10 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 text-[#288DD1]" />
          </div>
          <div>
            <p className="text-sm text-[#288DD1] font-medium">
              {isDragging ? "Drop file here" : `Click to upload ${label}`}
            </p>
            <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
          </div>
        </label>
      </div>
      {selectedFile && (
        <div className="mt-2 flex items-center justify-between p-3 bg-[#F5F5F4] border border-[#ECEDF0] rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-sm text-gray-700 font-medium">
              {typeof selectedFile === "string"
                ? "Uploaded File"
                : selectedFile.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="text-gray-500 hover:text-red-500 transition-colors"
            title="Remove file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
