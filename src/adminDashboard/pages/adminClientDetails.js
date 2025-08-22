import React, { useState, useEffect } from "react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import OverviewClient from "../components/clientsComps/clientsOverview";
import ClientModules from "../components/clientsComps/clientsModules";
import { useLocation, useNavigate } from "react-router-dom"; // Import useLocation and useNavigate

import { Loader2, AlertTriangle } from "lucide-react"; // Import icons for loading/error
import { useFetchClientById } from "../../hooks/adminHooks/clientHooks";

// Function to decode the ID from URL
const decodeId = (encodedId) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding ID:", e);
    return null; // Handle invalid encoded ID
  }
};

export default function AdminClientDetails() {
  const location = useLocation(); // Get the current location object
  const navigate = useNavigate(); // Initialize navigate hook

  const [activeButton, setActiveButton] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [clientId, setClientId] = useState(null); // State to store decoded client ID
  const [clientNameFromUrl, setClientNameFromUrl] = useState(""); // State to store client name from URL

  // Extract client ID and name from URL on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const encodedClientId = queryParams.get("id");
    const nameFromUrl = queryParams.get("name");

    if (encodedClientId) {
      const decodedId = decodeId(encodedClientId);
      setClientId(decodedId);
    }
    if (nameFromUrl) {
      setClientNameFromUrl(decodeURIComponent(nameFromUrl));
    }
  }, [location.search]);

  // Fetch client details using the hook
  const {
    data: clientDetails,
    isFetching: isClientFetching,
    isError,
    error,
  } = useFetchClientById(clientId);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleGoBack = () => {
    navigate("/admin/clients"); // Navigate back to the clients list
  };

  const buttons = [
    {
      label: "Overview",
      value: "overview",
      component: <OverviewClient client={clientDetails} />, // Pass clientDetails
    },
    {
      label: "Purchased Modules History",
      value: "purchased",
      component: <ClientModules client={clientDetails} />, // Pass clientDetails
    },
  ];

  const handleButtonClick = (value) => {
    setActiveButton(value);
  };

  // Show loading state
  if (isClientFetching || clientId === null) {
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
          <p className="ml-2 text-gray-700 mt-2">Loading client details...</p>
        </main>
      </>
    );
  }

  // Show error/not found state
  if (isError || !clientDetails) {
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
            This client could not be found.
          </p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
          >
            Go back to Clients List
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
          Client Details: {clientDetails.first_name} {clientDetails.last_name}
        </h1>
        <div className="flex border-b w-full border-[#EAECF0]">
          {buttons.map((button, index) => (
            <button
              key={index}
              className={`font-medium text-sm pb-4 px-2 transition-all ${
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
          {React.cloneElement(
            buttons.find((button) => button.value === activeButton).component,
            { client: clientDetails }
          )}
        </div>
      </main>
    </>
  );
}
