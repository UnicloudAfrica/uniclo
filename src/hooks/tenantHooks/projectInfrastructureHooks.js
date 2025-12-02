import { useQuery } from "@tanstack/react-query";
import tenantApi from "../../index/tenant/tenantApi";

const convertBackendResponse = (backendData) => {
  if (!backendData) return null;

  const infrastructure = backendData.infrastructure || {};

  const counts = {
    vpcs: infrastructure.vpc?.count ?? infrastructure.vpcs_count ?? null,
    subnets: infrastructure.subnets?.count ?? infrastructure.subnets_count ?? null,
    security_groups: infrastructure.security_groups?.count ?? infrastructure.security_groups_count ?? null,
    keypairs: infrastructure.keypairs?.count ?? infrastructure.keypairs_count ?? null,
    internet_gateways: infrastructure.internet_gateways?.count ?? infrastructure.igws_count ?? null,
    route_tables: infrastructure.route_tables?.count ?? infrastructure.route_tables_count ?? null,
    network_interfaces: infrastructure.network_interfaces?.count ?? infrastructure.enis_count ?? null,
    elastic_ips: infrastructure.elastic_ips?.count ?? infrastructure.eips_count ?? null,
  };

  const normalizeDetails = (component) => {
    if (!component || !component.details) return null;
    if (Array.isArray(component.details)) return component.details;
    if (typeof component.details === "object") return [component.details];
    return null;
  };

  const normalizeStatus = (component) => {
    if (!component) return "pending";
    const status = component.status;
    if (status === "configured" || status === "completed") return "completed";
    if (status === "ready") {
      const details = normalizeDetails(component);
      if (
        (details && details.length > 0) ||
        (typeof component.count === "number" && component.count > 0)
      ) {
        return "completed";
      }
      return "pending";
    }
    const details = normalizeDetails(component);
    if (
      (details && details.length > 0) ||
      (typeof component.count === "number" && component.count > 0)
    ) {
      return "completed";
    }
    return component.ready_for_setup ? "pending" : "pending";
  };

  return {
    project_id: backendData.project?.identifier,
    overall_status: backendData.project?.status || "pending",
    components: {
      keypairs: {
        status: (() => {
          const kp = infrastructure.keypairs;
          if (!kp) return "pending";
          if (kp.status === "configured" || kp.status === "completed") return "completed";
          if (typeof kp.count === "number" && kp.count > 0) return "completed";
          const details = normalizeDetails(kp);
          if (details && details.length > 0) return "completed";
          return kp.ready_for_setup ? "pending" : "pending";
        })(),
        details: normalizeDetails(infrastructure.keypairs),
        count: infrastructure.keypairs?.count ?? null,
        error: null,
      },
      vpc: {
        status: normalizeStatus(infrastructure.vpc),
        details: normalizeDetails(infrastructure.vpc),
        count: infrastructure.vpc?.count ?? null,
        error: null,
      },
      edge_networks: {
        status: normalizeStatus(infrastructure.edge_networks),
        details: normalizeDetails(infrastructure.edge_networks),
        count: infrastructure.edge_networks?.count ?? null,
        error: null,
      },
      security_groups: {
        status: normalizeStatus(infrastructure.security_groups),
        details: normalizeDetails(infrastructure.security_groups),
        count: infrastructure.security_groups?.count ?? null,
        error: null,
      },
      subnets: {
        status: normalizeStatus(infrastructure.subnets),
        details: normalizeDetails(infrastructure.subnets),
        count: infrastructure.subnets?.count ?? null,
        error: null,
      },
    },
    completion_percentage: backendData.completion_percentage || 0,
    estimated_completion: backendData.estimated_completion_time
      ? new Date(Date.now() + backendData.estimated_completion_time * 1000).toISOString()
      : null,
    last_updated: new Date().toISOString(),
    next_steps: backendData.next_steps || [],
    counts,
  };
};

export const useTenantProjectInfrastructureStatus = (projectId, options = {}) => {
  return useQuery({
    queryKey: ["tenant-project-infrastructure-status", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID is required");

      const response = await tenantApi(
        "GET",
        `/admin/project-infrastructure/${projectId}`
      );
      const convertedData = convertBackendResponse(response?.data ?? response);
      return { data: convertedData };
    },
    enabled: !!projectId,
    staleTime: 30000,
    cacheTime: 300000,
    retry: (failureCount, error) => {
      if (error?.message?.includes?.("404") || error?.message?.includes?.("403")) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};
