import React, { useState } from "react";
import { Upload, CheckCircle, X } from "lucide-react";

type FileInputOutput = "base64" | "file";

type FileInputChange =
  | File
  | {
      target: {
        files: Array<File | string>;
      };
    };

interface FileInputProps {
  id: string;
  label: string;
  field?: string;
  onChange: (value: FileInputChange) => void;
  error?: string;
  selectedFile?: File | string | null;
  accept?: string;
  outputAs?: FileInputOutput;
}

export const FileInput: React.FC<FileInputProps> = ({
  id,
  label,
  field,
  onChange,
  error,
  selectedFile,
  accept,
  outputAs = "base64", // 'base64' or 'file'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputName = field ?? id;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (outputAs === "base64") {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = typeof reader.result === "string" ? reader.result : "";
        onChange({ target: { files: [base64String] } });
      };
      reader.readAsDataURL(file);
    } else {
      // For 'file' output, pass the File object directly
      onChange(file);
    }
  };

  const handleRemoveFile = () => {
    onChange({ target: { files: [] } }); // Clear the file by passing an empty files array
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg bg-[var(--theme-surface-alt)] p-6 text-center transition-colors ${
          isDragging
            ? "border-[var(--theme-color)] bg-[var(--theme-color)] bg-opacity-10"
            : error
              ? "border-red-500"
              : "border-[var(--theme-surface-alt)] hover:border-[var(--theme-color)]"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id={id}
          name={inputName}
          type="file"
          onChange={handleFileChange} // Use the new handler
          accept={accept}
          className="hidden"
        />
        <label htmlFor={id} className="cursor-pointer flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-[var(--theme-color)] bg-opacity-10 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 text-[var(--theme-color)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--theme-color)] font-medium">
              {isDragging ? "Drop file here" : `Click to upload ${label}`}
            </p>
            <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
          </div>
        </label>
      </div>
      {selectedFile && (
        <div className="mt-2 flex items-center justify-between p-3 bg-[var(--theme-surface-alt)] border border-[var(--theme-surface-alt)] rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-sm text-gray-700 font-medium">
              {typeof selectedFile === "string" ? "Uploaded File" : selectedFile.name}
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
