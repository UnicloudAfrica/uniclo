import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  FolderKanban,
  Home,
  LifeBuoy,
  LogOut,
  Package,
  Settings,
  Shield,
  Users,
  X,
  Calculator,
  UserCheck,
} from "lucide-react";
import useAuthStore from "../../stores/userAuthStore";
import { useFetchProfile } from "../../hooks/resource";

const PATH_TO_ITEM_MAP = {
  "/dashboard": "Home",
  "/dashboard/projects": "Projects",
  "/dashboard/clients": "Clients",
  "/dashboard/leads": "Leads",
  "/dashboard/leads/create": "Leads",
  "/dashboard/leads/details": "Leads",
  "/dashboard/products": "Products",
  "/dashboard/calculator": "Calculator",
  "/dashboard/quote-calculator": "Quote Calculator",
  "/dashboard/quotes": "Quotes",
  "/dashboard/object-storage": "Object Storage",
  "/dashboard/payment-history": "Payment History",
  "/dashboard/support-ticket": "Support Ticket",
  "/dashboard/tax-configurations": "Tax Configurations",
  "/dashboard/admin-users": "Admin Users",
  "/dashboard/account-settings": "Account Settings",
};

const BASE_ICON_CLASS = "w-4 h-4 transition-colors duration-200";

const menuDefinitions = [
  { name: "Home", path: "/dashboard", icon: Home },
  { name: "Projects", path: "/dashboard/projects", icon: FolderKanban },
  { name: "Clients", path: "/dashboard/clients", icon: Users },
  { name: "Leads", path: "/dashboard/leads", icon: UserCheck },
  { name: "Products", path: "/dashboard/products", icon: Package },
  { name: "Calculator", path: "/dashboard/calculator", icon: Calculator },
  { name: "Quote Calculator", path: "/dashboard/quote-calculator", icon: ClipboardList },
  { name: "Quotes", path: "/dashboard/quotes", icon: FileText },
  { name: "Object Storage", path: "/dashboard/object-storage", icon: Database },
  { name: "Payment History", path: "/dashboard/payment-history", icon: CreditCard },
  { name: "Support Ticket", path: "/dashboard/support-ticket", icon: LifeBuoy },
  { name: "Tax Configurations", path: "/dashboard/tax-configurations", icon: Shield },
  { name: "Admin Users", path: "/dashboard/admin-users", icon: Users },
  { name: "Account Settings", path: "/dashboard/account-settings", icon: Settings },
];

const Sidebar = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
  const [activeItem, setActiveItem] = useState("Home");
  const navigate = useNavigate();
  const location = useLocation();
  const { clearToken } = useAuthStore.getState();
  const { data: profile } = useFetchProfile();

  useEffect(() => {
    const currentPath = location.pathname;
    const itemName = PATH_TO_ITEM_MAP[currentPath] || "Home";
    setActiveItem(itemName);
  }, [location.pathname]);

  const menuItems = menuDefinitions;

  const handleItemClick = (itemName, path) => {
    setActiveItem(itemName);
    navigate(path);
    onCloseMobileMenu();
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const firstInitial = firstName?.trim()?.[0]?.toUpperCase() || "";
    const lastInitial = lastName?.trim()?.[0]?.toUpperCase() || "";
    return firstInitial + lastInitial;
  };

  const handleLogout = () => {
    clearToken();
    navigate("/sign-in");
    onCloseMobileMenu();
  };

  const renderMenuItem = (item) => {
    const isActive = activeItem === item.name;
    const Icon = item.icon;

    return (
      <li key={item.name}>
        <button
          onClick={() => handleItemClick(item.name, item.path)}
          className={`w-full flex items-center py-2 px-3.5 space-x-2 text-left transition-all duration-200 hover:bg-gray-50 ${
            isActive ? "text-[#1C1C1C]" : "text-[#676767] hover:text-[#1C1C1C]"
          }`}
        >
          <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
            {isActive && (
              <div className="absolute left-[-14px] w-1 h-4 bg-[--theme-color] rounded-[3px]" />
            )}
            <Icon
              className={`${BASE_ICON_CLASS} ${
                isActive ? "text-[--theme-color]" : "text-[#676767]"
              }`}
            />
          </div>
          <span className="text-sm font-normal md:hidden lg:block font-Outfit">
            {item.name}
          </span>
        </button>
      </li>
    );
  };

  const renderMobileMenuItem = (item) => {
    const isActive = activeItem === item.name;
    const Icon = item.icon;
    const activeMobileClasses = "bg-[#ffffff15] text-white";
    const inactiveMobileClasses =
      "text-gray-200 hover:bg-[#ffffff15] hover:text-white";

    return (
      <li key={item.name}>
        <button
          onClick={() => handleItemClick(item.name, item.path)}
          className={`w-full flex items-center py-2 px-4 space-x-3 text-left transition-all duration-200 rounded-lg ${
            isActive ? activeMobileClasses : inactiveMobileClasses
          }`}
        >
          <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
            <Icon
              className={`${BASE_ICON_CLASS} ${
                isActive ? "text-white" : "text-gray-200"
              }`}
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
              Menu
            </button>
            <nav className="flex-1 overflow-y-auto w-full mt-3 px-2">
              <ul className="flex flex-col h-full w-full">
                {menuItems.map((item) => renderMenuItem(item))}
                <li className="pt-2 mt-auto border-t border-[#ECEDF0]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center py-2 px-4 space-x-2 text-left text-[#DC3F41] hover:bg-[#ffffff15] rounded-lg transition-colors duration-200"
                  >
                    <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium hidden lg:flex">
                      Logout
                    </span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Overlay Sidebar */}
      <div className="md:hidden font-Outfit">
        <div
          className={`fixed inset-0 bg-black z-[999] transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "bg-opacity-50 pointer-events-auto"
              : "bg-opacity-0 pointer-events-none"
          }`}
          onClick={onCloseMobileMenu}
        >
          <div
            className={`fixed top-0 left-0 h-full w-[280px] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ backgroundColor: "var(--theme-color, #14547F)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffffff20] text-base font-semibold">
                  {getInitials(profile?.first_name, profile?.last_name) || "--"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {profile?.email || "No email"}
                  </span>
                  <span className="text-xs text-white/80">
                    {(profile?.first_name || profile?.last_name) &&
                      `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`}
                  </span>
                </div>
              </div>
              <button
                onClick={onCloseMobileMenu}
                className="text-white hover:bg-[#ffffff20] p-2 rounded-lg transition-colors duration-200"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-4">
                {menuItems.map((item) => renderMobileMenuItem(item))}
                <li>
                  <button
                    className="w-full flex items-center py-3 px-4 space-x-3 text-left text-[#FEE2E2] hover:bg-[#ffffff15] rounded-lg transition-colors duration-200"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      <LogOut />
                    </div>
                    <span className="text-xs font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </nav>

            <div className="text-xs text-[#F1F1F1CC] px-6 py-4 border-t border-white/20">
              Version 1.0 - Live • Terms of Service
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
