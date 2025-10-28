import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AddModules from "../components/modulesComp/addModules";
import AdminPageShell from "../components/AdminPageShell";

const AdminModules = () => {
  const [activeTab, setActiveTab] = useState("Z2 Compute Instances");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRefs = useRef({});
  const buttonRefs = useRef({});
  const [isAddModulesOpen, setAddModules] = useState(false);
  // State to control mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddModules = () => setAddModules(true);
  const closeAddModules = () => setAddModules(false);

  // Array of module instances for tabs
  const moduleInstances = [
    "Z2 Compute Instances",
    "Z4 Compute Instances",
    "Z8 Compute Instances",
    "Shared Storage",
  ];

  // Data for each module instance
  const moduleData = {
    "Z2 Compute Instances": [
      {
        moduleName: "Z2 Large Compute Instances",
        price: "#936.80",
        cpu: "2 vCPU",
        memory: "4 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 13, 2025",
        action: "Edit Module",
      },
      {
        moduleName: "Z2 xLarge Compute Instances",
        price: "#976.80",
        cpu: "4 vCPU",
        memory: "8 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 13, 2025",
        action: "Delete Module",
      },
    ],
    "Z4 Compute Instances": [
      {
        moduleName: "Z4 Large Compute Instances",
        price: "#1,297.80",
        cpu: "8 vCPU",
        memory: "16 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 13, 2025",
        action: "Edit Module",
      },
      {
        moduleName: "Z4 xLarge Compute Instances",
        price: "#1,516.00",
        cpu: "16 vCPU",
        memory: "32 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 15, 2025",
        action: "Delete Module",
      },
    ],
    "Z8 Compute Instances": [
      {
        moduleName: "Z8 Large Compute Instances",
        price: "#1,572.00",
        cpu: "32 vCPU",
        memory: "64 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 15, 2025",
        action: "Edit Module",
      },
      {
        moduleName: "Z8 xLarge Compute Instances",
        price: "#2,356.80",
        cpu: "48 vCPU",
        memory: "96 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 15, 2025",
        action: "Delete Module",
      },
    ],
    "Shared Storage": [
      {
        moduleName: "Shared Storage Basic",
        price: "#500.00",
        cpu: "N/A",
        memory: "10 Gibs",
        duration: "30 Days",
        createdDate: "April 13, 2025",
        action: "Edit Module",
      },
    ],
  };

  const currentData = moduleData[activeTab] || [];
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const currentItems = currentData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleDropdown = (index, event) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const dropdownWidth = 200; // Approximate width of dropdown in pixels
    const windowWidth = window.innerWidth;

    let left = buttonRect.left + window.scrollX - 150; // Move left by 150px for more leftward positioning
    if (left + dropdownWidth > windowWidth) {
      left = windowWidth - dropdownWidth - 10; // Align to the right edge with a small margin
    }
    if (left < 0) {
      left = 10; // Ensure it doesn't go off the left edge
    }

    setDropdownPosition({
      top: buttonRect.bottom + window.scrollY,
      left,
    });
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  const handleDropdownAction = (action, itemName) => {
    console.log(`${action} for ${itemName}`);
    closeDropdown();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      let shouldClose = true;
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && ref.contains(event.target)) {
          shouldClose = false;
        }
      });
      if (shouldClose) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <AdminPageShell
        title="Modules"
        description="Manage catalog pricing, resources, and availability across all module tiers."
        actions={
          <button
            onClick={openAddModules}
            className="inline-flex items-center rounded-full bg-[#288DD1] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1976D2] transition-colors"
          >
            Add Module
          </button>
        }
        contentClassName="space-y-6"
      >

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          {moduleInstances.map((instance) => (
            <button
              key={instance}
              onClick={() => {
                setActiveTab(instance);
                setCurrentPage(1);
              }}
              className={`pb-2 text-sm font-medium ${
                activeTab === instance
                  ? "border-b-2 border-[#288DD1] text-[#288DD1]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {instance}
            </button>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px]">
          <table className="w-full bg-white">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  MODULE NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  PRICE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  CPU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  MEMORY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  DURATION
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  CREATED DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6EA]">
              {currentItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.moduleName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.cpu}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.memory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.createdDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      ref={(el) => (buttonRefs.current[index] = el)}
                      onClick={(e) => toggleDropdown(index, e)}
                      className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-6 space-y-4">
          {currentItems.map((item, index) => (
            <div key={index} className="border-b border-gray-200 py-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-[#1C1C1C]">
                  {item.moduleName}
                </h3>
              </div>
              <div className="flex w-full items-center justify-between">
                <p className="text-sm text-[#575758]">Price: {item.price}</p>
                <div className="flex justify-end mt-2">
                  <button
                    ref={(el) => (buttonRefs.current[index] = el)}
                    onClick={(e) => toggleDropdown(index, e)}
                    className="text-[#288DD1] hover:text-[#1976D2] transition-colors p-1"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-[#575758]">CPU: {item.cpu}</p>
              <p className="text-sm text-[#575758]">Memory: {item.memory}</p>
              <p className="text-sm text-[#575758]">
                Duration: {item.duration}
              </p>
              <p className="text-sm text-[#575758]">
                Created: {item.createdDate}
              </p>
            </div>
          ))}
        </div>

        {/* Dropdown Overlay */}
        {openDropdown !== null && currentItems[openDropdown] && (
          <div
            ref={(el) => (dropdownRefs.current[openDropdown] = el)}
            className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              minWidth: "12rem",
            }}
          >
            <button
              onClick={() =>
                handleDropdownAction(
                  "Edit Module",
                  currentItems[openDropdown].moduleName
                )
              }
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit Module
            </button>
            <button
              onClick={() =>
                handleDropdownAction(
                  "Delete Module",
                  currentItems[openDropdown].moduleName
                )
              }
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Delete Module
            </button>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center px-4 mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNumber
                        ? "bg-[#288DD1] text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <span className="text-sm text-gray-700">of</span>

            <button
              onClick={() => handlePageChange(totalPages)}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? "bg-[#288DD1] text-white"
                  : "text-gray-700 bg-white border border-[#333333] hover:bg-gray-50"
              }`}
            >
              {totalPages}
            </button>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
            </AdminPageShell>
      <AddModules isOpen={isAddModulesOpen} onClose={closeAddModules} />
    </>
  );
};

export default AdminModules;
