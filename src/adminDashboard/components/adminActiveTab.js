import { useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const AdminActiveTab = () => {
  const location = useLocation();

  // Map URL path segments to human-readable names
  const pathMap = {
    "admin-dashboard": "Home",
    modules: "Modules",
    partners: "Partners",
    clients: "Clients",
    payment: "Payment",
    "support-ticket": "Ticket",
    overview: "Overview",
    details: "Details",
    products: "products",
    "purchased-modules": "Purchased Modules",
    "tax-configuration": "Tax Configuration",
    "admin-users": "Admin Users",
    projects: "Admin Projects",
  };

  // Generate breadcrumb items from the current pathname
  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment); // Remove empty segments

    if (pathSegments.length === 0)
      return [{ name: "Home", path: "/dashboard" }];

    return pathSegments.map((segment, index) => {
      const pathSoFar = `/${pathSegments.slice(0, index + 1).join("/")}`;
      return {
        name: pathMap[segment] || segment, // Use mapped name or raw segment if not in map
        path: pathSoFar,
      };
    });
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <div className="font-Outfit fixed top-[74px] left-0 md:left-20 lg:left-[20%] h-[52px] px-8 border-b border-[#C8CBD9] flex items-center w-full md:w-[calc(100%-5rem)] lg:w-[80%] z-[99] bg-white">
      {/* <button className="text-[#288DD1]/50 font-Outfit font-normal text-sm">
        Menu
      </button> */}
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="text-[#1C1C1C80] mx-2 w-4" />}
          <button
            className={`font-Outfit text-sm ${
              index === breadcrumbItems.length - 1
                ? "text-[#288DD1] font-medium"
                : "text-[#288DD1]/50 font-normal"
            }`}
            onClick={() => (window.location.href = item.path)} // Basic navigation (replace with useNavigate if needed)
          >
            {item.name}
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminActiveTab;
