import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react"; // Import icons
import EditPartnerModal from "../../pages/tenantComps/editTenant";
import DeletePartnerModal from "../../pages/tenantComps/deleteTenant";

const OverviewPartner = ({ partnerDetails }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  // Status Badge Component
  const StatusBadge = ({ verified }) => {
    const statusText = verified === 1 ? "Verified" : "Unverified";
    const bgColor = verified === 1 ? "bg-green-100" : "bg-red-100";
    const textColor = verified === 1 ? "text-green-800" : "text-red-800";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        {statusText}
      </span>
    );
  };

  // Helper to render a field, now directly using partnerDetails
  const renderField = (label, value, isLink = false, isColor = false) => {
    if (value === null || value === undefined || value === "") {
      return (
        <div className="flex items-center justify-between">
          <div className="text-base font-light text-[#575758]">{label}:</div>
          <div className="text-base font-medium text-[#575758]">N/A</div>
        </div>
      );
    }

    if (isLink) {
      return (
        <div className="flex items-center justify-between">
          <div className="text-base font-light text-[#575758]">{label}:</div>
          <div className="text-base font-medium text-[#575758]">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#288DD1] hover:underline truncate max-w-[200px] block" // Added max-w and block for truncation
            >
              {value}
            </a>
          </div>
        </div>
      );
    }

    if (isColor) {
      return (
        <div className="flex items-center justify-between">
          <div className="text-base font-light text-[#575758]">{label}:</div>
          <div className="flex items-center gap-2 text-base font-medium text-[#575758]">
            <span
              className="w-6 h-6 rounded-full border border-gray-300"
              style={{ backgroundColor: value }}
            ></span>
            <span>{value}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div className="text-base font-light text-[#575758]">{label}:</div>
        <div className="text-base font-medium text-[#575758]">{value}</div>
      </div>
    );
  };

  // Dynamically generate documents list from partnerDetails
  const documents = [
    {
      title: "National ID Document",
      path: partnerDetails.national_id_document,
      type: "image",
    },
    {
      title: "Registration Document",
      path: partnerDetails.registration_document,
      type: "image",
    },
    {
      title: "Utility Bill Document",
      path: partnerDetails.utility_bill_document,
      type: "image",
    },
    {
      title: "Company Logo",
      path: partnerDetails.logo,
      type: "image",
    },
  ].filter((doc) => doc.path); // Filter out documents that don't have a path

  if (!partnerDetails) {
    return (
      <div className="text-center text-gray-500 py-10">
        No partner details available.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row">
        {/* Left Sidebar - Documents */}
        <div className="w-full md:w-80 px-4 overflow-y-auto space-y-4 divide-y ">
          {documents.length > 0 ? (
            documents.map((doc, index) => (
              <div
                key={index}
                className="pt-8 flex items-center flex-col justify-center md:block"
              >
                {doc.path ? (
                  <img
                    src={doc.path} // Use the actual path from partnerDetails
                    alt={doc.title}
                    className="max-w-[150px] h-auto rounded-md shadow-sm"
                    // Add onerror to show a placeholder if image fails to load
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = `https://placehold.co/150x100/E0E0E0/676767?text=No+Image`;
                      e.target.alt = "Image not available";
                    }}
                  />
                ) : (
                  <div className="w-[150px] h-[100px] bg-gray-200 flex items-center justify-center text-gray-500 text-xs rounded-md">
                    No Image
                  </div>
                )}
                <p className="mt-1.5 text-center text-[#1C1C1C80] text-xs font-normal">
                  {doc.title}
                </p>
              </div>
            ))
          ) : (
            <div className="pt-8 text-center text-gray-500 text-sm">
              No documents found.
            </div>
          )}
        </div>

        {/* Main Content - Partner Details */}
        <div className="flex-1 md:px-8 bg-white rounded-[12px] shadow-sm p-6">
          <div className="w-full md:max-w-2xl">
            {/* Header */}
            <div className="pb-4 border-b border-[#EDEFF6] mb-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-base font-medium text-[#575758]">
                  ID: {partnerDetails.identifier || "N/A"}
                </div>
                <StatusBadge verified={partnerDetails.verified} />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                  title="Edit Partner"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Delete Partner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-3">
              {renderField("Name", partnerDetails.name)}
              {renderField("Email Address", partnerDetails.email)}
              {renderField("Phone Number", partnerDetails.phone)}
              {renderField("Type", partnerDetails.type)}
              {renderField("Industry", partnerDetails.industry)}
              <div className="flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Address:
                </div>
                <div className="text-base font-medium text-[#575758] text-right">
                  {partnerDetails.address || "N/A"}
                  {partnerDetails.city && `, ${partnerDetails.city}`}
                  {partnerDetails.state && `, ${partnerDetails.state}`}
                  {partnerDetails.zip && ` ${partnerDetails.zip}`}
                  {partnerDetails.country && `, ${partnerDetails.country}`}
                </div>
              </div>
              {renderField(
                "Registration Number",
                partnerDetails.registration_number
              )}
              {renderField("TIN Number", partnerDetails.tin_number)}
              {renderField("Website", partnerDetails.website, true)}

              {/* New Business-related fields, directly from partnerDetails */}
              {renderField(
                "Privacy Policy URL",
                partnerDetails.privacy_policy_url,
                true
              )}
              {renderField(
                "Unsubscription URL",
                partnerDetails.unsubscription_url,
                true
              )}
              {renderField(
                "Help Center URL",
                partnerDetails.help_center_url,
                true
              )}
              {renderField(
                "Business Logo Href",
                partnerDetails.logo_href,
                true
              )}
              {renderField(
                "Theme Color",
                partnerDetails.theme_color,
                false,
                true
              )}
              {renderField(
                "Secondary Color",
                partnerDetails.secondary_color,
                false,
                true
              )}
              {renderField(
                "Ahref Link Color",
                partnerDetails.ahref_link_color,
                false,
                true
              )}

              {renderField("Created At", formatDate(partnerDetails.created_at))}
              {renderField(
                "Last Updated",
                formatDate(partnerDetails.updated_at)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditPartnerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        partnerDetails={partnerDetails}
      />
      <DeletePartnerModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        partnerId={partnerDetails.id}
        partnerName={partnerDetails.name}
      />
    </>
  );
};

export default OverviewPartner;
