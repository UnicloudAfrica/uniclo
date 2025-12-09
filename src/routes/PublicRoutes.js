import React from "react";
import { Route } from "react-router-dom";
import About from "../pages/about";
import Contact from "../pages/contact";
import FaqPage from "../pages/faqPage";
import Landing from "../pages/landing";
import Partnership from "../pages/partnership";
import Resources from "../pages/resources";
import Services from "../pages/services";
import Terms from "../pages/terms";
import Solutions from "../pages/solutions";
import DetailedSolution from "../pages/detailedSolu";
import Events from "../pages/events";
import Blog from "../pages/blog";
import Cms from "../pages/cms";
import Advisory from "../pages/advisory";
import DetailedBlog from "../pages/detailedblog";
import DetailedResources from "../pages/detailedresouces";
import DetailedCases from "../pages/detailedcase";
import DetailedBoard from "../pages/detailedboard";
import Career from "../pages/career";
import DetailedCareer from "../pages/detailedcareer";
import Login from "../adminComps/login";
import Management from "../pages/management";
import DetailedManage from "../pages/detailedmanage";
import ExtResouce from "../pages/extResource";
import ExtResouce1 from "../pages/extResource1";
import VerifyMail from "../dashboard/pages/verifyMail";
import ForgotPassword from "../dashboard/pages/forgotPassword";
import ResetPassword from "../dashboard/pages/resetPassword";
import TenantHome from "../tenantDashboard/pages/tenantHome";
import DashboardSignUpV2 from "../dashboard/pages/sign-upV2";
import DashboardLoginV2 from "../dashboard/pages/loginV2";
import TenantRegister from "../tenantDashboard/pages/tenant-signup";
import TenantLogin from "../tenantDashboard/pages/tenant-signin";

import Press from "../pages/press";

const PublicRoutes = () => {
  return (
    <>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/management" element={<Advisory />} />
      <Route path="/advisory-board" element={<Management />} />
      <Route path="/advisory-board/:name" element={<DetailedManage />} />
      <Route path="/management/:name" element={<DetailedBoard />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/partnership" element={<Partnership />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/services" element={<Services />} />
      <Route path="/solutions" element={<Solutions />} />
      <Route path="/events" element={<Events />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/press" element={<Press />} />

      <Route
        path="/Africa-Data-Centres-and-Onix-Data-Centre-announce-partnership"
        element={<ExtResouce />}
      />
      <Route
        path="/Benue-State-to-build-modern-data-center-and-cloud-system-with-UniCloud-Africa"
        element={<ExtResouce1 />}
      />
      <Route path="/solutions/:id" element={<DetailedSolution />} />
      <Route path="/resources/:id" element={<DetailedResources />} />
      <Route path="/use-cases/:id" element={<DetailedCases />} />
      <Route path="/blogs/:title" element={<DetailedBlog />} />
      <Route path="/careers/:id" element={<DetailedCareer />} />
      <Route path="/cms-login" element={<Login />} />
      <Route path="/cms-admin" element={<Cms />} />
      <Route path="/career" element={<Career />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-mail" element={<VerifyMail />} />
      <Route path="/sign-up" element={<DashboardSignUpV2 />} />
      <Route path="/sign-in" element={<DashboardLoginV2 />} />
      <Route path="/tenant-home" element={<TenantHome />} />
      <Route path="/tenant-sign-up" element={<TenantRegister />} />
      <Route path="/tenant-sign-in" element={<TenantLogin />} />
    </>
  );
};

export default PublicRoutes;
