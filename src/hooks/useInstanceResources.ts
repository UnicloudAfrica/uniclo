import { useState, useEffect, useCallback } from "react";
import adminSilentApi from "../index/admin/silent";
import ToastUtils from "../utils/toastUtil";

export interface InstanceResources {
  projects: any[];
  regions: any[];
  instance_types: any[];
  os_images: any[];
  volume_types: any[];
  bandwidths: any[];
  security_groups: any[];
  keypairs: any[];
  floating_ips?: any[];
  volumes?: any[];
}

const initialResources: InstanceResources = {
  projects: [],
  regions: [],
  instance_types: [],
  os_images: [],
  volume_types: [],
  bandwidths: [],
  security_groups: [],
  keypairs: [],
  floating_ips: [],
  volumes: [],
};

// Type for API function that can be passed from different contexts
export type ApiFn = (method: string, endpoint: string, body?: any) => Promise<any>;

interface UseInstanceResourcesOptions {
  /** Custom API function to use instead of default adminSilentApi */
  apiFn?: ApiFn;
  /** Custom endpoint for fetching resources (default: /instances/resources) */
  endpoint?: string;
  /** Whether to fetch resources on mount (default: true) */
  autoFetch?: boolean;
}

/**
 * Hook to fetch instance creation resources.
 * Supports multiple API contexts (admin, tenant, client) by accepting a custom API function.
 */
export const useInstanceResources = (options: UseInstanceResourcesOptions = {}) => {
  const { apiFn = adminSilentApi, endpoint = "/instances/resources", autoFetch = true } = options;

  const [resources, setResources] = useState<InstanceResources>(initialResources);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  const loadResources = useCallback(async () => {
    setIsLoadingResources(true);
    try {
      const res = await apiFn("GET", endpoint);
      const data = res?.data || {};
      setResources({
        projects: data.projects || [],
        regions: data.regions || [],
        instance_types: data.instance_types || [],
        os_images: data.os_images || [],
        volume_types: data.volume_types || [],
        bandwidths: data.bandwidths || data.bandwidth || [],
        security_groups: data.security_groups || data.securityGroups || [],
        keypairs: data.keypairs || data.key_pairs || [],
        floating_ips: data.floating_ips || [],
        volumes: data.volumes || [],
      });
    } catch (error) {
      console.error("Failed to load resources", error);
      ToastUtils.error("Could not load instance resources.");
    } finally {
      setIsLoadingResources(false);
    }
  }, [apiFn, endpoint]);

  useEffect(() => {
    if (autoFetch) {
      loadResources();
    }
  }, [autoFetch, loadResources]);

  return { resources, isLoadingResources, refetchResources: loadResources };
};
