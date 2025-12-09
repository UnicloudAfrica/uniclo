// @ts-nocheck
import React from "react";
import { FileInput } from "../../../utils/fileInput";

interface UploadFilesProps {
  formData: any;
  setFormData: (data: any) => void;
  errors: any;
  setErrors?: (errors: any) => void;
}

const UploadFiles: React.FC<UploadFilesProps> & {
  validate: (data: any) => any;
} = ({ formData, setFormData, errors }: any) => {
  const documentFields = [
    {
      id: "registration_document",
      label: "Registration Document",
      field: "registration_document",
    },
    {
      id: "utility_bill_document",
      label: "Utility Bill",
      field: "utility_bill_document",
    },
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

  const handleFileUpload = (field: string) => (e: any) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      business: { ...formData.business, [field]: file },
    });
  };

  return (
    <div className="space-y-5 w-full font-Outfit">
      {documentFields.map(({ id, label, field }: any) => (
        <div key={id}>
          <FileInput
            id={id}
            label={label}
            field={field}
            onChange={handleFileUpload(field)}
            error={errors[field]}
            selectedFile={formData.business[field]}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
        </div>
      ))}
    </div>
  );
};

UploadFiles.validate = (formData: any) => {
  const newErrors: any = {};
  const documentFields = [
    { field: "registration_document" },
    { field: "utility_bill_document" },
    { field: "tinCertificate" },
    { field: "nationalIdDocument" },
    { field: "businessLogo" },
  ];
  documentFields.forEach(({ field }) => {
    if (!formData.business[field])
      newErrors[field] = `${
        field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")
      } is required`;
  });
  return newErrors;
};

export default UploadFiles;
