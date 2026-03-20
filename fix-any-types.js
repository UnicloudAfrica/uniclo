const fs = require('fs');
const path = require('path');

const filePath = '/Users/mac_1/Documents/GitHub/unicloud/web/src/adminDashboard/components/AdminInstanceConfigurationCard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const interfaces = `
interface RegionResource {
  id?: string | number;
  code?: string;
  region?: string;
  slug?: string;
  identifier?: string;
  az_selection_mode?: "auto" | "user_selectable" | "disabled";
  availability_zones?: AvailabilityZoneResource[];
}

interface AvailabilityZoneResource {
  id?: string | number;
  code?: string;
  name?: string;
  status?: string;
  provider?: string;
}

interface PricingEffect {
  price_local?: number | string | null;
  price_usd?: number | string | null;
  amount?: number | string | null;
  currency?: string;
}

interface PricingResource {
  productable_id?: string | number;
  id?: string | number;
  product_id?: string | number;
  name?: string;
  price_local?: number | string | null;
  price_usd?: number | string | null;
  amount?: number | string | null;
  vcpus?: number | string;
  memory_mb?: number | string;
  memoryGb?: number | string;
  memory_gb?: number | string;
  config?: { vcpus?: number | string; memory_mb?: number | string; };
  configuration?: { vcpus?: number | string; };
  product?: PricingResource;
  pricing?: { effective?: PricingEffect };
}

interface ProjectResource {
  id?: string | number;
  identifier?: string;
  project_id?: string | number;
  code?: string;
  name?: string;
  slug?: string;
  region?: string | RegionResource;
  region_code?: string;
  value?: string | number;
  label?: string;
  raw?: unknown;
}

interface NetworkResource {
  id?: string | number;
  network_id?: string | number;
  uuid?: string;
  identifier?: string;
  name?: string;
  display_name?: string;
  network_name?: string;
  label?: string;
}

interface SubnetResource {
  id?: string | number;
  subnet_id?: string | number;
  identifier?: string;
  name?: string;
  cidr?: string;
}

interface KeyPairResource {
  id?: string | number;
  name?: string;
}
`;

// Insert interfaces before useFetchSecurityGroups
content = content.replace(
  '// Local positional-arg wrappers for dynamic hook fallbacks',
  interfaces + '\n// Local positional-arg wrappers for dynamic hook fallbacks'
);

content = content.replace(
  'const useFetchSecurityGroups = (projectId: any, region: any, opts: any = {}) =>',
  'const useFetchSecurityGroups = (projectId: string, region: string, opts: Record<string, unknown> = {}) =>'
);

content = content.replace(
  'const useFetchSubnets = (projectId: any, region: any, opts: any = {}) =>',
  'const useFetchSubnets = (projectId: string, region: string, opts: Record<string, unknown> = {}) =>'
);

content = content.replace(
  'type FetchHookResult = { data: any; isFetching?: boolean; isLoading?: boolean };',
  'type FetchHookResult = { data: unknown; isFetching?: boolean; isLoading?: boolean };'
);

content = content.replace(
  'regions?: any[];',
  'regions?: RegionResource[];'
);

content = content.replace(
  'const extractRegionCode = (region: any) => {',
  'const extractRegionCode = (region: RegionResource | string | null | undefined) => {'
);

content = content.replace(
  'const resolveEffectivePrice = (item: any) => {',
  'const resolveEffectivePrice = (item: PricingResource | null | undefined) => {'
);

content = content.replace(
  'const hasEffectivePricing = (item: any) => {',
  'const hasEffectivePricing = (item: PricingResource | null | undefined) => {'
);

content = content.replace(
  'const formatPriceSuffix = (item: any) => {',
  'const formatPriceSuffix = (item: PricingResource | null | undefined) => {'
);

content = content.replace(
  '(r: any) =>',
  '(r: RegionResource) =>'
);

content = content.replace(
  /.az_selection_mode as/g,
  '(selectedRegionData as RegionResource)?.az_selection_mode as'
);
content = content.replace(
  /\(selectedRegionData as any\)\?/g,
  '(selectedRegionData as RegionResource)?'
);

content = content.replace(
  /\(az: any\)/g,
  '(az: AvailabilityZoneResource)'
);

// project mapping fix
const projectOptionsReplacement = `  const projectOptions = useMemo(() => {
    const rawData = (projectsResp as { data?: ProjectResource[] })?.data;
    const arrayData = Array.isArray(rawData) ? rawData : Array.isArray(projectsResp) ? projectsResp as ProjectResource[] : [];
    const combined = [
      ...arrayData,
      ...(Array.isArray(baseProjectOptions) ? baseProjectOptions : []), 
    ];

    const seen = new Set();
    return combined.reduce((acc: Option[], project: ProjectResource) => {`;
    
content = content.replace(
  /  const projectOptions = useMemo\(\(\) => \{\n    const combined = \[\n      \.\.\.\(projectsResp\?\.data && Array\.isArray\(projectsResp\.data\) \? projectsResp\.data : \[\]\),\n      \.\.\.\(Array\.isArray\(baseProjectOptions\) \? baseProjectOptions : \[\]\), \/\/ Usually baseProjectOptions are transformed Options, wait, in original it was "regionAwareProjects"\n    \];\n\n    const seen = new Set\(\);\n    return combined\.reduce\(\(acc: Option\[\], project: any\) => \{/s,
  projectOptionsReplacement
);

content = content.replace(
  /\(item: any, idx: number\): Option \| null/g,
  '(item: PricingResource, idx: number): Option | null'
);

const networkListReplacement = `  const networkOptions = useMemo(() => {
    const list = Array.isArray(networksResponse)
      ? (networksResponse as NetworkResource[])
      : Array.isArray((networksResponse as { data?: NetworkResource[] })?.data)
        ? (networksResponse as { data?: NetworkResource[] }).data || []
        : [];
    return list
      .map((network: NetworkResource): Option | null => {`;
content = content.replace(
  /  const networkOptions = useMemo\(\(\) => \{\n    const list = Array\.isArray\(networksResponse\)\n      \? \(networksResponse as Record<string, unknown>\[\]\)\n      : Array\.isArray\(\(networksResponse as Record<string, unknown>\)\?\.data\)\n        \? \(networksResponse as Record<string, \{ data\?: unknown \}\>\)\.data\n        : \[\];\n    return list\n      \.map\(\(network: any\): Option \| null => \{/s,
  networkListReplacement
);

content = content.replace(
  /\(subnet: any\)/g,
  '(subnet: SubnetResource)'
);

content = content.replace(
  /\(kp: any\)/g,
  '(kp: KeyPairResource)'
);

content = content.replace(
  /\(template: any\)/g,
  '(template: Configuration & { name?: string })'
);

fs.writeFileSync(filePath, content, 'utf8');

console.log("Done regex replaces script");
