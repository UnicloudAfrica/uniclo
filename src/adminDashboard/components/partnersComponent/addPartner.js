import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useFetchCountries, useFetchIndustries } from "../../../hooks/resource";
import { useCreateTenant } from "../../../hooks/adminHooks/tenantHooks";
import CreateAccount from "../../pages/tenantComps/createAccount";
import BusinessInfo from "../../pages/tenantComps/businessInfo";
import BusinessAddress from "../../pages/tenantComps/businessAddress";
import UploadFiles from "../../pages/tenantComps/uploadFiles";
import StepNavigation from "../../pages/tenantComps/stepNavigation";
import ToastUtils from "../../../utils/toastUtil";

const AddPartner = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "tenant",
    force_password_reset: true,
    status: "",
    domain: "",
    firstName: "",
    lastName: "",
    verified: false,

    business: {
      email: "",
      name: "",
      type: "",
      industry: "",
      address: "",
      registration_number: "",
      tin_number: "",
      website: "",
      zip: "",
      country: "",
      country_id: "",
      city: "",
      state: "",
      phone: "",
      registration_document: null,
      utility_bill_document: null,
      tinCertificate: null,
      nationalIdDocument: null,
      businessLogo: null,
      dependant_tenant: false,
      verified: false,
    },
  });
  const [errors, setErrors] = useState({});
  const { mutate: createTenant, isPending } = useCreateTenant();
  const { data: industries, isFetching: isIndustriesFetching } =
    useFetchIndustries();
  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();

  const steps = [
    {
      component: CreateAccount,
      label: "Create Account",
      validate: CreateAccount.validate,
    },
    {
      component: (props) => (
        <BusinessInfo
          {...props}
          industries={industries}
          isIndustriesFetching={isIndustriesFetching}
        />
      ),
      label: "Business Info",
      validate: BusinessInfo.validate,
    },
    {
      component: (props) => (
        <BusinessAddress
          {...props}
          countries={countries}
          isCountriesFetching={isCountriesFetching}
        />
      ),
      label: "Business Address",
      validate: BusinessAddress.validate,
    },
    {
      component: UploadFiles,
      label: "Upload Document",
      validate: UploadFiles.validate,
    },
  ];

  const validateStep = () => {
    const stepErrors = steps[currentStep].validate(formData);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setErrors({});
  };

  const handleSubmit = () => {
    if (validateStep()) {
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.business.phone,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        force_password_reset: formData.force_password_reset,
        status: formData.status,
        domain: `${formData.domain}.unicloudafrica.com`, // Append .unicloudafrica.com
        verified: formData.business.verified,

        business: {
          name: formData.business.name,
          type: formData.business.type,
          industry: formData.business.industry,
          address: formData.business.address,
          registration_number: formData.business.registration_number,
          tin_number: formData.business.tin_number,
          email: formData.business.email,
          phone: formData.business.phone,
          website: formData.business.website,
          zip: formData.business.zip,
          country: formData.business.country,
          country_id: formData.business.country_id,
          city: formData.business.city,
          state: formData.business.state,
          registration_document: formData.business.registration_document,
          utility_bill_document: formData.business.utility_bill_document,
          tin_certificate: formData.business.tinCertificate,
          national_id_document: formData.business.nationalIdDocument,
          logo: formData.business.businessLogo,
          dependant_tenant: formData.business.dependant_tenant,
          verified: formData.business.verified,
        },
      };
      createTenant(payload, {
        onSuccess: () => {
          setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            role: "tenant",
            force_password_reset: true,
            status: "",
            domain: "",
            firstName: "",
            lastName: "",
            verified: false,

            business: {
              email: "",
              name: "",
              type: "",
              industry: "",
              address: "",
              registration_number: "",
              tin_number: "",
              website: "",
              zip: "",
              country: "",
              country_id: "",
              city: "",
              state: "",
              phone: "",
              registration_document: null,
              utility_bill_document: null,
              tinCertificate: null,
              nationalIdDocument: null,
              businessLogo: null,
              dependant_tenant: false,
              verified: false,
            },
          });
          setCurrentStep(0);
          ToastUtils.success("Tenant added");
          onClose();
        },
        onError: (error) => console.log(`Error: ${error.message}`),
      });
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] w-full max-w-[650px] mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
              <h2 className="text-lg font-semibold text-[#575758]">
                Add Partner
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 max-h-[400px] w-full overflow-y-auto">
              <StepNavigation
                steps={steps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                validateStep={validateStep}
              />
              {steps[currentStep].component({ formData, setFormData, errors })}
            </div>
            <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 rounded-b-[24px]">
              <button
                onClick={currentStep > 0 ? handleBack : onClose}
                className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              >
                {currentStep > 0 ? "Back" : "Close"}
              </button>
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={isPending}
                  className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Next
                  {isPending && (
                    <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Submit
                  {isPending && (
                    <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPartner;
