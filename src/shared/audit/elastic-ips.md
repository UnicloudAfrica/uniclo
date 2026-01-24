# Elastic IPs Audit - Phase 0

## Summary

**Verdict: Category A - Fully Shareable**

All three dashboards already use the same shared components (`ElasticIpsOverview`, `ElasticIpsTable`) and hooks. The only differences are permission-based action visibility.

---

## Permission & API Matrix

| Aspect                    | Admin                    | Tenant | Client | Notes                   |
| ------------------------- | ------------------------ | ------ | ------ | ----------------------- |
| **API endpoint**          | Same                     | Same   | Same   | All use `vpcInfraHooks` |
| **API response shape**    | Same                     | Same   | Same   | `ElasticIp` type shared |
| **Can allocate (create)** | ✅                       | ✅     | ❌     | Client is read-only     |
| **Can release (delete)**  | ✅                       | ✅     | ❌     | Client is read-only     |
| **Can associate**         | ✅                       | ❌     | ❌     | Only Admin has modal    |
| **Can disassociate**      | ✅                       | ✅     | ❌     | Admin + Tenant          |
| **Can view all tenants**  | ✅                       | ❌     | ❌     | Admin only              |
| **Can view all projects** | ✅                       | ✅     | ❌     | Admin + Tenant          |
| **Legacy page exists**    | ✅ `infraComps/eips.tsx` | ?      | ?      | Needs migration         |
| **File type**             | `.tsx`                   | `.tsx` | `.tsx` | All TypeScript          |

---

## Current Implementation Comparison

### Admin (199 lines)

- Full CRUD: allocate, release, associate, disassociate
- Custom associate modal (inline in component)
- Uses `AdminPageShell`, `AdminHeadbar`, `AdminSidebar`
- Breadcrumbs configured
- Refresh button in header

### Tenant (73 lines)

- Allocate, release, disassociate (no associate)
- Uses `TenantPageShell`
- No custom modal
- Simpler action handlers

### Client (31 lines)

- **Read-only** - no actions passed to `ElasticIpsOverview`
- Uses `ClientPageShell`
- Minimal - just displays data

---

## Shared Components Already In Use

| Component                  | Location                            | Used By       |
| -------------------------- | ----------------------------------- | ------------- |
| `ElasticIpsOverview`       | `shared/components/infrastructure/` | All 3         |
| `ElasticIpsTable`          | `shared/components/infrastructure/` | All 3         |
| `useElasticIps`            | `shared/hooks/vpcInfraHooks`        | All 3         |
| `useCreateElasticIp`       | `shared/hooks/vpcInfraHooks`        | Admin, Tenant |
| `useDeleteElasticIp`       | `shared/hooks/vpcInfraHooks`        | Admin, Tenant |
| `useAssociateElasticIp`    | `shared/hooks/vpcInfraHooks`        | Admin only    |
| `useDisassociateElasticIp` | `shared/hooks/vpcInfraHooks`        | Admin, Tenant |

---

## API Routes

### Admin Routes (`admin.php`)

```php
Route::get('elastic-ips', 'listElasticIps');
Route::post('elastic-ips', 'createElasticIp');
Route::post('elastic-ips/{id}/associate', 'associateElasticIp');
Route::delete('elastic-ips/{id}/disassociate', 'disassociateElasticIp');
Route::delete('elastic-ips/{id}', 'deleteElasticIp');
```

### Shared Routes (`shared_infra.php`)

```php
Route::apiResource('elastic-ips', ElasticIpController::class)
    ->only(['index', 'store', 'update', 'destroy']);
```

---

## Permission Preset Definition

```ts
interface ElasticIpPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canAssociate: boolean;
  canDisassociate: boolean;
  canViewAllTenants: boolean;
  canViewAllProjects: boolean;
}

const ELASTIC_IP_PERMISSIONS = {
  admin: {
    canCreate: true,
    canDelete: true,
    canAssociate: true,
    canDisassociate: true,
    canViewAllTenants: true,
    canViewAllProjects: true,
  },
  tenant: {
    canCreate: true,
    canDelete: true,
    canAssociate: false, // No associate modal in tenant
    canDisassociate: true,
    canViewAllTenants: false,
    canViewAllProjects: true,
  },
  client: {
    canCreate: false,
    canDelete: false,
    canAssociate: false,
    canDisassociate: false,
    canViewAllTenants: false,
    canViewAllProjects: false,
  },
};
```

---

## Refactoring Recommendations

### 1. Low Effort - Already Mostly Shared

Since all three pages already use `ElasticIpsOverview` and the same hooks, refactoring is minimal:

- Extract the associate modal to a shared component
- Add permission-based action gating to `ElasticIpsOverview`
- Create thin dashboard wrappers

### 2. Files to Create

- `shared/components/infrastructure/modals/AssociateElasticIpModal.tsx`
- `shared/config/permissionPresets.ts` (or add to existing)

### 3. Files to Update

- `ElasticIpsOverview.tsx` - Accept permissions object
- `ElasticIpsTable.tsx` - Gate action buttons based on permissions

### 4. Legacy Page Migration

- `adminDashboard/pages/infraComps/eips.tsx` - Replace with redirect or deprecate

---

## Estimated Effort

| Task                                      | Time           |
| ----------------------------------------- | -------------- |
| Extract AssociateElasticIpModal           | 30 min         |
| Add permissions to ElasticIpsOverview     | 30 min         |
| Create ElasticIpsContainer                | 1 hour         |
| Update 3 dashboard pages to thin wrappers | 30 min         |
| Testing                                   | 1 hour         |
| **Total**                                 | **~3.5 hours** |

---

## Next Steps

1. ✅ Audit complete
2. [ ] Create `permissionPresets.ts` with Elastic IP permissions
3. [ ] Extract `AssociateElasticIpModal` from Admin page
4. [ ] Update `ElasticIpsOverview` to accept permissions
5. [ ] Create `ElasticIpsContainer`
6. [ ] Convert dashboard pages to thin wrappers
7. [ ] Test all three dashboards
