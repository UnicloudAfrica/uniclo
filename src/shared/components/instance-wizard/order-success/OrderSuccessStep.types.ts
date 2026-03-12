export interface ConfigurationSummary {
  id: string;
  name?: string;
  title?: string;
  region?: string;
  regionLabel?: string;
  count?: number | string;
  months?: number | string;
  canFastTrack?: boolean;
}

export interface PricingSummary {
  currency: string;
  grandTotal: number;
}

export interface KeypairDownload {
  id?: string | number;
  name: string;
  material: string;
  project_name?: string;
  region?: string;
}

export interface PipelineStep {
  id: string;
  label: string;
  status: "completed" | "pending" | "not_started" | "failed";
  description?: string;
  updated_at?: string;
  context?: Record<string, any>;
}

export interface InstanceSummary {
  key: string;
  name: string;
  identifier: string;
}

export interface ConfigurationPipelineGroup {
  key: string;
  title: string;
  subtitle: string;
  termLabel: string;
  instanceIds: string[];
  instanceCount: number;
  instanceSummaries: InstanceSummary[];
  requiresElasticIp: boolean;
  requiresDataVolumes: boolean;
}

export interface OrderSuccessStepProps {
  orderId?: string;
  transactionId?: string;
  isFastTrack?: boolean;
  configurationSummaries: ConfigurationSummary[];
  pricingSummary?: PricingSummary;
  keypairDownloads?: KeypairDownload[];
  instances?: unknown;
  instancesPageUrl: string;
  onCreateAnother: () => void;
  resourceLabel?: string;
}

export interface InstanceRef {
  key: string;
  lookupId: string;
  broadcastId: string;
}
