import React, { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

const FileDropInput = ({
  accept = ".pdf,.png,.jpg,.jpeg",
  onFileSelected,
  value,
  helperText,
  placeholder = "Drag & drop or click to upload",
  disabled = false,
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    onFileSelected?.(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFiles(files);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    onFileSelected?.(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const renderPreview = () => {
    const renderFileLabel = (stringValue) => (
      <span className="text-xs text-gray-600 text-center break-all">
        {stringValue.split("/").pop()}
      </span>
    );

    if (!value) {
      return (
        <span className="text-xs text-gray-500 text-center">
          {placeholder}. Supported formats: {accept}
        </span>
      );
    }

    if (typeof value === "string" && value.startsWith("data:image")) {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-white shadow-sm">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs text-emerald-600">New file ready to upload.</span>
        </div>
      );
    }

    if (typeof value === "string") {
      const lower = value.toLowerCase();
      const isImage =
        lower.startsWith("http") &&
        (lower.endsWith(".png") ||
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".svg"));

      if (isImage) {
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-white shadow-sm">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            {renderFileLabel(value)}
          </div>
        );
      }

      if (value.startsWith("data:")) {
        return (
          <span className="text-xs text-emerald-600 text-center">
            New file ready to upload.
          </span>
        );
      }

      return renderFileLabel(value);
    }

    if (typeof value === "object" && value !== null) {
      const src = value.url ?? value.path ?? value.preview ?? "";
      const label =
        value.original_name ??
        value.name ??
        value.path?.split("/").pop() ??
        "Uploaded file";
      const lower = src.toLowerCase();
      const isImage =
        lower.startsWith("http") &&
        (lower.endsWith(".png") ||
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".svg"));

      return (
        <div className="flex flex-col items-center gap-2">
          {isImage && (
            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-white shadow-sm">
              <img
                src={src}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <span className="text-xs text-gray-600 text-center break-all">
            {label}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl px-4 py-6 cursor-pointer transition ${
          disabled
            ? "opacity-60 cursor-not-allowed border-gray-200 bg-gray-50"
            : isDragging
            ? "border-[--theme-color] bg-slate-100"
            : "border-gray-300 hover:border-[--theme-color]"
        }`}
        onClick={() => {
          if (disabled) return;
          inputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <UploadCloud className="w-6 h-6 text-gray-400" />
        {renderPreview()}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-300 text-gray-500 hover:text-rose-500 hover:border-rose-400 transition"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {helperText && (
        <p className="text-xs text-gray-500 leading-snug">{helperText}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          if (disabled) return;
          const files = event.target.files;
          if (files && files.length > 0) {
            handleFiles(files);
          } else {
            onFileSelected?.(null);
          }
        }}
      />
    </div>
  );
};

export default FileDropInput;
