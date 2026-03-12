/**
 * Step definitions for the object storage creation wizard.
 */

export const BASE_STEPS_FAST_TRACK = [
  {
    id: "workflow",
    label: "Workflow & assignment",
    description: "Choose billing path and who owns this request.",
  },
  {
    id: "services",
    label: "Service profiles",
    description: "Select regions, tiers, and contract length.",
  },
  {
    id: "review",
    label: "Review & provision",
    description: "Validate totals and confirm provisioning.",
  },
  {
    id: "success",
    label: "Success",
    description: "Provisioning has started.",
  },
];

export const BASE_STEPS_STANDARD = [
  {
    id: "workflow",
    label: "Workflow & assignment",
    description: "Choose billing path and who owns this request.",
  },
  {
    id: "services",
    label: "Service profiles",
    description: "Select regions, tiers, and contract length.",
  },
  {
    id: "payment",
    label: "Payment",
    description: "Generate payment options and share with finance.",
  },
  {
    id: "review",
    label: "Review & provision",
    description: "Validate totals and confirm provisioning.",
  },
  {
    id: "success",
    label: "Success",
    description: "Provisioning has started.",
  },
];
