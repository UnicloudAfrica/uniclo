import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import home from "./assets/home.png";
import activeHome from "./assets/activeHome.png";
import modules from "./assets/module.png";
import activemodules from "./assets/activeModule.png";
import partners from "./assets/partners.png";
import activepartners from "./assets/activePartners.png";
import clients from "./assets/clients.png";
import activeClients from "./assets/activeClients.png";
import paymentHistory from "./assets/history.png";
import activePaymentHistory from "./assets/activeHistory.png";
import supportTicket from "./assets/support.png";
import activeSupportTicket from "./assets/activeSupport.png";

const AdminSidebar = () => {
  const [activeItem, setActiveItem] = useState("Home");
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get the current location

  // Map of paths to menu item names
  const pathToItemMap = {
    "/admin-dashboard": "Home",
    "/admin-dashboard/partners": "Partners",
    "/admin-dashboard/modules": "Modules",
    "/admin-dashboard/clients": "Clients",
    "/admin-dashboard/payment": "Payment",
    "/admin-dashboard/support-ticket": "Support Ticket",
  };

  // Update activeItem based on the current path
  useEffect(() => {
    const currentPath = location.pathname;
    const itemName = pathToItemMap[currentPath] || "Home"; // Default to "Home" if path not found
    setActiveItem(itemName);
  }, [location.pathname]); // Re-run when pathname changes

  const menuItems = [
    {
      name: "Home",
      icon: home,
      activeIcon: activeHome,
      path: "/admin-dashboard",
    },
    {
      name: "Partners",
      icon: partners,
      activeIcon: activepartners,
      path: "/admin-dashboard/partners",
    },
    {
      name: "Clients",
      icon: clients,
      activeIcon: activeClients,
      path: "/admin-dashboard/clients",
    },
    {
      name: "Modules",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/modules",
    },

    {
      name: "Payment",
      icon: paymentHistory,
      activeIcon: activePaymentHistory,
      path: "/admin-dashboard/payment",
    },
    {
      name: "Ticket",
      icon: supportTicket,
      activeIcon: activeSupportTicket,
      path: "/admin-dashboard/support-ticket",
    },
  ];

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
              ADMIN
            </button>
            <div className="w-full">
              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto w-full mt-3 px-2">
                <ul className="flex flex-col h-full w-full">
                  {menuItems.map((item) => renderMenuItem(item))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
