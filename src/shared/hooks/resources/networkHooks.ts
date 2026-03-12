/**
 * Network / ENI Hooks — Context-aware CRUD hooks for network interfaces.
 * Replaces: adminHooks/networkHooks.ts, tenantHooks/networkHooks.ts, clientHooks/networkHooks.ts
 */
import { createResourceHooks } from "../createResourceHooks";

const networkHooks = createResourceHooks({
  resourcePath: "network-interfaces",
  queryKeyBase: "networks",
});

export const {
  useFetchList: useFetchNetworks,
  useFetchById: useFetchNetworkById,
  useCreate: useCreateNetwork,
  useUpdate: useUpdateNetwork,
  useDelete: useDeleteNetwork,
  useSync: useSyncNetworks,
  queryKeys: networkKeys,
} = networkHooks;

export default networkHooks;
