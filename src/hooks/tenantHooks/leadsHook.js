import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenant from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import config from "../../config";
import useTenantAuthStore from "../../stores/tenantAuthStore";

// GET: Fetch all leads
const fetchLeads = async () => {
  const res = await silentTenant("GET", "/leads");
  if (!res.data) {
    throw new Error("Failed to fetch leads");
  }

  return res.data;
};

// GET: Fetch lead stats
const fetchLeadStats = async () => {
  const res = await silentTenant("GET", "/lead-statistics");
  if (!res) {
    throw new Error("Failed to fetch lead statistics");
  }

  return res;
};

const extractLeadTypes = (payload) => {
  const sources = [
    payload,
    payload?.data,
    payload?.message,
    payload?.data?.data,
    payload?.data?.lead_types,
    payload?.lead_types,
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
const fetchLeadById = async (id) => {
  const res = await silentTenant("GET", `/leads/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch lead with ID ${id}`);
  }

  return res.data;
};

const extractFileNameFromDisposition = (header) => {
  if (!header) return null;
  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch && utfMatch[1]) {
    return decodeURIComponent(utfMatch[1]);
  }
  const asciiMatch = header.match(/filename="?([^";]+)"?/i);
  return asciiMatch ? asciiMatch[1] : null;
};

const downloadDoc = async (id) => {
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
    } catch (err) {
      console.error("Unable to read tenant download error response", err);
    }
    throw new Error(message || "Failed to download document");
  }

  const blob = await response.blob();
  const contentType = response.headers.get("Content-Type") || "application/octet-stream";
  const fileName = extractFileNameFromDisposition(response.headers.get("Content-Disposition"));

  return {
    blob,
    contentType,
    fileName,
  };
};

// PATCH: Update a lead
const updateLead = async ({ id, leadData }) => {
  const res = await tenantApi("PATCH", `/leads/${id}`, leadData);
  if (!res.data) {
    throw new Error(`Failed to update lead with ID ${id}`);
  }
  return res.data;
};

// PATCH: Update a lead stage
const updateLeadStage = async ({ id, stageData }) => {
  const res = await tenantApi("PATCH", `/lead-stage/${id}`, stageData);
  if (!res.data) {
    throw new Error(`Failed to update lead with ID ${id}`);
  }
  return res.data;
};

// PATCH: Update a doc
const updateDocument = async ({ id, docData }) => {
  const res = await tenantApi("PATCH", `/lead-review-document/${id}`, docData);
  if (!res) {
    throw new Error(`Failed to update doc with ID ${id}`);
  }
  return res;
};

// POST: Create a new Lead
const createNewLead = async (leadData) => {
  const res = await tenantApi("POST", "/leads", leadData);
  if (!res.data) {
    throw new Error("Failed to create Lead ");
  }
  return res.data;
};

// POST: Create a new Lead Stage
const createCustomStage = async (leadData) => {
  const res = await tenantApi("POST", "/lead-stage", leadData);
  if (!res.data) {
    throw new Error("Failed to create Lead Stage");
  }
  return res.data;
};

// POST: post a new Lead doc
const addLeadDoc = async (leadData) => {
  const res = await tenantApi("POST", "/lead-documents", leadData);
  if (!res.data) {
    throw new Error("Failed to create Lead doc");
  }
  return res.data;
};

const convertLeadToUser = async (id) => {
  const res = await tenantApi("GET", `/lead-convert-to-user/${id}`);
  if (!res.data) {
    throw new Error(`Failed to convert lead with ID ${id} to user`);
  }
  return res.data;
};

// Hook to fetch all leads
export const useFetchLeads = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-leads"],
    queryFn: fetchLeads,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch lead stats
export const useFetchLeadStats = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-lead-stats"],
    queryFn: fetchLeadStats,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchLeadTypes = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-lead-types"],
    queryFn: fetchLeadTypes,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch lead by ID
export const useFetchLeadById = (id, options = {}) => {
  return useQuery({
    queryKey: ["tenant-lead", id],
    queryFn: () => fetchLeadById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to download doc
export const useDownloadDoc = (id, options = {}) => {
  return useQuery({
    queryKey: ["tenant-download-doc", id],
    queryFn: () => downloadDoc(id),
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
    onSuccess: (data, variables) => {
      // Invalidate both Leads list and specific Lead query
      queryClient.invalidateQueries(["tenant-leads"]);
      queryClient.invalidateQueries(["tenant-lead", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating lead:", error);
    },
  });
};

// Hook to update a lead stage
export const useUpdateLeadStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLeadStage,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["tenant-leads-stage"]);
      queryClient.invalidateQueries(["tenant-lead-stage", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating lead:", error);
    },
  });
};

// Hook to update a doc
export const useUpdateDoc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["tenant-leads"]);
      queryClient.invalidateQueries(["tenant-leads-stage"]);
      queryClient.invalidateQueries(["tenant-lead-stage", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating doc:", error);
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
      queryClient.invalidateQueries(["tenant-leads"]);
      queryClient.invalidateQueries(["tenant-leads-stage"]);
    },
    onError: (error) => {
      console.error("Error creating Lead:", error);
    },
  });
};

export const useCreateCustomStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomStage,
    onSuccess: () => {
      // Invalidate CustomStages query to refresh the list
      queryClient.invalidateQueries(["Custom-Stage"]);
    },
    onError: (error) => {
      console.error("Error creating Custom-Stage:", error);
    },
  });
};

export const useAddLeadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addLeadDoc,
    onSuccess: () => {
      // Invalidate CustomStages query to refresh the list
      queryClient.invalidateQueries(["tenant-leads"]);
    },
    onError: (error) => {
      console.error("Error creating lead doc:", error);
    },
  });
};

export const useConvertLeadToUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => convertLeadToUser(id),

    onSuccess: (data, variables) => {
      const id = variables;

      queryClient.invalidateQueries({ queryKey: ["tenant-lead", id] });
      queryClient.invalidateQueries({ queryKey: ["tenant-leads"] });
      queryClient.invalidateQueries(["clients"]);
      // console.log(`Lead with ID ${id} successfully converted to user.`);
    },

    onError: (error) => {
      // console.error("Error converting lead to user:", error);
    },
  });
};
