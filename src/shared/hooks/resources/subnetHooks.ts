/**
 * Subnet Hooks — Context-aware CRUD hooks for subnets.
 * Replaces: adminHooks/subnetHooks.ts, tenantHooks/subnetHooks.ts, clientHooks/subnetHooks.ts
 */
import { createResourceHooks } from "../createResourceHooks";

const subnetHooks = createResourceHooks({
  resourcePath: "subnets",
  queryKeyBase: "subnets",
});

export const {
  useFetchList: useFetchSubnets,
  useFetchById: useFetchSubnetById,
  useCreate: useCreateSubnet,
  useUpdate: useUpdateSubnet,
  useDelete: useDeleteSubnet,
  useSync: useSyncSubnets,
  queryKeys: subnetKeys,
} = subnetHooks;

export default subnetHooks;
