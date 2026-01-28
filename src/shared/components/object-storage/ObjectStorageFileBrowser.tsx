// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  Folder,
  File as FileIcon,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  Download,
  Trash2,
  ChevronRight,
  Home,
  RefreshCw,
  Loader2,
  FolderPlus,
  Eye,
  X,
  Grid3X3,
  List,
  Database,
  Rocket,
  BookOpen,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";
import objectStorageApi from "../../../services/objectStorageApi";
import DropzoneUploader from "./DropzoneUploader";
import ToastUtils from "../../../utils/toastUtil";

interface FileItem {
  type: "file" | "folder";
  key: string;
  name: string;
  size?: number;
  last_modified?: string;
}

interface ObjectStorageFileBrowserProps {
  accountId: string;
  bucketName: string | null;
  buckets: any[];
  onSelectBucket?: (name: string) => void;
}

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "svg", "webp", "ico"];
  const videoExts = ["mp4", "avi", "mov", "webm", "mkv"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac"];
  const archiveExts = ["zip", "rar", "7z", "tar", "gz"];
  const codeExts = ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "html", "css", "json"];
  const docExts = ["pdf", "doc", "docx", "txt", "md", "xls", "xlsx"];

  if (imageExts.includes(ext)) return FileImage;
  if (videoExts.includes(ext)) return FileVideo;
  if (audioExts.includes(ext)) return FileAudio;
  if (archiveExts.includes(ext)) return FileArchive;
  if (codeExts.includes(ext)) return FileCode;
  if (docExts.includes(ext)) return FileText;
  return FileIcon;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const ObjectStorageFileBrowser: React.FC<ObjectStorageFileBrowserProps> = ({
  accountId,
  bucketName,
  buckets = [],
  onSelectBucket,
}) => {
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const fetchObjects = useCallback(async () => {
    if (!bucketName) return;

    try {
      setLoading(true);
      const data = await objectStorageApi.listObjects(accountId, bucketName, currentPrefix);
      setFolders(data.folders || []);
      // Filter out .keep files - they're just folder placeholders
      const visibleFiles = (data.files || []).filter(
        (f: FileItem) => !f.name.endsWith(".keep") && f.name !== ".keep"
      );
      setFiles(visibleFiles);
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to load objects");
    } finally {
      setLoading(false);
    }
  }, [accountId, bucketName, currentPrefix]);

  useEffect(() => {
    if (bucketName) {
      setCurrentPrefix("");
      fetchObjects();
    }
  }, [bucketName]);

  useEffect(() => {
    if (bucketName) {
      fetchObjects();
    }
  }, [currentPrefix, fetchObjects]);

  const navigateToFolder = (prefix: string) => {
    setCurrentPrefix(prefix);
  };

  const navigateUp = () => {
    const parts = currentPrefix.split("/").filter(Boolean);
    parts.pop();
    setCurrentPrefix(parts.length > 0 ? parts.join("/") + "/" : "");
  };

  const handleDownload = async (item: FileItem) => {
    try {
      const url = await objectStorageApi.getObjectUrl(accountId, bucketName!, item.key);
      window.open(url, "_blank");
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to get download URL");
    }
  };

  const handlePreview = async (item: FileItem) => {
    try {
      const url = await objectStorageApi.getObjectUrl(accountId, bucketName!, item.key);
      setPreviewUrl(url);
      setPreviewName(item.name);
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to load preview");
    }
  };

  const handleDelete = async (item: FileItem) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    try {
      setDeletingKey(item.key);
      await objectStorageApi.deleteObject(accountId, bucketName!, item.key);
      ToastUtils.success("Deleted successfully");
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
    setCreatingFolder(true);

    try {
      const emptyBlob = new Blob([""], { type: "text/plain" });
      const keepFile = new File([emptyBlob], ".keep", { type: "text/plain" });

      await objectStorageApi.uploadFile(accountId, bucketName!, folderKey, keepFile);

      ToastUtils.success("Folder created");
      setShowNewFolder(false);
      setNewFolderName("");
      fetchObjects();
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const isPreviewable = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "gif", "svg", "webp", "pdf"].includes(ext);
  };

  // Build breadcrumb segments
  const breadcrumbs = currentPrefix
    .split("/")
    .filter(Boolean)
    .map((segment, index, arr) => ({
      name: segment,
      prefix: arr.slice(0, index + 1).join("/") + "/",
    }));

  // Welcome state when no silo is selected
  if (!bucketName) {
    return (
      <div className="h-full flex flex-col">
        {/* Welcome Header */}
        <div className="brand-hero p-8 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome to Silo Storage</h1>
          <p className="text-white/70">
            Select a Silo from the sidebar to browse files, or create a new Silo to get started.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buckets.slice(0, 3).map((bucket) => (
              <button
                key={bucket.id}
                onClick={() => onSelectBucket?.(bucket.name)}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[rgb(var(--theme-color-300))] hover:bg-[rgb(var(--theme-color-50))] transition-all text-left group"
              >
                <div className="rounded-lg bg-[rgb(var(--theme-color-100))] p-3 group-hover:bg-[rgb(var(--theme-color-200))] transition-colors">
                  <Database className="h-6 w-6 text-[var(--theme-color)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{bucket.name}</p>
                  <p className="text-sm text-gray-500">Click to browse</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="p-6 pt-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Rocket className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Upload Files</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Drag and drop files directly into any Silo, or use the upload button.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <FolderPlus className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium text-emerald-900">Organize with Folders</h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    Create folders to organize your files and keep everything tidy.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-100 p-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-amber-900">S3-Compatible API</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Use your credentials to connect via any S3-compatible tool or SDK.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-violet-100 p-2">
                  <Shield className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-medium text-violet-900">Secure by Default</h3>
                  <p className="text-sm text-violet-700 mt-1">
                    All data is encrypted at rest and in transit for maximum security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with breadcrumbs and actions */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Breadcrumbs */}
          <button
            onClick={() => setCurrentPrefix("")}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <Home className="h-4 w-4" />
            {bucketName}
          </button>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <button
                onClick={() => navigateToFolder(crumb.prefix)}
                className="px-2 py-1 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 truncate max-w-[150px]"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-primary-100 text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" ? "bg-primary-100 text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </button>
          <button
            onClick={fetchObjects}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {creatingFolder ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dropzone Upload Area */}
      <div className="p-4 border-b border-gray-200">
        <DropzoneUploader
          accountId={accountId}
          bucketName={bucketName}
          currentPrefix={currentPrefix}
          onUploadComplete={fetchObjects}
          compact
        />
      </div>

      {/* File Browser Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="text-center py-16">
            <Folder className="mx-auto h-16 w-16 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-600">This folder is empty</p>
            <p className="text-sm text-gray-400 mt-1">
              Drop files here or click upload to add files
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Back button if in subfolder */}
            {currentPrefix && (
              <button
                onClick={navigateUp}
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
              >
                <Folder className="h-10 w-10 text-gray-400" />
                <span className="mt-2 text-sm font-medium text-gray-600">..</span>
              </button>
            )}

            {/* Folders */}
            {folders.map((folder) => (
              <button
                key={folder.key}
                onClick={() => navigateToFolder(folder.key)}
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <Folder className="h-10 w-10 text-amber-500" />
                <span className="mt-2 text-sm font-medium text-gray-700 truncate w-full text-center">
                  {folder.name}
                </span>
              </button>
            ))}

            {/* Files */}
            {files.map((file) => {
              const FileIcon = getFileIcon(file.name);
              return (
                <div
                  key={file.key}
                  className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all group relative"
                >
                  <FileIcon className="h-10 w-10 text-gray-400" />
                  <span className="mt-2 text-sm font-medium text-gray-700 truncate w-full text-center">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-400">{formatSize(file.size || 0)}</span>

                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    {isPreviewable(file.name) && (
                      <button
                        onClick={() => handlePreview(file)}
                        className="p-1 bg-white rounded shadow text-gray-500 hover:text-primary-600"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1 bg-white rounded shadow text-gray-500 hover:text-primary-600"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={deletingKey === file.key}
                      className="p-1 bg-white rounded shadow text-gray-500 hover:text-red-600"
                    >
                      {deletingKey === file.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Modified
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentPrefix && (
                  <tr onClick={navigateUp} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Folder className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-700">..</span>
                      </div>
                    </td>
                    <td colSpan={3} className="px-4 py-3 text-sm text-gray-500">
                      Go up one level
                    </td>
                  </tr>
                )}
                {folders.map((folder) => (
                  <tr
                    key={folder.key}
                    onClick={() => navigateToFolder(folder.key)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Folder className="h-5 w-5 text-amber-500" />
                        <span className="font-medium text-gray-900">{folder.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">—</td>
                    <td className="px-4 py-3 text-sm text-gray-500">—</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))}
                {files.map((file) => {
                  const FileIcon = getFileIcon(file.name);
                  return (
                    <tr key={file.key} className="hover:bg-gray-50 group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-5 w-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatSize(file.size || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {file.last_modified
                          ? new Date(file.last_modified).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isPreviewable(file.name) && (
                            <button
                              onClick={() => handlePreview(file)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(file)}
                            disabled={deletingKey === file.key}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            {deletingKey === file.key ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="font-medium text-gray-900">{previewName}</span>
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewName("");
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 max-h-[calc(90vh-60px)] overflow-auto">
              {previewName.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? (
                <img src={previewUrl} alt={previewName} className="max-w-full h-auto" />
              ) : previewName.match(/\.pdf$/i) ? (
                <iframe src={previewUrl} className="w-full h-[70vh]" title={previewName} />
              ) : (
                <p className="text-gray-500">Preview not available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectStorageFileBrowser;
