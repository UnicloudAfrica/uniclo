import { useNavigate, useParams } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import { ModernCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchTenantAdminById, useDeleteTenantAdmin } from "../../../hooks/adminUserHooks";

const InfoRow = ({ label, value }: any) => (
  <div className="space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm font-semibold text-slate-900">{value ?? "—"}</p>
  </div>
);

export default function TenantUserDetailsPage() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const { data: user, isFetching: isLoading } = useFetchTenantAdminById(userId as any);
  const { mutateAsync: removeUser, isPending: isDeleting } = useDeleteTenantAdmin();

  const handleDelete = async () => {
    if (!userId) return;
    const confirm = globalThis.window.confirm("Remove this user from your tenant workspace?");
    if (!confirm) return;

    try {
      await removeUser(userId);
      ToastUtils.success("Tenant user removed.");
      navigate("/dashboard/clients");
    } catch (error) {
      ToastUtils.error((error as any)?.response?.data?.message || "Failed to remove tenant user.");
    }
  };

  return (
    <TenantPageShell
      title="Tenant user"
      description="Manage access and invitations for your tenant administrators."
      homeHref="/dashboard/clients"
      actions={
        <ModernButton variant="outline" onClick={() => navigate(-1)}>
          Back
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <ModernCard padding="lg" className="space-y-6">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-slate-500">Loading tenant user…</div>
        ) : user ? (
          <>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-slate-900">
                {[(user as any).first_name, (user as any).last_name].filter(Boolean).join(" ") ||
                  (user as any).email ||
                  "Tenant user"}
              </h2>
              <p className="text-sm text-slate-500">
                Role: {(user as any).pivot?.role ?? (user as any).role ?? "member"}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoRow label="Email" value={(user as any).email} />
              <InfoRow label="Phone" value={(user as any).phone} />
              <InfoRow
                label="Invitation status"
                value={(user as any).pivot?.accepted_at ? "Accepted" : "Pending acceptance"}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <ModernButton
                variant="primary"
                onClick={() => navigate(`/dashboard/tenant-users/${userId}/edit`)}
              >
                Edit user
              </ModernButton>
              <ModernButton
                variant="outline"
                tone={"destructive" as any}
                onClick={handleDelete}
                isDisabled={isDeleting}
                isLoading={isDeleting}
              >
                Remove access
              </ModernButton>
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-sm text-slate-500">Tenant user not found.</div>
        )}
      </ModernCard>
    </TenantPageShell>
  );
}
