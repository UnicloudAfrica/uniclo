export interface HierarchicalTenant {
  id: string | number;
  name?: string;
  company_name?: string;
  parent_id?: string | number | null;
}

export interface TenantHierarchyOption {
  id: string | number;
  label: string;
  depth: number;
}

const displayName = (tenant: HierarchicalTenant): string =>
  tenant.name || tenant.company_name || `Tenant ${tenant.id}`;

/**
 * Flatten a list of tenants into a depth-tagged, pre-order list so a native
 * <select> can render the parent/child hierarchy with indentation.
 *
 * The backend's GET /tenants already returns every tenant (top-level and
 * sub-tenants) flat, each carrying parent_id, so the tree is built entirely
 * client-side with no extra request. Tenants whose parent isn't in the list
 * (orphans), self-referential rows, and tenants caught in a mutual parent
 * cycle are all surfaced as roots so none is ever silently dropped.
 */
export function buildTenantHierarchyOptions(
  tenants: HierarchicalTenant[],
): TenantHierarchyOption[] {
  const byId = new Map<string, HierarchicalTenant>();
  tenants.forEach((tenant) => byId.set(String(tenant.id), tenant));

  const childrenByParent = new Map<string, HierarchicalTenant[]>();
  const roots: HierarchicalTenant[] = [];

  tenants.forEach((tenant) => {
    const parentKey = tenant.parent_id != null ? String(tenant.parent_id) : null;
    if (parentKey && parentKey !== String(tenant.id) && byId.has(parentKey)) {
      const siblings = childrenByParent.get(parentKey) ?? [];
      siblings.push(tenant);
      childrenByParent.set(parentKey, siblings);
    } else {
      roots.push(tenant);
    }
  });

  const byName = (a: HierarchicalTenant, b: HierarchicalTenant) =>
    displayName(a).localeCompare(displayName(b));

  const options: TenantHierarchyOption[] = [];
  const visited = new Set<string>();

  const walk = (tenant: HierarchicalTenant, depth: number): void => {
    const key = String(tenant.id);
    if (visited.has(key)) return;
    visited.add(key);
    options.push({ id: tenant.id, label: displayName(tenant), depth });
    [...(childrenByParent.get(key) ?? [])]
      .sort(byName)
      .forEach((child) => walk(child, depth + 1));
  };

  [...roots].sort(byName).forEach((root) => walk(root, 0));

  // Anything never reached (e.g. a mutual parent cycle) still gets surfaced.
  tenants.forEach((tenant) => {
    if (!visited.has(String(tenant.id))) {
      visited.add(String(tenant.id));
      options.push({ id: tenant.id, label: displayName(tenant), depth: 0 });
    }
  });

  return options;
}
