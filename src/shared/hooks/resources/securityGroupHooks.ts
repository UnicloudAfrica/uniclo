/**
 * Security Group Hooks — Context-aware CRUD hooks for security groups.
 * Replaces: adminHooks/securityGroupHooks.ts, tenantHooks/securityGroupHooks.ts, clientHooks/securityGroupHooks.ts
 */
import { createResourceHooks } from "../createResourceHooks";

const securityGroupHooks = createResourceHooks({
  resourcePath: "security-groups",
  queryKeyBase: "securityGroups",
});

export const {
  useFetchList: useFetchSecurityGroups,
  useFetchById: useFetchSecurityGroupById,
  useCreate: useCreateSecurityGroup,
  useUpdate: useUpdateSecurityGroup,
  useDelete: useDeleteSecurityGroup,
  useSync: useSyncSecurityGroups,
  queryKeys: securityGroupKeys,
} = securityGroupHooks;

export default securityGroupHooks;
