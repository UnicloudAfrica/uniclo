import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import fileApi from "../../index/admin/fileapi";

// GET: Fetch all leads
const fetchLeads = async () => {
  const res = await silentApi("GET", "/leads");
  if (!res.data) {
    throw new Error("Failed to fetch leads");
  }

  return res.data;
};
// GET: Fetch lead stats
const fetchLeadStats = async () => {
  const res = await silentApi("GET", "/lead-statistics");
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
  const res = await silentApi("GET", "/lead-types");
  return extractLeadTypes(res);
};

// const fetchLeads = async (params = {}) => {
//   const defaultParams = {
//     per_page: 10,
//   };

//   const queryParams = { ...defaultParams, ...params };

//   const queryString = Object.keys(queryParams)
//     .filter(
//       (key) => queryParams[key] !== undefined && queryParams[key] !== null
//     )
//     .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
//     .join("&");

//   const uri = `/leads${queryString ? `?${queryString}` : ""}`;

//   const res = await silentApi("GET", uri);
//   if (!res.data) {
//     throw new Error("Failed to fetch leads");
//   }
//   return res;
// };

// GET: Fetch lead by ID
const fetchLeadById = async (id) => {
  const res = await silentApi("GET", `/leads/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch lead with ID ${id}`);
  }

  return res.data;
};
// GET: Download doc
const downloadDoc = async (id) => {
  try {
    const res = await silentApi("GET", `/lead-download-document/${id}`);
    console.log("Downloaded data type:", typeof res); // Should be "object" for ArrayBuffer
    console.log("Downloaded data length:", res.byteLength || res.length); // Size of binary data
    if (!res) {
      throw new Error(`Failed to fetch doc with ID ${id}`);
    }
    return res; // Return ArrayBuffer
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};

// PATCH: Update a lead
const updateLead = async ({ id, leadData }) => {
  const res = await api("PATCH", `/leads/${id}`, leadData);
  if (!res.data) {
    throw new Error(`Failed to update lead with ID ${id}`);
  }
  return res.data;
};
// PATCH: Update a lead stage
const updateLeadStage = async ({ id, stageData }) => {
  const res = await api("PATCH", `/lead-stage/${id}`, stageData);
  if (!res.data) {
    throw new Error(`Failed to update lead with ID ${id}`);
  }
  return res.data;
};
// PATCH: Update a doc
const updateDocument = async ({ id, docData }) => {
  const res = await api("PATCH", `/lead-review-document/${id}`, docData);
  if (!res) {
    throw new Error(`Failed to update doc with ID ${id}`);
  }
  return res;
};

// POST: Create a new Lead
const createNewLead = async (leadData) => {
  const res = await api("POST", "/leads", leadData);
  if (!res.data) {
    throw new Error("Failed to create Lead ");
  }
  return res.data;
};
// POST: Create a new Lead Stage
const createCustomStage = async (leadData) => {
  const res = await api("POST", "/lead-stage", leadData);
  if (!res.data) {
    throw new Error("Failed to create Lead Stage");
  }
  return res.data;
};
// POST: post a new Lead doc
const addLeadDoc = async (leadData) => {
  const res = await api("POST", "/lead-documents", leadData);
  if (!res.data) {
    throw new Error("Failed to create Lead doc");
  }
  return res.data;
};

const convertLeadToUser = async (id) => {
  const res = await api("GET", `/lead-convert-to-user/${id}`);
  if (!res.data) {
    throw new Error(`Failed to convert lead with ID ${id} to user`);
  }
  return res.data;
};

// Hook to fetch all leads
export const useFetchLeads = (options = {}) => {
  return useQuery({
    queryKey: ["admin-leads"],
    queryFn: fetchLeads,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch lead stats
export const useFetchLeadStats = (options = {}) => {
  return useQuery({
    queryKey: ["admin-lead-stats"],
    queryFn: fetchLeadStats,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchLeadTypes = (options = {}) => {
  return useQuery({
    queryKey: ["admin-lead-types"],
    queryFn: fetchLeadTypes,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// export const useFetchLeads = (params = {}, options = {}) => {
//   return useQuery({
//     queryKey: ["admin-leads", params],
//     // Pass params to the queryFn
//     queryFn: () => fetchLeads(params),
//     staleTime: 1000 * 60 * 5, // Cache for 5 minutes
//     refetchOnWindowFocus: false,
//     ...options,
//   });
// };

// Hook to fetch lead by ID
export const useFetchLeadById = (id, options = {}) => {
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
export const useDownloadDoc = (id, options = {}) => {
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
export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLead,
    onSuccess: (data, variables) => {
      // Invalidate both Leads list and specific Lead query
      queryClient.invalidateQueries(["admin-leads"]);
      queryClient.invalidateQueries(["admin-lead", variables.id]);
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
      queryClient.invalidateQueries(["admin-leads-stage"]);
      queryClient.invalidateQueries(["admin-lead-stage", variables.id]);
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
      queryClient.invalidateQueries(["admin-leads"]);
      queryClient.invalidateQueries(["admin-leads-stage"]);
      queryClient.invalidateQueries(["admin-lead-stage", variables.id]);
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
      queryClient.invalidateQueries(["admin-leads"]);
      queryClient.invalidateQueries(["admin-leads-stage"]);
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
      queryClient.invalidateQueries(["admin-leads"]);
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

      queryClient.invalidateQueries({ queryKey: ["admin-lead", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries(["clients"]);
      // console.log(`Lead with ID ${id} successfully converted to user.`);
    },

    onError: (error) => {
      // console.error("Error converting lead to user:", error);
    },
  });
};
