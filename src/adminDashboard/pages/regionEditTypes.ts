export type ServiceFieldDefinition = {
  type?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type ServiceDefinition = {
  label?: string;
  description?: string;
  fields?: Record<string, ServiceFieldDefinition>;
};

export type ServiceConfigCardProps = {
  serviceType: string;
  serviceConfig?: ServiceDefinition;
  enabled: boolean;
  onToggle: () => void;
  fulfillmentMode: string;
  onModeChange: (mode: string) => void;
  credentials: Record<string, any>;
  onCredentialChange: (fieldName: string, value: string) => void;
  onTestConnection: () => void;
  status?: string;
  testing?: boolean;
  isExistingConnection?: boolean;
};

export type RegionFormData = {
  name: string;
  code: string;
  country_code: string;
  city: string;
  status: string;
  is_active: boolean;
  visibility: string;
};

export type RegionHeroBannerProps = {
  formData: RegionFormData;
  regionName: string;
  regionProvider: string | undefined;
  locationLabel: string;
};

export type VisibilityApprovalCardProps = {
  formData: RegionFormData;
  setFormData: React.Dispatch<React.SetStateAction<RegionFormData>>;
  region: Record<string, any>;
  setRegion: React.Dispatch<React.SetStateAction<any>>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  regionCode: string;
};

export type FastTrackConfigCardProps = {
  region: Record<string, any>;
  setRegion: React.Dispatch<React.SetStateAction<any>>;
  tenants: any[];
  selectedTenantsToGrant: string[];
  setSelectedTenantsToGrant: React.Dispatch<React.SetStateAction<string[]>>;
  tenantSearch: string;
  setTenantSearch: React.Dispatch<React.SetStateAction<string>>;
  onRevokeFastTrack: (tenantId: string) => void;
  fetchRegionDetail: () => void;
};
