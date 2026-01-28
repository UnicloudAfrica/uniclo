import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

// GET: Fetch all tenant instances
const fetchTenantInstances = async (params = {}) => {
    // Define default parameters
    const defaultParams = {
        per_page: 10,
    };

    const queryParams = { ...defaultParams, ...params };

    const queryString = Object.keys(queryParams)
        .filter((key) => queryParams[key] !== undefined && queryParams[key] !== null)
        .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
        .join("&");

    // Following pattern from projectHooks which uses /admin/projects
    const uri = `/admin/instances${queryString ? `?${queryString}` : ""}`;

    const res = await tenantSilentApi("GET", uri);
    if (!res.data) {
        // If /admin/instances fails, we might want to try /instances, but let's stick to pattern
        throw new Error("Failed to fetch instances");
    }
    return res;
};

// GET: Fetch instance by ID
const fetchTenantInstanceById = async (id) => {
    const encodedId = encodeURIComponent(id);
    const res = await tenantSilentApi("GET", `/admin/instances/${encodedId}`);
    if (!res.data) {
        throw new Error(`Failed to fetch instance with ID ${id}`);
    }
    return res.data;
};

// POST: Instance Actions (Start, Stop, etc)
// Note: Admin instancesHook has executeInstanceManagementAction with specific path.
// Tenant might use similar path.
const executeTenantInstanceAction = async ({
    identifier,
    action,
    params = {},
}) => {
    if (!identifier || !action) {
        throw new Error("Instance identifier and action are required.");
    }

    // Check path, assume /admin/instance-management or /admin/instances/{id}/actions
    // Admin uses /instance-management/{identifier}/actions
    // Tenant likely uses /admin/instance-management/{identifier}/actions
    const res = await tenantApi("POST", `/admin/instance-management/${identifier}/actions`, {
        action,
        params,
    });

    if (!res?.success) {
        throw new Error(res?.message || `Failed to execute ${action} action`);
    }

    return res.data ?? res;
};

// Hook: Fetch all instances
export const useFetchTenantInstances = (params = {}, options = {}) => {
    return useQuery({
        queryKey: ["tenant-instances", params],
        queryFn: () => fetchTenantInstances(params),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        ...options,
    });
};

// Hook: Fetch instance by ID
export const useFetchTenantInstanceById = (id, options = {}) => {
    return useQuery({
        queryKey: ["tenant-instance", id],
        queryFn: () => fetchTenantInstanceById(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        ...options,
    });
};

// Hook: Execute action
export const useTenantInstanceAction = () => {
    return useMutation({
        mutationFn: executeTenantInstanceAction,
        onError: (error) => {
            console.error("Error executing instance action:", error);
        },
    });
};
