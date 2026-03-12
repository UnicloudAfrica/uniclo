/**
 * Route Table Hooks — Context-aware CRUD hooks for route tables.
 * Replaces: adminHooks/routeTableHooks.ts, tenantHooks/routeTableHooks.ts, clientHooks/routeTableHooks.ts
 */
import { createResourceHooks } from "../createResourceHooks";

const routeTableHooks = createResourceHooks({
  resourcePath: "route-tables",
  queryKeyBase: "routeTables",
});

export const {
  useFetchList: useFetchRouteTables,
  useFetchById: useFetchRouteTableById,
  useCreate: useCreateRouteTable,
  useUpdate: useUpdateRouteTable,
  useDelete: useDeleteRouteTable,
  useSync: useSyncRouteTables,
  queryKeys: routeTableKeys,
} = routeTableHooks;

export default routeTableHooks;
