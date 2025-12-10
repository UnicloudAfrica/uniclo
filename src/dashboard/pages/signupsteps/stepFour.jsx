import React from "react";
import { FileInput } from "../../../utils/fileInput";

export const UploadDocumentStep = ({ formData, updateFormData, errors }) => {
  const handleFileUpload = (field) => (e) => {
    const file = e.target.files[0];
    updateFormData(field, file);
  };

  const documentFields = [
    {
      id: "certificateOfIncorporation",
      label: "Certificate of Incorporation",
      field: "certificateOfIncorporation",
    },
    { id: "utilityBill", label: "Utility Bill", field: "utilityBill" },
    {
      id: "tinCertificate",
      label: "TIN Number Certificate",
      field: "tinCertificate",
    },
    {
      id: "nationalIdDocument",
      label: "National ID Document",
      field: "nationalIdDocument",
    },
    {
      id: "businessLogo",
      label: "Business Logo",
      field: "businessLogo",
    },
  ];

  return (
    <div className="space-y-5">
      {documentFields.map(({ id, label, field }) => (
        <FileInput
          key={id}
          id={id}
          label={label}
          field={field}
          onChange={handleFileUpload(field)}
          error={errors[field]}
          selectedFile={formData[field]}
          accept=".pdf,.jpg,.jpeg,.png"
        />
      ))}
    </div>
  );
};
