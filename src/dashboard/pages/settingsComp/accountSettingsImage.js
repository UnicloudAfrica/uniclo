import React from "react";
import { FileInput } from "../../../utils/fileInput";

const AccountSettingsImages = ({ businessData, handleFileChange, errors }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 bg-white rounded-lg shadow-sm border border-[#ECEDF0] p-6">
      <FileInput
        id="national_id_document"
        label="National ID Document"
        accept="image/*,application/pdf"
        selectedFile={businessData.national_id_document}
        onChange={(e) =>
          handleFileChange("national_id_document", e.target.files[0])
        }
        error={errors.national_id_document}
      />
      <FileInput
        id="logo"
        label="Business Logo"
        accept="image/*"
        selectedFile={businessData.logo}
        onChange={(e) => handleFileChange("logo", e.target.files[0])}
        error={errors.logo}
      />
      <FileInput
        id="registration_document"
        label="Registration Document"
        accept="image/*,application/pdf"
        selectedFile={businessData.registration_document}
        onChange={(e) =>
          handleFileChange("registration_document", e.target.files[0])
        }
        error={errors.registration_document}
      />
      <FileInput
        id="utility_bill_document"
        label="Utility Bill Document"
        accept="image/*,application/pdf"
        selectedFile={businessData.utility_bill_document}
        onChange={(e) =>
          handleFileChange("utility_bill_document", e.target.files[0])
        }
        error={errors.utility_bill_document}
      />
    </div>
  );
};

export default AccountSettingsImages;
