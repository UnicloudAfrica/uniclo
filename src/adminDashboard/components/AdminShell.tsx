import React from "react";
import AdminHeadbar from "./adminHeadbar";
import AdminSidebar from "./AdminSidebar";
import usePermissionRefresh from "@/hooks/usePermissionRefresh";

const AdminShell: React.FC = () => {
  usePermissionRefresh();

  return (
    <>
      <AdminHeadbar forceRender />
      <AdminSidebar forceRender />
    </>
  );
};

export default AdminShell;
