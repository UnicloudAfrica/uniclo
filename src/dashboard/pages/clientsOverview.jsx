import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import OverviewClient from "../components/overviewClient";
import ClientModules from "../components/clientModules";
import useAuthRedirect from "../../utils/authRedirect";
import { useFetchClientById } from "../../hooks/adminHooks/clientHooks";

export default function ClientsOverview() {
  const [activeButton, setActiveButton] = useState("overview");
  const { isLoading: isAuthLoading } = useAuthRedirect();
  const location = useLocation();
  const navigate = useNavigate();

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
    <TenantPageShell
      title={client?.name || "Client Overview"}
      description={client?.email || "View and manage client details"}
    >
      {isAuthLoading || isClientFetching ? (
        <div className="w-full min-h-[calc(100vh-300px)] flex items-center justify-center">
          <Loader2 className="w-12 text-[#288DD1] animate-spin" />
        </div>
      ) : clientError || !client ? (
        <div className="w-full min-h-[calc(100vh-300px)] flex flex-col items-center justify-center font-Outfit text-gray-600 text-lg">
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
            {buttons.find((button) => button.value === activeButton).component}
          </div>
        </>
      )}
    </TenantPageShell>
  );
}
