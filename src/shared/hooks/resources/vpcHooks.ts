/**
 * VPC Hooks — Context-aware CRUD hooks for VPCs.
 * Replaces: adminHooks/vpcHooks.ts, tenantHooks/vpcHooks.ts, clientHooks/vpcHooks.ts
 */
import { createResourceHooks } from "../createResourceHooks";

const vpcHooks = createResourceHooks({
  resourcePath: "vpcs",
  queryKeyBase: "vpcs",
});

export const {
  useFetchList: useFetchVpcs,
  useFetchById: useFetchVpcById,
  useCreate: useCreateVpc,
  useUpdate: useUpdateVpc,
  useDelete: useDeleteVpc,
  useSync: useSyncVpcs,
  queryKeys: vpcKeys,
} = vpcHooks;

export default vpcHooks;
