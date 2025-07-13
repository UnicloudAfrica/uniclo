import React, { useState, useEffect } from "react";
import CartFloat from "../components/cartFloat";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import AddInstanceModal from "../components/addInstanace";

export default function ProjectDetails() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [instances, setInstances] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of instances per page
  const [isAddProjectOpen, setAddProject] = useState(false);

  const openAddProject = () => setAddProject(true);
  const closeAddProject = () => setAddProject(false);
  // Dummy data for demonstration
  useEffect(() => {
    // Simulate fetching project details
    setProjectDetails({
      id: "proj-abc-123",
      name: "My Awesome Project",
      description:
        "This project hosts several critical instances for our internal applications and development environments. It is configured for high availability.",
      type: "VPC",
      createdAt: "2023-01-15",
      owner: "John Doe",
    });

    // Simulate fetching instances for the project
    setInstances([
      {
        id: "inst-001",
        name: "Web Server 01",
        instanceType: "t3.medium",
        vCPUs: "2",
        ram: "4 GiB",
        disk: "100 GiB SSD",
        operatingSystem: "Ubuntu 22.04",
        ha: "Yes",
        user: "admin",
        account: "Dev",
        status: "Running",
      },
      {
        id: "inst-002",
        name: "DB Server",
        instanceType: "m5.large",
        vCPUs: "4",
        ram: "16 GiB",
        disk: "500 GiB SSD",
        operatingSystem: "PostgreSQL",
        ha: "No",
        user: "db_user",
        account: "Prod",
        status: "Stopped",
      },
      {
        id: "inst-003",
        name: "App Server 01",
        instanceType: "t3.small",
        vCPUs: "1",
        ram: "2 GiB",
        disk: "50 GiB SSD",
        operatingSystem: "Windows 2019",
        ha: "Yes",
        user: "app_user",
        account: "Dev",
        status: "Running",
      },
      {
        id: "inst-004",
        name: "Load Balancer",
        instanceType: "t3.nano",
        vCPUs: "1",
        ram: "1 GiB",
        disk: "10 GiB SSD",
        operatingSystem: "Linux",
        ha: "Yes",
        user: "network_admin",
        account: "Prod",
        status: "Running",
      },
      {
        id: "inst-005",
        name: "Analytics Engine",
        instanceType: "c5.xlarge",
        vCPUs: "8",
        ram: "32 GiB",
        disk: "1 TB HDD",
        operatingSystem: "CentOS 8",
        ha: "No",
        user: "data_analyst",
        account: "Analytics",
        status: "Running",
      },
      {
        id: "inst-006",
        name: "Backup Server",
        instanceType: "r5.large",
        vCPUs: "2",
        ram: "8 GiB",
        disk: "2 TB HDD",
        operatingSystem: "Ubuntu 20.04",
        ha: "No",
        user: "backup_admin",
        account: "Ops",
        status: "Running",
      },
      {
        id: "inst-007",
        name: "Test VM",
        instanceType: "t2.micro",
        vCPUs: "1",
        ram: "1 GiB",
        disk: "20 GiB SSD",
        operatingSystem: "Debian",
        ha: "No",
        user: "dev_tester",
        account: "Dev",
        status: "Stopped",
      },
    ]);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = instances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(instances.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleRowClick = (item) => {
    // Placeholder for navigating to instance details or opening a modal
    // alert(`Clicked on instance: ${item.name}`);
    console.log("Selected Instance:", item);
  };

  if (!projectDetails) {
    return (
      <>
        <CartFloat />
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700">Loading project details...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <CartFloat />
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <h1 className="text-2xl font-bold text-[#1E1E1EB2] mb-6">
          Project Details
        </h1>

        {/* Project Details Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Project Name:</span>
              <span className="text-gray-900">{projectDetails.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Type:</span>
              <span className="text-gray-900">{projectDetails.type}</span>
            </div>
            <div className="flex flex-col md:col-span-1">
              <span className="font-medium text-gray-600">Description:</span>
              <span className="text-gray-900">
                {projectDetails.description}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Created At:</span>
              <span className="text-gray-900">{projectDetails.createdAt}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Owner:</span>
              <span className="text-gray-900">{projectDetails.owner}</span>
            </div>
          </div>
        </div>

        <div className=" w-full flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#575758] ">Instances</h2>
          <button
            onClick={openAddProject}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base  "
          >
            Add Instances
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Instance Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  vCPUs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  RAM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Disk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Operating System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  HA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E8E6EA]">
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.instanceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.vCPUs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.ram}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.disk}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.operatingSystem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.ha}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.account}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          item.status === "Running"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Stopped"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No instances found for this project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-6 space-y-4">
          {currentData.length > 0 ? (
            currentData.map((item) => (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)}
                className="bg-white rounded-[12px] shadow-sm p-4 cursor-pointer border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {item.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      item.status === "Running"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Stopped"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Instance Type:</span>
                    <span>{item.instanceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">vCPUs:</span>
                    <span>{item.vCPUs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">RAM:</span>
                    <span>{item.ram}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Disk:</span>
                    <span>{item.disk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">OS:</span>
                    <span>{item.operatingSystem}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">HA:</span>
                    <span>{item.ha}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">User:</span>
                    <span>{item.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Account:</span>
                    <span>{item.account}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
              No instances found for this project.
            </div>
          )}
        </div>

        {/* Pagination */}
        {instances.length > itemsPerPage && (
          <div className="flex items-center justify-center px-4 py-3 border-t border-gray-200 bg-white rounded-b-[12px] mt-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft />
              </button>
              <span className="text-sm text-gray-700">{currentPage}</span>
              <span className="text-sm text-gray-700">of</span>
              <span className="text-sm text-gray-700">{totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </main>
      <AddInstanceModal isOpen={isAddProjectOpen} onClose={closeAddProject} />
    </>
  );
}
