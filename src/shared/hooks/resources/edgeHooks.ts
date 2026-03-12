/**
 * Edge Location Hooks — Context-aware CRUD hooks for edge locations.
 * Replaces duplicated edge-config fetching across admin/tenant/client hooks.
 */
import { createResourceHooks } from "../createResourceHooks";

const edgeHooks = createResourceHooks({
  resourcePath: "edge-config",
  queryKeyBase: "edgeLocations",
});

export const {
  useFetchList: useFetchEdgeLocations,
  useFetchById: useFetchEdgeLocationById,
  useCreate: useCreateEdgeLocation,
  useUpdate: useUpdateEdgeLocation,
  useDelete: useDeleteEdgeLocation,
  queryKeys: edgeLocationKeys,
} = edgeHooks;

export default edgeHooks;
