import { useState } from "react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import OverviewPartner from "../components/partnersComponent/overviewPartner";
import PartnerModules from "../components/partnersComponent/partnerModules";

export default function AdminPartnerDetails() {
  const [activeButton, setActiveButton] = useState("overview");

  const buttons = [
    {
      label: "Overview",
      value: "overview",
      component: <OverviewPartner />,
    },
    {
      label: "Clients",
      value: "clients",
      component: "<clients />",
    },

    {
      label: "Purchased Modules History",
      value: "purchased",
      component: <PartnerModules />,
    },
  ];

  const handleButtonClick = (value) => {
    setActiveButton(value);
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminActiveTab />
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
