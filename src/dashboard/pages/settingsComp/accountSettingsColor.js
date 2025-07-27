import React from "react";

const AccountSettingsColors = ({ businessData, updateFormData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-lg shadow-sm border border-[#ECEDF0] p-6">
      <div>
        <label
          htmlFor="theme_color"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Theme Color
        </label>
        <input
          id="theme_color"
          name="theme_color"
          type="color"
          value={businessData.theme_color}
          onChange={(e) => updateFormData("theme_color", e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>
      <div>
        <label
          htmlFor="secondary_color"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Secondary Color
        </label>
        <input
          id="secondary_color"
          name="secondary_color"
          type="color"
          value={businessData.secondary_color}
          onChange={(e) => updateFormData("secondary_color", e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>
      <div>
        <label
          htmlFor="text_color"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Text Color
        </label>
        <input
          id="text_color"
          name="text_color"
          type="color"
          value={businessData.text_color}
          onChange={(e) => updateFormData("text_color", e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>
      <div>
        <label
          htmlFor="ahref_link_color"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Link Color
        </label>
        <input
          id="ahref_link_color"
          name="ahref_link_color"
          type="color"
          value={businessData.ahref_link_color}
          onChange={(e) => updateFormData("ahref_link_color", e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>
    </div>
  );
};

export default AccountSettingsColors;
