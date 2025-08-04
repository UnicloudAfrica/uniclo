import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

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
  if (!res.data) {
    throw new Error("Failed to fetch lead statistics");
  }

  return res.data;
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

// POST: Create a new Lead Stage
const createCustomStage = async (leadData) => {
  const res = await api("POST", "/lead-stage", leadData);
  if (!res.data) {
    throw new Error("Failed to create Lead Stage");
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
//  hook to create custom stage
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
