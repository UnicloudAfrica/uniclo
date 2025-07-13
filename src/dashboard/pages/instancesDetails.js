import React, { useState, useEffect } from "react";
import CartFloat from "../components/cartFloat";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar"; // Corrected import path
import ActiveTab from "../components/activeTab";
import { Loader2 } from "lucide-react"; // Import Loader2 for loading state

export default function InstancesDetails() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instanceDetails, setInstanceDetails] = useState(null); // State to hold instance details

  // Simulate fetching instance details
  useEffect(() => {
    // In a real application, you would fetch this based on an ID from the URL (e.g., useParams from react-router-dom)
    // For demonstration, we'll use dummy data.
    const fetchInstance = async () => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setInstanceDetails({
        id: "inst-001",
        name: "Web Server 01",
        instanceType: "t3.medium",
        vCPUs: "2",
        ram: "4 GiB",
        disk: "100 GiB SSD",
        operatingSystem: "Ubuntu 22.04 LTS",
        ha: "Yes",
        user: "admin",
        account: "Development",
        status: "Running",
        ipAddress: "192.168.1.100",
        creationDate: "2024-05-20 10:30 AM",
        region: "us-east-1",
        tags: ["web", "frontend", "production"],
        description:
          "Primary web server hosting the main application interface. Configured for high availability and automatic scaling.",
      });
    };

    fetchInstance();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (!instanceDetails) {
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
          <p className="ml-2 text-gray-700">Loading instance details...</p>
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
          Instance Details: {instanceDetails.name}
        </h1>

        {/* Instance Overview Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Instance Name:</span>
              <span className="text-gray-900">{instanceDetails.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Instance Type:</span>
              <span className="text-gray-900">
                {instanceDetails.instanceType}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">vCPUs:</span>
              <span className="text-gray-900">{instanceDetails.vCPUs}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">RAM:</span>
              <span className="text-gray-900">{instanceDetails.ram}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Disk:</span>
              <span className="text-gray-900">{instanceDetails.disk}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">
                Operating System:
              </span>
              <span className="text-gray-900">
                {instanceDetails.operatingSystem}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">
                High Availability (HA):
              </span>
              <span className="text-gray-900">{instanceDetails.ha}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">IP Address:</span>
              <span className="text-gray-900">{instanceDetails.ipAddress}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">User:</span>
              <span className="text-gray-900">{instanceDetails.user}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Account:</span>
              <span className="text-gray-900">{instanceDetails.account}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Creation Date:</span>
              <span className="text-gray-900">
                {instanceDetails.creationDate}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Region:</span>
              <span className="text-gray-900">{instanceDetails.region}</span>
            </div>
            <div className="flex flex-col md:col-span-2">
              <span className="font-medium text-gray-600">Description:</span>
              <span className="text-gray-900">
                {instanceDetails.description}
              </span>
            </div>
            <div className="flex flex-col md:col-span-2">
              <span className="font-medium text-gray-600">Tags:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {instanceDetails.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-600">Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium capitalize ${
                  instanceDetails.status === "Running"
                    ? "bg-green-100 text-green-800"
                    : instanceDetails.status === "Stopped"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {instanceDetails.status}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Section (Placeholder) */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-colors">
              Start Instance
            </button>
            <button className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors">
              Stop Instance
            </button>
            <button className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors">
              Reboot Instance
            </button>
            <button className="px-6 py-3 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 transition-colors">
              Delete Instance
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
