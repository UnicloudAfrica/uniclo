import type { StatusTone } from "@/shared/components/orbit";

/** Map a mail-migration status string to a friendly badge tone + label. */
export function mailStatusTone(status: string | undefined): {
  tone: StatusTone;
  label: string;
} {
  switch (status) {
    case "completed":
      return { tone: "success", label: "All done" };
    case "running":
    case "in_progress":
      return { tone: "running", label: "Moving" };
    case "pending":
    case "queued":
      return { tone: "pending", label: "Getting ready" };
    case "cancelled":
    case "canceled":
      return { tone: "neutral", label: "Cancelled" };
    case "failed":
    case "error":
      return { tone: "danger", label: "Something went wrong" };
    default:
      return { tone: "neutral", label: status ?? "Unknown" };
  }
}

export const isMailMigrationRunning = (status: string | undefined): boolean =>
  status === "running" || status === "in_progress" || status === "pending" || status === "queued";
