/**
 * Shield Hooks — Context-aware hooks for DDoS protection services.
 *
 * Covers:
 * - Domain CRUD + verify/activate
 * - Protection mode + stats + attack history
 * - DNS record management
 * - SSL status + provisioning
 * - Firewall rules, IP access lists, geo-filter
 * - Admin overview, providers, plans, tenant usage
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { createResourceHooks, createQueryKeys } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;
type QueryOptions = Partial<
  Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
>;

const asEnvelope = <T = AnyRecord>(
  res: unknown
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ─── Types ──────────────────────────────────────────────────────

export interface ShieldDomain {
  id: number;
  uuid: string;
  tenant_id: number;
  user_id: number;
  project_id?: number;
  domain: string;
  provider: "stormwall" | "cloudflare";
  provider_domain_id?: string;
  provider_zone_id?: string;
  status: string;
  protection_mode: string;
  ssl_status: string;
  ssl_type: string;
  dns_configured: boolean;
  origin_ip: string;
  origin_port: number;
  settings: AnyRecord;
  activated_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ShieldProtectionStatus {
  status: string;
  protection_mode: string;
  provider_domain_id?: string;
}

export interface ShieldTrafficStats {
  requests_total?: number;
  requests_cached?: number;
  bandwidth_total?: number;
  threats_blocked?: number;
  [key: string]: unknown;
}

export interface ShieldAttack {
  id: string;
  type: string;
  start_time: string;
  end_time?: string;
  peak_bandwidth?: number;
  status: string;
  [key: string]: unknown;
}

export interface ShieldDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
}

export interface ShieldSslStatus {
  status: string;
  type: string;
  [key: string]: unknown;
}

export interface ShieldFirewallRule {
  id: string;
  expression: string;
  action: string;
  description?: string;
  priority?: number;
}

export interface ShieldIpRule {
  id: string;
  ip: string;
  note?: string;
  [key: string]: unknown;
}

export interface ShieldGeoFilter {
  countries: string[];
  action: "block" | "allow";
}

// ─── Attack Map Types ──────────────────────────────────────────

export interface AttackFlow {
  source_country: string;
  target_country: string;
  target_domain: string;
  type: string;
  peak_bps: number;
  peak_pps: number;
  started_at: string;
  ended_at: string | null;
  mitigated: boolean;
}

export interface AttackMapSummary {
  total_attacks: number;
  total_bandwidth_bps: number;
  active_domains: number;
  mitigated: number;
  active_attacks: number;
}

export interface AttackMapData {
  summary: AttackMapSummary;
  flows: AttackFlow[];
  top_sources: Record<string, number>;
  by_type: Record<string, number>;
  timeline: Array<Record<string, unknown>>;
}

export interface DomainAnalyticsInsights {
  total_attacks: number;
  mitigated: number;
  by_type: Record<string, number>;
  peak_attack: Record<string, unknown> | null;
  total_blocked: number;
  total_requests: number;
  total_bandwidth: number;
}

export interface DomainAnalyticsData {
  domain: string;
  traffic: Array<Record<string, unknown>>;
  attacks: Array<Record<string, unknown>>;
  insights: DomainAnalyticsInsights;
}

export interface ShieldOverview {
  total_domains: number;
  active_domains: number;
  by_provider: Record<string, number>;
  by_status: Record<string, number>;
}

export interface ShieldProviderInfo {
  key: string;
  configured: boolean;
  domain_count: number;
}

export interface ShieldPlan {
  id: number;
  integration_key: string;
  service_type: string;
  name: string;
  description?: string;
  billing_model: string;
  unit_label?: string;
  provider?: string;
}

// ─── Basic domain CRUD via factory ──────────────────────────────

const shieldDomainHooks = createResourceHooks<ShieldDomain>({
  resourcePath: "shield/domains",
  queryKeyBase: "shieldDomains",
  dataKey: "data",
  updateMethod: "put",
});

export const {
  useFetchList: useFetchShieldDomains,
  useFetchById: useFetchShieldDomainById,
  useCreate: useCreateShieldDomain,
  useUpdate: useUpdateShieldDomain,
  useDelete: useDeleteShieldDomain,
  queryKeys: shieldDomainKeys,
} = shieldDomainHooks;

// ─── Extended Query Keys ────────────────────────────────────────

export const shieldKeys = {
  ...createQueryKeys("shield"),
  domain: (context: string, domainId: string) =>
    ["shield-domain", context, domainId] as const,
  protection: (context: string, domainId: string) =>
    ["shield-protection", context, domainId] as const,
  stats: (context: string, domainId: string) =>
    ["shield-stats", context, domainId] as const,
  attacks: (context: string, domainId: string) =>
    ["shield-attacks", context, domainId] as const,
  events: (context: string, domainId: string) =>
    ["shield-events", context, domainId] as const,
  dns: (context: string, domainId: string) =>
    ["shield-dns", context, domainId] as const,
  ssl: (context: string, domainId: string) =>
    ["shield-ssl", context, domainId] as const,
  firewall: (context: string, domainId: string) =>
    ["shield-firewall", context, domainId] as const,
  ipRules: (context: string, domainId: string, listType: string) =>
    ["shield-ip-rules", context, domainId, listType] as const,
  geoFilter: (context: string, domainId: string) =>
    ["shield-geo-filter", context, domainId] as const,
  overview: (context: string) => ["shield-overview", context] as const,
  providers: (context: string) => ["shield-providers", context] as const,
  plans: (context: string) => ["shield-plans", context] as const,
  tenantUsage: (context: string, tenantId: string) =>
    ["shield-tenant-usage", context, tenantId] as const,
  attackMap: (context: string) => ["shield-attack-map", context] as const,
  domainAnalytics: (context: string, domainId: string) =>
    ["shield-domain-analytics", context, domainId] as const,
};

// ─── Domain Actions ─────────────────────────────────────────────

export function useVerifyShieldDomain() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async (domainId: string) => {
      const res = await toastApi.post(
        `${urlPrefix}/shield/domains/${domainId}/verify`
      );
      return asEnvelope(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shieldDomainKeys.all });
    },
  });
}

export function useActivateShieldDomain() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async (domainId: string) => {
      const res = await toastApi.post(
        `${urlPrefix}/shield/domains/${domainId}/activate`
      );
      return asEnvelope(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shieldDomainKeys.all });
    },
  });
}

// ─── Protection ─────────────────────────────────────────────────

export function useFetchProtectionStatus(
  domainId: string,
  options?: QueryOptions
) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.protection(context, domainId),
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/domains/${domainId}/protection/status`
      );
      return asEnvelope<ShieldProtectionStatus>(res.data).data;
    },
    enabled: !!domainId,
    ...options,
  });
}

export function useSetProtectionMode() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      mode,
    }: {
      domainId: string;
      mode: string;
    }) => {
      const res = await toastApi.put(
        `${urlPrefix}/shield/domains/${domainId}/protection/mode`,
        { mode }
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.protection(context, domainId),
      });
      queryClient.invalidateQueries({ queryKey: shieldDomainKeys.all });
    },
  });
}

export function useFetchTrafficStats(
  domainId: string,
  options?: QueryOptions
) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.stats(context, domainId),
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/domains/${domainId}/protection/stats`
      );
      return asEnvelope<ShieldTrafficStats>(res.data).data;
    },
    enabled: !!domainId,
    ...options,
  });
}

export function useFetchAttacks(domainId: string, options?: QueryOptions) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.attacks(context, domainId),
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/domains/${domainId}/protection/attacks`
      );
      return asEnvelope<ShieldAttack[]>(res.data).data ?? [];
    },
    enabled: !!domainId,
    ...options,
  });
}

// ─── DNS ────────────────────────────────────────────────────────

export function useFetchDnsRecords(domainId: string, options?: QueryOptions) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.dns(context, domainId),
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/domains/${domainId}/dns`
      );
      return asEnvelope<ShieldDnsRecord[]>(res.data).data ?? [];
    },
    enabled: !!domainId,
    ...options,
  });
}

export function useCreateDnsRecord() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      ...data
    }: { domainId: string } & Partial<ShieldDnsRecord>) => {
      const res = await toastApi.post(
        `${urlPrefix}/shield/domains/${domainId}/dns`,
        data
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.dns(context, domainId),
      });
    },
  });
}

export function useUpdateDnsRecord() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      recordId,
      ...data
    }: { domainId: string; recordId: string } & Partial<ShieldDnsRecord>) => {
      const res = await toastApi.put(
        `${urlPrefix}/shield/domains/${domainId}/dns/${recordId}`,
        data
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.dns(context, domainId),
      });
    },
  });
}

export function useDeleteDnsRecord() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      recordId,
    }: {
      domainId: string;
      recordId: string;
    }) => {
      const res = await toastApi.delete(
        `${urlPrefix}/shield/domains/${domainId}/dns/${recordId}`
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.dns(context, domainId),
      });
    },
  });
}

// ─── SSL ────────────────────────────────────────────────────────

export function useFetchSslStatus(domainId: string, options?: QueryOptions) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.ssl(context, domainId),
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/domains/${domainId}/ssl`
      );
      return asEnvelope<ShieldSslStatus>(res.data).data;
    },
    enabled: !!domainId,
    ...options,
  });
}

export function useProvisionSsl() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async (domainId: string) => {
      const res = await toastApi.post(
        `${urlPrefix}/shield/domains/${domainId}/ssl/provision`
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, domainId) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.ssl(context, domainId),
      });
      queryClient.invalidateQueries({ queryKey: shieldDomainKeys.all });
    },
  });
}

export function useUploadCustomSsl() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      certificate,
      private_key,
    }: {
      domainId: string;
      certificate: string;
      private_key: string;
    }) => {
      const res = await toastApi.post(
        `${urlPrefix}/shield/domains/${domainId}/ssl/custom`,
        { certificate, private_key }
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.ssl(context, domainId),
      });
      queryClient.invalidateQueries({ queryKey: shieldDomainKeys.all });
    },
  });
}

// ─── Firewall ───────────────────────────────────────────────────

export function useFetchFirewallRules(
  domainId: string,
  options?: QueryOptions
) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.firewall(context, domainId),
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/domains/${domainId}/firewall`
      );
      return asEnvelope<ShieldFirewallRule[]>(res.data).data ?? [];
    },
    enabled: !!domainId,
    ...options,
  });
}

export function useCreateFirewallRule() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      ...data
    }: { domainId: string } & Partial<ShieldFirewallRule>) => {
      const res = await toastApi.post(
        `${urlPrefix}/shield/domains/${domainId}/firewall`,
        data
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.firewall(context, domainId),
      });
    },
  });
}

export function useUpdateFirewallRule() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      ruleId,
      ...data
    }: {
      domainId: string;
      ruleId: string;
    } & Partial<ShieldFirewallRule>) => {
      const res = await toastApi.put(
        `${urlPrefix}/shield/domains/${domainId}/firewall/${ruleId}`,
        data
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.firewall(context, domainId),
      });
    },
  });
}

export function useDeleteFirewallRule() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      ruleId,
    }: {
      domainId: string;
      ruleId: string;
    }) => {
      const res = await toastApi.delete(
        `${urlPrefix}/shield/domains/${domainId}/firewall/${ruleId}`
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.firewall(context, domainId),
      });
    },
  });
}

// ─── IP Access Lists ────────────────────────────────────────────

export function useFetchIpRules(
  domainId: string,
  listType: string,
  options?: QueryOptions
) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.ipRules(context, domainId, listType),
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/domains/${domainId}/ip-rules/${listType}`
      );
      return asEnvelope<ShieldIpRule[]>(res.data).data ?? [];
    },
    enabled: !!domainId && !!listType,
    ...options,
  });
}

export function useAddIpRule() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      listType,
      ip,
      note,
    }: {
      domainId: string;
      listType: string;
      ip: string;
      note?: string;
    }) => {
      const res = await toastApi.post(
        `${urlPrefix}/shield/domains/${domainId}/ip-rules/${listType}`,
        { ip, note }
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId, listType }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.ipRules(context, domainId, listType),
      });
    },
  });
}

export function useRemoveIpRule() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      listType,
      ruleId,
    }: {
      domainId: string;
      listType: string;
      ruleId: string;
    }) => {
      const res = await toastApi.delete(
        `${urlPrefix}/shield/domains/${domainId}/ip-rules/${listType}/${ruleId}`
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId, listType }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.ipRules(context, domainId, listType),
      });
    },
  });
}

// ─── Geo-Filter ─────────────────────────────────────────────────

export function useFetchGeoFilter(domainId: string, options?: QueryOptions) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.geoFilter(context, domainId),
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/domains/${domainId}/geo-filter`
      );
      return asEnvelope<ShieldGeoFilter>(res.data).data;
    },
    enabled: !!domainId,
    ...options,
  });
}

export function useSetGeoFilter() {
  const { context } = useApiContext();
  const queryClient = useQueryClient();
  const { toastApi, urlPrefix } = apiRegistry[context];

  return useMutation({
    mutationFn: async ({
      domainId,
      countries,
      action,
    }: {
      domainId: string;
      countries: string[];
      action: "block" | "allow";
    }) => {
      const res = await toastApi.put(
        `${urlPrefix}/shield/domains/${domainId}/geo-filter`,
        { countries, action }
      );
      return asEnvelope(res.data);
    },
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({
        queryKey: shieldKeys.geoFilter(context, domainId),
      });
    },
  });
}

// ─── Admin ──────────────────────────────────────────────────────

export function useFetchShieldOverview(options?: QueryOptions) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.overview(context),
    queryFn: async () => {
      const res = await silentApi.get(`${urlPrefix}/shield/overview`);
      return asEnvelope<ShieldOverview>(res.data).data;
    },
    ...options,
  });
}

export function useFetchShieldProviders(options?: QueryOptions) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.providers(context),
    queryFn: async () => {
      const res = await silentApi.get(`${urlPrefix}/shield/providers`);
      return asEnvelope<ShieldProviderInfo[]>(res.data).data ?? [];
    },
    ...options,
  });
}

export function useFetchShieldPlans(options?: QueryOptions) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.plans(context),
    queryFn: async () => {
      const res = await silentApi.get(`${urlPrefix}/shield/plans`);
      return asEnvelope<ShieldPlan[]>(res.data).data ?? [];
    },
    ...options,
  });
}

export function useFetchTenantUsage(
  tenantId: string,
  options?: QueryOptions
) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: shieldKeys.tenantUsage(context, tenantId),
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/tenant-usage/${tenantId}`
      );
      return asEnvelope(res.data).data;
    },
    enabled: !!tenantId,
    ...options,
  });
}

// ─── Attack Map / Analytics ────────────────────────────────────

export function useFetchAttackMap(
  params?: { from?: string; to?: string; limit?: number },
  options?: QueryOptions
) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: [...shieldKeys.attackMap(context), params],
    queryFn: async () => {
      const res = await silentApi.get(`${urlPrefix}/shield/attack-map`, {
        params,
      });
      return asEnvelope<AttackMapData>(res.data).data;
    },
    ...options,
  });
}

export function useFetchDomainAnalytics(
  domainId: string,
  params?: { from?: string; to?: string; granularity?: string },
  options?: QueryOptions
) {
  const { context } = useApiContext();
  const { silentApi, urlPrefix } = apiRegistry[context];

  return useQuery({
    queryKey: [...shieldKeys.domainAnalytics(context, domainId), params],
    queryFn: async () => {
      const res = await silentApi.get(
        `${urlPrefix}/shield/domains/${domainId}/analytics`,
        { params }
      );
      return asEnvelope<DomainAnalyticsData>(res.data).data;
    },
    enabled: !!domainId,
    ...options,
  });
}
