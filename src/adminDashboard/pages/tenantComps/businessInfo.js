const BusinessInfo = ({
  formData,
  setFormData,
  errors,
  industries,
  isIndustriesFetching,
}) => {
  return (
    <div className="space-y-4 font-Outfit">
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
          htmlFor="companyType"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Company Type *
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.companyType
              ? "border-red-500 border"
              : "border-gray-300 border"
          } rounded px-3 py-2`}
        >
          <select
            id="companyType"
            value={formData.business.company_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: {
                  ...formData.business,
                  company_type: e.target.value,
                },
              })
            }
            className="w-full bg-transparent outline-none"
          >
            <option value="" disabled>
              Select business type
            </option>
            <option value="RC">Limited Liability Company</option>
            <option value="BN">Business Name</option>
            <option value="IT">Incorporated Trustees</option>
            <option value="LL">Limited Liability</option>
            <option value="LLP">Limited Liability Partnership</option>
          </select>
        </span>
        {errors.companyType && (
          <p className="text-red-500 text-xs mt-1">{errors.companyType}</p>
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
            {industries?.map((industry) => (
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
      <div>
        <label
          htmlFor="verified"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Are they verified?
        </label>
        <div className="flex items-center">
          <input
            id="verified"
            type="checkbox"
            checked={formData.business.verified}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: { ...formData.business, verified: e.target.checked },
              })
            }
            className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
          />
          <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
            Verified
          </label>
        </div>
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
  if (!formData.business.company_type)
    newErrors.companyType = "Company type is required";
  if (!formData.business.industry)
    newErrors.businessIndustry = "Industry is required";
  if (!formData.business.website)
    newErrors.businessWebsite = "Website is required";
  if (
    formData.business.website &&
    !/^https?:\/\/\S+$/.test(formData.business.website)
  )
    newErrors.businessWebsite = "Invalid website URL";
  // No validation for verified (optional boolean)
  return newErrors;
};

export default BusinessInfo;
