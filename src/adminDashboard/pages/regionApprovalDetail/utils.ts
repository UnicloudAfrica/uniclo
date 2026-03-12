import type { ApprovalStatus } from "./types";

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};

export const statusToneMap: Record<ApprovalStatus, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "neutral",
};

export const statusLabelMap: Record<ApprovalStatus, string> = {
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const formatSegment = (value: string | null | undefined) =>
  value
    ? value.replaceAll(/[_-]/g, " ").replace(/\b\w/g, (char: string) => char.toUpperCase())
    : "\u2014";

export const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
