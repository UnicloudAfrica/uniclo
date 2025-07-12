import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import About from "./pages/about";
import Contact from "./pages/contact";
import FaqPage from "./pages/faqPage";
import Landing from "./pages/landing";
import Partnership from "./pages/partnership";
import Resources from "./pages/resources";
import Services from "./pages/services";
import Terms from "./pages/terms";
import Solutions from "./pages/solutions";
import DetailedSolution from "./pages/detailedSolu";
import Events from "./pages/events";
import Blog from "./pages/blog";
import Cms from "./pages/cms";
import Advisory from "./pages/advisory";
import DetailedBlog from "./pages/detailedblog";
import DetailedResources from "./pages/detailedresouces";
import DetailedCases from "./pages/detailedcase";
import DetailedBoard from "./pages/detailedboard";
import Career from "./pages/career";
import DetailedCareer from "./pages/detailedcareer";
import Login from "./adminComps/login";
import Management from "./pages/management";
import DetailedManage from "./pages/detailedmanage";
import ExtResouce from "./pages/extResource";
import ExtResouce1 from "./pages/extResource1";
import DashboardLogin from "./dashboard/pages/login";
import DashboardSignUp from "./dashboard/pages/sign-up";
import VerifyMail from "./dashboard/pages/verifyMail";
import Dashboard from "./dashboard/pages/dashboard";
import { Modules } from "./dashboard/pages/modules";
import PurchasedModules from "./dashboard/pages/purchasedModules";
import PaymentHistory from "./dashboard/pages/paymentHistory";
import SupportTicket from "./dashboard/pages/supportTicket";
import Clients from "./dashboard/pages/clients";
import ClientsOverview from "./dashboard/pages/clientsOverview";
import AdminDashboard from "./adminDashboard/pages/adminDashboard";
import AdminPartners from "./adminDashboard/pages/adminPartners";
import AdminPartnerDetails from "./adminDashboard/pages/adminPartnerDetails";
import AdminClients from "./adminDashboard/pages/adminClients";
import AdminClientDetails from "./adminDashboard/pages/adminClientDetails";
import AdminModules from "./adminDashboard/pages/adminModules";
import AdminPayment from "./adminDashboard/pages/adminPayment";
import ForgotPassword from "./dashboard/pages/forgotPassword";
import ResetPassword from "./dashboard/pages/resetPassword";
import AdminSignup from "./adminDashboard/pages/adminSignup";
import VerifyAdminMail from "./adminDashboard/pages/adminVerify";
import Requests from "./dashboard/pages/requests";
import AdminLogin from "./adminDashboard/pages/adminSignin";
import AdminPurchasedModules from "./adminDashboard/pages/adminPurchasedModules";

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
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

          {/* dashboard pages */}
          <Route path="/sign-in" element={<DashboardLogin />} />
          <Route path="/sign-up" element={<DashboardSignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-mail" element={<VerifyMail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/modules" element={<Modules />} />
          <Route
            path="/dashboard/purchased-modules"
            element={<PurchasedModules />}
          />
          <Route path="/dashboard/clients" element={<Clients />} />
          <Route path="/dashboard/requests" element={<Requests />} />
          <Route
            path="/dashboard/clients/overview"
            element={<ClientsOverview />}
          />
          <Route
            path="/dashboard/payment-history"
            element={<PaymentHistory />}
          />
          <Route path="/dashboard/support-ticket" element={<SupportTicket />} />

          {/* admin pages */}
          <Route path="/admin-signin" element={<AdminLogin />} />
          {/* <Route path="/admin-signup" element={<AdminSignup />} /> */}
          <Route path="/verify-admin-mail" element={<VerifyAdminMail />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-dashboard/partners" element={<AdminPartners />} />
          <Route
            path="/admin-dashboard/partners/details"
            element={<AdminPartnerDetails />}
          />
          <Route path="/admin-dashboard/clients" element={<AdminClients />} />
          <Route
            path="/admin-dashboard/clients/details"
            element={<AdminClientDetails />}
          />
          <Route path="/admin-dashboard/modules" element={<AdminModules />} />
          <Route
            path="/admin-dashboard/purchased-modules"
            element={<AdminPurchasedModules />}
          />
          <Route path="/admin-dashboard/payment" element={<AdminPayment />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
