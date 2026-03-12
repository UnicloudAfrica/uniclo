import config from "../../../../config";
import type { ApiContext, SavedCard } from "./types";

export const normalizeReference = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const isNumericReference = (value: string | null) => {
  if (!value) return false;
  return /^\d+$/.test(value);
};

// Detect API context from URL
export const detectApiContext = (): ApiContext => {
  if (typeof window === "undefined") return "client";
  const path = globalThis.window.location.pathname;
  if (path.startsWith("/admin-dashboard") || path.startsWith("/admin")) return "admin";
  if (path.startsWith("/dashboard")) return "tenant";
  return "client";
};

// Get API base URL for context
export const getApiBaseUrlForContext = (context: ApiContext): string => {
  switch (context) {
    case "admin":
      return config.adminURL;
    case "tenant":
      return config.tenantURL;
    case "client":
    default:
      return config.baseURL;
  }
};

export const getApiPrefixForContext = (context: ApiContext): string => {
  if (context === "tenant") return "/admin";
  if (context === "client") return "/business";
  return "";
};

export const resolveCardIdentifier = (card?: SavedCard | null, fallback = "") => {
  if (!card) return fallback;
  if (card.identifier) return card.identifier;
  if (card.id !== undefined && card.id !== null) return String(card.id);
  return fallback;
};
