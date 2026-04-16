export type ProvisioningMode = "standard" | "fast-track";

export interface ProvisioningStep {
  id: string;
  title: string;
  desc: string;
}

export const buildProvisioningSteps = (mode: ProvisioningMode): ProvisioningStep[] => {
  if (mode === "fast-track") {
    return [
      {
        id: "workflow",
        title: "Workflow & Assignment",
        desc: "Choose fast-track mode and assign user or tenant.",
      },
      {
        id: "services",
        title: "Cube-Instance setup",
        desc: "Select region, size, image, storage, and networking.",
      },
      {
        id: "protection",
        title: "Protection Plan",
        desc: "Choose backup, DR, or replication for your instances.",
      },
      {
        id: "review",
        title: "Review & provision",
        desc: "Confirm details and provision cube-instances.",
      },
      { id: "success", title: "Success", desc: "Provisioning started." },
    ];
  }

  return [
    {
      id: "workflow",
      title: "Workflow & Assignment",
      desc: "Choose standard mode and assign user or tenant.",
    },
    {
      id: "services",
      title: "Cube-Instance setup",
      desc: "Select region, size, image, storage, and networking.",
    },
    {
      id: "protection",
      title: "Protection Plan",
      desc: "Choose backup, DR, or replication for your instances.",
    },
    { id: "payment", title: "Payment", desc: "Generate payment options and share with finance." },
    {
      id: "review",
      title: "Review & provision",
      desc: "Validate totals and confirm provisioning.",
    },
    { id: "success", title: "Success", desc: "Provisioning started." },
  ];
};
