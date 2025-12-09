// @ts-nocheck
import React, { useState, useEffect } from "react";
import logo from "./assets/logo.png"; // Default logo as fallback

const TenantHome = ({ tenant = "Tenant" }: any) => {
  const [tenantData, setTenantData] = useState({
    name: tenant,
    logo: logo, // Placeholder logo
    color: "#288DD1", // Placeholder color
  });

  // Simulate API request to fetch tenant data
  useEffect(() => {
    // Mock API call (replace with real endpoint later)
    const fetchTenantData = async () => {
      try {
        // Simulate fetching data based on tenant name
        const mockResponse = {
          name: tenant === "Tenant" ? "Default Tenant" : `${tenant} Corp`,
          logo: logo, // Placeholder, could be a URL like "https://example.com/${tenant}-logo.png"
          color: tenant === "Tenant" ? "#FF5722" : "#FF5722", // Different example color for demo
        };
        setTenantData(mockResponse);
      } catch (error) {
        console.error("Failed to fetch tenant data:", error);
        // Fallback to default data if fetch fails
        setTenantData({
          name: tenant,
          logo: logo,
          color: "#288DD1",
        });
      }
    };

    fetchTenantData();
  }, [tenant]);

  const shadeColor = (color: any, percent: any) => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.round((R * (100 + percent)) / 100);
    G = Math.round((G * (100 + percent)) / 100);
    B = Math.round((B * (100 + percent)) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    const RR = R.toString(16).length === 1 ? `0${R.toString(16)}` : R.toString(16);
    const GG = G.toString(16).length === 1 ? `0${G.toString(16)}` : G.toString(16);
    const BB = B.toString(16).length === 1 ? `0${B.toString(16)}` : B.toString(16);

    return `#${RR}${GG}${BB}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 font-Outfit bg-gray-50"
      style={{ backgroundColor: tenantData.color + "20" }} // Light background tint of tenant color
    >
      <div className="max-w-md mx-auto w-full bg-white p-6 rounded-xl shadow-md">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <img
            src={tenantData.logo}
            className="w-[80px] mx-auto mb-3 rounded"
            alt={`${tenantData.name} Logo`}
          />
          <h1 className="text-2xl font-semibold mb-1" style={{ color: tenantData.color }}>
            Welcome to {tenantData.name}'s Portal
          </h1>
          <p className="text-gray-600 text-sm">Client portal for {tenantData.name}.</p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col space-y-3">
          <a
            href="/login"
            className="w-full bg-[tenantData.color] hover:bg-[shade(tenantData.color, 20%)] text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
            style={{
              backgroundColor: tenantData.color,
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = shadeColor(tenantData.color, 20))}
            onMouseOut={(e) => (e.target.style.backgroundColor = tenantData.color)}
          >
            Login
          </a>
          <a
            href="/register"
            className="w-full border border-[tenantData.color] text-[tenantData.color] hover:bg-[shade(tenantData.color, 90%)] font-medium py-2 px-4 rounded-lg transition-colors text-center"
            style={{
              borderColor: tenantData.color,
              color: tenantData.color,
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = tenantData.color)}
            onMouseOut={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
};

export default TenantHome;
