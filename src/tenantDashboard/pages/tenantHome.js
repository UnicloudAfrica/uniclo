import React from "react";
import logo from "./assets/logo.png";
// TenantHome Component
const TenantHome = ({ tenant = "Tenant" }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 font-Outfit bg-gray-50">
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-lg shadow-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img
            src={logo}
            className="w-[100px] mx-auto mb-4 rounded-full"
            alt="Logo"
          />
          <h1 className="text-3xl font-semibold text-[#121212] mb-2">
            Welcome to {tenant}'s Portal
          </h1>
          <p className="text-[#676767] text-base">
            Client portal for tenant {tenant}.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col space-y-4">
          <a
            href="/login"
            className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 text-center"
          >
            Login
          </a>
          <a
            href="/register"
            className="w-full border border-[#288DD1] text-[#288DD1] hover:bg-[#e0f2fe] font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 text-center"
          >
            Register
          </a>
          <a
            href="/admin"
            className="w-full border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-offset-2 text-center"
          >
            Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default TenantHome;
