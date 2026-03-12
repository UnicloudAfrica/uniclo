import type { PipelineStep } from "./OrderSuccessStep.types";

export const DEFAULT_INSTANCE_PIPELINE: PipelineStep[] = [
  {
    id: "queue_provisioning",
    label: "Provisioning queued",
    status: "not_started",
    description: "Provisioning will begin shortly.",
  },
  {
    id: "resolve_inputs",
    label: "Validating configuration",
    status: "not_started",
    description: "Checking compute, image, and network prerequisites.",
  },
  {
    id: "project_created",
    label: "Project ready",
    status: "not_started",
    description: "Ensuring project context and access.",
  },
  {
    id: "infrastructure_ready",
    label: "Infrastructure ready",
    status: "not_started",
    description: "Preparing VPC, networks, and security groups.",
  },
  {
    id: "keypair_ready",
    label: "Key pair ready",
    status: "not_started",
    description: "Preparing SSH access credentials.",
  },
  {
    id: "sync_user_access",
    label: "Access synchronized",
    status: "not_started",
    description: "Syncing user permissions on the project.",
  },
  {
    id: "create_instance",
    label: "Creating instance",
    status: "not_started",
    description: "Allocating compute resources.",
  },
  {
    id: "wait_for_active",
    label: "Booting and health checks",
    status: "not_started",
    description: "Booting the instance and running readiness checks.",
  },
  {
    id: "allocate_elastic_ip",
    label: "Elastic IP allocation",
    status: "not_started",
    description: "Allocating and attaching Elastic IPs.",
  },
  {
    id: "attach_data_volumes",
    label: "Data volumes",
    status: "not_started",
    description: "Creating and attaching additional volumes.",
  },
  {
    id: "post_provision",
    label: "Finalizing resources",
    status: "not_started",
    description: "Final checks and bookkeeping.",
  },
  {
    id: "instance_ready",
    label: "Instance ready",
    status: "not_started",
    description: "Provisioning complete.",
  },
];
