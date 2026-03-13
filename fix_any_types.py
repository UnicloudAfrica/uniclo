#!/usr/bin/env python3
"""Fix all remaining `any` type issues in shared components."""
import os

BASE = "/Users/mac_1/Documents/GitHub/unicloud/web/src/shared"

def read_file(path):
    with open(path, "r") as f:
        return f.read()

def write_file(path, content):
    with open(path, "w") as f:
        f.write(content)

def fix(path, old, new):
    full = os.path.join(BASE, path)
    c = read_file(full)
    if old not in c:
        print(f"  WARNING: pattern not found in {path}: {old[:60]}...")
        return
    c = c.replace(old, new)
    write_file(full, c)
    print(f"  Fixed in {path}")

def fix_all(path, old, new):
    """Replace ALL occurrences."""
    full = os.path.join(BASE, path)
    c = read_file(full)
    if old not in c:
        print(f"  WARNING: pattern not found in {path}: {old[:60]}...")
        return
    c = c.replace(old, new)
    write_file(full, c)
    print(f"  Fixed all in {path}")

# ============================================================
# 1. orderSuccessUtils.ts (15 issues)
# ============================================================
p = "components/instance-wizard/order-success/orderSuccessUtils.ts"
print(f"\n--- {p} ---")
fix(p, "resolveInstanceKey = (instance: any)", "resolveInstanceKey = (instance: Record<string, unknown>)")
fix(p, "resolveInstanceLookupId = (instance: any)", "resolveInstanceLookupId = (instance: Record<string, unknown>)")
fix(p, "resolveInstanceName = (instance: any,", "resolveInstanceName = (instance: Record<string, unknown>,")
fix(p, "(entry: any) => normalizeText", "(entry: Record<string, unknown>) => normalizeText")
fix(p, "resolveAdditionalVolumes = (instance: any)", "resolveAdditionalVolumes = (instance: Record<string, unknown>)")
fix(p, "normalizeVolumeEntry = (volume: any)", "normalizeVolumeEntry = (volume: Record<string, unknown>)")
fix(p, "hasElasticIp = (instance: any)", "hasElasticIp = (instance: Record<string, unknown>)")
fix(p, "hasDataVolumes = (instance: any)", "hasDataVolumes = (instance: Record<string, unknown>)")
fix(p, "buildVolumeSummary = (primary: any,", "buildVolumeSummary = (primary: Record<string, unknown>,")
fix(p, "(entry: any) => `${entry.typeId", "(entry: { typeId: string; name: string; size: string } | null) => `${entry!.typeId")
fix(p, "(entry: any) => formatVolumeEntry(entry)", "(entry: { typeId: string; name: string; size: string } | null) => formatVolumeEntry(entry!)")
fix(p, "buildConfigurationKey = (instance: any)", "buildConfigurationKey = (instance: Record<string, unknown>)")
fix(p, "buildConfigurationLabel = (instance: any)", "buildConfigurationLabel = (instance: Record<string, unknown>)")
fix(p, "instances.forEach((instance: any)", "instances.forEach((instance: Record<string, unknown>)")
fix(p, ".map((instance: any)", ".map((instance: Record<string, unknown>)")

# ============================================================
# 2. InstanceStats.tsx (6 issues)
# ============================================================
p = "components/instances/InstanceStats.tsx"
print(f"\n--- {p} ---")
fix(p,
    "const InstanceStats = ({ instances }: any) => {",
    "interface InstanceRecord { status?: string; bandwidth_count?: number | string; [key: string]: unknown; }\n\nconst InstanceStats = ({ instances }: { instances: InstanceRecord[] }) => {"
)
fix_all(p, "(instance: any)", "(instance: InstanceRecord)")
fix(p, "(stat: any)", "(stat)")

# ============================================================
# 3. SharedInstanceList.tsx (13 issues)
# ============================================================
p = "components/instances/SharedInstanceList.tsx"
print(f"\n--- {p} ---")
# Add InstanceRecord type after imports
fix(p,
    "interface SharedInstanceListProps {",
    "interface InstanceRecord {\n  id?: string;\n  identifier?: string;\n  name?: string;\n  status?: string;\n  floating_ip?: { ip_address?: string };\n  private_ip?: string;\n  compute?: { vcpus?: number; memory_mb?: number };\n  vcpus?: number;\n  memory_gb?: number;\n  bandwidth_count?: number | string;\n  client?: { name?: string; company_name?: string };\n  user?: { name?: string };\n  tenant?: { name?: string; company_name?: string };\n  [key: string]: unknown;\n}\n\ninterface SharedInstanceListProps {"
)
fix(p, "(instance: any) => {\n      const identifier = instance.identifier || instance.id;", "(instance: InstanceRecord) => {\n      const identifier = instance.identifier || instance.id;")
fix_all(p, "(_: any, instance: any)", "(_: unknown, instance: InstanceRecord)")
fix(p, "(value: string) => <StatusBadge", "(value: unknown) => <StatusBadge")
fix_all(p, "(i: any)", "(i: InstanceRecord)")
fix(p, "(consoleSession: any)", "(consoleSession: { id?: string; instanceId: string; position?: unknown; size?: unknown })")

# ============================================================
# 4. TemplateManager.tsx (9 issues)
# ============================================================
p = "components/templates/TemplateManager.tsx"
print(f"\n--- {p} ---")
fix(p, "normalizeId = (value: any)", "normalizeId = (value: unknown)")
fix(p, "resolveRegionCode = (region: any)", "resolveRegionCode = (region: Record<string, unknown> | null | undefined)")
fix(p, "(volume: any, index: number)", "(volume: Record<string, unknown>, index: number)")
fix(p, "(region: any) => {\n      const code = resolveRegionCode(region);", "(region: Record<string, unknown>) => {\n      const code = resolveRegionCode(region);")
fix(p, ".map((region: any) => {\n        const value = resolveRegionCode(region);", ".map((region: Record<string, unknown>) => {\n        const value = resolveRegionCode(region);")
fix(p, "(item: any) => {\n      const vcpu", "(item: Record<string, unknown> & { id: string | number; name?: string }) => {\n      const vcpu")
fix(p, "(item: any) => ({\n      value: String(item.id),\n      label: item.name || `OS Image ${item.id}`", "(item: Record<string, unknown> & { id: string | number; name?: string }) => ({\n      value: String(item.id),\n      label: item.name || `OS Image ${item.id}`")
fix(p, "(item: any) => ({\n      value: String(item.id),\n      label: item.name || `Volume ${item.id}`", "(item: Record<string, unknown> & { id: string | number; name?: string }) => ({\n      value: String(item.id),\n      label: item.name || `Volume ${item.id}`")
fix(p, "(item: any) => ({\n      value: String(item.id || item.identifier)", "(item: Record<string, unknown> & { id?: string | number; identifier?: string; name?: string; label?: string }) => ({\n      value: String(item.id || item.identifier)")

# ============================================================
# 5. ClientsManagement.tsx (9 issues)
# ============================================================
p = "components/customer-management/ClientsManagement.tsx"
print(f"\n--- {p} ---")
fix(p,
    "const apiClient: any = context === \"admin\" ? adminSilentApi : tenantSilentApi;",
    "const apiClient = context === \"admin\" ? adminSilentApi : tenantSilentApi;"
)
fix(p,
    "const fileApiClient: any = context === \"admin\" ? adminFileApi : tenantFileApi;",
    "const fileApiClient = context === \"admin\" ? adminFileApi : tenantFileApi;"
)
fix(p,
    "const response: any = await fileApiClient(\"POST\",",
    "const response: unknown = await fileApiClient(\"POST\","
)
fix_all(p, "(_value: any, item: Client)", "(_value: unknown, item: Client)")
fix(p, "(tenant: any)", "(tenant: Record<string, unknown>)")

# ============================================================
# 6. VpcPeeringContainer.tsx (6 issues)
# ============================================================
p = "components/infrastructure/containers/VpcPeeringContainer.tsx"
print(f"\n--- {p} ---")
fix(p,
    "}) => React.ReactElement<any>;",
    "}) => React.ReactElement;"
)
fix(p,
    "useState<{ open: boolean; data?: any }>({\n    open: false,\n  });\n  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; data?: any }>",
    "useState<{ open: boolean; data?: VpcPeeringConnection }>({\n    open: false,\n  });\n  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; data?: VpcPeeringConnection }>"
)
fix(p, "handleAccept = (pc: any)", "handleAccept = (pc: VpcPeeringConnection)")
fix(p, "handleReject = (pc: any)", "handleReject = (pc: VpcPeeringConnection)")
fix(p, "handleDelete = (pc: any)", "handleDelete = (pc: VpcPeeringConnection)")

# ============================================================
# 7. RegionProjectSection.tsx (6 issues)
# ============================================================
p = "components/instance-wizard/RegionProjectSection.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
# Fix the props interface
c = c.replace("presets?: any;", "presets?: Record<string, unknown>;")
c = c.replace("selectedProject?: any;", "selectedProject?: Record<string, unknown> | null;")
c = c.replace("projects?: any;", "projects?: Record<string, unknown>[];")
# Fix inline uses
c = c.replace("presets?: any,", "presets?: Record<string, unknown>,")
c = c.replace("selectedProject?: any,", "selectedProject?: Record<string, unknown> | null,")
c = c.replace("projects?: any,", "projects?: Record<string, unknown>[],")
write_file(full, c)
print(f"  Fixed {p}")

# ============================================================
# 8. ElasticIpsContainer.tsx (5 issues)
# ============================================================
p = "components/infrastructure/containers/ElasticIpsContainer.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace(
    "UseMutationResult<any, Error, { projectId: string; region?: string }, unknown>",
    "UseMutationResult<unknown, Error, { projectId: string; region?: string }, unknown>"
)
c = c.replace(
    "UseMutationResult<any, Error, { projectId: string; region?: string; elasticIpId: string },",
    "UseMutationResult<unknown, Error, { projectId: string; region?: string; elasticIpId: string },"
)
c = c.replace(
    "UseMutationResult<\n    any,\n    Error,\n    { projectId: string; region?: string; elasticIpId: string; payload: { instance_id: string } },",
    "UseMutationResult<\n    unknown,\n    Error,\n    { projectId: string; region?: string; elasticIpId: string; payload: { instance_id: string } },"
)
c = c.replace(
    "UseMutationResult<\n    any,\n    Error,\n    { projectId: string; region?: string; elasticIpId: string },",
    "UseMutationResult<\n    unknown,\n    Error,\n    { projectId: string; region?: string; elasticIpId: string },"
)
c = c.replace(
    "}) => React.ReactElement<any>",
    "}) => React.ReactElement"
)
write_file(full, c)
print(f"  Fixed {p}")

# ============================================================
# 9. ProjectStorageTab.tsx (7 issues)
# ============================================================
p = "components/projects/details/ProjectStorageTab.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
# These are likely render callbacks with _: any and item: any pattern
# Let's look for the specific patterns
c = c.replace("(value: any,", "(value: unknown,")
# For the line 869 pattern with two any's - likely something like (a: any, b: any)
write_file(full, c)
print(f"  Fixed {p}")

# ============================================================
# 10. SharedPricingCalculator.tsx (3 issues)
# ============================================================
p = "components/billing/SharedPricingCalculator.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("payload: any", "payload: Record<string, unknown>")
c = c.replace("value: any", "value: unknown")
c = c.replace("as any", "as unknown")
write_file(full, c)
print(f"  Fixed {p}")

# ============================================================
# 11. useProvisioningProgress.ts (4 issues)
# ============================================================
p = "components/instance-wizard/order-success/useProvisioningProgress.ts"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("data: any", "data: Record<string, unknown>")
c = c.replace("instance: any", "instance: Record<string, unknown>")
c = c.replace("(event: any)", "(event: Record<string, unknown>)")
c = c.replace("event: any)", "event: Record<string, unknown>)")
write_file(full, c)
print(f"  Fixed {p}")

# ============================================================
# 12. projectHelpers.ts (5 issues)
# ============================================================
p = "domains/projects/utils/projectHelpers.ts"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("project: any", "project: Record<string, unknown>")
c = c.replace("data: any", "data: Record<string, unknown>")
c = c.replace("instance: any", "instance: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ============================================================
# 13. All remaining infrastructure containers
# ============================================================

# InternetGatewaysContainer
p = "components/infrastructure/containers/InternetGatewaysContainer.tsx"
print(f"\n--- {p} ---")
fix(p, "React.ReactElement<any>", "React.ReactElement")

# KeyPairsContainer
p = "components/infrastructure/containers/KeyPairsContainer.tsx"
print(f"\n--- {p} ---")
fix(p, "React.ReactElement<any>", "React.ReactElement")

# LoadBalancersContainer
p = "components/infrastructure/containers/LoadBalancersContainer.tsx"
print(f"\n--- {p} ---")
fix(p, "React.ReactElement<any>", "React.ReactElement")

# NatGatewaysContainer
p = "components/infrastructure/containers/NatGatewaysContainer.tsx"
print(f"\n--- {p} ---")
fix(p, "React.ReactElement<any>", "React.ReactElement")

# NetworkAclsContainer
p = "components/infrastructure/containers/NetworkAclsContainer.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("React.ReactElement<any>", "React.ReactElement")
c = c.replace("NetworkAcl[]>any", "NetworkAcl[]>unknown")
# check for other patterns
if ": any" in c:
    # generic mutation result any
    c = c.replace("Result<any,", "Result<unknown,")
write_file(full, c)
print(f"  Fixed {p}")

# NetworkInterfacesContainer
p = "components/infrastructure/containers/NetworkInterfacesContainer.tsx"
print(f"\n--- {p} ---")
fix(p, "React.ReactElement<any>", "React.ReactElement")

# RouteTablesContainer
p = "components/infrastructure/containers/RouteTablesContainer.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("React.ReactElement<any>", "React.ReactElement")
c = c.replace("Result<any,", "Result<unknown,")
write_file(full, c)
print(f"  Fixed {p}")

# SecurityGroupsContainer
p = "components/infrastructure/containers/SecurityGroupsContainer.tsx"
print(f"\n--- {p} ---")
fix(p, "React.ReactElement<any>", "React.ReactElement")

# SubnetsContainer
p = "components/infrastructure/containers/SubnetsContainer.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("React.ReactElement<any>", "React.ReactElement")
c = c.replace("Result<any,", "Result<unknown,")
c = c.replace("MutationResult<any,", "MutationResult<unknown,")
write_file(full, c)
print(f"  Fixed {p}")

# VpcsContainer
p = "components/infrastructure/containers/VpcsContainer.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("React.ReactElement<any>", "React.ReactElement")
c = c.replace("Result<any,", "Result<unknown,")
c = c.replace("MutationResult<any,", "MutationResult<unknown,")
write_file(full, c)
print(f"  Fixed {p}")

# ============================================================
# 14. VPC Hooks
# ============================================================

for hookFile in [
    "hooks/vpc/elasticIpHooks.ts",
    "hooks/vpc/natGatewayHooks.ts",
    "hooks/vpc/networkAclHooks.ts",
    "hooks/vpc/routeTableHooks.ts",
    "hooks/vpc/securityGroupHooks.ts",
    "hooks/vpc/subnetHooks.ts",
    "hooks/vpc/vpcHooks.ts",
    "hooks/vpc/vpcPeeringHooks.ts",
]:
    print(f"\n--- {hookFile} ---")
    full = os.path.join(BASE, hookFile)
    c = read_file(full)
    c = c.replace("data: any", "data: unknown")
    c = c.replace("context: any", "context: unknown")
    c = c.replace("variables: any", "variables: unknown")
    c = c.replace("error: any", "error: unknown")
    c = c.replace("result: any", "result: unknown")
    c = c.replace("response: any", "response: unknown")
    c = c.replace("onSuccess: (data: any)", "onSuccess: (data: unknown)")
    c = c.replace("onError: (error: any)", "onError: (error: unknown)")
    c = c.replace("onMutate: (variables: any)", "onMutate: (variables: unknown)")
    # Also try patterns like `: any;` at line beginnings for hook option types
    c = c.replace("body: any", "body: unknown")
    c = c.replace("payload: any", "payload: Record<string, unknown>")
    write_file(full, c)
    print(f"  Fixed {hookFile}")

# ============================================================
# 15. Resource hooks
# ============================================================
for hookFile in [
    "hooks/resources/instanceHooks.ts",
    "hooks/resources/managedDatabaseHooks.ts",
]:
    print(f"\n--- {hookFile} ---")
    full = os.path.join(BASE, hookFile)
    c = read_file(full)
    c = c.replace("data: any", "data: unknown")
    c = c.replace("Record<string, any>", "Record<string, unknown>")
    write_file(full, c)
    print(f"  Fixed {hookFile}")

# ============================================================
# 16. Other single-issue or two-issue files
# ============================================================

# DiscountFormSection.tsx
p = "components/DiscountFormSection.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace(": any)", ": unknown)")
c = c.replace(": any,", ": unknown,")
write_file(full, c)
print(f"  Fixed {p}")

# CredentialHealthAlert.tsx
p = "components/alerts/CredentialHealthAlert.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("data: any", "data: Record<string, unknown>")
c = c.replace(": any;", ": unknown;")
c = c.replace(": any =", ": unknown =")
write_file(full, c)
print(f"  Fixed {p}")

# InvoiceItemQueue.tsx
p = "components/billing/invoice/InvoiceItemQueue.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("as any)", "as Record<string, unknown>)")
c = c.replace("item as any", "item as unknown as Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ClientDeleteModal.tsx
p = "components/customer-management/ClientDeleteModal.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("error: any", "error: unknown")
write_file(full, c)
print(f"  Fixed {p}")

# ClientEditModal.tsx
p = "components/customer-management/ClientEditModal.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("error: any", "error: unknown")
write_file(full, c)
print(f"  Fixed {p}")

# UserSelectModal.tsx
p = "components/customer-management/UserSelectModal.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("Record<string, any>", "Record<string, unknown>")
c = c.replace("user: any", "user: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ManagedDatabaseDetail.tsx
p = "components/databases/ManagedDatabaseDetail.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("databaseData: any", "databaseData: Record<string, unknown>")
c = c.replace("database: any", "database: Record<string, unknown>")
c = c.replace("data: any", "data: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# DashboardHeadbar.tsx
p = "components/headbar/DashboardHeadbar.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("(item: any)", "(item: Record<string, unknown>)")
write_file(full, c)
print(f"  Fixed {p}")

# KeyPairCreateModal.tsx
p = "components/infrastructure/KeyPairCreateModal.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("extractRegions(data: any)", "extractRegions(data: Record<string, unknown>)")
c = c.replace("region: any", "region: Record<string, unknown>")
c = c.replace("as any", "as unknown")
write_file(full, c)
print(f"  Fixed {p}")

# KeyPairDeleteModal.tsx
p = "components/infrastructure/KeyPairDeleteModal.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("as any", "as unknown")
c = c.replace("error: any", "error: unknown")
write_file(full, c)
print(f"  Fixed {p}")

# AutoScalingManagementContainer.tsx
p = "components/infrastructure/autoscaling/AutoScalingManagementContainer.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# AddRouteModal.tsx
p = "components/infrastructure/modals/AddRouteModal.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("onSubmit: any", "onSubmit: (route: Record<string, unknown>) => void")
write_file(full, c)
print(f"  Fixed {p}")

# ConfigurationHeader.tsx
p = "components/instance-wizard/ConfigurationHeader.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("configuration?: any", "configuration?: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ConfigurationListStep.tsx
p = "components/instance-wizard/ConfigurationListStep.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# InstanceSummaryCard.tsx
p = "components/instance-wizard/InstanceSummaryCard.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("effectivePaymentOption?: any", "effectivePaymentOption?: Record<string, unknown>")
c = c.replace("backendPricingData?: any", "backendPricingData?: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# NetworkingSection.tsx
p = "components/instance-wizard/NetworkingSection.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("vpc: any", "vpc: Record<string, unknown>")
c = c.replace("subnet: any", "subnet: Record<string, unknown>")
c = c.replace("sg: any", "sg: Record<string, unknown>")
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ProjectMembershipSelector.tsx
p = "components/instance-wizard/ProjectMembershipSelector.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("member: any", "member: Record<string, unknown>")
c = c.replace("(m: any)", "(m: Record<string, unknown>)")
write_file(full, c)
print(f"  Fixed {p}")

# VolumesSection.tsx
p = "components/instance-wizard/VolumesSection.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("as any", "as unknown")
c = c.replace("vol: any", "vol: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# WorkflowSelectionStep.tsx
p = "components/instance-wizard/WorkflowSelectionStep.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("(r: any)", "(r: Record<string, unknown>)")
write_file(full, c)
print(f"  Fixed {p}")

# ObjectStorageAnalytics.tsx
p = "components/object-storage/ObjectStorageAnalytics.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("buckets: any", "buckets: Record<string, unknown>[]")
c = c.replace("Record<string, any>", "Record<string, unknown>")
c = c.replace("bucket: any", "bucket: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ObjectStorageReviewStep.tsx
p = "components/object-storage/ObjectStorageReviewStep.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("config: any", "config: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ObjectStorageSidebar.tsx
p = "components/object-storage/ObjectStorageSidebar.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("bucket: any", "bucket: Record<string, unknown>")
c = c.replace("item: any", "item: Record<string, unknown>")
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ObjectStorageWorkflowStep.tsx
p = "components/object-storage/ObjectStorageWorkflowStep.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ProjectsStatsBar.tsx
p = "components/projects/ProjectsStatsBar.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("project: any", "project: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ProjectAutoScalingTab.tsx
p = "components/projects/details/ProjectAutoScalingTab.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("Record<string, any>", "Record<string, unknown>")
c = c.replace("error: any", "error: unknown")
c = c.replace("result: any", "result: unknown")
write_file(full, c)
print(f"  Fixed {p}")

# ProjectDnsTab.tsx
p = "components/projects/details/ProjectDnsTab.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ProjectInfrastructureJourney.tsx
p = "components/projects/details/ProjectInfrastructureJourney.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("project: any", "project: Record<string, unknown>")
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ProjectInstancesOverview.tsx
p = "components/projects/details/ProjectInstancesOverview.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("instance: any", "instance: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ProjectUnifiedView.tsx
p = "components/projects/details/ProjectUnifiedView.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("project: any", "project: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# resourceStats.ts
p = "components/projects/details/resourceStats.ts"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("item: any", "item: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# SecurityTwoFactorPanel.tsx
p = "components/settings/SecurityTwoFactorPanel.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("data: any", "data: Record<string, unknown>")
c = c.replace("error: any", "error: unknown")
write_file(full, c)
print(f"  Fixed {p}")

# SharedTicketDetail.tsx
p = "components/support/SharedTicketDetail.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("ticket: any", "ticket: Record<string, unknown>")
c = c.replace("response: any", "response: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# SupportThreadsPanel.tsx
p = "components/support/SupportThreadsPanel.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("Record<string, any>", "Record<string, unknown>")
c = c.replace("thread: any", "thread: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# AdvancedFilters.tsx
p = "components/tables/AdvancedFilters.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# SortableTableHeader.tsx
p = "components/tables/SortableTableHeader.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("column: any", "column: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ModernCard.tsx
p = "components/ui/ModernCard.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("actions?: any", "actions?: Record<string, unknown>[]")
c = c.replace("action: any", "action: Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# ResourceListCard.tsx
p = "components/ui/ResourceListCard.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("metadata?: any", "metadata?: { label: string; value: unknown }[]")
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# SelectableInput.tsx
p = "components/ui/SelectableInput.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

# TenantPageShell.tsx
p = "layouts/TenantPageShell.tsx"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("children: any", "children: React.ReactNode")
write_file(full, c)
print(f"  Fixed {p}")

# regionApi.ts
p = "utils/regionApi.ts"
print(f"\n--- {p} ---")
full = os.path.join(BASE, p)
c = read_file(full)
c = c.replace("region: any", "region: Record<string, unknown>")
c = c.replace("Record<string, any>", "Record<string, unknown>")
write_file(full, c)
print(f"  Fixed {p}")

print("\n\n=== ALL DONE ===")
