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
import AdminPartnerCreate from "./adminDashboard/pages/adminPartnerCreate";
import AdminPartnerDetails from "./adminDashboard/pages/adminPartnerDetails";
import AdminClients from "./adminDashboard/pages/adminClients";
import AdminClientCreate from "./adminDashboard/pages/adminClientCreate";
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
import Project from "./dashboard/pages/projectmain";
import Instances from "./dashboard/pages/instances";
import ProjectDetails from "./dashboard/pages/projectDetails";
import InstancesDetails from "./dashboard/pages/instancesDetails";
import AdminInventory from "./adminDashboard/pages/adminInventory";
import AdminTax from "./adminDashboard/pages/adminTax";
import TenantHome from "./tenantDashboard/pages/tenantHome";
import { getSubdomain } from "./utils/getSubdomaim";
import DashboardSignUpV2 from "./dashboard/pages/sign-upV2";
import DashboardLoginV2 from "./dashboard/pages/loginV2";
import TenantRegister from "./tenantDashboard/pages/tenant-signup";
import TenantLogin from "./tenantDashboard/pages/tenant-signin";
import AdminUsers from "./adminDashboard/pages/adminUsers";
import AdminUserCreate from "./adminDashboard/pages/adminUserCreate";
import AdminProjects from "./adminDashboard/pages/adminProjects";
import AdminProjectDetails from "./adminDashboard/pages/adminProjectDetails";
import AdminAddInstance from "./adminDashboard/pages/adminAddInstance";
import Settings from "./dashboard/pages/settings";
import DashboardTaxConfigurations from "./dashboard/pages/taxConfiguration";
import Products from "./dashboard/pages/products";
import TenantAdmin from "./dashboard/pages/tenantAdmin";
import Calculator from "./pages/calculator";
import AdminLeads from "./adminDashboard/pages/adminLeads";
import AdminLeadCreate from "./adminDashboard/pages/adminLeadCreate";
import AdminLeadDetails from "./adminDashboard/pages/adminLeadDetails";
import TenantCalculator from "./dashboard/pages/calculator";
import AdminSupportTicket from "./adminDashboard/pages/adminSupport";
import AdminRegion from "./adminDashboard/pages/adminRegion";
import AdminKeyPairs from "./adminDashboard/pages/adminKeyPairs";
import AdminPricing from "./adminDashboard/pages/adminPricing";
import AdminProducts from "./adminDashboard/pages/adminProducts";
import AdminProductCreate from "./adminDashboard/pages/AdminProductCreate";
import AdminColocation from "./adminDashboard/pages/adminColocation";
import AddInstancePage from "./dashboard/pages/addInstance";
// import AdminQuoteCalculator from "./adminDashboard/pages/AdminQuoteCalculator";
import TenantQuotes from "./dashboard/pages/quotes";
// import QuoteCalculatorWizard from "./dashboard/pages/QuoteCalculatorWizard";
import TenantQuoteCalculator from "./dashboard/pages/TenantQuoteCalculator";
import ClientDashboard from "./clientDashboard/pages/clientDashboard";
import ClientProject from "./clientDashboard/pages/clientProjects";
import ClientProjectDetails from "./clientDashboard/pages/clientProjectDetails";
import ClientInstances from "./clientDashboard/pages/clientInstances";
import ClientAddInstancePage from "./clientDashboard/pages/clientAddInstances";
import AdminMultiQuote from "./adminDashboard/pages/adminMultiQuote";
import AdminAdvancedCalculator from "./adminDashboard/pages/adminAdvancedCalculator";
import AdminInfrastructureSetup from "./adminDashboard/pages/adminInfrastructureSetup";
import MultiInstanceCreation from "./adminDashboard/pages/multiInstanceCreation";
// Instance Management routes removed - functionality moved to standard instances
// import InstanceManagement from "./adminDashboard/pages/instanceManagement";
// import InstanceDetails from "./adminDashboard/pages/instanceDetails";
import EnhancedProfileSettings from "./adminDashboard/pages/enhancedProfileSettings";
import ClientCalculator from "./clientDashboard/pages/clientCalculator";
import ClientPaymentHistory from "./clientDashboard/pages/clientTransaction";
import ClientSettings from "./clientDashboard/pages/clientAccountSettings";
import ClientSupport from "./clientDashboard/pages/clientSupport";
import AdminInstances from "./adminDashboard/pages/adminInstances";
import AdminInstancesDetails from "./adminDashboard/pages/adminInstancesDetails";
import TenantLeads from "./tenantDashboard/pages/tenant-leads";
import TenantLeadDetails from "./tenantDashboard/pages/tenant-lead-details";
import RegionApprovals from "./adminDashboard/pages/RegionApprovals";
import RegionApprovalDetail from "./adminDashboard/pages/RegionApprovalDetail";
import RegionApprovalEdit from "./adminDashboard/pages/RegionApprovalEdit";
import RegionApprovalCreate from "./adminDashboard/pages/RegionApprovalCreate";
import RegionDetail from "./adminDashboard/pages/RegionDetail";
import RegionEdit from "./adminDashboard/pages/RegionEdit";
import RegionRequests from "./tenantDashboard/pages/RegionRequests";
import RegionRequestDetail from "./tenantDashboard/pages/RegionRequestDetail";
import NewRegionRequest from "./tenantDashboard/pages/NewRegionRequest";
import RevenueDashboard from "./tenantDashboard/pages/RevenueDashboard";

import ClientDashboardLayout from "./clientDashboard/components/ClientDashboardLayout";
import Press from "./pages/press";
function App() {
  const location = useLocation();
  const subdomain = getSubdomain();
  const isTenant = !!subdomain; // True for xyz.unicloudafrica.com, false for unicloudafrica.com

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          {/* <Route
            path="/"
            element={isTenant ? <TenantHome tenant={subdomain} /> : <Landing />}
          /> */}
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
          <Route path="/calculator" element={<Calculator />} />
          <Route
            path="/dashboard/quote-calculator"
            element={<TenantQuoteCalculator />}
          />
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
          {/* <Route path="/sign-in" element={<DashboardLogin />} />
          <Route path="/sign-up" element={<DashboardSignUp />} /> */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-mail" element={<VerifyMail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/modules" element={<Modules />} />
          <Route path="/dashboard/instances" element={<PurchasedModules />} />
          <Route path="/dashboard/clients" element={<Clients />} />
          <Route path="/dashboard/requests" element={<Requests />} />
          <Route path="/dashboard/projects" element={<Project />} />
          <Route path="/dashboard/calculator" element={<TenantCalculator />} />
          <Route path="/dashboard/products" element={<Products />} />
          <Route path="/dashboard/admin-users" element={<TenantAdmin />} />
          <Route
            path="/dashboard/projects/details"
            element={<ProjectDetails />}
          />
          <Route path="/dashboard/instances" element={<Instances />} />
          <Route path="/dashboard/quotes" element={<TenantQuotes />} />
          <Route path="/dashboard/add-instance" element={<AddInstancePage />} />

          {/* Tenant Leads Routes */}
          <Route path="/tenant-dashboard/leads" element={<TenantLeads />} />
          <Route
            path="/tenant-dashboard/leads/details"
            element={<TenantLeadDetails />}
          />

          {/* Tenant Region Marketplace Routes */}
          <Route
            path="/tenant-dashboard/region-requests"
            element={<RegionRequests />}
          />
          <Route
            path="/tenant-dashboard/region-requests/new"
            element={<NewRegionRequest />}
          />
          <Route
            path="/tenant-dashboard/region-requests/:id"
            element={<RegionRequestDetail />}
          />
          <Route
            path="/tenant-dashboard/revenue"
            element={<RevenueDashboard />}
          />
          <Route path="/dashboard/account-settings" element={<Settings />} />
          <Route
            path="/dashboard/tax-configurations"
            element={<DashboardTaxConfigurations />}
          />
          <Route
            path="/dashboard/instances/details"
            element={<InstancesDetails />}
          />
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
          <Route path="/admin-dashboard/admin-users" element={<AdminUsers />} />
          <Route
            path="/admin-dashboard/admin-users/create"
            element={<AdminUserCreate />}
          />
          <Route path="/admin-dashboard/admins" element={<AdminUsers />} />
          <Route path="/admin-dashboard/partners" element={<AdminPartners />} />
          <Route
            path="/admin-dashboard/partners/create"
            element={<AdminPartnerCreate />}
          />
          <Route
            path="/admin-dashboard/partners/details"
            element={<AdminPartnerDetails />}
          />
          <Route path="/admin-dashboard/clients" element={<AdminClients />} />
          <Route
            path="/admin-dashboard/clients/create"
            element={<AdminClientCreate />}
          />
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
          <Route path="/admin-dashboard/products" element={<AdminProducts />} />
          <Route
            path="/admin-dashboard/products/add"
            element={<AdminProductCreate />}
          />
          <Route
            path="/admin-dashboard/colocation"
            element={<AdminColocation />}
          />
          <Route
            path="/admin-dashboard/inventory"
            element={<AdminInventory />}
          />
          <Route path="/admin-dashboard/projects" element={<AdminProjects />} />
          <Route path="/admin-dashboard/leads" element={<AdminLeads />} />
          <Route
            path="/admin-dashboard/leads/create"
            element={<AdminLeadCreate />}
          />
          <Route path="/admin-dashboard/regions" element={<AdminRegion />} />
          <Route
            path="/admin-dashboard/regions/:id"
            element={<RegionDetail />}
          />
          <Route
            path="/admin-dashboard/regions/:id/edit"
            element={<RegionEdit />}
          />
          <Route
            path="/admin-dashboard/region-approvals"
            element={<RegionApprovals />}
          />
          <Route
            path="/admin-dashboard/region-approvals/create"
            element={<RegionApprovalCreate />}
          />
          <Route
            path="/admin-dashboard/region-approvals/:id"
            element={<RegionApprovalDetail />}
          />
          <Route
            path="/admin-dashboard/region-approvals/:id/edit"
            element={<RegionApprovalEdit />}
          />
          <Route
            path="/admin-dashboard/leads/details"
            element={<AdminLeadDetails />}
          />
          <Route
            path="/admin-dashboard/projects/details"
            element={<AdminProjectDetails />}
          />
          <Route
            path="/admin-dashboard/infrastructure-setup"
            element={<AdminInfrastructureSetup />}
          />
          {/* Instances route removed in favor of Instance Management */}
          <Route
            path="/admin-dashboard/add-instance"
            element={<AdminAddInstance />}
          />
          <Route
            path="/admin-dashboard/key-pairs"
            element={<AdminKeyPairs />}
          />
          <Route path="/admin-dashboard/pricing" element={<AdminPricing />} />
          {/* Instances details route removed in favor of Instance Management details */}

          {/* <Route
            path="/admin-dashboard/calculator"
            element={<Admincalculator />}
          />
          <Route
            path="/admin-dashboard/calculator-new"
            element={<AdminCalculatorOptions />}
          /> */}
          <Route path="/admin-dashboard/quote" element={<AdminMultiQuote />} />
          <Route
            path="/admin-dashboard/advanced-calculator"
            element={<AdminAdvancedCalculator />}
          />
          {/* Instance Management routes removed - functionality moved to standard instances */}
          {/* <Route path="/admin-dashboard/instance-management" element={<InstanceManagement />} /> */}
          {/* <Route path="/admin-dashboard/instance-management/details" element={<InstanceDetails />} /> */}
          <Route
            path="/admin-dashboard/profile-settings"
            element={<EnhancedProfileSettings />}
          />
          <Route
            path="/admin-dashboard/multi-instance-creation"
            element={<MultiInstanceCreation />}
          />
          <Route
            path="/admin-dashboard/instances"
            element={<AdminInstances />}
          />
          <Route
            path="/admin-dashboard/instances/details"
            element={<AdminInstancesDetails />}
          />
          {/* <Route
            path="/admin-dashboard/quote-calculator"
            element={<AdminQuoteCalculator />}
          /> */}
          <Route
            path="/admin-dashboard/tax-configuration"
            element={<AdminTax />}
          />

          <Route
            path="/admin-dashboard/support-ticket"
            element={<AdminSupportTicket />}
          />

          {/* new pages */}
          <Route path="/sign-up" element={<DashboardSignUpV2 />} />
          <Route path="/sign-in" element={<DashboardLoginV2 />} />
          <Route path="/tenant-home" element={<TenantHome />} />
          <Route path="/tenant-sign-up" element={<TenantRegister />} />
          <Route path="/tenant-sign-in" element={<TenantLogin />} />
          {/* client pages */}
          <Route element={<ClientDashboardLayout />}>
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route
              path="/client-dashboard/projects"
              element={<ClientProject />}
            />
            <Route
              path="/client-dashboard/projects/details"
              element={<ClientProjectDetails />}
            />
            <Route
              path="/client-dashboard/instances"
              element={<ClientInstances />}
            />
            <Route
              path="/client-dashboard/add-instance"
              element={<ClientAddInstancePage />}
            />
            <Route
              path="/client-dashboard/calculator"
              element={<ClientCalculator />}
            />
            <Route
              path="/client-dashboard/orders-payments"
              element={<ClientPaymentHistory />}
            />
            <Route
              path="/client-dashboard/account-settings"
              element={<ClientSettings />}
            />
            <Route
              path="/client-dashboard/support"
              element={<ClientSupport />}
            />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
