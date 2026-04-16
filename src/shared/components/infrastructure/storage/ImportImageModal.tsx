import React, { useState } from "react";
import { Upload, Link, X, Loader2 } from "lucide-react";
import ModernButton from "../../ui/ModernButton";
import { api } from "../../../../lib/api";
import ToastUtils from "@/utils/toastUtil";

interface ImportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  region: string;
}

type Tab = "url" | "upload";

const DISK_FORMATS = ["qcow2", "vmdk", "vhd", "vhdx", "raw", "iso"];
const FIRMWARE_OPTIONS = ["bios", "uefi"];

const ImportImageModal: React.FC<ImportImageModalProps> = ({
  isOpen,
  onClose,
  projectId,
  region: _region,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("url");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // URL import form
  const [urlName, setUrlName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [urlFormat, setUrlFormat] = useState("qcow2");
  const [urlGuestOs, setUrlGuestOs] = useState("");
  const [urlFirmware, setUrlFirmware] = useState("bios");

  // File upload form
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileFormat, setFileFormat] = useState("qcow2");
  const [fileGuestOs, setFileGuestOs] = useState("");
  const [fileFirmware, setFileFirmware] = useState("bios");
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetForm = () => {
    setUrlName("");
    setSourceUrl("");
    setUrlFormat("qcow2");
    setUrlGuestOs("");
    setUrlFirmware("bios");
    setFile(null);
    setFileName("");
    setFileFormat("qcow2");
    setFileGuestOs("");
    setFileFirmware("bios");
    setUploadProgress(0);
  };

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/migrations", {
        image_name: urlName,
        project_id: projectId,
        source_url: sourceUrl,
        source_format: urlFormat,
        guest_os: urlGuestOs || "other",
        firmware: urlFirmware,
        source_cloud: "url",
      });
      ToastUtils.success("Image import started. Check your recent imports for progress.");
      resetForm();
      onClose();
    } catch {
      ToastUtils.error("Failed to start import.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("image_name", fileName || file.name);
    formData.append("project_id", projectId);
    formData.append("disk_format", fileFormat);
    formData.append("guest_os", fileGuestOs || "other");
    formData.append("firmware", fileFirmware);

    try {
      // Use XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/v1/client/migrations/upload`);

        const token = document.cookie
          .split("; ")
          .find((c) => c.startsWith("token="))
          ?.split("=")[1];
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(formData);
      });

      ToastUtils.success("File uploaded. Processing will begin shortly.");
      resetForm();
      onClose();
    } catch {
      ToastUtils.error("File upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Import Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 px-6">
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "url"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Link className="h-4 w-4" />
            Import from URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "upload"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload File
          </button>
        </div>

        {/* Tab content */}
        <div className="px-6 py-5">
          {activeTab === "url" ? (
            <form onSubmit={handleUrlImport} className="space-y-4">
              <FormField label="Image Name" required>
                <input
                  type="text"
                  value={urlName}
                  onChange={(e) => setUrlName(e.target.value)}
                  placeholder="My Custom Image"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </FormField>

              <FormField label="Source URL" required>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://example.com/image.qcow2"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </FormField>

              <div className="grid grid-cols-3 gap-3">
                <FormField label="Format">
                  <select
                    value={urlFormat}
                    onChange={(e) => setUrlFormat(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {DISK_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Guest OS">
                  <input
                    type="text"
                    value={urlGuestOs}
                    onChange={(e) => setUrlGuestOs(e.target.value)}
                    placeholder="ubuntu"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </FormField>

                <FormField label="Firmware">
                  <select
                    value={urlFirmware}
                    onChange={(e) => setUrlFirmware(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {FIRMWARE_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <ModernButton type="button" variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </ModernButton>
                <ModernButton
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !urlName || !sourceUrl}
                >
                  {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Import
                </ModernButton>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <FormField label="Image Name" required>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="My Custom Image"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </FormField>

              {/* Drop zone */}
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-8 text-center transition hover:border-primary-300 hover:bg-primary-50/30"
                onClick={() => document.getElementById("image-file-input")?.click()}
              >
                <Upload className="mb-2 h-8 w-8 text-slate-300" />
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1048576).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-500">
                      Click to select or drag & drop
                    </p>
                    <p className="text-xs text-slate-400">QCOW2, VMDK, VHD, RAW, ISO</p>
                  </>
                )}
                <input
                  id="image-file-input"
                  type="file"
                  className="hidden"
                  accept=".qcow2,.vmdk,.vhd,.vhdx,.raw,.iso,.img"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      if (!fileName) setFileName(f.name.replace(/\.[^.]+$/, ""));
                    }
                  }}
                />
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <FormField label="Format">
                  <select
                    value={fileFormat}
                    onChange={(e) => setFileFormat(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {DISK_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Guest OS">
                  <input
                    type="text"
                    value={fileGuestOs}
                    onChange={(e) => setFileGuestOs(e.target.value)}
                    placeholder="ubuntu"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </FormField>

                <FormField label="Firmware">
                  <select
                    value={fileFirmware}
                    onChange={(e) => setFileFirmware(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {FIRMWARE_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <ModernButton type="button" variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </ModernButton>
                <ModernButton type="submit" size="sm" disabled={isSubmitting || !file || !fileName}>
                  {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Upload
                </ModernButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const FormField = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-500">
      {label}
      {required && <span className="text-red-400"> *</span>}
    </label>
    {children}
  </div>
);

export default ImportImageModal;
