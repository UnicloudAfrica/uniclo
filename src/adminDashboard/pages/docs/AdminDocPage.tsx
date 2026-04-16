import React from "react";
import DynamicDocPage from "@/docs/renderer/DynamicDocPage";
import { loadAdminDoc } from "@/docs/config/adminDocs";

const AdminDocPage: React.FC = () => <DynamicDocPage loadDoc={loadAdminDoc} scope="admin" />;

export default AdminDocPage;
