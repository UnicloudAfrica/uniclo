// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  Upload,
  Download,
  Trash2,
  ChevronRight,
  Home,
  RefreshCw,
  Loader2,
  FolderPlus,
  ArrowLeft,
  Eye,
  X,
} from "lucide-react";
import objectStorageApi from "../../../services/objectStorageApi";
import ToastUtils from "../../../utils/toastUtil";

interface ObjectStorageBrowserProps {
  accountId: string;
  bucketName: string;
  onBack?: () => void;
}

interface FileItem {
  type: "file" | "folder";
  key: string;
  name: string;
  size?: number;
  last_modified?: string;
}

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "ico"].includes(ext)) return FileImage;
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return FileVideo;
  if (["mp3", "wav", "ogg", "aac", "flac"].includes(ext)) return FileAudio;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["js", "ts", "jsx", "tsx", "py", "php", "java", "css", "html", "json", "xml"].includes(ext))
    return FileCode;
  if (["txt", "md", "doc", "docx", "pdf", "csv"].includes(ext)) return FileText;
  return File;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const ObjectStorageBrowser: React.FC<ObjectStorageBrowserProps> = ({
  accountId,
  bucketName,
  onBack,
}) => {
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchObjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await objectStorageApi.listObjects(accountId, bucketName, currentPrefix);
      setFolders(data?.folders || []);
      setFiles(data?.files || []);
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to load objects");
    } finally {
      setLoading(false);
    }
  }, [accountId, bucketName, currentPrefix]);

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  // Breadcrumb parts
  const breadcrumbs = currentPrefix
    ? currentPrefix
        .split("/")
        .filter(Boolean)
        .map((part, idx, arr) => ({
          name: part,
          prefix: arr.slice(0, idx + 1).join("/") + "/",
        }))
    : [];

  const navigateToFolder = (prefix: string) => {
    setCurrentPrefix(prefix);
  };

  const navigateUp = () => {
    if (!currentPrefix) return;
    const parts = currentPrefix.split("/").filter(Boolean);
    parts.pop();
    setCurrentPrefix(parts.length ? parts.join("/") + "/" : "");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const objectKey = currentPrefix + file.name;

        // Upload through backend (bypasses CORS)
        await objectStorageApi.uploadFile(accountId, bucketName, objectKey, file);

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      ToastUtils.success(`Uploaded ${selectedFiles.length} file(s)`);
      fetchObjects();
    } catch (err: any) {
      ToastUtils.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (item: FileItem) => {
    try {
      const url = await objectStorageApi.getObjectUrl(accountId, bucketName, item.key);
      window.open(url, "_blank");
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to get download URL");
    }
  };

  const handlePreview = async (item: FileItem) => {
    try {
      const url = await objectStorageApi.getObjectUrl(accountId, bucketName, item.key);
      setPreviewUrl(url);
      setPreviewName(item.name);
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to preview file");
    }
  };

  const handleDelete = async (item: FileItem) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    try {
      setDeletingKey(item.key);
      await objectStorageApi.deleteObject(accountId, bucketName, item.key);
      ToastUtils.success("File deleted");
      fetchObjects();
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to delete");
    } finally {
      setDeletingKey(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const folderKey = currentPrefix + newFolderName.trim() + "/.keep";

    try {
      // Create an empty file blob for the .keep marker
      const emptyBlob = new Blob([""], { type: "text/plain" });
      const keepFile = new File([emptyBlob], ".keep", { type: "text/plain" });

      // Upload through backend (bypasses CORS)
      await objectStorageApi.uploadFile(accountId, bucketName, folderKey, keepFile);

      ToastUtils.success("Folder created");
      setShowNewFolder(false);
      setNewFolderName("");
      fetchObjects();
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to create folder");
    }
  };

  const isPreviewable = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "gif", "svg", "webp", "pdf", "txt", "json", "md", "csv"].includes(
      ext
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h3 className="font-semibold text-gray-900">{bucketName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <button
            onClick={fetchObjects}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="border-b border-gray-200 bg-blue-50 px-4 py-2">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Uploading... {uploadProgress}%</span>
          </div>
          <div className="mt-1 h-1 w-full rounded-full bg-blue-200">
            <div
              className="h-1 rounded-full bg-blue-600 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 border-b border-gray-100 bg-white px-4 py-2 text-sm overflow-x-auto">
        <button
          onClick={() => setCurrentPrefix("")}
          className="flex items-center gap-1 rounded px-2 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <Home className="h-4 w-4" />
        </button>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.prefix}>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => navigateToFolder(crumb.prefix)}
              className={`rounded px-2 py-1 hover:bg-gray-100 ${
                idx === breadcrumbs.length - 1
                  ? "font-medium text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* New Folder Form */}
      {showNewFolder && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName("");
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div className="py-16 text-center">
          <Folder className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-600">This folder is empty</p>
          <p className="text-sm text-gray-400">Upload files or create a new folder</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {/* Folders */}
          {folders.map((folder) => (
            <div
              key={folder.key}
              onClick={() => navigateToFolder(folder.key)}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50"
            >
              <Folder className="h-5 w-5 text-amber-500" />
              <span className="flex-1 font-medium text-gray-900">{folder.name}</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          ))}

          {/* Files */}
          {files.map((file) => {
            const FileIcon = getFileIcon(file.name);
            return (
              <div key={file.key} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <FileIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatSize(file.size || 0)}
                    {file.last_modified &&
                      ` • ${new Date(file.last_modified).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {isPreviewable(file.name) && (
                    <button
                      onClick={() => handlePreview(file)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(file)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    disabled={deletingKey === file.key}
                    className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingKey === file.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-h-[90vh] max-w-4xl w-full rounded-2xl bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="font-semibold text-gray-900">{previewName}</h3>
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewName("");
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto p-4">
              {previewName.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? (
                <img src={previewUrl} alt={previewName} className="mx-auto max-w-full" />
              ) : previewName.match(/\.pdf$/i) ? (
                <iframe src={previewUrl} className="h-[70vh] w-full" title={previewName} />
              ) : (
                <iframe
                  src={previewUrl}
                  className="h-[70vh] w-full bg-gray-50"
                  title={previewName}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectStorageBrowser;
