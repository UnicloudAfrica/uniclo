import type { Lead } from "@/types/lead";
import type { UnknownRecord } from "./leads-dashboard.types";

export const formatCreatedAt = (dateString: string | undefined): string => {
  if (!dateString) return "\u2014";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const encodeId = (id: string | number): string => {
  return encodeURIComponent(btoa(String(id)));
};

export const getLeadIdentifier = (lead: Lead): string | number | undefined =>
  lead?.identifier || lead?.id;

export const normalizeId = (id: string | number | undefined | null): string =>
  id !== undefined && id !== null ? String(id) : "";

export const formatStatusForDisplay = (status: string): string => {
  return status.replace(/_/g, " ");
};

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});

export const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const coerceNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const normalizeLeadsByStatus = (value: unknown): Record<string, number> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, count]) => [key, coerceNumber(count) ?? 0])
  );
};

export const extractLeadStats = (payload: unknown) => {
  const record = asRecord(payload);
  const data = asRecord(record.data);
  const message = asRecord(record.message);
  return {
    leads: coerceNumber(message.leads ?? data.leads ?? record.leads),
    leads_by_status: normalizeLeadsByStatus(
      message.leads_by_status ?? data.leads_by_status ?? record.leads_by_status
    ),
  };
};

export const isLead = (value: unknown): value is Lead => {
  if (!isRecord(value)) return false;
  const id = value.id;
  return (
    (typeof id === "string" || typeof id === "number") &&
    typeof value.first_name === "string" &&
    typeof value.last_name === "string" &&
    typeof value.email === "string" &&
    typeof value.status === "string"
  );
};

export const extractLeads = (payload: unknown): Lead[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isLead);
  }
  const record = asRecord(payload);
  if (Array.isArray(record.data)) {
    return record.data.filter(isLead);
  }
  return [];
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim() !== "") return error;
  if (isRecord(error) && typeof error.message === "string" && error.message.trim() !== "") {
    return error.message;
  }
  return fallback;
};

export const getStatusColorClass = (status: string): string => {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "contacted":
      return "bg-yellow-100 text-yellow-800";
    case "qualified":
      return "bg-green-100 text-green-800";
    case "proposal_sent":
      return "bg-indigo-100 text-indigo-800";
    case "negotiating":
      return "bg-purple-100 text-purple-800";
    case "closed_won":
      return "bg-emerald-100 text-emerald-800";
    case "closed_lost":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
