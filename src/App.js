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
import ClientDashboard from "./tenantDashboard/pages/client-dashboard";
import AdminUsers from "./adminDashboard/pages/adminUsers";
import AdminProjects from "./adminDashboard/pages/adminProjects";
import AdminProjectDetails from "./adminDashboard/pages/adminProjectDetails";
import AdminInstances from "./adminDashboard/pages/adminInstances";
import AdminAddInstance from "./adminDashboard/pages/adminAddInstance";
import Settings from "./dashboard/pages/settings";
import DashboardTaxConfigurations from "./dashboard/pages/taxConfiguration";
import Products from "./dashboard/pages/products";
import TenantAdmin from "./dashboard/pages/tenantAdmin";
import AdminInstancesDetails from "./adminDashboard/pages/adminInstancesDetails";
import Calculator from "./pages/calculator";
import AdminLeads from "./adminDashboard/pages/adminLeads";
import AdminLeadDetails from "./adminDashboard/pages/adminLeadDetails";
import TenantCalculator from "./dashboard/pages/calculator";
import Admincalculator from "./adminDashboard/pages/admincalculator";
import AdminSupportTicket from "./adminDashboard/pages/adminSupport";
import AdminRegion from "./adminDashboard/pages/adminRegion";
import AdminCountryPricing from "./adminDashboard/pages/adminCountryPricing";
import AdminKeyPairs from "./adminDashboard/pages/adminKeyPairs";
import AdminPricing from "./adminDashboard/pages/adminPricing";
import AdminProducts from "./adminDashboard/pages/adminProducts";
import AdminColocation from "./adminDashboard/pages/adminColocation";
import AddInstancePage from "./dashboard/pages/addInstance";
import AdminCalculatorOptions from "./adminDashboard/pages/adminCalculatorOptions";
import AdminMultiQuote from "./adminDashboard/pages/adminMultiQuote";
import TenantQuotes from "./dashboard/pages/quotes";

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
          <Route path="/calculator" element={<Calculator />} />
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
          <Route
            path="/dashboard/purchased-instances"
            element={<PurchasedModules />}
          />
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
          <Route path="/admin-dashboard/products" element={<AdminProducts />} />
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
          <Route path="/admin-dashboard/regions" element={<AdminRegion />} />
          <Route
            path="/admin-dashboard/country-pricing"
            element={<AdminCountryPricing />}
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
            path="/admin-dashboard/instances"
            element={<AdminInstances />}
          />
          <Route
            path="/admin-dashboard/add-instance"
            element={<AdminAddInstance />}
          />
          <Route
            path="/admin-dashboard/key-pairs"
            element={<AdminKeyPairs />}
          />
          <Route path="/admin-dashboard/pricing" element={<AdminPricing />} />
          <Route
            path="/admin-dashboard/instances/details"
            element={<AdminInstancesDetails />}
          />

          <Route
            path="/admin-dashboard/calculator"
            element={<Admincalculator />}
          />
          <Route
            path="/admin-dashboard/calculator-new"
            element={<AdminCalculatorOptions />}
          />
          <Route path="/admin-dashboard/quote" element={<AdminMultiQuote />} />
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
          <Route path="/client-dashboard" element={<ClientDashboard />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
