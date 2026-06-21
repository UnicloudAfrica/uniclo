import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Boxes,
  Plus,
  KeyRound,
  HardDriveDownload,
  BookOpen,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import objectStorageApi from "@/services/objectStorageApi";
import DropzoneUploader from "./DropzoneUploader";
import ToastUtils from "@/utils/toastUtil";

interface FileItem {
  type: "file" | "folder";
  key: string;
  name: string;
  size?: number;
  last_modified?: string;
}

interface Bucket extends Record<string, unknown> {
  id?: string | number;
  name?: string;
}

interface ObjectStorageFileBrowserProps {
  accountId: string;
  bucketName: string | null;
  buckets: Bucket[];
  onSelectBucket?: (name: string) => void;
  /** First-run focal CTA — create a silo inline from the welcome state. */
  onCreateBucket?: (name: string) => Promise<void>;
  /** "Connect via S3" card — surface the credentials panel. */
  onShowCredentials?: () => void;
  /** "Add more storage" card — open the extend-quota flow. */
  onAddStorage?: () => void;
  /** Optional docs link; the docs card only renders when this is set. */
  docsUrl?: string;
  /**
   * Whether the account finished provisioning (i.e. has S3 access keys — the
   * same gate the backend enforces before allowing bucket creation). When
   * explicitly false, the welcome state shows a provisioning notice instead of
   * the create form, and polls onRefresh until it flips true.
   */
  accountReady?: boolean;
  /** Re-fetch account + silos — used by the provisioning notice + auto-poll. */
  onRefresh?: () => void;
  /** True when provisioning permanently failed (status === 'provision_failed'). */
  provisioningFailed?: boolean;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
};

/**
 * A themed shortcut card for the welcome state. Renders as a <button> when given
 * onClick, or an external <a> when given href. Every surface uses theme tokens so
 * the card restains per tenant brand.
 */
const WelcomeActionCard: React.FC<{
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick?: () => void;
  href?: string;
}> = ({ icon: Icon, title, subtitle, onClick, href }) => {
  const cardClass =
    "group flex items-start gap-3 rounded-xl border p-4 text-left transition motion-safe:hover:-translate-y-0.5 hover:shadow-[var(--shadow-brand)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--theme-color-300))]";
  const cardStyle: React.CSSProperties = {
    borderColor: "var(--theme-border-color)",
    background: "var(--theme-card-bg)",
  };
  const inner = (
    <>
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition motion-safe:group-hover:scale-105"
        style={{ background: "var(--theme-color-10)" }}
      >
        <Icon className="h-5 w-5" style={{ color: "var(--theme-color)" }} />
      </span>
      <span>
        <p className="text-sm font-semibold" style={{ color: "var(--theme-heading-color)" }}>
          {title}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--theme-muted-color)" }}>
          {subtitle}
        </p>
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cardClass} style={cardStyle}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cardClass} style={cardStyle}>
      {inner}
    </button>
  );
};

const ObjectStorageFileBrowser: React.FC<ObjectStorageFileBrowserProps> = ({
  accountId,
  bucketName,
  buckets = [],
  onSelectBucket,
  onCreateBucket,
  onShowCredentials,
  onAddStorage,
  docsUrl,
  accountReady,
  onRefresh,
  provisioningFailed,
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
  const [welcomeName, setWelcomeName] = useState("");
  const [creatingSilo, setCreatingSilo] = useState(false);

  const fetchObjects = useCallback(async () => {
    if (!bucketName) return;

    try {
      setLoading(true);
      const data = (await objectStorageApi.listObjects(
        accountId,
        bucketName,
        currentPrefix
      )) as Record<string, unknown>;
      setFolders((data.folders as FileItem[]) || []);
      // Filter out .keep files - they're just folder placeholders
      const visibleFiles = ((data.files as FileItem[]) || []).filter(
        (f: FileItem) => !f.name.endsWith(".keep") && f.name !== ".keep"
      );
      setFiles(visibleFiles);
    } catch (err) {
      ToastUtils.error(getErrorMessage(err, "Failed to load objects"));
    } finally {
      setLoading(false);
    }
  }, [accountId, bucketName, currentPrefix]);

  useEffect(() => {
    if (bucketName) {
      setCurrentPrefix("");
      fetchObjects();
    }
  }, [bucketName, fetchObjects]);

  useEffect(() => {
    if (bucketName) {
      fetchObjects();
    }
  }, [currentPrefix, fetchObjects, bucketName]);

  // Keep onRefresh in a ref so the provisioning poll interval stays stable
  // across re-renders (parents redefine the handler each render).
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    // While the account is still provisioning (no S3 keys yet) and we're on the
    // welcome screen, poll so the create form unlocks automatically once ready.
    // Don't poll a permanently-failed account — that state won't change itself.
    if (bucketName || accountReady !== false || provisioningFailed) return;
    const id = setInterval(() => onRefreshRef.current?.(), 6000);
    return () => clearInterval(id);
  }, [bucketName, accountReady, provisioningFailed]);

  const navigateToFolder = (prefix: string) => {
    if (prefix.includes('..')) return;
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
      globalThis.window.open(String(url), "_blank");
    } catch (err) {
      ToastUtils.error(getErrorMessage(err, "Failed to get download URL"));
    }
  };

  const handlePreview = async (item: FileItem) => {
    try {
      const url = await objectStorageApi.getObjectUrl(accountId, bucketName!, item.key);
      setPreviewUrl(String(url));
      setPreviewName(item.name);
    } catch (err) {
      ToastUtils.error(getErrorMessage(err, "Failed to load preview"));
    }
  };

  const handleDelete = async (item: FileItem) => {
    if (!globalThis.window.confirm(`Delete "${item.name}"?`)) return;

    try {
      setDeletingKey(item.key);
      await objectStorageApi.deleteObject(accountId, bucketName!, item.key);
      ToastUtils.success("Deleted successfully");
      fetchObjects();
    } catch (err) {
      ToastUtils.error(getErrorMessage(err, "Failed to delete"));
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
    } catch (err) {
      ToastUtils.error(getErrorMessage(err, "Failed to create folder"));
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleWelcomeCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = welcomeName.trim();
    // Re-entrancy guard: React batching can collapse rapid double-clicks before
    // the disabled button prop updates (see web/CLAUDE.md).
    if (!name || creatingSilo || !onCreateBucket) return;
    try {
      setCreatingSilo(true);
      await onCreateBucket(name); // parent toasts + refetches buckets
      setWelcomeName("");
      onSelectBucket?.(name); // land straight in the new silo — the payoff
    } catch {
      // Parent already surfaced the error toast; keep the typed name for retry.
    } finally {
      setCreatingSilo(false);
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

  // Welcome state when no silo is selected — a focal "create your first silo"
  // flow plus only-when-real shortcut cards. Everything restains per tenant.
  if (!bucketName) {
    const hasSilos = buckets.length > 0;
    const failed = provisioningFailed === true;
    const provisioning = accountReady === false && !failed;
    return (
      <div className="h-full overflow-y-auto" style={{ background: "var(--theme-card-bg)" }}>
        <div className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
          {/* Hero */}
          <div className="text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: failed ? "rgb(var(--theme-danger-500) / 0.12)" : "var(--theme-color-10)",
                boxShadow: "var(--shadow-brand)",
              }}
            >
              {failed ? (
                <AlertTriangle className="h-8 w-8" style={{ color: "rgb(var(--theme-danger-500))" }} />
              ) : provisioning ? (
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--theme-color)" }} />
              ) : (
                <Boxes className="h-8 w-8" style={{ color: "var(--theme-color)" }} />
              )}
            </div>
            <p className="t-eyebrow" style={{ color: "rgb(var(--theme-color-600))" }}>
              Object Storage
            </p>
            <h1
              className="mt-2 text-2xl font-bold md:text-3xl"
              style={{ color: "var(--theme-heading-color)" }}
            >
              {failed
                ? "Provisioning failed"
                : provisioning
                  ? "Setting up your storage"
                  : hasSilos
                    ? "Pick a Silo to get started"
                    : "Create your first Silo"}
            </h1>
            <p
              className="mx-auto mt-2 max-w-md text-sm"
              style={{ color: "var(--theme-muted-color)" }}
            >
              {failed
                ? "This storage account couldn't be provisioned. Delete it and create a new one, or contact support if it keeps happening."
                : provisioning
                  ? "We're provisioning your storage account. You'll be able to create Silos the moment it's ready."
                  : "A Silo is a private, S3-compatible bucket for your files. Name one below and you'll be uploading in seconds."}
            </p>
          </div>

          {failed ? (
            /* Permanently failed — recovery guidance, no polling */
            <div
              className="mt-7 rounded-2xl border p-6 text-center"
              style={{
                background: "var(--theme-card-bg)",
                borderColor: "var(--theme-border-color)",
                boxShadow: "var(--shadow-brand)",
              }}
            >
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: "rgb(var(--theme-danger-500) / 0.12)",
                    color: "rgb(var(--theme-danger-500))",
                  }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Provisioning failed
                </span>
                <p className="text-sm" style={{ color: "var(--theme-muted-color)" }}>
                  We couldn&rsquo;t finish setting up this account. Use{" "}
                  <span className="font-semibold" style={{ color: "var(--theme-heading-color)" }}>
                    Delete
                  </span>{" "}
                  above to remove it, then create a new one.
                </p>
                <button
                  type="button"
                  onClick={() => onRefresh?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-[rgb(var(--theme-color-50))]"
                  style={{
                    borderColor: "rgb(var(--theme-color-200))",
                    color: "rgb(var(--theme-color-600))",
                  }}
                >
                  <RefreshCw className="h-4 w-4" /> Refresh status
                </button>
              </div>
            </div>
          ) : provisioning ? (
            /* Provisioning notice — auto-refreshes until S3 keys exist */
            <div
              className="mt-7 rounded-2xl border p-6 text-center"
              style={{
                background: "var(--theme-card-bg)",
                borderColor: "var(--theme-border-color)",
                boxShadow: "var(--shadow-brand)",
              }}
            >
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: "var(--theme-color-10)", color: "rgb(var(--theme-color-700))" }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Provisioning in progress
                </span>
                <p className="text-sm" style={{ color: "var(--theme-muted-color)" }}>
                  This usually takes a moment. Your S3 credentials and the option to create Silos
                  unlock automatically once provisioning finishes.
                </p>
                <button
                  type="button"
                  onClick={() => onRefresh?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-[rgb(var(--theme-color-50))]"
                  style={{ borderColor: "rgb(var(--theme-color-200))", color: "rgb(var(--theme-color-600))" }}
                >
                  <RefreshCw className="h-4 w-4" /> Refresh status
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* Focal CTA — inline create form */}
          <form
            onSubmit={handleWelcomeCreate}
            className="mt-7 rounded-2xl border p-5 md:p-6"
            style={{
              background: "var(--theme-card-bg)",
              borderColor: "var(--theme-border-color)",
              boxShadow: "var(--shadow-brand)",
            }}
          >
            <label
              htmlFor="welcome-silo-name"
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--theme-heading-color)" }}
            >
              Silo name
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Database
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "rgb(var(--theme-color-400))" }}
                />
                <input
                  id="welcome-silo-name"
                  type="text"
                  value={welcomeName}
                  onChange={(e) =>
                    setWelcomeName(e.target.value.toLowerCase().replaceAll(/[^a-z0-9-]/g, ""))
                  }
                  placeholder="my-first-silo"
                  aria-label="Silo name"
                  autoFocus
                  disabled={creatingSilo}
                  className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm font-mono outline-none transition focus:ring-2 focus:ring-[rgb(var(--theme-color-200))] focus:border-[rgb(var(--theme-color-400))]"
                  style={{ borderColor: "var(--theme-border-color)", color: "var(--theme-text-color)" }}
                />
              </div>
              <button
                type="submit"
                disabled={creatingSilo || !welcomeName.trim() || !onCreateBucket}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition motion-safe:active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--theme-color)" }}
              >
                {creatingSilo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating&hellip;
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Create Silo
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--theme-muted-color)" }}>
              Lowercase letters, numbers and hyphens only. You can add more Silos anytime.
            </p>
          </form>

          {/* How it works */}
          <ol className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { n: 1, t: "Name your Silo", d: "Pick a unique, URL-safe name." },
              { n: 2, t: "Upload files", d: "Drag & drop or use the S3 API." },
              { n: 3, t: "Share & manage", d: "Organize in folders, control access." },
            ].map((s) => (
              <li
                key={s.n}
                className="rounded-xl border p-3.5"
                style={{ borderColor: "var(--theme-border-color)", background: "var(--theme-card-bg)" }}
              >
                <div
                  className="mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: "var(--theme-color-10)", color: "rgb(var(--theme-color-700))" }}
                >
                  {s.n}
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--theme-heading-color)" }}>
                  {s.t}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--theme-muted-color)" }}>
                  {s.d}
                </p>
              </li>
            ))}
          </ol>

          {/* Real shortcut cards — each renders only when its action is wired */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {hasSilos && (
              <WelcomeActionCard
                icon={FolderPlus}
                title="Open an existing Silo"
                subtitle={`${buckets.length} ${buckets.length === 1 ? "silo" : "silos"} available`}
                onClick={() => {
                  const n = buckets[0]?.name;
                  if (typeof n === "string" && n) onSelectBucket?.(n);
                }}
              />
            )}
            {onShowCredentials && (
              <WelcomeActionCard
                icon={KeyRound}
                title="View S3 credentials"
                subtitle="Endpoint, access key & secret"
                onClick={onShowCredentials}
              />
            )}
            {onAddStorage && (
              <WelcomeActionCard
                icon={HardDriveDownload}
                title="Add more storage"
                subtitle="Extend your quota"
                onClick={onAddStorage}
              />
            )}
            {docsUrl && (
              <WelcomeActionCard
                icon={BookOpen}
                title="Read the S3 docs"
                subtitle="Connect any S3 SDK or tool"
                href={docsUrl}
              />
            )}
          </div>
            </>
          )}
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
