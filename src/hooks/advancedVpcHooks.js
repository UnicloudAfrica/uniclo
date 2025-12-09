import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

/**
 * Advanced VPC Hooks
 *
 * These hooks provide functionality for advanced VPC features including:
 * - NAT Gateways
 * - Network ACLs
 * - VPC Security Posture
 * - VPC Peering Connections
 * - VPC Endpoints
 * - VPC Flow Logs
 */

// ================================
// NAT Gateway Operations
// ================================

const fetchNatGateways = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentApi(
    "GET",
    `/business/nat-gateways${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch NAT gateways");
  return res;
};

const fetchNatGatewayById = async (id) => {
  const res = await silentApi("GET", `/business/nat-gateways/${id}`);
  if (!res.data) throw new Error(`Failed to fetch NAT gateway with ID ${id}`);
  return res.data;
};

const createNatGateway = async (gatewayData) => {
  const res = await api("POST", "/business/nat-gateways", gatewayData);
  if (!res.data) throw new Error("Failed to create NAT gateway");
  return res.data;
};

const updateNatGateway = async ({ id, gatewayData }) => {
  const res = await api("PATCH", `/business/nat-gateways/${id}`, gatewayData);
  if (!res.data) throw new Error(`Failed to update NAT gateway with ID ${id}`);
  return res.data;
};

const deleteNatGateway = async (id) => {
  const res = await api("DELETE", `/business/nat-gateways/${id}`);
  if (!res.data) throw new Error(`Failed to delete NAT gateway with ID ${id}`);
  return res.data;
};

const attachNatGateway = async ({ id, attachmentData }) => {
  const res = await api("POST", `/business/nat-gateways/${id}/attach`, attachmentData);
  if (!res.data) throw new Error(`Failed to attach NAT gateway with ID ${id}`);
  return res.data;
};

const detachNatGateway = async ({ id, detachmentData }) => {
  const res = await api("POST", `/business/nat-gateways/${id}/detach`, detachmentData);
  if (!res.data) throw new Error(`Failed to detach NAT gateway with ID ${id}`);
  return res.data;
};

// ================================
// Network ACL Operations
// ================================

const fetchNetworkAcls = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentApi(
    "GET",
    `/business/network-acls${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch Network ACLs");
  return res;
};

const fetchNetworkAclById = async (id) => {
  const res = await silentApi("GET", `/business/network-acls/${id}`);
  if (!res.data) throw new Error(`Failed to fetch Network ACL with ID ${id}`);
  return res.data;
};

const createNetworkAcl = async (aclData) => {
  const res = await api("POST", "/business/network-acls", aclData);
  if (!res.data) throw new Error("Failed to create Network ACL");
  return res.data;
};

const updateNetworkAcl = async ({ id, aclData }) => {
  const res = await api("PATCH", `/business/network-acls/${id}`, aclData);
  if (!res.data) throw new Error(`Failed to update Network ACL with ID ${id}`);
  return res.data;
};

const deleteNetworkAcl = async (id) => {
  const res = await api("DELETE", `/business/network-acls/${id}`);
  if (!res.data) throw new Error(`Failed to delete Network ACL with ID ${id}`);
  return res.data;
};

// ================================
// VPC Security Posture Operations
// ================================

const fetchVpcSecurityPostures = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentApi(
    "GET",
    `/business/vpc-security-postures${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch VPC security postures");
  return res;
};

const fetchVpcSecurityPostureById = async (id) => {
  const res = await silentApi("GET", `/business/vpc-security-postures/${id}`);
  if (!res.data) throw new Error(`Failed to fetch VPC security posture with ID ${id}`);
  return res.data;
};

const refreshSecurityPosture = async ({ id, refreshData }) => {
  const res = await api("POST", `/business/vpc-security-postures/${id}/refresh`, refreshData);
  if (!res.data) throw new Error(`Failed to refresh security posture with ID ${id}`);
  return res.data;
};

const assessSecurityPosture = async ({ id, assessmentData }) => {
  const res = await api("POST", `/business/vpc-security-postures/${id}/assess`, assessmentData);
  if (!res.data) throw new Error(`Failed to assess security posture with ID ${id}`);
  return res.data;
};

// ================================
// VPC Peering Operations
// ================================

const fetchVpcPeerings = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentApi(
    "GET",
    `/business/vpc-peering-connections${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch VPC peering connections");
  return res;
};

const fetchVpcPeeringById = async (id) => {
  const res = await silentApi("GET", `/business/vpc-peering-connections/${id}`);
  if (!res.data) throw new Error(`Failed to fetch VPC peering connection with ID ${id}`);
  return res.data;
};

const createVpcPeering = async (peeringData) => {
  const res = await api("POST", "/business/vpc-peering-connections", peeringData);
  if (!res.data) throw new Error("Failed to create VPC peering connection");
  return res.data;
};

const acceptVpcPeering = async ({ id, acceptanceData }) => {
  const res = await api("POST", `/business/vpc-peering-connections/${id}/accept`, acceptanceData);
  if (!res.data) throw new Error(`Failed to accept VPC peering connection with ID ${id}`);
  return res.data;
};

const rejectVpcPeering = async ({ id, rejectionData }) => {
  const res = await api("POST", `/business/vpc-peering-connections/${id}/reject`, rejectionData);
  if (!res.data) throw new Error(`Failed to reject VPC peering connection with ID ${id}`);
  return res.data;
};

// ================================
// VPC Endpoints Operations
// ================================

const fetchVpcEndpoints = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentApi(
    "GET",
    `/business/vpc-endpoints${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch VPC endpoints");
  return res;
};

const createVpcEndpoint = async (endpointData) => {
  const res = await api("POST", "/business/vpc-endpoints", endpointData);
  if (!res.data) throw new Error("Failed to create VPC endpoint");
  return res.data;
};

// ================================
// HOOKS
// ================================

// NAT Gateway Hooks
export const useFetchNatGateways = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["nat-gateways", params],
    queryFn: () => fetchNatGateways(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchNatGatewayById = (id, options = {}) => {
  return useQuery({
    queryKey: ["nat-gateway", id],
    queryFn: () => fetchNatGatewayById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateNatGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNatGateway,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nat-gateways"] });
    },
    onError: (error) => {
      console.error("Error creating NAT gateway:", error);
    },
  });
};

export const useUpdateNatGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNatGateway,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nat-gateways"] });
      queryClient.invalidateQueries({ queryKey: ["nat-gateway", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating NAT gateway:", error);
    },
  });
};

export const useAttachNatGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachNatGateway,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nat-gateways"] });
      queryClient.invalidateQueries({ queryKey: ["nat-gateway", variables.id] });
    },
    onError: (error) => {
      console.error("Error attaching NAT gateway:", error);
    },
  });
};

// Network ACL Hooks
export const useFetchNetworkAcls = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["network-acls", params],
    queryFn: () => fetchNetworkAcls(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateNetworkAcl = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNetworkAcl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network-acls"] });
    },
    onError: (error) => {
      console.error("Error creating Network ACL:", error);
    },
  });
};

// VPC Security Posture Hooks
export const useFetchVpcSecurityPostures = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["vpc-security-postures", params],
    queryFn: () => fetchVpcSecurityPostures(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useRefreshSecurityPosture = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshSecurityPosture,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vpc-security-postures"] });
      queryClient.invalidateQueries({ queryKey: ["vpc-security-posture", variables.id] });
    },
    onError: (error) => {
      console.error("Error refreshing security posture:", error);
    },
  });
};

export const useAssessSecurityPosture = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assessSecurityPosture,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vpc-security-postures"] });
      queryClient.invalidateQueries({ queryKey: ["vpc-security-posture", variables.id] });
    },
    onError: (error) => {
      console.error("Error assessing security posture:", error);
    },
  });
};

// VPC Peering Hooks
export const useFetchVpcPeerings = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["vpc-peering-connections", params],
    queryFn: () => fetchVpcPeerings(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateVpcPeering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVpcPeering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpc-peering-connections"] });
    },
    onError: (error) => {
      console.error("Error creating VPC peering connection:", error);
    },
  });
};

export const useAcceptVpcPeering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptVpcPeering,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vpc-peering-connections"] });
      queryClient.invalidateQueries({ queryKey: ["vpc-peering-connection", variables.id] });
    },
    onError: (error) => {
      console.error("Error accepting VPC peering connection:", error);
    },
  });
};

export const useRejectVpcPeering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectVpcPeering,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vpc-peering-connections"] });
      queryClient.invalidateQueries({ queryKey: ["vpc-peering-connection", variables.id] });
    },
    onError: (error) => {
      console.error("Error rejecting VPC peering connection:", error);
    },
  });
};

// VPC Endpoints Hooks
export const useFetchVpcEndpoints = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["vpc-endpoints", params],
    queryFn: () => fetchVpcEndpoints(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateVpcEndpoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVpcEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpc-endpoints"] });
    },
    onError: (error) => {
      console.error("Error creating VPC endpoint:", error);
    },
  });
};
