// @ts-nocheck
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, CheckCircle2, AlertCircle, FileIcon, Loader2, FolderUp } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  startTime?: number;
  speed?: number;
}

interface DropzoneUploaderProps {
  accountId: string;
  bucketName: string;
  currentPrefix: string;
  onUploadComplete?: () => void;
  compact?: boolean;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatSpeed = (bytesPerSecond: number) => {
  return formatBytes(bytesPerSecond) + "/s";
};

const DropzoneUploader: React.FC<DropzoneUploaderProps> = ({
  accountId,
  bucketName,
  currentPrefix,
  onUploadComplete,
  compact = false,
}) => {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (uploadFile: UploadFile) => {
    const { id, file } = uploadFile;
    const objectKey = currentPrefix + file.name;
    const startTime = Date.now();

    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "uploading", progress: 0, startTime } : u))
    );

    try {
      // Use XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", objectKey);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = elapsed > 0 ? event.loaded / elapsed : 0;

            setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress, speed } : u)));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploads((prev) =>
              prev.map((u) => (u.id === id ? { ...u, status: "success", progress: 100 } : u))
            );
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));

        // Determine the correct API base URL using the same logic as objectStorageApi
        const apiBase = import.meta.env.VITE_API_USER_BASE_URL || "";
        let baseUrl: string;

        if (window.location.pathname.includes("admin-dashboard")) {
          // Admin routes: admin/v1/object-storage (no /api prefix)
          baseUrl = `${apiBase}/admin/v1/object-storage`;
        } else if (
          window.location.pathname.includes("dashboard") &&
          !window.location.pathname.includes("client")
        ) {
          // Tenant routes: tenant/v1/admin/object-storage (no /api prefix)
          baseUrl = `${apiBase}/tenant/v1/admin/object-storage`;
        } else {
          // Client routes: api/v1/business/object-storage (has /api prefix)
          baseUrl = `${apiBase}/api/v1/business/object-storage`;
        }

        xhr.open("POST", `${baseUrl}/accounts/${accountId}/buckets/${bucketName}/upload`);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    } catch (error: any) {
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "error", error: error.message } : u))
      );
    }
  };

  const processUploads = async (files: UploadFile[]) => {
    setIsUploading(true);

    for (const file of files) {
      if (file.status === "pending") {
        await uploadFile(file);
      }
    }

    setIsUploading(false);

    // Check if all succeeded
    const allSuccess = files.every((f) => {
      const current = uploads.find((u) => u.id === f.id);
      return current?.status === "success";
    });

    if (allSuccess && onUploadComplete) {
      onUploadComplete();
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newUploads: UploadFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "pending",
      }));

      setUploads((prev) => [...prev, ...newUploads]);
      processUploads(newUploads);
    },
    [accountId, bucketName, currentPrefix]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const clearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== "success"));
    if (onUploadComplete) onUploadComplete();
  };

  const pendingCount = uploads.filter((u) => u.status === "pending").length;
  const uploadingCount = uploads.filter((u) => u.status === "uploading").length;
  const successCount = uploads.filter((u) => u.status === "success").length;
  const errorCount = uploads.filter((u) => u.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`
                    relative border-2 border-dashed rounded-xl transition-all cursor-pointer
                    ${
                      isDragActive
                        ? "border-primary-500 bg-primary-50"
                        : "border-slate-300 hover:border-primary-400 hover:bg-slate-50"
                    }
                    ${compact ? "p-4" : "p-8"}
                `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`rounded-full bg-primary-100 ${compact ? "p-2 mb-2" : "p-4 mb-4"}`}>
            {isDragActive ? (
              <FolderUp className={`${compact ? "h-5 w-5" : "h-8 w-8"} text-primary-600`} />
            ) : (
              <Upload className={`${compact ? "h-5 w-5" : "h-8 w-8"} text-primary-600`} />
            )}
          </div>
          <p className={`font-medium text-slate-700 ${compact ? "text-sm" : "text-base"}`}>
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className={`text-slate-500 mt-1 ${compact ? "text-xs" : "text-sm"}`}>
            or click to browse
          </p>
        </div>
      </div>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Queue Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-4 text-sm">
              {uploadingCount > 0 && (
                <span className="flex items-center gap-1 text-primary-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading {uploadingCount}
                </span>
              )}
              {pendingCount > 0 && <span className="text-slate-500">{pendingCount} pending</span>}
              {successCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {successCount} completed
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errorCount} failed
                </span>
              )}
            </div>
            {successCount > 0 && (
              <button
                onClick={clearCompleted}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear completed
              </button>
            )}
          </div>

          {/* File List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-3 px-4 py-3">
                <FileIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {upload.name}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">{formatBytes(upload.size)}</span>
                  </div>
                  {upload.status === "uploading" && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{upload.progress}%</span>
                        {upload.speed && <span>{formatSpeed(upload.speed)}</span>}
                      </div>
                    </div>
                  )}
                  {upload.status === "error" && (
                    <p className="text-xs text-red-600">{upload.error || "Upload failed"}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {upload.status === "uploading" && (
                    <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
                  )}
                  {upload.status === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                  {upload.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {upload.status === "pending" && (
                    <button
                      onClick={() => removeUpload(upload.id)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropzoneUploader;
