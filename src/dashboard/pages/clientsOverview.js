import React, { useState, useEffect } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import OverviewClient from "../components/overviewClient";
import ClientModules from "../components/clientModules";
import useAuthRedirect from "../../utils/authRedirect";
import { useLocation, useNavigate } from "react-router-dom"; // Import useNavigate
import { useFetchClientById } from "../../hooks/adminHooks/clientHooks";
import { Loader2 } from "lucide-react";

export default function ClientsOverview() {
  const [activeButton, setActiveButton] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading: isAuthLoading } = useAuthRedirect();
  const location = useLocation();
  const navigate = useNavigate(); // Initialize navigate hook

  const decodeId = (encodedId) => {
    try {
      return atob(decodeURIComponent(encodedId));
    } catch (error) {
      console.error("Failed to decode client ID:", error);
      return null;
    }
  };

  const queryParams = new URLSearchParams(location.search);
  const encodedClientId = queryParams.get("id");
  const clientId = encodedClientId ? decodeId(encodedClientId) : null;

  const {
    data: client,
    isFetching: isClientFetching,
    error: clientError,
  } = useFetchClientById(clientId, {
    enabled: !!clientId,
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const buttons = [
    {
      label: "Overview",
      value: "overview",
      component: <OverviewClient client={client} />,
    },
    {
      label: "Purchased Modules History",
      value: "purchased",
      component: <ClientModules client={client} />,
    },
  ];

  const handleButtonClick = (value) => {
    setActiveButton(value);
  };

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="dashboard-content-shell p-6 md:p-8">
        {isAuthLoading || isClientFetching ? (
          <div className="w-full min-h-[calc(100vh-200px)] flex items-center justify-center">
            <Loader2 className="w-12 text-[#288DD1] animate-spin" />
          </div>
        ) : clientError || !client ? (
          <div className="w-full min-h-[calc(100vh-200px)] flex flex-col items-center justify-center font-Outfit text-gray-600 text-lg">
            <p className="text-red-600 mb-4">Client not found.</p>
            <button
              onClick={() => navigate("/dashboard/clients")}
              className="px-6 py-2 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
            >
              Go Back to Clients
            </button>
          </div>
        ) : (
          <>
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
              {
                buttons.find((button) => button.value === activeButton)
                  .component
              }
            </div>
          </>
        )}
      </main>
    </>
  );
}
