# Security Groups Audit - Phase 0

## Summary

**Verdict: Category A - Fully Shareable**

All three dashboards use the same `SecurityGroupsOverview` component. Differences are permission-based only.

---

## Permission & API Matrix

| Aspect             | Admin  | Tenant | Client | Notes                                 |
| ------------------ | ------ | ------ | ------ | ------------------------------------- |
| **API endpoint**   | Same   | Same   | Same   | `useSecurityGroups`                   |
| **Can create**     | ✅     | ❌     | ❌     | Admin only has modal                  |
| **Can delete**     | ✅     | ❌     | ❌     | Admin only                            |
| **Can view rules** | ✅     | ✅     | ❌     | Admin + Tenant navigate to rules page |
| **Needs VPC list** | ✅     | ❌     | ❌     | For create modal                      |
| **File type**      | `.tsx` | `.tsx` | `.tsx` | All TypeScript                        |

---

## Current Implementation

### Admin (188 lines)

- Full CRUD: create, delete
- Create modal with VPC selector (`useVpcs`)
- Navigate to rules page
- Uses `AdminPageShell`

### Tenant (52 lines)

- View only + navigate to rules
- No create/delete
- Uses `TenantPageShell`

### Client (31 lines)

- Read-only (no actions passed)
- Uses `ClientPageShell`

---

## Shared Components Already In Use

| Component                | Location                            |
| ------------------------ | ----------------------------------- |
| `SecurityGroupsOverview` | `shared/components/infrastructure/` |
| `SecurityGroupsTable`    | `shared/components/infrastructure/` |
| `useSecurityGroups`      | `shared/hooks/vpcInfraHooks`        |
| `useCreateSecurityGroup` | `shared/hooks/vpcInfraHooks`        |
| `useDeleteSecurityGroup` | `shared/hooks/vpcInfraHooks`        |
| `useVpcs`                | `shared/hooks/vpcInfraHooks`        |

---

## Permission Preset Definition

```ts
interface SecurityGroupPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canViewRules: boolean;
  canViewAllTenants: boolean;
  canViewAllProjects: boolean;
}

const SECURITY_GROUP_PERMISSIONS = {
  admin: {
    canCreate: true,
    canDelete: true,
    canViewRules: true,
    canViewAllTenants: true,
    canViewAllProjects: true,
  },
  tenant: {
    canCreate: false,
    canDelete: false,
    canViewRules: true,
    canViewAllTenants: false,
    canViewAllProjects: true,
  },
  client: {
    canCreate: false,
    canDelete: false,
    canViewRules: false,
    canViewAllTenants: false,
    canViewAllProjects: false,
  },
};
```

---

## Refactoring Tasks

1. Add `SecurityGroupPermissions` to `permissionPresets.ts`
2. Create `CreateSecurityGroupModal.tsx` (extract from Admin)
3. Add `permissions` prop to `SecurityGroupsOverview`
4. Create `SecurityGroupsContainer.tsx` with wrapper pattern
5. Convert 3 dashboard pages to thin wrappers

---

## Estimated Effort

| Task                                    | Time           |
| --------------------------------------- | -------------- |
| Add permissions to permissionPresets.ts | 15 min         |
| Extract CreateSecurityGroupModal        | 30 min         |
| Update SecurityGroupsOverview           | 20 min         |
| Create SecurityGroupsContainer          | 45 min         |
| Convert 3 pages to thin wrappers        | 30 min         |
| Testing                                 | 30 min         |
| **Total**                               | **~2.5 hours** |
