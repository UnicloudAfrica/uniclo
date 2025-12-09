/**
 * Object Storage Helper Utilities
 * Shared utility functions for object storage operations
 */

import type {
  Bucket,
  BucketStatus,
  StorageTier,
  BucketStats,
  StorageObject,
} from "../types/storage.types";

/**
 * Get bucket status variant
 */
export const getBucketStatusVariant = (status: BucketStatus) => {
  switch (status) {
    case "active":
      return {
        label: "Active",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "suspended":
      return {
        label: "Suspended",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    case "deleting":
      return {
        label: "Deleting",
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
      };
    case "deleted":
      return {
        label: "Deleted",
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "bg-gray-400",
      };
    default:
      return {
        label: "Unknown",
        bg: "bg-gray-50",
        text: "text-gray-500",
        dot: "bg-gray-300",
      };
  }
};

/**
 * Get storage tier variant
 */
export const getStorageTierVariant = (tier: StorageTier) => {
  switch (tier) {
    case "standard":
      return {
        label: "Standard",
        description: "Frequent access",
        icon: "⚡",
      };
    case "infrequent":
      return {
        label: "Infrequent Access",
        description: "Less frequent access",
        icon: "📦",
      };
    case "archive":
      return {
        label: "Archive",
        description: "Long-term storage",
        icon: "🗄️",
      };
    case "glacier":
      return {
        label: "Glacier",
        description: "Cold storage",
        icon: "❄️",
      };
    default:
      return {
        label: tier,
        description: "",
        icon: "📁",
      };
  }
};

/**
 * Format file size
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Calculate bucket statistics
 */
export const calculateBucketStats = (buckets: Bucket[]): BucketStats => {
  return buckets.reduce(
    (stats, bucket) => {
      stats.total++;

      if (bucket.status === "active") stats.active++;
      if (bucket.status === "suspended") stats.suspended++;

      stats.total_size_bytes += bucket.size_bytes || 0;
      stats.total_objects += bucket.object_count || 0;

      return stats;
    },
    { total: 0, active: 0, suspended: 0, total_size_bytes: 0, total_objects: 0 }
  );
};

/**
 * Validate bucket name
 */
export const isValidBucketName = (name: string): boolean => {
  // Bucket names must be between 3-63 characters
  if (name.length < 3 || name.length > 63) return false;

  // Must start and end with lowercase letter or number
  if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) return false;

  // Can only contain lowercase letters, numbers, hyphens, and dots
  if (!/^[a-z0-9.-]+$/.test(name)) return false;

  // Cannot contain consecutive dots
  if (/\.\./.test(name)) return false;

  // Cannot be formatted as IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) return false;

  return true;
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};

/**
 * Get file type icon
 */
export const getFileTypeIcon = (filename: string): string => {
  const ext = getFileExtension(filename);

  const iconMap: Record<string, string> = {
    // Images
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    svg: "🖼️",
    webp: "🖼️",
    // Documents
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    txt: "📃",
    md: "📃",
    // Spreadsheets
    xls: "📊",
    xlsx: "📊",
    csv: "📊",
    // Archives
    zip: "🗜️",
    rar: "🗜️",
    tar: "🗜️",
    gz: "🗜️",
    // Code
    js: "💻",
    ts: "💻",
    jsx: "💻",
    tsx: "💻",
    py: "🐍",
    java: "☕",
    // Media
    mp4: "🎥",
    avi: "🎥",
    mov: "🎥",
    mp3: "🎵",
    wav: "🎵",
  };

  return iconMap[ext] || "📁";
};

/**
 * Sort objects (folders first, then alphabetically)
 */
export const sortObjects = (objects: StorageObject[]): StorageObject[] => {
  return [...objects].sort((a, b) => {
    // Folders first
    if (a.is_folder && !b.is_folder) return -1;
    if (!a.is_folder && b.is_folder) return 1;

    // Then alphabetically
    return a.key.localeCompare(b.key);
  });
};

/**
 * Filter objects by search
 */
export const filterObjectsBySearch = (
  objects: StorageObject[],
  searchQuery: string
): StorageObject[] => {
  if (!searchQuery.trim()) return objects;

  const query = searchQuery.toLowerCase();
  return objects.filter((obj) => obj.key.toLowerCase().includes(query));
};

/**
 * Get folder path from key
 */
export const getFolderPath = (key: string): string => {
  const parts = key.split("/");
  parts.pop(); // Remove filename
  return parts.join("/");
};

/**
 * Get file name from key
 */
export const getFileName = (key: string): string => {
  const parts = key.split("/");
  return parts[parts.length - 1];
};

/**
 * Format estimated cost
 */
export const formatStorageCost = (
  sizeBytes: number,
  tier: StorageTier,
  currency: string = "USD"
): string => {
  // Rough estimates per GB/month
  const costPerGB: Record<StorageTier, number> = {
    standard: 0.023,
    infrequent: 0.0125,
    archive: 0.004,
    glacier: 0.001,
  };

  const sizeGB = sizeBytes / (1024 * 1024 * 1024);
  const cost = sizeGB * costPerGB[tier];

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cost);
};
