/**
 * Admin Infrastructure API
 */

import { apiClient } from "@/shared/api/client";
import type {
  VPC,
  Subnet,
  SecurityGroup,
  VPCFormData,
  SubnetFormData,
  SecurityGroupFormData,
} from "@/shared/domains/infrastructure/types/infrastructure.types";

export const adminInfrastructureApi = {
  // VPCs
  fetchVPCs: async (projectId: string, region: string) => {
    const { data } = await apiClient.get(`/admin/infrastructure/vpcs`, {
      params: { project_id: projectId, region },
    });
    return data;
  },

  createVPC: async (vpcData: VPCFormData): Promise<VPC> => {
    const { data } = await apiClient.post<VPC>("/admin/infrastructure/vpcs", vpcData);
    return data;
  },

  deleteVPC: async (vpcId: string): Promise<void> => {
    await apiClient.delete(`/admin/infrastructure/vpcs/${vpcId}`);
  },

  // Subnets
  fetchSubnets: async (projectId: string, region: string) => {
    const { data } = await apiClient.get(`/admin/infrastructure/subnets`, {
      params: { project_id: projectId, region },
    });
    return data;
  },

  createSubnet: async (subnetData: SubnetFormData): Promise<Subnet> => {
    const { data } = await apiClient.post<Subnet>("/admin/infrastructure/subnets", subnetData);
    return data;
  },

  deleteSubnet: async (subnetId: string): Promise<void> => {
    await apiClient.delete(`/admin/infrastructure/subnets/${subnetId}`);
  },

  // Security Groups
  fetchSecurityGroups: async (projectId: string, region: string) => {
    const { data } = await apiClient.get(`/admin/infrastructure/security-groups`, {
      params: { project_id: projectId, region },
    });
    return data;
  },

  createSecurityGroup: async (sgData: SecurityGroupFormData): Promise<SecurityGroup> => {
    const { data } = await apiClient.post<SecurityGroup>(
      "/admin/infrastructure/security-groups",
      sgData
    );
    return data;
  },

  deleteSecurityGroup: async (sgId: string): Promise<void> => {
    await apiClient.delete(`/admin/infrastructure/security-groups/${sgId}`);
  },
};

export default adminInfrastructureApi;
