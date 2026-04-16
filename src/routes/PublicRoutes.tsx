import { Navigate, Route } from "react-router-dom";
import VerifyMail from "../dashboard/pages/verifyMail";
import ForgotPassword from "../dashboard/pages/forgotPassword";
import ResetPassword from "../dashboard/pages/resetPassword";
import TenantHome from "../tenantDashboard/pages/tenantHome";
import DashboardSignUpV2 from "../dashboard/pages/sign-upV2";
import DashboardLoginV2 from "../dashboard/pages/loginV2";
import TenantRegister from "../tenantDashboard/pages/tenant-signup";
import TenantLogin from "../tenantDashboard/pages/tenant-signin";
import PublicCostExplorer from "../pages/PublicCostExplorer";

import type { JSX } from "react";

const PublicRoutes = (): JSX.Element => (
  <>
    <Route path="/" element={<Navigate to="/sign-in" replace />} />
    <Route path="/cost-explorer" element={<PublicCostExplorer />} />
    <Route path="/sign-in" element={<DashboardLoginV2 />} />
    <Route path="/sign-up" element={<DashboardSignUpV2 />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/verify-mail" element={<VerifyMail />} />
    <Route path="/tenant-home" element={<TenantHome />} />
    <Route path="/tenant-sign-up" element={<TenantRegister />} />
    <Route path="/tenant-sign-in" element={<TenantLogin />} />
  </>
);

export default PublicRoutes;
