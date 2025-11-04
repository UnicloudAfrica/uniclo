import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import ModernButton from "../components/ModernButton";
import { useFetchAdminById } from "../../hooks/adminHooks/adminHooks";
import { EditAdminModal } from "./adminComps/editAdmin";

const decodeId = (encodedId) => {
  if (!encodedId) return null;
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (error) {
    console.error("Failed to decode admin id", error);
    return null;
  }
};

const AdminUserEdit = () => {
  const { adminId } = useParams();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const decodedAdminId = useMemo(() => decodeId(adminId), [adminId]);

  const {
    data: adminDetails,
    isFetching,
    isError,
    error,
  } = useFetchAdminById(decodedAdminId, {
    enabled: !!decodedAdminId,
  });

  const adminRecord = useMemo(
    () => adminDetails?.data ?? adminDetails,
    [adminDetails]
  );

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const goBack = () => navigate("/admin-dashboard/admin-users");

  const headerActions = (
    <ModernButton variant="outline" onClick={goBack} className="gap-2">
      <ArrowLeft size={18} />
      Back to Admin Users
    </ModernButton>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Edit Admin User"
        description={
          adminRecord?.email
            ? `Update access for ${adminRecord.email}`
            : "Modify administrator access and profile information."
        }
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu />
        {isFetching && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-[#EAECF0] bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#288DD1]" />
            <p className="text-sm font-medium text-slate-600">
              Loading admin record...
            </p>
          </div>
        )}
        {!isFetching && (isError || !adminRecord) && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-red-100 bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-semibold text-red-700">
              Unable to load this administrator.
            </p>
            {error?.message && (
              <p className="text-xs text-red-600">{error.message}</p>
            )}
            <ModernButton onClick={goBack} className="mt-2">
              Return to listing
            </ModernButton>
          </div>
        )}
        {!isFetching && adminRecord && (
          <EditAdminModal
            mode="page"
            isOpen
            admin={adminRecord}
            onClose={goBack}
          />
        )}
      </AdminPageShell>
    </>
  );
};

export default AdminUserEdit;
