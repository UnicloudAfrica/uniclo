/**
 * Internet Gateway Hooks — Context-aware CRUD hooks for internet gateways.
 * Replaces: adminHooks/igwHooks.ts, tenantHooks/igwHooks.ts, clientHooks/igwHooks.ts
 */
import { createResourceHooks } from "../createResourceHooks";

const igwHooks = createResourceHooks({
  resourcePath: "internet-gateways",
  queryKeyBase: "igws",
});

export const {
  useFetchList: useFetchIgws,
  useFetchById: useFetchIgwById,
  useCreate: useCreateIgw,
  useUpdate: useUpdateIgw,
  useDelete: useDeleteIgw,
  useSync: useSyncIgws,
  queryKeys: igwKeys,
} = igwHooks;

export default igwHooks;
