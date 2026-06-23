import { useCallback, useMemo, useState } from "react";
import { Layers, Plus, ShieldCheck, Sparkles, UserCog } from "lucide-react";
import TenantPageShell from "@/shared/layouts/TenantPageShell";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import EmptyState from "@/shared/components/ui/EmptyState";
import ErrorState from "@/shared/components/ui/ErrorState";
import ModernButton from "@/shared/components/ui/ModernButton";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import {
  buildSegments,
  RoleCard,
  RoleDrawer,
  StatCard,
  type RoleFormState,
} from "@/shared/components/roles/roleVisuals";
import ToastUtils from "@/utils/toastUtil";
import {
  useFetchRoles,
  useFetchPermissionCatalog,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  type Role,
} from "@/hooks/tenantHooks/roleHooks";

const TeamRolesPage = () => {
  const { data: roles, isLoading, isError, refetch } = useFetchRoles();
  const { data: catalog } = useFetchPermissionCatalog();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);

  const rows = useMemo<Role[]>(() => (Array.isArray(roles) ? roles : []), [roles]);
  const catalogGroups = useMemo<[string, string[]][]>(
    () => Object.entries(catalog ?? {}),
    [catalog]
  );
  const totalPermissions = useMemo(
    () => catalogGroups.reduce((sum, [, perms]) => sum + perms.length, 0),
    [catalogGroups]
  );

  const customCount = rows.filter((r) => !r.is_system).length;
  const systemCount = rows.length - customCount;
  const membersAssigned = rows.reduce((sum, r) => sum + (r.member_count || 0), 0);

  const openCreate = useCallback(() => {
    setEditing(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((role: Role) => {
    setEditing(role);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditing(null);
  }, []);

  const saving = createRole.isPending || updateRole.isPending;

  const handleSubmit = useCallback(
    async (form: RoleFormState) => {
      const name = form.name.trim();
      if (name === "" || saving) return;
      const description = form.description.trim();
      const permissions = Array.from(form.permissions);
      try {
        if (editing) {
          await updateRole.mutateAsync({ id: editing.id, data: { name, description, permissions } });
          ToastUtils.success(`Role "${name}" updated`);
        } else {
          await createRole.mutateAsync({ name, description, permissions });
          ToastUtils.success(`Role "${name}" created`);
        }
        closeDrawer();
      } catch {
        ToastUtils.error(`Failed to ${editing ? "update" : "create"} role`);
      }
    },
    [editing, saving, updateRole, createRole, closeDrawer]
  );

  const handleDelete = useCallback(async () => {
    if (!pendingDelete || deleteRole.isPending) return;
    const target = pendingDelete;
    try {
      await deleteRole.mutateAsync(target.id);
      ToastUtils.success(`Role "${target.name}" deleted`);
      setPendingDelete(null);
    } catch {
      ToastUtils.error("Failed to delete role");
    }
  }, [pendingDelete, deleteRole]);

  const createButton = (
    <ModernButton variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
      Create role
    </ModernButton>
  );

  const renderRoles = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-[78px] w-[78px] rounded-full" />
              </div>
              <Skeleton className="mt-4 h-16 w-full rounded-xl" />
              <Skeleton className="mt-4 h-8 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <ErrorState
          title="Could not load roles"
          message="Something went wrong while fetching your team roles."
          onRetry={() => refetch()}
        />
      );
    }

    if (rows.length === 0) {
      return (
        <EmptyState
          icon={<ShieldCheck size={24} />}
          title="No roles yet"
          description="Create a custom role to bundle permissions and assign them to your team members."
          action={createButton}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            totalPermissions={totalPermissions}
            segments={buildSegments(new Set(role.permissions), catalogGroups)}
            onEdit={() => openEdit(role)}
            onDelete={() => setPendingDelete(role)}
          />
        ))}
      </div>
    );
  };

  return (
    <TenantPageShell
      title="Team & Roles"
      description="Define custom roles, bundle permissions, and control what your team members can access."
      subHeaderContent={createButton}
    >
      {/* Summary stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total roles"
          value={rows.length}
          hint={`${customCount} custom · ${systemCount} system`}
          icon={<ShieldCheck size={18} />}
          loading={isLoading}
        />
        <StatCard
          label="Custom roles"
          value={customCount}
          hint="Editable, team-defined"
          icon={<Sparkles size={18} />}
          loading={isLoading}
        />
        <StatCard
          label="Permissions"
          value={totalPermissions}
          hint={`across ${catalogGroups.length} groups`}
          icon={<Layers size={18} />}
        />
        <StatCard
          label="Members assigned"
          value={membersAssigned}
          hint="With a role attached"
          icon={<UserCog size={18} />}
          loading={isLoading}
        />
      </div>

      {renderRoles()}

      <RoleDrawer
        open={drawerOpen}
        editing={editing}
        catalog={catalog}
        totalPermissions={totalPermissions}
        saving={saving}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete role"
        message={
          pendingDelete
            ? `Delete role "${pendingDelete.name}"? Members assigned to it will lose its permissions.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteRole.isPending}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </TenantPageShell>
  );
};

export default TeamRolesPage;
