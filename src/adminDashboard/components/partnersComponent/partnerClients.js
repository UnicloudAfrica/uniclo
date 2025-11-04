// src/components/partner/PartnerClients.jsx
import { Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFetchSubTenantByTenantID } from "../../../hooks/adminHooks/tenantHooks";
import ModernButton from "../ModernButton";

const encodeId = (id) => {
  return encodeURIComponent(btoa(id));
};

const PartnerClients = ({ tenantId }) => {
  const navigate = useNavigate();
  const { data: partnerClients, isFetching: isClientsFetching } =
    useFetchSubTenantByTenantID(tenantId);

  const clientData = partnerClients || [];

  const handleViewDetails = (client) => {
    const encodedId = encodeId(client.id || client.identifier);
    const clientFullName = encodeURIComponent(
      `${client.name || ""}`.trim() || "Unknown Client"
    );
    navigate(
      `/admin-dashboard/clients/details?id=${encodedId}&name=${clientFullName}`
    );
  };

  return (
    <div className="font-Outfit">
      {isClientsFetching ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-600">Loading clients...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
            <table className="w-full">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase"
                  >
                    S/N
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase"
                  >
                    NAME
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase"
                  >
                    EMAIL ADDRESS
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase"
                  >
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E8E6EA]">
                {clientData.length > 0 ? (
                  clientData.map((item, index) => (
                    <tr
                      key={item.id || item.identifier}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewDetails(item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(item);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </ModernButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden mt-6 space-y-4">
            {clientData.length > 0 ? (
              clientData.map((item, index) => (
                <div
                  key={item.id || item.identifier}
                  className="bg-white border border-[#E8E6EA] rounded-[8px] p-4 mb-4 cursor-pointer"
                  onClick={() => handleViewDetails(item)}
                  role="button"
                  aria-label={`View details for ${item.name}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-[#1C1C1C]">
                      S/N: {index + 1}
                    </h3>
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(item);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </ModernButton>
                  </div>
                  <p className="text-sm text-[#575758]">Name: {item.name}</p>
                  <p className="text-sm text-[#575758]">Email: {item.email}</p>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[8px] shadow-sm p-4 text-center text-gray-500">
                No clients found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PartnerClients;
