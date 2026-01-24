// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import AdminActiveTab from "../components/adminActiveTab";
import AddModules from "../components/modulesComp/addModules";
import AdminPageShell from "../components/AdminPageShell.tsx";
import ModernTable from "../../shared/components/ui/ModernTable";

const AdminModules = () => {
  const [activeTab, setActiveTab] = useState("Z2 Compute Instances");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isAddModulesOpen, setAddModules] = useState(false);
  const dropdownRefs = useRef({});

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
        id: "z2-1",
        moduleName: "Z2 Large Compute Instances",
        price: "#936.80",
        cpu: "2 vCPU",
        memory: "4 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 13, 2025",
      },
      {
        id: "z2-2",
        moduleName: "Z2 xLarge Compute Instances",
        price: "#976.80",
        cpu: "4 vCPU",
        memory: "8 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 13, 2025",
      },
    ],
    "Z4 Compute Instances": [
      {
        id: "z4-1",
        moduleName: "Z4 Large Compute Instances",
        price: "#1,297.80",
        cpu: "8 vCPU",
        memory: "16 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 13, 2025",
      },
      {
        id: "z4-2",
        moduleName: "Z4 xLarge Compute Instances",
        price: "#1,516.00",
        cpu: "16 vCPU",
        memory: "32 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 15, 2025",
      },
    ],
    "Z8 Compute Instances": [
      {
        id: "z8-1",
        moduleName: "Z8 Large Compute Instances",
        price: "#1,572.00",
        cpu: "32 vCPU",
        memory: "64 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 15, 2025",
      },
      {
        id: "z8-2",
        moduleName: "Z8 xLarge Compute Instances",
        price: "#2,356.80",
        cpu: "48 vCPU",
        memory: "96 Gibs Memory",
        duration: "30 Days",
        createdDate: "April 15, 2025",
      },
    ],
    "Shared Storage": [
      {
        id: "ss-1",
        moduleName: "Shared Storage Basic",
        price: "#500.00",
        cpu: "N/A",
        memory: "10 Gibs",
        duration: "30 Days",
        createdDate: "April 13, 2025",
      },
    ],
  };

  const currentData = moduleData[activeTab] || [];

  const handleDropdownAction = (action: any, itemName: any) => {
    console.log(`${action} for ${itemName}`);
    setOpenDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      let shouldClose = true;
      Object.values(dropdownRefs.current).forEach((ref: any) => {
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

  const columns = [
    {
      key: "moduleName",
      header: "MODULE NAME",
    },
    {
      key: "price",
      header: "PRICE",
    },
    {
      key: "cpu",
      header: "CPU",
    },
    {
      key: "memory",
      header: "MEMORY",
    },
    {
      key: "duration",
      header: "DURATION",
    },
    {
      key: "createdDate",
      header: "CREATED DATE",
    },
    {
      key: "action",
      header: "ACTION",
      render: (_, item, index) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(openDropdown === item.id ? null : item.id);
            }}
            className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {openDropdown === item.id && (
            <div
              ref={(el) => (dropdownRefs.current[item.id] = el)}
              className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50"
              style={{ minWidth: "12rem" }}
            >
              <button
                onClick={() => handleDropdownAction("Edit Module", item.moduleName)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit Module
              </button>
              <button
                onClick={() => handleDropdownAction("Delete Module", item.moduleName)}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete Module
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
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
          {moduleInstances.map((instance: any) => (
            <button
              key={instance}
              onClick={() => {
                setActiveTab(instance);
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

        {/* Table using ModernTable */}
        <ModernTable
          data={currentData}
          columns={columns}
          searchable={true}
          searchPlaceholder="Search modules..."
          searchKeys={["moduleName", "price", "cpu", "memory"]}
          paginated={true}
          pageSize={5}
          exportable={false}
          filterable={false}
        />
      </AdminPageShell>
      <AddModules isOpen={isAddModulesOpen} onClose={closeAddModules} />
    </>
  );
};
export default AdminModules;
