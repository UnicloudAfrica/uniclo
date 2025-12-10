import React from "react";

export default function TabSelector({ activeTab, setActiveTab }) {
  return (
    <div className="flex w-full mb-6 bg-[#FAFAFA] border border-[#ECEDF0] rounded-[50px] p-3">
      <button
        onClick={() => setActiveTab("partner")}
        className={`flex-1 py-2 px-4 w-[50%] rounded-[30px] text-sm font-normal whitespace-nowrap transition-colors ${
          activeTab === "partner"
            ? "bg-[#288DD1] text-white shadow-sm font-semibold"
            : "text-[#676767] hover:text-gray-800 font-normal"
        }`}
      >
        Signup as Partner
      </button>
      <button
        onClick={() => setActiveTab("client")}
        className={`flex-1 py-2 px-4 w-[50%] rounded-[30px] text-sm font-normal whitespace-nowrap transition-colors ${
          activeTab === "client"
            ? "bg-[#288DD1] text-white shadow-sm font-semibold"
            : "text-[#676767] hover:text-gray-800 font-normal"
        }`}
      >
        Signup as Client
      </button>
    </div>
  );
}
