import React, { useState } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import OverviewClient from "../components/overviewClient";
import ClientModules from "../components/clientModules";
import CartFloat from "../components/cartFloat";
import useAuthRedirect from "../../utils/authRedirect";

export default function ClientsOverview() {
  const [activeButton, setActiveButton] = useState("overview");
  // State to control mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading } = useAuthRedirect();

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const buttons = [
    {
      label: "Overview",
      value: "overview",
      component: <OverviewClient />,
    },

    {
      label: "Purchased Modules History",
      value: "purchased",
      component: <ClientModules />,
    },
  ];

  const handleButtonClick = (value) => {
    setActiveButton(value);
  };

  return (
    <>
      {/* <CartFloat /> */}
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <div className="flex border-b w-full border-[#EAECF0]">
          {buttons.map((button, index) => (
            <button
              key={index}
              className={`font-mediu text-sm pb-4 px-2 transition-all ${
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

        <div className="  w-full mt-6">
          {buttons.find((button) => button.value === activeButton).component}
        </div>
      </main>
    </>
  );
}
