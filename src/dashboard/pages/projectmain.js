import React, { useState } from "react";
import CartFloat from "../components/cartFloat";
import Headbar from "../components/headbar";
import ActiveTab from "../components/activeTab";
import Sidebar from "../components/sidebar";
import AddProject from "../components/addProject";
import CreateProjectModal from "../components/addProject";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Project() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddProjectOpen, setAddProject] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddProject = () => setAddProject(true);
  const closeAddProject = () => setAddProject(false);

  // Mock data with added description and type
  const instances = [
    {
      id: 1,
      name: "Test-Windows",
      description: "Windows-based test instance for development",
      type: "VPC",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(instances.length / itemsPerPage);

  const currentData = instances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    // Add modal logic if needed
  };

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
        <div className="flex items-center justify-between">
          {/* <h2 className="text-base font-medium text-[#1C1C1C]">Projects</h2> */}
        </div>

        <button
          onClick={openAddProject}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base mt-5"
        >
          Add Project
        </button>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px]">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E8E6EA]">
              {currentData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-6">
          {currentData.map((item) => (
            <div
              key={item.id}
              onClick={() => handleRowClick(item)}
              className="border-b border-gray-200 py-4 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">
                  {item.name}
                </h3>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Description:</span>
                  <span>{item.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Type:</span>
                  <span>{item.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {instances.length > 0 && (
          <div className="flex items-center justify-center px-4 py-3 border-t border-gray-200">
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

      <CreateProjectModal isOpen={isAddProjectOpen} onClose={closeAddProject} />
    </>
  );
}
