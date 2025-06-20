import { BellRing, CircleHelp, Menu } from "lucide-react";
import logo from "./assets/logo.png";
import { useLocation } from "react-router-dom";

const Headbar = ({ onMenuClick }) => {
  const location = useLocation();

  // Map URL path segments to human-readable names
  const pathMap = {
    dashboard: "Home",
    modules: "Modules",
    "purchased-modules": "Purchased Modules",
    clients: "Clients",
    "payment-history": "Payment History",
    "support-ticket": "Support Ticket",
    "app-settings": "App Settings",
    overview: "Overview",
  };

  // Get the active page name
  const getActivePageName = () => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment); // Remove empty segments
    if (pathSegments.length === 0) return "Home";
    const lastSegment = pathSegments[pathSegments.length - 1];
    return (
      pathMap[lastSegment] ||
      lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    );
  };

  const activePageName = getActivePageName();

  return (
    <>
      <div className="w-full fixed top-0 left-0 h-[74px] px-6 md:px-8 py-3 z-[999] border-b bg-[#fff] border-[#C8CBD9] hidden md:flex justify-between items-center font-Outfit ">
        {/* Logo */}
        <img src={logo} className="w-[71px] h-[54px]" alt="Logo" />
        {/* Centered Free Trial Button */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <button className="bg-[#288DD11A] rounded-[10px] py-3 px-9 text-center font-normal text-base text-[#288DD1]">
            Free Trial
          </button>
        </div>
        {/* User Info */}
        <div className="flex items-center space-x-6">
          <BellRing className="text-[#1C1C1C] w-5" />
          <CircleHelp className="text-[#1C1C1C] w-5" />
          <div>
            <p className="text-[#1C1C1C] font-semibold text-sm">
              myemail@email.com
            </p>
            <p className="font-normal text-sm text-[#1C1C1C]">Odinaka Adaeze</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1C1C1C33] font-semibold text-sm text-center flex items-center justify-center">
            OA
          </div>
        </div>
      </div>

      <div className="w-full fixed top-0 left-0 h-[74px] px-6 md:px-8 py-3 z-[999] border-b bg-[#fff] border-[#C8CBD9] flex md:hidden justify-between items-center font-Outfit ">
        <div className="flex items-center space-x-3">
          {/* Add onClick handler to Menu button */}
          <button onClick={onMenuClick}>
            <Menu />
          </button>
          <p className="font-semibold text-base text-[#1C1C1C]">
            {activePageName}
          </p>
        </div>
        {/* Notification Info */}
        <div className="flex items-center border border-[#ECEDF0] justify-center rounded-[8px] w-10 h-10 ">
          <BellRing className="text-[#1C1C1C] w-4" />
        </div>
      </div>
    </>
  );
};

export default Headbar;
