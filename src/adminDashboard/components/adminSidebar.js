import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { LogOut, X } from "lucide-react";

const AdminSidebar = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
  const [activeItem, setActiveItem] = useState("Home");
  const navigate = useNavigate();
  const location = useLocation();

  // Map of paths to menu item names
  const pathToItemMap = {
    "/admin-dashboard": "Home",
    "/admin-dashboard/partners": "Partners",
    "/admin-dashboard/modules": "Modules",
    "/admin-dashboard/clients": "Clients",
    "/admin-dashboard/payment": "Payment",
    "/admin-dashboard/projects": "Projects",
    "/admin-dashboard/instances": "Instances",
    "/admin-dashboard/enhanced-instance-management": "Enhanced Instances",
    "/admin-dashboard/enhanced-instance-details": "Instance Details",
    "/admin-dashboard/enhanced-profile-settings": "Profile Settings",
    "/admin-dashboard/multi-instance-creation": "Multi-Instance Creation",
    "/admin-dashboard/products": "Products",
    "/admin-dashboard/leads": "Leads",
    "/admin-dashboard/support-ticket": "Support Ticket",
    "/admin-dashboard/admin-users": "Admin Users",
    "/admin-dashboard/tax-configuration": "Tax Configuration",
    "/admin-dashboard/country-pricing": "Country Pricing",
    "/admin-dashboard/key-pairs": "Key Pairs",
    "/admin-dashboard/pricing": "Pricing",
    "/admin-dashboard/inventory": "Inventory",
    "/admin-dashboard/calculator": "Calculator",
    "/admin-dashboard/calculator-new": "Calculator",
    "/admin-dashboard/advanced-calculator": "Calculator",
    "/admin-dashboard/quote": "Generate Invoice",
  };

  // Update activeItem based on the current path
  useEffect(() => {
    const currentPath = location.pathname;
    const itemName = pathToItemMap[currentPath] || "Home"; // Default to "Home" if path not found
    setActiveItem(itemName);
  }, [location.pathname]);

  const menuItems = [
    {
      name: "Home",
      icon: home,
      activeIcon: activeHome,
      path: "/admin-dashboard",
    },
    {
      name: "Tenants & Users",
      icon: clients,
      activeIcon: activeClients,
      path: "/admin-dashboard/partners",
    },

    // {
    //   name: "Partners",
    //   icon: partners,
    //   activeIcon: activepartners,
    //   path: "/admin-dashboard/partners",
    // },
    // {
    //   name: "Clients",
    //   icon: clients,
    //   activeIcon: activeClients,
    //   path: "/admin-dashboard/clients",
    // },
    // {
    //   name: "Admin Users",
    //   icon: modules,
    //   activeIcon: activemodules,
    //   path: "/admin-dashboard/admin-users",
    // },
    // {
    //   name: "Modules",
    //   icon: modules,
    //   activeIcon: activemodules,
    //   path: "/admin-dashboard/modules",
    // },
    {
      name: "Leads",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/leads",
    },
    {
      name: "Payment",
      icon: paymentHistory,
      activeIcon: activePaymentHistory,
      path: "/admin-dashboard/payment",
    },
    {
      name: "Products",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/products",
    },
    {
      name: "Inventory",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/inventory",
    },
    {
      name: "Pricing",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/pricing",
    },
    // {
    //   name: "Infra",
    //   icon: modules,
    //   activeIcon: activemodules,
    //   path: "/admin-dashboard/key-pairs",
    // },
    {
      name: "Purchased Modules",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/purchased-modules",
    },
    {
      name: "Projects",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/projects",
    },
    {
      name: "Instances",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/instances",
    },
    {
      name: "Enhanced Instances",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/enhanced-instance-management",
    },
    {
      name: "Multi-Instance Creation",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/multi-instance-creation",
    },
    {
      name: "Regions",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/regions",
    },
    {
      name: "Calculator",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/advanced-calculator",
    },
    {
      name: "Generate Invoice",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/quote",
    },
    {
      name: "Tax Configuration",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/tax-configuration",
    },
    {
      name: "Ticket",
      icon: supportTicket,
      activeIcon: activeSupportTicket,
      path: "/admin-dashboard/support-ticket",
    },
    {
      name: "Profile Settings",
      icon: modules,
      activeIcon: activemodules,
      path: "/admin-dashboard/enhanced-profile-settings",
    },
  ];

  const handleItemClick = (itemName, path) => {
    setActiveItem(itemName);
    navigate(path);
    onCloseMobileMenu(); // Close mobile menu after navigation
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

  const renderMobileMenuItem = (item) => {
    const isActive = activeItem === item.name;

    return (
      <li key={item.name}>
        <button
          onClick={() => handleItemClick(item.name, item.path)}
          className={`w-full flex items-center py-2 px-4 space-x-3 text-left transition-all duration-200 rounded-lg ${
            isActive
              ? "bg-[#ffffff15] text-white"
              : "text-gray-200 hover:bg-[#ffffff15] hover:text-white"
          }`}
        >
          <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
            <img
              src={isActive ? item.activeIcon : item.icon}
              className="w-4 h-4 brightness-0 invert"
              alt={item.name}
            />
          </div>
          <span className="text-xs font-medium">{item.name}</span>
        </button>
      </li>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed top-[74px] left-0 z-[999] w-[80%] md:w-20 lg:w-[20%] h-full border-r border-[#C8CBD9] bg-[#fff] font-Outfit">
        <div className="flex flex-col h-full">
          <div className="px-3 py-4 md:px-3.5 md:py-6 w-full border-b border-[#ECEDF0]">
            <button className="py-1 px-2 text-[#676767] font-normal text-sm lg:text-sm">
              ADMIN
            </button>
            <nav className="flex-1 overflow-y-auto w-full mt-3 px-2">
              <ul className="flex flex-col h-full w-full">
                {menuItems.map((item) => renderMenuItem(item))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Overlay Sidebar */}
      <div className="md:hidden">
        {/* Overlay Background */}
        <div
          className={`fixed inset-0 bg-black z-[999] transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "bg-opacity-50 pointer-events-auto"
              : "bg-opacity-0 pointer-events-none"
          }`}
          onClick={onCloseMobileMenu}
        >
          {/* Sidebar Panel */}
          <div
            className={`fixed top-0 left-0 h-full w-[280px] bg-[#14547F] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Button */}
            <div className="flex justify-between items-center p-6">
              <div className="flex items-center"></div>
              <button
                onClick={onCloseMobileMenu}
                className="text-white hover:bg-[#ffffff20] p-2 rounded-lg transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Info */}
            <div className="px-6 mt-4 pb-4 border-b border-[#E9EAF433]">
              <div className="w-16 h-16 rounded-full bg-[#F1F1F11A] flex items-center justify-center text-[#fff] font-bold text-xl">
                AD
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium">admin@email.com</p>
                <p className="text-xs mt-1 text-[#F1F1F1CC]">Admin</p>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-4">
                {menuItems.map((item) => renderMobileMenuItem(item))}
                <li>
                  <button
                    className="w-full flex items-center py-3 px-4 space-x-3 text-left text-[#DC3F41] hover:bg-[#ffffff15] rounded-lg transition-colors duration-200"
                    onClick={() => {
                      // Add logout logic here
                      onCloseMobileMenu();
                    }}
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      <LogOut />
                    </div>
                    <span className="text-xs font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Footer */}
            <div className="text-xs text-[#F1F1F1CC] font-Outfit px-6 py-4 border-t border-[#ffffff20]">
              Version 1.0 - Live • Terms of Service
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
