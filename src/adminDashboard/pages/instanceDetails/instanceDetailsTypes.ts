import React from "react";

export interface InstanceCompute {
  vcpus?: number;
  memory_mb?: number | string;
  productable_name?: string;
  name?: string;
}

export interface InstanceVolumeType {
  name?: string;
}

export interface InstanceProject {
  name?: string;
  identifier?: string;
  id?: string;
}

export interface InstanceTelemetry {
  uptime_seconds?: number;
  uptime?: number;
  cpu_usage?: number | string;
  cpu?: number | string;
  memory_used_mb?: number | string;
  memory_usage?: number | string;
  memory?: { used_mb?: number; usage?: number };
  network_throughput?: number | string;
  network?: { throughput?: number | string };
  network_transfer_rate?: number | string;
  network_io?: number | string; // legacy support
  last_heartbeat?: string;
  last_check_in?: string;
  updated_at?: string;
  health_status?: string;
  health?: string;
  status?: string;
  last_updated?: string;
}

export interface InstanceUsageStats {
  cpu_average?: number | string;
  memory_average?: number | string;
  network_in?: number | string;
  network_out?: number | string;
  disk_read?: number | string;
  disk_write?: number | string;
  period?: string;
}

export interface PricingLine {
  name?: string;
  quantity?: number;
  unit_amount?: number;
  unitAmount?: number;
  unit_price?: number;
  price?: number;
  total?: number;
  amount?: number;
  frequency?: string;
  currency?: string;
  key?: string;
  id?: string;
}

export interface PricingBreakdown {
  lines?: PricingLine[];
  subtotal?: number;
  pre_discount_subtotal?: number;
  preDiscountSubtotal?: number;
  discount?: number;
  discount_label?: string;
  discountLabel?: string;
  tax?: number;
  total?: number;
  colocation_percentage?: number;
  facility_percentage?: number;
  colocation_amount?: number;
  facility_amount?: number;
  currency?: string;
}

export interface LifecycleData {
  telemetry?: InstanceTelemetry;
  data?: { telemetry?: InstanceTelemetry };
}

export interface DisplayInstance {
  [key: string]: unknown;
  name?: string;
  description?: string;
  tags?: string[] | string;
  identifier?: string;
  region?: string;
  status?: string;
  billing_status?: string;
  fulfillment_mode?: string;
  project?: InstanceProject;
  provider?: string;
  floating_ip?: { ip_address?: string };
  private_ip?: string;
  compute?: InstanceCompute;
  compute_details?: InstanceCompute;
  storage_size_gb?: number;
  storage_gb?: number;
  disk_gb?: number;
  volume_type?: InstanceVolumeType;
  transactions?: GenericRecord[];
  telemetry?: InstanceTelemetry;
  created_at?: string;
  updated_at?: string;
  next_billing_date?: string;
  expires_at?: string;
  uptime_seconds?: number;
  currency?: string;
  metadata?: Record<string, unknown> | null;
  os_image?: { name?: string };
  key_pair?: { name?: string };
  security_group_ids?: string[];
}

// Temporary fallback for complex unseen shapes, but stricter than 'any'
export type GenericRecord = Record<string, unknown>;

export type LifecycleDataSource = LifecycleData | GenericRecord[] | null;

export type ActionTone = "success" | "warning" | "danger" | "info" | "neutral";

export type ActionConfig = {
  label: string;
  description: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: ActionTone;
  disableOnStatus?: (status: string | null | undefined) => boolean;
  requires_confirmation?: boolean;
  confirmation_message?: string;
  default_params?: Record<string, unknown>;
};

export type LifecycleEvent = {
  id: string;
  label: string;
  status?: string | undefined;
  description?: string;
  timestamp?: string | number | Date | null;
  timestampLabel: string;
};

export type ResourceVolume = {
  id?: string | number | null;
  name?: string;
  volume_label?: string;
  size?: string | number | null;
  size_gb?: string | number | null;
};
