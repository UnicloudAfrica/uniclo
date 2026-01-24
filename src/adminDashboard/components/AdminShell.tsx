import React from "react";
import AdminHeadbar from "./adminHeadbar";
import AdminSidebar from "./AdminSidebar";

const AdminShell: React.FC = () => {
  return (
    <>
      <AdminHeadbar forceRender />
      <AdminSidebar forceRender />
    </>
  );
};

export default AdminShell;
