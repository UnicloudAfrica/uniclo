import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenant from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import config from "../../config";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { ApiResponse } from "../../shared/types/resource";

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type QueryOptions = Record<string, unknown>;
type LeadPayload = Record<string, unknown>;

type LeadUpdateInput = {
  id: string;
  leadData: LeadPayload;
};

type LeadStageUpdateInput = {
  id: string;
  stageData: LeadPayload;
};

type LeadDocUpdateInput = {
  id: string;
  docData: LeadPayload;
};

// GET: Fetch all leads with optional filters
const fetchLeads = async (params: QueryParams = {}) => {
  const queryParams = Object.keys(params)
    .filter(
      (key) =>
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== "" &&
        params[key] !== "all"
    )
    .map((key) => {
      const value = params[key] as string | number | boolean;
      return `${key}=${encodeURIComponent(value)}`;
    })
    .join("&");

  const uri = queryParams ? `/leads?${queryParams}` : "/leads";
  const res = await silentTenant<ApiResponse<unknown[]>>("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch leads");
  }

  return res.data;
};

// GET: Fetch lead stats
const fetchLeadStats = async () => {
  const res = await silentTenant<ApiResponse<unknown>>("GET", "/lead-statistics");
  if (!res) {
    throw new Error("Failed to fetch lead statistics");
  }

  return res;
};

const extractLeadTypes = (payload: unknown) => {
  const toRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  const payloadRecord = toRecord(payload);
  const dataRecord = toRecord(payloadRecord["data"]);
  const sources = [
    payload,
    payloadRecord["data"],
    payloadRecord["message"],
    dataRecord["data"],
    dataRecord["lead_types"],
    payloadRecord["lead_types"],
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source;
    }
  }

  return [];
};

const fetchLeadTypes = async () => {
  const res = await silentTenant("GET", "/lead-types");
  return extractLeadTypes(res);
};

// GET: Fetch lead by ID
const fetchLeadById = async (id: string) => {
  const res = await silentTenant<ApiResponse<Record<string, unknown>>>("GET", `/leads/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch lead with ID ${id}`);
  }

  return res.data;
};

const extractFileNameFromDisposition = (header: string | null): string | null => {
  if (!header) return null;
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }
  const asciiMatch = /filename="?([^";]+)"?/i.exec(header);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }
  return null;
};

const downloadDoc = async (id: string) => {
  if (!id) {
    throw new Error("Document identifier is required");
  }

  const tenantState = useTenantAuthStore.getState();
  const baseHeaders = tenantState?.getAuthHeaders ? tenantState.getAuthHeaders() : {};
  const response = await fetch(`${config.tenantURL}/lead-documents/${id}/download`, {
    method: "GET",
    headers: {
      ...baseHeaders,
      Accept: "application/octet-stream,application/pdf,image/*,*/*",
    },
    credentials: "include",
  });

  if (!response.ok) {
    let message = "Failed to download document";
    try {
      message = await response.text();
    } catch {
      // Ignored: fallback to default message
    }
    throw new Error(message || "Failed to download document");
  }

  const blob = await response.blob();
  const contentType = response.headers.get("Content-Type") || "application/octet-stream";
  const fileName =
    extractFileNameFromDisposition(response.headers.get("Content-Disposition")) ||
    `tenant-document-${id}`;

  return {
    blob,
    contentType,
    fileName,
  };
};

// PATCH: Update a lead
const updateLead = async ({ id, leadData }: LeadUpdateInput) => {
  const res = (await tenantApi("PATCH", `/leads/${id}`, leadData)) as ApiResponse<
    Record<string, unknown>
  >;
  if (!res.data) {
    throw new Error(`Failed to update lead with ID ${id}`);
  }
  return res.data;
};

// PATCH: Update a lead stage
const updateLeadStage = async ({ id, stageData }: LeadStageUpdateInput) => {
  const res = (await tenantApi("PATCH", `/lead-stage/${id}`, stageData)) as ApiResponse<
    Record<string, unknown>
  >;
  if (!res.data) {
    throw new Error(`Failed to update lead with ID ${id}`);
  }
  return res.data;
};

// PATCH: Update a doc
const updateDocument = async ({ id, docData }: LeadDocUpdateInput) => {
  const res = (await tenantApi("PATCH", `/lead-review-document/${id}`, docData)) as ApiResponse<
    Record<string, unknown>
  >;
  if (!res) {
    throw new Error(`Failed to update doc with ID ${id}`);
  }
  return res;
};

// POST: Create a new Lead
const createNewLead = async (leadData: LeadPayload) => {
  const res = (await tenantApi("POST", "/leads", leadData)) as ApiResponse<Record<string, unknown>>;
  if (!res.data) {
    throw new Error("Failed to create Lead ");
  }
  return res.data;
};

// POST: Create a new Lead Stage
const createCustomStage = async (leadData: LeadPayload) => {
  const res = (await tenantApi("POST", "/lead-stage", leadData)) as ApiResponse<
    Record<string, unknown>
  >;
  if (!res.data) {
    throw new Error("Failed to create Lead Stage");
  }
  return res.data;
};

// POST: post a new Lead doc
const addLeadDoc = async (leadData: LeadPayload) => {
  const res = (await tenantApi("POST", "/lead-documents", leadData)) as ApiResponse<
    Record<string, unknown>
  >;
  if (!res.data) {
    throw new Error("Failed to create Lead doc");
  }
  return res.data;
};

const convertLeadToUser = async (id: string) => {
  const res = (await tenantApi("GET", `/lead-convert-to-user/${id}`)) as ApiResponse<
    Record<string, unknown>
  >;
  if (!res.data) {
    throw new Error(`Failed to convert lead with ID ${id} to user`);
  }
  return res.data;
};

// Hook to fetch all leads
export const useFetchLeads = (params: QueryParams = {}, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tenant-leads", params],
    queryFn: () => fetchLeads(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch lead stats
export const useFetchLeadStats = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tenant-lead-stats"],
    queryFn: fetchLeadStats,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchLeadTypes = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tenant-lead-types"],
    queryFn: fetchLeadTypes,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch lead by ID
export const useFetchLeadById = (id: string | null | undefined, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tenant-lead", id],
    queryFn: () => fetchLeadById(id as string),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to download doc
export const useDownloadDoc = (id: string | null | undefined, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tenant-download-doc", id],
    queryFn: () => downloadDoc(id as string),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to update a lead
export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLead,
    onSuccess: (_, variables) => {
      // Invalidate both Leads list and specific Lead query
      queryClient.invalidateQueries({ queryKey: ["tenant-leads"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-lead", variables.id] });
    },
    onError: () => {
      // Error handled by react-query
    },
  });
};

// Hook to update a lead stage
export const useUpdateLeadStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLeadStage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-leads-stage"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-lead-stage", variables.id] });
    },
    onError: () => {
      // Error handled by react-query
    },
  });
};

// Hook to update a doc
export const useUpdateDoc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-leads"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-leads-stage"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-lead-stage", variables.id] });
    },
    onError: () => {
      // Error handled by react-query
    },
  });
};

//  hook to create custom stage
export const useCreateNewLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNewLead,
    onSuccess: () => {
      // Invalidate CustomStages query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["tenant-leads"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-leads-stage"] });
    },
    onError: () => {
      // Error handled by react-query
    },
  });
};

export const useCreateCustomStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomStage,
    onSuccess: () => {
      // Invalidate CustomStages query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["Custom-Stage"] });
    },
    onError: () => {
      // Error handled by react-query
    },
  });
};

export const useAddLeadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addLeadDoc,
    onSuccess: () => {
      // Invalidate CustomStages query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["tenant-leads"] });
    },
    onError: () => {
      // Error handled by react-query
    },
  });
};

export const useConvertLeadToUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => convertLeadToUser(id),

    onSuccess: (_, variables) => {
      const id = variables;

      queryClient.invalidateQueries({ queryKey: ["tenant-lead", id] });
      queryClient.invalidateQueries({ queryKey: ["tenant-leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },

    onError: () => {
      // Error handled by react-query
    },
  });
};
