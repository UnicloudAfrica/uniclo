import React from "react";
import { X } from "lucide-react";

export const ViewAdminModal = ({ isOpen, onClose, admin }) => {
  if (!isOpen || !admin) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] w-full max-w-[550px] mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Admin Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 w-full overflow-y-auto max-h-[400px] space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Full Name:</span>
            <span className="text-gray-900">
              {admin.first_name || "N/A"} {admin.middle_name || ""}{" "}
              {admin.last_name || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Email:</span>
            <span className="text-gray-900">{admin.email || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Phone:</span>
            <span className="text-gray-900">{admin.phone || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Identifier:</span>
            <span className="text-gray-900">{admin.identifier || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Role:</span>
            <span className="text-gray-900 capitalize">
              {admin.pivot.workspace_role || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Address:</span>
            <span className="text-gray-900">{admin.address || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Country:</span>
            <span className="text-gray-900">{admin.country || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">State:</span>
            <span className="text-gray-900">{admin.state || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">City:</span>
            <span className="text-gray-900">{admin.city || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Zip Code:</span>
            <span className="text-gray-900">{admin.zip_code || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Verified:</span>
            <span
              className={`px-3 py-1 inline-flex text-xs leading-5 font-normal rounded-full ${
                admin.verified
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {admin.verified ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">
              Force Password Reset:
            </span>
            <span
              className={`px-3 py-1 inline-flex text-xs leading-5 font-normal rounded-full ${
                admin.force_password_reset
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {admin.force_password_reset ? "Required" : "Not Required"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">
              Invitation Status:
            </span>
            <span
              className={`px-3 py-1 inline-flex text-xs leading-5 font-normal rounded-full ${
                admin.pivot?.is_accepted
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {admin.pivot?.is_accepted ? "Accepted" : "Not Accepted"}
            </span>
          </div>
          {admin.pivot?.is_accepted ? (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Accepted At:</span>
              <span className="text-gray-900">
                {formatDate(admin.pivot?.accepted_at)}
              </span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">
                  Invite Expires At:
                </span>
                <span className="text-gray-900">
                  {formatDate(admin.pivot?.invite_expires_at)}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Created At:</span>
            <span className="text-gray-900">
              {formatDate(admin.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          {/* Resend Invite button added here */}
          <div className="flex justify-end items-center">
            <button className="px-6 py-2 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mr-4">
              Resend Invite
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
