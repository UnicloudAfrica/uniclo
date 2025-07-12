import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { FileInput } from "../../../utils/fileInput";
import { useCreateCustomer } from "../../../hooks/adminHooks/customerHooks";
import { useFetchCountries, useFetchIndustries } from "../../../hooks/resource";

// Updated CreateAccount component with status field
const CreateAccount = ({ formData, setFormData, errors }) => {
  const validate = () => {
    const newErrors = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email";
    if (!formData.password || formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.status) newErrors.status = "Status is required";
    return newErrors;
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email *
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email address"
          className={`w-full input-field ${
            errors.email ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Temporary Password *
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder="Enter Password"
          className={`w-full input-field ${
            errors.password ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Confirm Password *
        </label>
        <input
          id="confirm-password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          placeholder="Repeat Password"
          className={`w-full input-field ${
            errors.confirmPassword ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Role *
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.role ? "border-red-500 border" : "border-gray-300 border"
          } rounded px-3 py-2`}
        >
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-transparent outline-none"
          >
            <option value="" disabled>
              Select role
            </option>
            <option value="Client">Client</option>
            <option value="Partner">Partner</option>
          </select>
        </span>
        {errors.role && (
          <p className="text-red-500 text-xs mt-1">{errors.role}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Status *
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.status ? "border-red-500 border" : "border-gray-300 border"
          } rounded px-3 py-2`}
        >
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full bg-transparent outline-none"
          >
            <option value="" disabled>
              Select status
            </option>
            <option value="verified">Verified</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </span>
        {errors.status && (
          <p className="text-red-500 text-xs mt-1">{errors.status}</p>
        )}
      </div>
    </div>
  );
};

CreateAccount.validate = (formData) => {
  const newErrors = {};
  if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
    newErrors.email = "Invalid email";
  if (!formData.password || formData.password.length < 6)
    newErrors.password = "Password must be at least 6 characters";
  if (formData.password !== formData.confirmPassword)
    newErrors.confirmPassword = "Passwords do not match";
  if (!formData.role) newErrors.role = "Role is required";
  if (!formData.status) newErrors.status = "Status is required";
  return newErrors;
};

// BusinessInfo component (unchanged except for industry mapping fix)
const BusinessInfo = ({
  formData,
  setFormData,
  errors,
  industries,
  isIndustriesFetching,
}) => {
  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.business.phone)
      newErrors.businessPhone = "Business phone is required";
    else if (!/^\+?\d{10,15}$/.test(formData.business.phone))
      newErrors.businessPhone = "Invalid phone number";
    if (
      !formData.business.email ||
      !/\S+@\S+\.\S+/.test(formData.business.email)
    )
      newErrors.businessEmail = "Invalid business email";
    if (!formData.business.name)
      newErrors.businessName = "Business name is required";
    if (!formData.business.registration_number)
      newErrors.registrationNumber = "Registration number is required";
    if (!formData.business.tin_number)
      newErrors.tinNumber = "TIN number is required";
    if (!formData.business.type)
      newErrors.businessType = "Business type is required";
    if (!formData.business.industry)
      newErrors.businessIndustry = "Industry is required";
    if (!formData.business.website)
      newErrors.businessWebsite = "Website is required";
    if (
      formData.business.website &&
      !/^https?:\/\/\S+$/.test(formData.business.website)
    )
      newErrors.businessWebsite = "Invalid website URL";
    return newErrors;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            First Name *
          </label>
          <input
            id="first_name"
            type="text"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            placeholder="Enter First Name"
            className={`w-full input-field ${
              errors.firstName ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Last Name *
          </label>
          <input
            id="last_name"
            type="text"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            placeholder="Enter Last Name"
            className={`w-full input-field ${
              errors.lastName ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor="business_phone"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Business Phone *
        </label>
        <input
          id="business_phone"
          type="tel"
          value={formData.business.phone}
          onChange={(e) =>
            setFormData({
              ...formData,
              business: { ...formData.business, phone: e.target.value },
            })
          }
          placeholder="Enter business phone (e.g., +1234567890)"
          className={`w-full input-field ${
            errors.businessPhone ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.businessPhone && (
          <p className="text-red-500 text-xs mt-1">{errors.businessPhone}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="business_email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Business Email *
        </label>
        <input
          id="business_email"
          type="email"
          value={formData.business.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              business: { ...formData.business, email: e.target.value },
            })
          }
          placeholder="Enter business email address"
          className={`w-full input-field ${
            errors.businessEmail ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.businessEmail && (
          <p className="text-red-500 text-xs mt-1">{errors.businessEmail}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="business_name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Business Name *
        </label>
        <input
          id="business_name"
          type="text"
          value={formData.business.name}
          onChange={(e) =>
            setFormData({
              ...formData,
              business: { ...formData.business, name: e.target.value },
            })
          }
          placeholder="Enter business Name"
          className={`w-full input-field ${
            errors.businessName ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.businessName && (
          <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="registration_number"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Registration Number *
        </label>
        <input
          id="registration_number"
          type="text"
          value={formData.business.registration_number}
          onChange={(e) =>
            setFormData({
              ...formData,
              business: {
                ...formData.business,
                registration_number: e.target.value,
              },
            })
          }
          placeholder="Enter Registration Number"
          className={`w-full input-field ${
            errors.registrationNumber ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.registrationNumber && (
          <p className="text-red-500 text-xs mt-1">
            {errors.registrationNumber}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="tin_number"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          TIN Number *
        </label>
        <input
          id="tin_number"
          type="text"
          value={formData.business.tin_number}
          onChange={(e) =>
            setFormData({
              ...formData,
              business: { ...formData.business, tin_number: e.target.value },
            })
          }
          placeholder="Enter TIN Number"
          className={`w-full input-field ${
            errors.tinNumber ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.tinNumber && (
          <p className="text-red-500 text-xs mt-1">{errors.tinNumber}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="businessType"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Business Type *
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.businessType
              ? "border-red-500 border"
              : "border-gray-300 border"
          } rounded px-3 py-2`}
        >
          <select
            id="businessType"
            value={formData.business.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: { ...formData.business, type: e.target.value },
              })
            }
            className="w-full bg-transparent outline-none"
          >
            <option value="" disabled>
              Select business type
            </option>
            <option value="BNG">Business Name</option>
            <option value="LLC">Limited Liability Company</option>
            <option value="NGO">Non-Governmental Organization</option>
            <option value="LLP">Limited Liability Partnership</option>
            <option value="Other">Other</option>
          </select>
        </span>
        {errors.businessType && (
          <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="industry"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Industry *
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.businessIndustry
              ? "border-red-500 border"
              : "border-gray-300 border"
          } rounded px-3 py-2`}
        >
          <select
            id="industry"
            value={formData.business.industry}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: { ...formData.business, industry: e.target.value },
              })
            }
            className="w-full bg-transparent outline-none"
            disabled={isIndustriesFetching}
          >
            <option value="" disabled>
              {isIndustriesFetching
                ? "Loading industries..."
                : "Select an industry"}
            </option>
            {industries?.message?.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))}
          </select>
        </span>
        {errors.businessIndustry && (
          <p className="text-red-500 text-xs mt-1">{errors.businessIndustry}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="website"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Website *
        </label>
        <input
          id="website"
          type="text"
          value={formData.business.website}
          onChange={(e) =>
            setFormData({
              ...formData,
              business: { ...formData.business, website: e.target.value },
            })
          }
          placeholder="Enter website (e.g., https://example.com)"
          className={`w-full input-field ${
            errors.businessWebsite ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.businessWebsite && (
          <p className="text-red-500 text-xs mt-1">{errors.businessWebsite}</p>
        )}
      </div>
    </div>
  );
};

BusinessInfo.validate = (formData) => {
  const newErrors = {};
  if (!formData.firstName) newErrors.firstName = "First name is required";
  if (!formData.lastName) newErrors.lastName = "Last name is required";
  if (!formData.business.phone)
    newErrors.businessPhone = "Business phone is required";
  else if (!/^\+?\d{10,15}$/.test(formData.business.phone))
    newErrors.businessPhone = "Invalid phone number";
  if (!formData.business.email || !/\S+@\S+\.\S+/.test(formData.business.email))
    newErrors.businessEmail = "Invalid business email";
  if (!formData.business.name)
    newErrors.businessName = "Business name is required";
  if (!formData.business.registration_number)
    newErrors.registrationNumber = "Registration number is required";
  if (!formData.business.tin_number)
    newErrors.tinNumber = "TIN number is required";
  if (!formData.business.type)
    newErrors.businessType = "Business type is required";
  if (!formData.business.industry)
    newErrors.businessIndustry = "Industry is required";
  if (!formData.business.website)
    newErrors.businessWebsite = "Website is required";
  if (
    formData.business.website &&
    !/^https?:\/\/\S+$/.test(formData.business.website)
  )
    newErrors.businessWebsite = "Invalid website URL";
  return newErrors;
};

// Updated BusinessAddress component to store country and country_id
const BusinessAddress = ({
  formData,
  setFormData,
  errors,
  countries,
  isCountriesFetching,
}) => {
  const validate = () => {
    const newErrors = {};
    if (!formData.business.address) newErrors.address = "Address is required";
    if (!formData.business.zip) newErrors.zip = "Zip code is required";
    if (!formData.business.country_id)
      newErrors.country = "Country is required";
    if (!formData.business.city) newErrors.city = "City is required";
    if (!formData.business.state) newErrors.state = "State/Region is required";
    return newErrors;
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="business_address"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Business Address *
        </label>
        <input
          id="business_address"
          type="text"
          value={formData.business.address}
          onChange={(e) =>
            setFormData({
              ...formData,
              business: { ...formData.business, address: e.target.value },
            })
          }
          placeholder="Enter business Address"
          className={`w-full input-field ${
            errors.address ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.address && (
          <p className="text-red-500 text-xs mt-1">{errors.address}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="zip_code"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Postal / Zip Code *
          </label>
          <input
            id="zip_code"
            type="text"
            value={formData.business.zip}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: { ...formData.business, zip: e.target.value },
              })
            }
            placeholder="Enter Postal / Zip Code"
            className={`w-full input-field ${
              errors.zip ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.zip && (
            <p className="text-red-500 text-xs mt-1">{errors.zip}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Country *
          </label>
          <span
            className={`w-full input-field block transition-all ${
              errors.country
                ? "border-red-500 border"
                : "border-gray-300 border"
            } rounded px-3 py-2`}
          >
            <select
              id="country"
              value={formData.business.country_id || ""}
              onChange={(e) => {
                const value = e.target.value;
                console.log("Selected value:", value); // Debug: Log selected value
                const selectedCountry = countries?.find(
                  (c) => c.id === parseInt(value)
                );
                console.log("Selected country:", selectedCountry); // Debug: Log found country
                setFormData((prev) => {
                  const newFormData = {
                    ...prev,
                    business: {
                      ...prev.business,
                      country: selectedCountry ? selectedCountry.name : "",
                      country_id: value,
                    },
                  };
                  console.log(
                    "Updated formData.business:",
                    newFormData.business
                  ); // Debug: Log updated formData
                  return newFormData;
                });
              }}
              className="w-full bg-transparent outline-none"
              disabled={isCountriesFetching || !countries?.length}
            >
              <option value="" disabled>
                {isCountriesFetching
                  ? "Loading countries..."
                  : "Select country"}
              </option>
              {countries?.length ? (
                countries.map((country) => (
                  <option key={country.id} value={country.id.toString()}>
                    {country.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No countries available
                </option>
              )}
            </select>
          </span>
          {errors.country && (
            <p className="text-red-500 text-xs mt-1">{errors.country}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            City *
          </label>
          <input
            id="city"
            type="text"
            value={formData.business.city}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: { ...formData.business, city: e.target.value },
              })
            }
            placeholder="Enter City"
            className={`w-full input-field ${
              errors.city ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            State/Region/Province *
          </label>
          <input
            id="state"
            type="text"
            value={formData.business.state}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: { ...formData.business, state: e.target.value },
              })
            }
            placeholder="Enter State/Region/Province"
            className={`w-full input-field ${
              errors.state ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.state && (
            <p className="text-red-500 text-xs mt-1">{errors.state}</p>
          )}
        </div>
      </div>
    </div>
  );
};

BusinessAddress.validate = (formData) => {
  const newErrors = {};
  if (!formData.business.address) newErrors.address = "Address is required";
  if (!formData.business.zip) newErrors.zip = "Zip code is required";
  if (!formData.business.country_id) newErrors.country = "Country is required";
  if (!formData.business.city) newErrors.city = "City is required";
  if (!formData.business.state) newErrors.state = "State/Region is required";
  return newErrors;
};

// Updated UploadFiles component with corrected validation
const UploadFiles = ({ formData, setFormData, errors }) => {
  const documentFields = [
    {
      id: "registration_document",
      label: "Registeration Document",
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

  const validate = () => {
    const newErrors = {};
    documentFields.forEach(({ field }) => {
      if (!formData.business[field])
        newErrors[field] = `${
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1")
        } is required`;
    });
    return newErrors;
  };

  const handleFileUpload = (field) => (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      business: { ...formData.business, [field]: file },
    });
  };

  return (
    <div className="space-y-5 w-full">
      {documentFields.map(({ id, label, field }) => (
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
          {errors[field] && (
            <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
          )}
        </div>
      ))}
    </div>
  );
};

UploadFiles.validate = (formData) => {
  const newErrors = {};
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
        field.charAt(0).toUpperCase() +
        field.slice(1).replace(/([A-Z])/g, " $1")
      } is required`;
  });
  return newErrors;
};

// Updated AddPartner component
const AddPartner = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    status: "",
    firstName: "",
    lastName: "",
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
    },
  });
  const [errors, setErrors] = useState({});
  const { mutate: createCustomer, isPending } = useCreateCustomer();
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
        status: formData.status,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
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
        },
      };
      createCustomer(payload, {
        onSuccess: () => {
          // alert("Customer created successfully!");
          setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            role: "",
            status: "",
            firstName: "",
            lastName: "",
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
            },
          });
          setCurrentStep(0);
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
              <div className="flex justify-between mb-4 border-b">
                {steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (index <= currentStep || validateStep()) {
                        setCurrentStep(index);
                        setErrors({});
                      }
                    }}
                    className={`px-4 py-2 text-sm md:text-base ${
                      currentStep === index
                        ? "border-b-2 border-[#288DD1] text-[#288DD1]"
                        : "text-gray-500 hover:text-[#288DD1]"
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
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
