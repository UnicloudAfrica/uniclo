import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const buildQueryString = ({ region, page, perPage, search }) => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (page) params.append("page", page);
  if (perPage) params.append("per_page", perPage);
  if (search) params.append("search", search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (res) => {
  if (!res) {
    throw new Error("Unexpected response from server");
  }
  return {
    data: res.data ?? [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const fetchEbsVolumes = async ({ region, page, perPage, search }) => {
  const queryString = buildQueryString({ region, page, perPage, search });
  const res = await silentApi("GET", `/product-volume-type${queryString}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch EBS volumes");
  }
  return payload;
};

const fetchEbsVolumeById = async (id) => {
  const res = await silentApi("GET", `/product-volume-type/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to fetch EBS volume with ID ${id}`);
  }
  return res.data;
};

const createEbsVolume = async (volumeData) => {
  const res = await api("POST", "/product-volume-type", volumeData);
  if (!res?.data) {
    throw new Error("Failed to create EBS volume");
  }
  return res.data;
};

const updateEbsVolume = async ({ id, volumeData }) => {
  const res = await api("PATCH", `/product-volume-type/${id}`, volumeData);
  if (!res?.data) {
    throw new Error(`Failed to update EBS volume with ID ${id}`);
  }
  return res.data;
};

const deleteEbsVolume = async (id) => {
  const res = await api("DELETE", `/product-volume-type/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to delete EBS volume with ID ${id}`);
  }
  return res.data;
};

export const useFetchEbsVolumes = (
  region,
  { page = 1, perPage = 10, search = "" } = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["ebsVolumes", region, page, perPage, search],
    queryFn: () => fetchEbsVolumes({ region, page, perPage, search }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchEbsVolumeById = (id, options = {}) => {
  return useQuery({
    queryKey: ["ebsVolume", id],
    queryFn: () => fetchEbsVolumeById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEbsVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebsVolumes"] });
    },
    onError: (error) => {
      console.error("Error creating EBS volume:", error);
    },
  });
};

export const useUpdateEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEbsVolume,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ebsVolumes"] });
      queryClient.invalidateQueries({
        queryKey: ["ebsVolume", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating EBS volume:", error);
    },
  });
};

export const useDeleteEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEbsVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebsVolumes"] });
    },
    onError: (error) => {
      console.error("Error deleting EBS volume:", error);
    },
  });
};

