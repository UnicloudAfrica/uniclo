/**
 * Elastic IP Hooks — Context-aware CRUD hooks for elastic IPs.
 * Replaces: adminHooks/elasticIPHooks.ts, tenantHooks/elasticIPHooks.ts, clientHooks/elasticIPHooks.ts
 */
import { createResourceHooks } from "../createResourceHooks";

const eipHooks = createResourceHooks({
  resourcePath: "elastic-ips",
  queryKeyBase: "elasticIps",
});

export const {
  useFetchList: useFetchElasticIps,
  useFetchById: useFetchElasticIpById,
  useCreate: useCreateElasticIp,
  useUpdate: useUpdateElasticIp,
  useDelete: useDeleteElasticIp,
  useSync: useSyncElasticIps,
  queryKeys: elasticIpKeys,
} = eipHooks;

export default eipHooks;
