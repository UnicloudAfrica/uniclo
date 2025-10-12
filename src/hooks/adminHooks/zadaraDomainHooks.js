// src/hooks/adminHooks/zadaraDomainHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// ============== DOMAIN MANAGEMENT ==============

// GET: Fetch all Zadara domains
const fetchZadaraDomains = async () => {
  const res = await silentApi("GET", "/zadara-domains");
  if (!res.data) {
    throw new Error("Failed to fetch Zadara domains");
  }
  return res.data;
};

// POST: Ensure root domain (UCA_CRM_PORTAL)
const ensureRootDomain = async (domainData = {}) => {
  const res = await api("POST", "/zadara-domains", domainData);
  if (!res.data) {
    throw new Error("Failed to ensure root domain");
  }
  return res.data;
};

// GET: Fetch domain hierarchy details
const fetchDomainHierarchy = async (domainId) => {
  const res = await silentApi("GET", `/zadara-domains/${domainId}`);
  if (!res.data) {
    throw new Error(`Failed to fetch domain hierarchy for ${domainId}`);
  }
  return res.data;
};

// GET: Fetch tenant hierarchy
const fetchTenantHierarchy = async (tenantId) => {
  const res = await silentApi("GET", `/zadara-domains/tenant-hierarchy/${tenantId}`);
  if (!res.data) {
    throw new Error(`Failed to fetch tenant hierarchy for ${tenantId}`);
  }
  return res.data;
};

// ============== SUBTENANT MANAGEMENT ==============

// GET: Fetch all subtenants
const fetchSubtenants = async (parentTenantId = null) => {
  const endpoint = parentTenantId 
    ? `/sub-tenants?parent_tenant_id=${parentTenantId}`
    : "/sub-tenants";
  const res = await silentApi("GET", endpoint);
  if (!res.data) {
    throw new Error("Failed to fetch subtenants");
  }
  return res.data;
};

// POST: Create subtenant with admin escalation
const createSubtenant = async (subtenantData) => {
  const res = await api("POST", "/sub-tenants", subtenantData);
  if (!res.data) {
    throw new Error("Failed to create subtenant");
  }
  return res.data;
};

// GET: Fetch subtenant details
const fetchSubtenantById = async (identifier) => {
  const res = await silentApi("GET", `/sub-tenants/${identifier}`);
  if (!res.data) {
    throw new Error(`Failed to fetch subtenant ${identifier}`);
  }
  return res.data;
};

// PUT: Update subtenant (including verification)
const updateSubtenant = async ({ identifier, subtenantData }) => {
  const res = await api("PUT", `/sub-tenants/${identifier}`, subtenantData);
  if (!res.data) {
    throw new Error(`Failed to update subtenant ${identifier}`);
  }
  return res.data;
};

// DELETE: Delete subtenant
const deleteSubtenant = async (identifier) => {
  const res = await api("DELETE", `/sub-tenants/${identifier}`);
  if (!res.data) {
    throw new Error(`Failed to delete subtenant ${identifier}`);
  }
  return res.data;
};

// ============== POLICY MANAGEMENT ==============

// POST: Sync policies for project
const syncProjectPolicies = async (projectId) => {
  const res = await api("POST", "/zadara-domains/sync-policies", {
    project_id: projectId
  });
  if (!res.data) {
    throw new Error(`Failed to sync policies for project ${projectId}`);
  }
  return res.data;
};

// POST: Assign policies to user
const assignUserPolicies = async ({ userId, projectId }) => {
  const res = await api("POST", "/zadara-domains/assign-user-policies", {
    user_id: userId,
    project_id: projectId
  });
  if (!res.data) {
    throw new Error(`Failed to assign policies to user ${userId}`);
  }
  return res.data;
};

// GET: Fetch user policies
const fetchUserPolicies = async ({ userId, projectId }) => {
  const res = await silentApi("GET", `/zadara-domains/user-policies?user_id=${userId}&project_id=${projectId}`);
  if (!res.data) {
    throw new Error(`Failed to fetch policies for user ${userId} in project ${projectId}`);
  }
  return res.data;
};

// ============== REACT HOOKS ==============

// Hook to fetch all Zadara domains
export const useFetchZadaraDomains = (options = {}) => {
  return useQuery({
    queryKey: ["zadara-domains"],
    queryFn: fetchZadaraDomains,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to ensure root domain
export const useEnsureRootDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ensureRootDomain,
    onSuccess: () => {
      queryClient.invalidateQueries(["zadara-domains"]);
      queryClient.invalidateQueries(["tenants"]);
    },
    onError: (error) => {
      console.error("Error ensuring root domain:", error);
    },
  });
};

// Hook to fetch domain hierarchy
export const useFetchDomainHierarchy = (domainId, options = {}) => {
  return useQuery({
    queryKey: ["domain-hierarchy", domainId],
    queryFn: () => fetchDomainHierarchy(domainId),
    enabled: !!domainId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to fetch tenant hierarchy
export const useFetchTenantHierarchy = (tenantId, options = {}) => {
  return useQuery({
    queryKey: ["tenant-hierarchy", tenantId],
    queryFn: () => fetchTenantHierarchy(tenantId),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2, // Shorter cache for hierarchy data
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to fetch subtenants
export const useFetchSubtenants = (parentTenantId = null, options = {}) => {
  return useQuery({
    queryKey: ["subtenants", parentTenantId],
    queryFn: () => fetchSubtenants(parentTenantId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to create subtenant
export const useCreateSubtenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubtenant,
    onSuccess: () => {
      queryClient.invalidateQueries(["subtenants"]);
      queryClient.invalidateQueries(["tenants"]);
      queryClient.invalidateQueries(["tenant-hierarchy"]);
    },
    onError: (error) => {
      console.error("Error creating subtenant:", error);
    },
  });
};

// Hook to fetch subtenant by ID
export const useFetchSubtenantById = (identifier, options = {}) => {
  return useQuery({
    queryKey: ["subtenants", identifier],
    queryFn: () => fetchSubtenantById(identifier),
    enabled: !!identifier,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to update subtenant
export const useUpdateSubtenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSubtenant,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["subtenants"]);
      queryClient.invalidateQueries(["subtenants", variables.identifier]);
      queryClient.invalidateQueries(["tenant-hierarchy"]);
      queryClient.invalidateQueries(["tenants"]);
    },
    onError: (error) => {
      console.error("Error updating subtenant:", error);
    },
  });
};

// Hook to delete subtenant
export const useDeleteSubtenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubtenant,
    onSuccess: () => {
      queryClient.invalidateQueries(["subtenants"]);
      queryClient.invalidateQueries(["tenant-hierarchy"]);
      queryClient.invalidateQueries(["tenants"]);
    },
    onError: (error) => {
      console.error("Error deleting subtenant:", error);
    },
  });
};

// Hook to sync project policies
export const useSyncProjectPolicies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncProjectPolicies,
    onSuccess: () => {
      queryClient.invalidateQueries(["user-policies"]);
      queryClient.invalidateQueries(["projects"]);
    },
    onError: (error) => {
      console.error("Error syncing project policies:", error);
    },
  });
};

// Hook to assign user policies
export const useAssignUserPolicies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignUserPolicies,
    onSuccess: () => {
      queryClient.invalidateQueries(["user-policies"]);
    },
    onError: (error) => {
      console.error("Error assigning user policies:", error);
    },
  });
};

// Hook to fetch user policies
export const useFetchUserPolicies = ({ userId, projectId }, options = {}) => {
  return useQuery({
    queryKey: ["user-policies", userId, projectId],
    queryFn: () => fetchUserPolicies({ userId, projectId }),
    enabled: !!(userId && projectId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};