import { useNavigate, useParams } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../adminDashboard/components/ModernCard";
import ModernButton from "../../../adminDashboard/components/ModernButton";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchTenantAdminById,
  useDeleteTenantAdmin,
} from "../../../hooks/adminUserHooks";

const InfoRow = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="text-sm font-semibold text-slate-900">{value ?? "—"}</p>
  </div>
);

export default function TenantUserDetailsPage() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const {
    data: user,
    isFetching: isLoading,
  } = useFetchTenantAdminById(userId);
  const { mutateAsync: removeUser, isPending: isDeleting } =
    useDeleteTenantAdmin();

  const handleDelete = async () => {
    if (!userId) return;
    const confirm = window.confirm(
      "Remove this user from your tenant workspace?"
    );
    if (!confirm) return;

    try {
      await removeUser(userId);
      ToastUtils.success("Tenant user removed.");
      navigate("/dashboard/clients");
    } catch (error) {
      ToastUtils.error(
        error?.response?.data?.message || "Failed to remove tenant user."
      );
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
          <div className="py-10 text-center text-sm text-slate-500">
            Loading tenant user…
          </div>
        ) : user ? (
          <>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-slate-900">
                {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                  user.email ||
                  "Tenant user"}
              </h2>
              <p className="text-sm text-slate-500">
                Role: {user.pivot?.role ?? user.role ?? "member"}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Phone" value={user.phone} />
              <InfoRow label="Invitation status" value={user.pivot?.accepted_at ? "Accepted" : "Pending acceptance"} />
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
                tone="destructive"
                onClick={handleDelete}
                isDisabled={isDeleting}
                isLoading={isDeleting}
              >
                Remove access
              </ModernButton>
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-sm text-slate-500">
            Tenant user not found.
          </div>
        )}
      </ModernCard>
    </TenantPageShell>
  );
}
