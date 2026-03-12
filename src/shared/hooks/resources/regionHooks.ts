/**
 * Region Hooks — Context-aware CRUD hooks for cloud regions.
 * Replaces duplicated region fetching across admin/tenant/client hooks.
 */
import { createResourceHooks } from "../createResourceHooks";

const regionHooks = createResourceHooks({
  resourcePath: "cloud-regions",
  queryKeyBase: "regions",
});

export const {
  useFetchList: useFetchRegions,
  useFetchById: useFetchRegionById,
  useCreate: useCreateRegion,
  useUpdate: useUpdateRegion,
  useDelete: useDeleteRegion,
  queryKeys: regionKeys,
} = regionHooks;

export default regionHooks;
