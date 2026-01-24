# Subnets Audit - Phase 0

## Summary

**Verdict: Category B - Shareable with Minor Differences**

Tenant has create/delete capabilities (unlike Security Groups). Form UI differs: Admin uses modal, Tenant uses inline card.

---

## Permission & API Matrix

| Aspect                 | Admin  | Tenant | Client |
| ---------------------- | ------ | ------ | ------ |
| **API endpoint**       | Same   | Same   | Same   |
| **Can create**         | ✅     | ✅     | ❌     |
| **Can delete**         | ✅     | ✅     | ❌     |
| **Needs VPC list**     | ✅     | ✅     | ❌     |
| **Show default stats** | ✅     | ❌     | ❌     |
| **Show default badge** | ✅     | ❌     | ❌     |
| **File type**          | `.tsx` | `.tsx` | `.tsx` |

---

## Current Implementation

### Admin (181 lines)

- Create via modal
- Delete with default subnet protection
- Shows `showDefaultStats` and `showDefaultBadge`

### Tenant (141 lines)

- Create via inline card form (different UI pattern)
- Delete
- Uses VPCs for create form

### Client (31 lines)

- Read-only
- `showVpcColumn={false}`

---

## Permission Preset Definition

```ts
interface SubnetPermissions {
  canCreate: boolean;
  canDelete: boolean;
  showDefaultStats: boolean;
  showDefaultBadge: boolean;
  showVpcColumn: boolean;
}

const SUBNET_PERMISSIONS = {
  admin: {
    canCreate: true,
    canDelete: true,
    showDefaultStats: true,
    showDefaultBadge: true,
    showVpcColumn: true,
  },
  tenant: {
    canCreate: true,
    canDelete: true,
    showDefaultStats: false,
    showDefaultBadge: false,
    showVpcColumn: true,
  },
  client: {
    canCreate: false,
    canDelete: false,
    showDefaultStats: false,
    showDefaultBadge: false,
    showVpcColumn: false,
  },
};
```

---

## Refactoring Tasks

1. Add `SubnetPermissions` to `permissionPresets.ts`
2. Create `CreateSubnetModal.tsx` (extract from Admin, can be used by Tenant too)
3. Add `permissions` prop to `SubnetsOverview`
4. Create `SubnetsContainer.tsx` with wrapper pattern
5. Convert 3 dashboard pages to thin wrappers (Tenant may need inline form option)

---

## Estimated Effort

| Task                                    | Time             |
| --------------------------------------- | ---------------- |
| Add permissions to permissionPresets.ts | 15 min           |
| Extract CreateSubnetModal               | 30 min           |
| Update SubnetsOverview                  | 20 min           |
| Create SubnetsContainer                 | 45 min           |
| Convert 3 pages to thin wrappers        | 30 min           |
| Testing                                 | 30 min           |
| **Total**                               | **~2.5-3 hours** |
