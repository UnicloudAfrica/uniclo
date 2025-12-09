export const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

export const STATUS_TONES: Record<
  string,
  "info" | "neutral" | "warning" | "success" | "danger" | "primary" | "secondary"
> = {
  not_started: "info",
  draft: "neutral",
  submitted: "info",
  in_review: "info",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",
};

export const STATUS_OPTIONS = [
  { value: "in_review", label: "Keep in review" },
  { value: "changes_requested", label: "Request changes" },
  { value: "approved", label: "Approve submission" },
  { value: "rejected", label: "Reject submission" },
];
