import { useRef, useState } from "react";
import { Upload, Link as LinkIcon, FileUp, Cloud } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ModernModal,
  ModernButton,
  ModernInput,
  ModernSelect,
  Tabs,
  type TabItem,
  ProgressBar,
  InfoCallout,
} from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";

/**
 * Customer image import modal.
 *
 * Two tabs:
 *   • From URL  — provider pulls the image directly. No bandwidth cost
 *                 for the customer; faster than upload for large images
 *                 hosted somewhere accessible.
 *   • Upload    — multipart form upload. Streamed to disk, virus-scanned,
 *                 then pushed to Glance by ProcessImageUploadJob.
 *
 * Both modes use the same target metadata (name, format, guest OS).
 *
 * Upload progress bar comes from XHR.upload.onprogress so the user gets
 * real feedback on multi-GB files instead of a hung spinner.
 */

interface ImportImageModalProps {
  open: boolean;
  onClose: () => void;
  projectIdentifier: string;
}

const FORMAT_OPTIONS = [
  { label: "qcow2 (recommended)", value: "qcow2" },
  { label: "raw", value: "raw" },
  { label: "vmdk", value: "vmdk" },
  { label: "vhd / vhdx", value: "vhd" },
  { label: "iso", value: "iso" },
];

const GUEST_OS_OPTIONS = [
  { label: "Ubuntu", value: "ubuntu" },
  { label: "Debian", value: "debian" },
  { label: "CentOS / Rocky / AlmaLinux", value: "rhel" },
  { label: "Fedora", value: "fedora" },
  { label: "Windows", value: "windows" },
  { label: "Other Linux", value: "other_linux" },
];

const FIRMWARE_OPTIONS = [
  { label: "BIOS (most images)", value: "bios" },
  { label: "UEFI (modern images)", value: "uefi" },
];

export default function ImportImageModal({
  open,
  onClose,
  projectIdentifier,
}: ImportImageModalProps) {
  const [tab, setTab] = useState("url");
  const [imageName, setImageName] = useState("");
  const [diskFormat, setDiskFormat] = useState("qcow2");
  const [guestOs, setGuestOs] = useState("ubuntu");
  const [firmware, setFirmware] = useState("bios");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const reset = () => {
    setImageName("");
    setSourceUrl("");
    setFile(null);
    setUploadPct(null);
  };

  const handleClose = () => {
    if (urlImport.isPending || fileUpload.isPending) return;
    reset();
    onClose();
  };

  const urlImport = useMutation({
    mutationFn: async () => {
      return api.post("/migrations", {
        type: "import",
        source_url: sourceUrl,
        source_cloud: "url",
        target_region: "lagos-1", // TODO: pull from project
        image_name: imageName,
        guest_os: guestOs,
        firmware,
        source_format: diskFormat,
        project_id: projectIdentifier,
      } as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      ToastUtils.success("Import queued — provider will pull the image directly.");
      qc.invalidateQueries({ queryKey: ["images"] });
      qc.invalidateQueries({ queryKey: ["migration-jobs"] });
      handleClose();
    },
    onError: (err: { message?: string } | Error) => {
      ToastUtils.error((err as { message?: string }).message ?? "Import failed.");
    },
  });

  const fileUpload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Pick a file first");

      const fd = new FormData();
      fd.append("file", file);
      fd.append("image_name", imageName);
      fd.append("project_id", projectIdentifier);
      fd.append("disk_format", diskFormat);
      fd.append("guest_os", guestOs);
      fd.append("firmware", firmware);

      // Use XHR for upload progress — fetch doesn't expose it.
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/v1/business/migrations/upload");
        xhr.withCredentials = true;
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadPct(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText || "Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fd);
      });
    },
    onSuccess: () => {
      ToastUtils.success("Upload complete. We'll virus-scan + register the image.");
      qc.invalidateQueries({ queryKey: ["images"] });
      qc.invalidateQueries({ queryKey: ["migration-jobs"] });
      handleClose();
    },
    onError: (err: { message?: string } | Error) => {
      ToastUtils.error((err as { message?: string }).message ?? "Upload failed.");
      setUploadPct(null);
    },
  });

  const tabs: TabItem[] = [
    { id: "url", label: "Import from URL", icon: <LinkIcon className="h-3.5 w-3.5" /> },
    { id: "upload", label: "Upload file", icon: <FileUp className="h-3.5 w-3.5" /> },
  ];

  const submitDisabled =
    !imageName ||
    (tab === "url" && !sourceUrl) ||
    (tab === "upload" && !file) ||
    urlImport.isPending ||
    fileUpload.isPending;

  return (
    <ModernModal
      isOpen={open}
      onClose={handleClose}
      title="Import an image"
      size="md"
    >
      <div className="space-y-5">
        <InfoCallout tone="info" icon={<Cloud className="h-4 w-4" />} title="Two ways to bring an image">
          <strong>From URL</strong> is faster + cheaper if the image is already
          hosted somewhere accessible (your S3, public mirror, etc.). The
          provider pulls it directly. <strong>Upload file</strong> works when
          the image is only on your machine.
        </InfoCallout>

        <Tabs items={tabs} activeId={tab} onChange={setTab} />

        <ModernInput
          label="Image name"
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
          placeholder="e.g. my-app-server-v3"
          required
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ModernSelect
            label="Format"
            value={diskFormat}
            onChange={setDiskFormat}
            options={FORMAT_OPTIONS}
          />
          <ModernSelect
            label="Guest OS"
            value={guestOs}
            onChange={setGuestOs}
            options={GUEST_OS_OPTIONS}
          />
          <ModernSelect
            label="Firmware"
            value={firmware}
            onChange={setFirmware}
            options={FIRMWARE_OPTIONS}
          />
        </div>

        {tab === "url" ? (
          <ModernInput
            label="Image URL"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://my-bucket.s3.amazonaws.com/server.qcow2"
            type="url"
            required
          />
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              File
            </label>
            <div
              className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50/30 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600"
              onClick={() => fileInput.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                accept=".qcow2,.raw,.vmdk,.vhd,.vhdx,.iso,.img"
              />
              <div>
                <Upload className="mx-auto h-6 w-6 text-slate-400" />
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {file ? file.name : "Click to choose a file or drag it here"}
                </p>
                {file && (
                  <p className="mt-1 text-xs text-slate-500">
                    {(file.size / 1024 / 1024 / 1024).toFixed(2)} GB
                  </p>
                )}
              </div>
            </div>

            {uploadPct !== null && (
              <div className="space-y-1">
                <ProgressBar value={uploadPct} />
                <p className="text-xs text-slate-500">{uploadPct}% uploaded</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <ModernButton variant="ghost" onClick={handleClose}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            disabled={submitDisabled}
            loading={urlImport.isPending || fileUpload.isPending}
            onClick={() => {
              if (tab === "url") {
                urlImport.mutate();
              } else {
                fileUpload.mutate();
              }
            }}
          >
            {urlImport.isPending || fileUpload.isPending
              ? "Working…"
              : tab === "url"
                ? "Queue import"
                : "Upload"}
          </ModernButton>
        </div>
      </div>
    </ModernModal>
  );
}
