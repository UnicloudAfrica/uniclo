import { useState, useEffect } from "react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import OverviewPartner from "../components/partnersComponent/overviewPartner";
import PartnerModules from "../components/partnersComponent/partnerModules";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { useFetchTenantById } from "../../hooks/adminHooks/tenantHooks";
import PartnerClients from "../components/partnersComponent/partnerClients";

// Function to decode the ID from URL (re-used from other files)
const decodeId = (encodedId) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding ID:", e);
    return null;
  }
};

export default function AdminPartnerDetails() {
  const [activeButton, setActiveButton] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation(); // Hook to access URL query parameters
  const navigate = useNavigate(); // Hook to navigate programmatically

  const [tenantId, setTenantId] = useState(null);
  const [tenantName, setTenantName] = useState("Partner"); // Default name

  // Extract ID and name from URL query parameters on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const encodedId = queryParams.get("id");
    const nameFromUrl = queryParams.get("name");

    if (encodedId) {
      const decodedId = decodeId(encodedId);
      setTenantId(decodedId);
    }
    if (nameFromUrl) {
      setTenantName(decodeURIComponent(nameFromUrl));
    }
  }, [location.search]);

  // Fetch tenant details using the custom hook
  const {
    data: partnerDetails,
    isFetching: isPartnerFetching,
    isError: isPartnerError,
    error: partnerError,
  } = useFetchTenantById(tenantId);

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Define buttons and their corresponding components
  const buttons = [
    {
      label: "Overview",
      value: "overview",
      component: (
        <OverviewPartner partnerDetails={partnerDetails} tenantId={tenantId} />
      ), // Pass partnerDetails
    },
    {
      label: "Clients",
      value: "clients",
      component: <PartnerClients tenantId={tenantId} />,
    },
    {
      label: "Purchased Modules History",
      value: "purchased",
      component: <PartnerModules tenantId={tenantId} />, // Pass tenantId
    },
  ];

  const handleButtonClick = (value) => {
    setActiveButton(value);
  };

  // Handle loading state
  if (isPartnerFetching) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700 mt-2">Loading partner details...</p>
        </main>
      </>
    );
  }

  // Handle error or no data found state
  if (isPartnerError || !partnerDetails) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-4">
            Partner details not found.
          </p>
          <button
            onClick={() => navigate("/admin-dashboard/partners")}
            className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
          >
            Go back to Partners List
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[#1E1E1EB2] mb-6">
          {tenantName} Details
        </h1>
        <div className="flex border-b w-full border-[#EAECF0]">
          {buttons.map((button) => (
            <button
              key={button.value}
              className={`font-medium text-sm pb-4 px-2 transition-all mr-4 ${
                // Added mr-4 for spacing
                activeButton === button.value
                  ? "border-b-2 border-[#288DD1] text-[#288DD1]"
                  : "text-[#1C1C1C]"
              }`}
              onClick={() => handleButtonClick(button.value)}
            >
              {button.label}
            </button>
          ))}
        </div>

        <div className="w-full mt-6">
          {/* Render the component based on activeButton */}
          {buttons.find((button) => button.value === activeButton).component}
        </div>
      </main>
    </>
  );
}
