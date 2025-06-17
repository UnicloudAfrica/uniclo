import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import home from "./assets/home.png";
import activeHome from "./assets/activeHome.png";
import modules from "./assets/module.png";
import activemodules from "./assets/activeModule.png";
import purchasedModules from "./assets/purchased_modules.png";
import activePurchasedModules from "./assets/activePurchased.png";
import clients from "./assets/clients.png";
import activeClients from "./assets/activeClients.png";
import paymentHistory from "./assets/history.png";
import activePaymentHistory from "./assets/activeHistory.png";
import supportTicket from "./assets/support.png";
import activeSupportTicket from "./assets/activeSupport.png";
import appSettings from "./assets/settings.png";

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState("Home");
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get the current location

  // Map of paths to menu item names
  const pathToItemMap = {
    "/dashboard": "Home",
    "/dashboard/modules": "Modules",
    "/dashboard/purchased-modules": "Purchased Modules",
    "/dashboard/clients": "Clients",
    "/dashboard/payment-history": "Payment History",
    "/dashboard/support-ticket": "Support Ticket",
    "/dashboard/app-settings": "App Settings",
  };

  // Update activeItem based on the current path
  useEffect(() => {
    const currentPath = location.pathname;
    const itemName = pathToItemMap[currentPath] || "Home"; // Default to "Home" if path not found
    setActiveItem(itemName);
  }, [location.pathname]); // Re-run when pathname changes

  const menuItems = [
    { name: "Home", icon: home, activeIcon: activeHome, path: "/dashboard" },
    {
      name: "Modules",
      icon: modules,
      activeIcon: activemodules,
      path: "/dashboard/modules",
    },
    {
      name: "Purchased Modules",
      icon: purchasedModules,
      activeIcon: activePurchasedModules,
      path: "/dashboard/purchased-modules",
    },
    {
      name: "Clients",
      icon: clients,
      activeIcon: activeClients,
      path: "/dashboard/clients",
    },
    {
      name: "Payment History",
      icon: paymentHistory,
      activeIcon: activePaymentHistory,
      path: "/dashboard/payment-history",
    },
    {
      name: "Support Ticket",
      icon: supportTicket,
      activeIcon: activeSupportTicket,
      path: "/dashboard/support-ticket",
    },
  ];

  const settingsItem = {
    name: "App Settings",
    icon: appSettings,
    activeIcon: appSettings,
    path: "/dashboard/app-settings",
  };

  const handleItemClick = (itemName, path) => {
    setActiveItem(itemName);
    navigate(path);
  };

  const renderMenuItem = (item, isBottom = false) => {
    const isActive = activeItem === item.name;

    return (
      <li key={item.name} className={isBottom ? "mt-auto" : ""}>
        <button
          onClick={() => handleItemClick(item.name, item.path)}
          className={`w-full flex items-center py-2 px-3.5 space-x-2 text-left transition-all duration-200 hover:bg-gray-50 ${
            isActive ? "text-[#1C1C1C]" : "text-[#676767] hover:text-[#1C1C1C]"
          }`}
        >
          {/* Add the black vertical bar for the active item */}
          <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
            {isActive && (
              <div className="absolute left-[-14px] w-1 h-4 bg-black rounded-[3px]" />
            )}
            <img
              src={isActive ? item.activeIcon : item.icon}
              className="w-4 h-4"
              alt={item.name}
            />
          </div>
          <span className="text-sm font-normal hidden font-Outfit lg:block">
            {item.name}
          </span>
        </button>
      </li>
    );
  };

  return (
    <>
      <div className="hidden md:block fixed top-[74px] left-0 z-[999] w-[80%] md:w-20 lg:w-[20%] h-full border-r border-[#C8CBD9] bg-[#fff] font-Outfit">
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="px-3 py-4 md:px-3.5 md:py-6 w-full border-b border-[#ECEDF0]">
            <button className="py-1 px-2 text-[#676767] font-normal text-sm lg:text-sm">
              Menu
            </button>
            <div className="w-full">
              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto w-full mt-3 px-2">
                <ul className="flex flex-col h-full w-full">
                  {menuItems.map((item) => renderMenuItem(item))}

                  {/* Settings at bottom */}
                  {renderMenuItem(settingsItem, true)}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
