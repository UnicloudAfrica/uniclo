import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import ToastUtils from "../../utils/toastUtil";

const API_BASE = import.meta.env.VITE_API_ADMIN_URL || "/api/v1/admin";

// ==================== NAT Gateways ====================

export const useNatGateways = (projectId: string) => {
  return useQuery({
    queryKey: ["nat-gateways", projectId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/projects/${projectId}/nat-gateways`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateNatGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: { subnet_id: string; elastic_ip_id?: string; name?: string };
    }) => {
      const { data } = await axios.post(`${API_BASE}/projects/${projectId}/nat-gateways`, payload);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("NAT Gateway created successfully");
      queryClient.invalidateQueries({ queryKey: ["nat-gateways", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create NAT Gateway");
    },
  });
};

export const useDeleteNatGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      natGatewayId,
    }: {
      projectId: string;
      natGatewayId: string;
    }) => {
      await axios.delete(`${API_BASE}/projects/${projectId}/nat-gateways/${natGatewayId}`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("NAT Gateway deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["nat-gateways", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete NAT Gateway");
    },
  });
};

// ==================== Elastic IPs ====================

export const useElasticIps = (projectId: string) => {
  return useQuery({
    queryKey: ["elastic-ips", projectId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/projects/${projectId}/elastic-ips`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload?: { name?: string };
    }) => {
      const { data } = await axios.post(
        `${API_BASE}/projects/${projectId}/elastic-ips`,
        payload || {}
      );
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Elastic IP allocated successfully");
      queryClient.invalidateQueries({ queryKey: ["elastic-ips", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to allocate Elastic IP");
    },
  });
};

export const useAssociateElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      elasticIpId,
      payload,
    }: {
      projectId: string;
      elasticIpId: string;
      payload: { instance_id?: string; network_interface_id?: string };
    }) => {
      const { data } = await axios.post(
        `${API_BASE}/projects/${projectId}/elastic-ips/${elasticIpId}/associate`,
        payload
      );
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Elastic IP associated successfully");
      queryClient.invalidateQueries({ queryKey: ["elastic-ips", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to associate Elastic IP");
    },
  });
};

export const useDisassociateElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, elasticIpId }: { projectId: string; elasticIpId: string }) => {
      await axios.delete(
        `${API_BASE}/projects/${projectId}/elastic-ips/${elasticIpId}/disassociate`
      );
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Elastic IP disassociated successfully");
      queryClient.invalidateQueries({ queryKey: ["elastic-ips", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to disassociate Elastic IP");
    },
  });
};

export const useDeleteElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, elasticIpId }: { projectId: string; elasticIpId: string }) => {
      await axios.delete(`${API_BASE}/projects/${projectId}/elastic-ips/${elasticIpId}`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Elastic IP released successfully");
      queryClient.invalidateQueries({ queryKey: ["elastic-ips", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to release Elastic IP");
    },
  });
};

// ==================== Security Group Rules ====================

export const useSecurityGroupRules = (projectId: string, securityGroupId: string) => {
  return useQuery({
    queryKey: ["security-group-rules", projectId, securityGroupId],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_BASE}/projects/${projectId}/security-groups/${securityGroupId}/rules`
      );
      return data.data || { ingress_rules: [], egress_rules: [] };
    },
    enabled: !!projectId && !!securityGroupId,
  });
};

export const useAddSecurityGroupRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      securityGroupId,
      payload,
    }: {
      projectId: string;
      securityGroupId: string;
      payload: {
        direction: "ingress" | "egress";
        protocol: string;
        port_range_min?: number;
        port_range_max?: number;
        cidr?: string;
      };
    }) => {
      const { data } = await axios.post(
        `${API_BASE}/projects/${projectId}/security-groups/${securityGroupId}/rules`,
        payload
      );
      return data;
    },
    onSuccess: (_, { projectId, securityGroupId }) => {
      ToastUtils.success("Security group rule added successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-group-rules", projectId, securityGroupId],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to add security group rule");
    },
  });
};

export const useRemoveSecurityGroupRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      securityGroupId,
      payload,
    }: {
      projectId: string;
      securityGroupId: string;
      payload: {
        direction: "ingress" | "egress";
        protocol: string;
        port_range_min?: number;
        port_range_max?: number;
        cidr?: string;
      };
    }) => {
      await axios.delete(
        `${API_BASE}/projects/${projectId}/security-groups/${securityGroupId}/rules`,
        { data: payload }
      );
    },
    onSuccess: (_, { projectId, securityGroupId }) => {
      ToastUtils.success("Security group rule removed successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-group-rules", projectId, securityGroupId],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to remove security group rule");
    },
  });
};

// ==================== Subnets ====================

export const useSubnets = (projectId: string) => {
  return useQuery({
    queryKey: ["subnets", projectId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/projects/${projectId}/subnets`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: { name: string; cidr_block: string; vpc_id: string };
    }) => {
      const { data } = await axios.post(`${API_BASE}/projects/${projectId}/subnets`, payload);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Subnet created successfully");
      queryClient.invalidateQueries({ queryKey: ["subnets", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create subnet");
    },
  });
};

export const useUpdateSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      subnetId,
      payload,
    }: {
      projectId: string;
      subnetId: string;
      payload: { name?: string };
    }) => {
      const { data } = await axios.patch(
        `${API_BASE}/projects/${projectId}/subnets/${subnetId}`,
        payload
      );
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Subnet updated successfully");
      queryClient.invalidateQueries({ queryKey: ["subnets", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to update subnet");
    },
  });
};

export const useDeleteSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, subnetId }: { projectId: string; subnetId: string }) => {
      await axios.delete(`${API_BASE}/projects/${projectId}/subnets/${subnetId}`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Subnet deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["subnets", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete subnet");
    },
  });
};

// ==================== Route Tables ====================

export const useRouteTables = (projectId: string) => {
  return useQuery({
    queryKey: ["route-tables", projectId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/projects/${projectId}/route-tables`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: {
        route_table_id: string;
        destination_cidr_block: string;
        gateway_id?: string;
        nat_gateway_id?: string;
      };
    }) => {
      const { data } = await axios.post(`${API_BASE}/projects/${projectId}/routes`, payload);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Route created successfully");
      queryClient.invalidateQueries({ queryKey: ["route-tables", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create route");
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: { route_table_id: string; destination_cidr_block: string };
    }) => {
      await axios.delete(`${API_BASE}/projects/${projectId}/routes`, { data: payload });
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Route deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["route-tables", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete route");
    },
  });
};

export const useAssociateRouteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      routeTableId,
      subnetId,
    }: {
      projectId: string;
      routeTableId: string;
      subnetId: string;
    }) => {
      const { data } = await axios.post(
        `${API_BASE}/projects/${projectId}/route-tables/${routeTableId}/associate`,
        { subnet_id: subnetId }
      );
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Route table associated successfully");
      queryClient.invalidateQueries({ queryKey: ["route-tables", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to associate route table");
    },
  });
};

// ==================== Network ACLs ====================

export const useNetworkAcls = (projectId: string) => {
  return useQuery({
    queryKey: ["network-acls", projectId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/projects/${projectId}/network-acls`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateNetworkAcl = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: { vpc_id: string; name?: string };
    }) => {
      const { data } = await axios.post(`${API_BASE}/projects/${projectId}/network-acls`, payload);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Network ACL created successfully");
      queryClient.invalidateQueries({ queryKey: ["network-acls", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create Network ACL");
    },
  });
};

export const useDeleteNetworkAcl = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      networkAclId,
    }: {
      projectId: string;
      networkAclId: string;
    }) => {
      await axios.delete(`${API_BASE}/projects/${projectId}/network-acls/${networkAclId}`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Network ACL deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["network-acls", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete Network ACL");
    },
  });
};

// ==================== VPC Peering ====================

export const useVpcPeering = (projectId: string) => {
  return useQuery({
    queryKey: ["vpc-peering", projectId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/projects/${projectId}/vpc-peering`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateVpcPeering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: { vpc_id: string; peer_vpc_id: string; name?: string };
    }) => {
      const { data } = await axios.post(`${API_BASE}/projects/${projectId}/vpc-peering`, payload);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("VPC peering connection created successfully");
      queryClient.invalidateQueries({ queryKey: ["vpc-peering", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create VPC peering connection");
    },
  });
};

export const useAcceptVpcPeering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, peeringId }: { projectId: string; peeringId: string }) => {
      await axios.post(`${API_BASE}/projects/${projectId}/vpc-peering/${peeringId}/accept`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("VPC peering connection accepted");
      queryClient.invalidateQueries({ queryKey: ["vpc-peering", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to accept VPC peering connection");
    },
  });
};

export const useRejectVpcPeering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, peeringId }: { projectId: string; peeringId: string }) => {
      await axios.post(`${API_BASE}/projects/${projectId}/vpc-peering/${peeringId}/reject`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("VPC peering connection rejected");
      queryClient.invalidateQueries({ queryKey: ["vpc-peering", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to reject VPC peering connection");
    },
  });
};

// ==================== Security Postures ====================

export const useSecurityPostures = (projectId: string) => {
  return useQuery({
    queryKey: ["security-postures", projectId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/projects/${projectId}/security-postures`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

// ==================== VPC Policies ====================

export const useVpcPolicies = (projectId: string) => {
  return useQuery({
    queryKey: ["vpc-policies", projectId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/projects/${projectId}/vpc-policies`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};
