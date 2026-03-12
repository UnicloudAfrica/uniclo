/**
 * Key Pair Hooks — Context-aware CRUD hooks for SSH key pairs.
 * Replaces: the triplication previously consolidated in shared/hooks/keyPairsHooks.ts
 *
 * Note: The existing shared/hooks/keyPairsHooks.ts file already implements
 * context-aware hooks manually. This factory-based version provides the same
 * functionality with less code.
 */
import { createResourceHooks } from "../createResourceHooks";

const keyPairHooks = createResourceHooks({
  resourcePath: "key-pairs",
  queryKeyBase: "keyPairs",
});

export const {
  useFetchList: useFetchKeyPairs,
  useFetchById: useFetchKeyPairById,
  useCreate: useCreateKeyPair,
  useUpdate: useUpdateKeyPair,
  useDelete: useDeleteKeyPair,
  useSync: useSyncKeyPairs,
  queryKeys: keyPairKeys,
} = keyPairHooks;

export default keyPairHooks;
