import React from "react";
import { useFetchDomainSettings } from "../../../hooks/profileHooks";

const DomainManagementSettings = () => {
  const {
    data: domainSettings,
    isFetching: isDomainFetching,
    error: domainError,
  } = useFetchDomainSettings();

  const domainToDisplay =
    domainSettings && domainSettings.length > 0 ? domainSettings[0].domain : "";

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-[#ECEDF0]">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Domain Management
      </h3>

      {isDomainFetching && (
        <p className="text-gray-600">Loading domain settings...</p>
      )}
      {domainError && (
        <p className="text-red-500">
          Error loading domain: {domainError.message}
        </p>
      )}

      {!isDomainFetching && !domainError && (
        <div className="mb-4">
          <label
            htmlFor="domainName"
            className="block text-gray-700 text-sm font-medium mb-2"
          >
            Associated Domain
          </label>
          <input
            type="text"
            id="domainName"
            value={domainToDisplay}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="No domain associated"
          />
          {domainSettings && domainSettings.length === 0 && (
            <p className="text-gray-500 text-sm mt-2">
              No domain currently associated with this tenant.
            </p>
          )}
        </div>
      )}

      {/* You can still add other management forms/fields below this if needed */}
    </div>
  );
};

export default DomainManagementSettings;
