import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import { apiRegistry } from "@/shared/api/apiRegistry";
import { ApiResponse } from "@/shared/types/resource";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Id = string | number;
type ApiPayload = Record<string, unknown>;
type QueryParams = Record<string, string | number | boolean | null | undefined>;

type ApiClient = <T = unknown>(
  method: HttpMethod,
  uri: string,
  body?: ApiPayload | null
) => Promise<T>;

export interface LeadStageData {
  stage_name: string;
  description: string;
  assigned_to: string;
  status: string;
}

export interface LeadUser {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface Lead {
  id: Id;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  lead_type: string;
  status: string;
  source?: string;
  notes?: string;
  assigned_to?: string | LeadUser | null;
  follow_up_date?: string;
  last_contacted_at?: string;
  lead_stage?: LeadStageData;
  created_at?: string;
  updated_at?: string;
}

export type LeadCreatePayload = Omit<Lead, "id" | "created_at" | "updated_at" | "lead_stage"> & {
  lead_stage?: LeadStageData;
};

export type LeadUpdateData = Partial<LeadCreatePayload>;

export interface LeadAssigneeOption {
  value: string;
  label: string;
}

export type UpdateLeadPayload = {
  id: Id;
  leadData: LeadUpdateData;
};
export type UpdateLeadStagePayload = {
  id: Id;
  stageData: Partial<LeadStageData>;
};
export type UpdateLeadDocumentPayload = {
  id: Id;
  docData: Record<string, unknown>;
};

const requestAdmin = async <T>(
  client: ApiClient,
  method: HttpMethod,
  uri: string,
  body?: ApiPayload
): Promise<ApiResponse<T>> => client<ApiResponse<T>>(method, uri, body ?? null);

const requireData = <T>(res: ApiResponse<T>, message: string): T => {
  if (!res.data) {
    throw new Error(message);
  }
  return res.data;
};

const buildQueryString = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    if (typeof value === "string" && value.toLowerCase() === "all") return false;
    return true;
  });

  if (entries.length === 0) return "";
  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
};

// GET: Fetch all leads with optional filters
const fetchLeads = async (params: QueryParams = {}): Promise<Lead[]> => {
  const queryString = buildQueryString(params);
  const uri = queryString ? `/leads?${queryString}` : "/leads";

  const res = await requestAdmin<Lead[]>(silentApi, "GET", uri);
  return requireData(res, "Failed to fetch leads");
};

// GET: Fetch lead stats
const fetchLeadStats = async (): Promise<ApiResponse<unknown>> => {
  return requestAdmin(silentApi, "GET", "/lead-statistics");
};

const extractLeadTypes = (payload: unknown): unknown[] => {
  const record = payload && typeof payload === "object" ? (payload as ApiResponse) : undefined;
  const dataRecord =
    record?.data && typeof record.data === "object" ? (record.data as ApiResponse) : undefined;

  const sources: unknown[] = [
    payload,
    record?.data,
    record?.message,
    dataRecord?.data,
    (dataRecord as Record<string, unknown>)?.["lead_types"],
    (record as Record<string, unknown>)?.["lead_types"],
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source;
    }
  }

  return [];
};

const fetchLeadTypes = async (): Promise<unknown[]> => {
  const res = await requestAdmin(silentApi, "GET", "/lead-types");
  return extractLeadTypes(res);
};

// GET: Fetch lead by ID
const fetchLeadById = async (id: Id): Promise<Lead> => {
  const res = await requestAdmin<Lead>(silentApi, "GET", `/leads/${id}`);
  return requireData(res, `Failed to fetch lead with ID ${id}`);
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

const downloadDoc = async (
  id: Id
): Promise<{ blob: Blob; contentType: string; fileName: string }> => {
  if (!id) {
    throw new Error("Document identifier is required");
  }

  // Routed via the unified fileApi (Week-3 cleanup) — shares auth +
  // CSRF + 401 redirect plumbing with every other registry call. We
  // need the full Response here because the filename comes from the
  // server's Content-Disposition header, so we use `getRaw`.
  const response = await apiRegistry.admin.fileApi.getRaw(`/lead-documents/${id}/download`);

  const blob = await response.blob();
  const contentType = response.headers.get("Content-Type") || "application/octet-stream";
  const fileName =
    extractFileNameFromDisposition(response.headers.get("Content-Disposition")) ||
    `lead-document-${id}`;

  return {
    blob,
    contentType,
    fileName,
  };
};

// PATCH: Update a lead
const updateLead = async ({ id, leadData }: UpdateLeadPayload): Promise<Lead> => {
  const res = await requestAdmin<Lead>(api, "PATCH", `/leads/${id}`, leadData as ApiPayload);
  return requireData(res, `Failed to update lead with ID ${id}`);
};
// PATCH: Update a lead stage
const updateLeadStage = async ({ id, stageData }: UpdateLeadStagePayload): Promise<Lead> => {
  const res = await requestAdmin<Lead>(api, "PATCH", `/lead-stage/${id}`, stageData as ApiPayload);
  return requireData(res, `Failed to update lead stage with ID ${id}`);
};
// PATCH: Update a doc
const updateDocument = async ({ id, docData }: UpdateLeadDocumentPayload): Promise<unknown> => {
  const res = await requestAdmin(
    api,
    "PATCH",
    `/lead-review-document/${id}`,
    docData as ApiPayload
  );
  if (!res.data) {
    throw new Error(`Failed to update document with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new Lead
const createNewLead = async (leadData: LeadCreatePayload): Promise<Lead> => {
  const res = await requestAdmin<Lead>(api, "POST", "/leads", leadData as unknown as ApiPayload);
  return requireData(res, "Failed to create lead");
};
// POST: Create a new Lead Stage
const createCustomStage = async (leadData: ApiPayload): Promise<unknown> => {
  const res = await requestAdmin(api, "POST", "/lead-stage", leadData);
  return requireData(res, "Failed to create lead stage");
};
// POST: post a new Lead doc
const addLeadDoc = async (leadData: ApiPayload): Promise<unknown> => {
  const res = await requestAdmin(api, "POST", "/lead-documents", leadData);
  return requireData(res, "Failed to create lead doc");
};

const convertLeadToUser = async (id: Id): Promise<unknown> => {
  const res = await requestAdmin(api, "GET", `/lead-convert-to-user/${id}`);
  return requireData(res, `Failed to convert lead with ID ${id} to user`);
};

// Hook to fetch all leads with optional filters
export const useFetchLeads = (
  params: QueryParams = {},
  options: Omit<UseQueryOptions<Lead[]>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["admin-leads", params],
    queryFn: () => fetchLeads(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch lead stats
export const useFetchLeadStats = (
  options: Omit<UseQueryOptions<ApiResponse<unknown>>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["admin-lead-stats"],
    queryFn: fetchLeadStats,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchLeadTypes = (
  options: Omit<UseQueryOptions<unknown[]>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["admin-lead-types"],
    queryFn: fetchLeadTypes,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch lead by ID
export const useFetchLeadById = (
  id: Id,
  options: Omit<UseQueryOptions<Lead>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["admin-lead", id],
    queryFn: () => fetchLeadById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to download doc
export const useDownloadDoc = (
  id: Id,
  options: Omit<
    UseQueryOptions<{ blob: Blob; contentType: string; fileName: string }>,
    "queryKey" | "queryFn"
  > = {}
) => {
  return useQuery({
    queryKey: ["admin-download-doc", id],
    queryFn: () => downloadDoc(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to update a lead
export const useUpdateLead = (
  options: Omit<UseMutationOptions<Lead, Error, UpdateLeadPayload>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<Lead, Error, UpdateLeadPayload>({
    mutationFn: updateLead,
    ...options,
    onSuccess: (data, variables, context) => {
      // Invalidate both Leads list and specific Lead query
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lead", variables.id] });
      if (options.onSuccess) {
        (options.onSuccess as unknown)(data, variables, context);
      }
    },
  });
};

// Hook to update a lead stage
export const useUpdateLeadStage = (
  options: Omit<UseMutationOptions<Lead, Error, UpdateLeadStagePayload>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<Lead, Error, UpdateLeadStagePayload>({
    mutationFn: updateLeadStage,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads-stage"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lead-stage", variables.id] });
      if (options.onSuccess) {
        (options.onSuccess as unknown)(data, variables, context);
      }
    },
  });
};
// Hook to update a doc
export const useUpdateDoc = (
  options: Omit<UseMutationOptions<unknown, Error, UpdateLeadDocumentPayload>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, UpdateLeadDocumentPayload>({
    mutationFn: updateDocument,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads-stage"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lead-stage", variables.id] });
      if (options.onSuccess) {
        (options.onSuccess as unknown)(data, variables, context);
      }
    },
  });
};

//  hook to create custom stage
export const useCreateNewLead = (
  options: Omit<UseMutationOptions<Lead, Error, LeadCreatePayload>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<Lead, Error, LeadCreatePayload>({
    mutationFn: createNewLead,
    ...options,
    onSuccess: (data, variables, context) => {
      // Invalidate CustomStages query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads-stage"] });
      if (options.onSuccess) {
        (options.onSuccess as unknown)(data, variables, context);
      }
    },
  });
};
export const useCreateCustomStage = (
  options: Omit<UseMutationOptions<unknown, Error, ApiPayload>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, ApiPayload>({
    mutationFn: createCustomStage,
    ...options,
    onSuccess: (data, variables, context) => {
      // Invalidate CustomStages query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["admin-lead-stage"] });
      if (options.onSuccess) {
        (options.onSuccess as unknown)(data, variables, context);
      }
    },
  });
};
export const useAddLeadDocument = (
  options: Omit<UseMutationOptions<unknown, Error, ApiPayload>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, ApiPayload>({
    mutationFn: addLeadDoc,
    ...options,
    onSuccess: (data, variables, context) => {
      // Invalidate CustomStages query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      if (options.onSuccess) {
        (options.onSuccess as unknown)(data, variables, context);
      }
    },
  });
};

export const useConvertLeadToUser = (
  options: Omit<UseMutationOptions<unknown, Error, Id>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, Id>({
    mutationFn: (id: Id) => convertLeadToUser(id),
    ...options,
    onSuccess: (data, id, context) => {
      queryClient.invalidateQueries({ queryKey: ["admin-lead", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (options.onSuccess) {
        (options.onSuccess as unknown)(data, id, context);
      }
    },
  });
};
