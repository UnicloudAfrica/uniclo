export interface AdditionalVolume {
  id: string;
  volume_type_id: string;
  storage_size_gb: number | string;
}

export interface Configuration {
  id: string;
  launch_mode: string;
  name: string;
  instance_count: number | string;
  description: string;
  project_id: string;
  project_mode?: "existing" | "new";
  project_name?: string;
  template_id?: string;
  template_name?: string;
  template_locked?: boolean;
  network_preset?: string;
  region: string;
  months: number | string;
  compute_instance_id: string;
  os_image_id: string;
  volume_type_id: string;
  storage_size_gb: number | string;
  bandwidth_id: string;
  bandwidth_count: number | string;
  floating_ip_count: number | string;
  security_group_ids: string[];
  keypair_name: string;
  keypair_label: string;
  additional_volumes: AdditionalVolume[];
  network_id: string;
  subnet_id: string;
  subnet_label: string;
  tags: string;
}

export interface Option {
  value: string | number;
  label: string;
  currency?: string;
  raw?: any;
  disabled?: boolean;
}
