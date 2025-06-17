export const BusinessInfoStep = ({ formData, updateFormData, errors }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="contactPersonFirstName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          First Name
        </label>
        <input
          id="contactPersonFirstName"
          type="text"
          value={formData.contactPersonFirstName}
          onChange={(e) =>
            updateFormData("contactPersonFirstName", e.target.value)
          }
          placeholder="Enter first name"
          className={`w-full input-field transition-all ${
            errors.contactPersonFirstName ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.contactPersonFirstName && (
          <p className="text-red-500 text-xs mt-1">
            {errors.contactPersonFirstName}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="contactPersonLastName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Last Name
        </label>
        <input
          id="contactPersonLastName"
          type="text"
          value={formData.contactPersonLastName}
          onChange={(e) =>
            updateFormData("contactPersonLastName", e.target.value)
          }
          placeholder="Enter last name"
          className={`w-full input-field transition-all ${
            errors.contactPersonLastName ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.contactPersonLastName && (
          <p className="text-red-500 text-xs mt-1">
            {errors.contactPersonLastName}
          </p>
        )}
      </div>
    </div>
    <div>
      <label
        htmlFor="contactPhone"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Contact Phone
      </label>
      <input
        id="contactPhone"
        type="tel"
        value={formData.contactPhone}
        onChange={(e) => updateFormData("contactPhone", e.target.value)}
        placeholder="Enter phone number"
        className={`w-full input-field transition-all ${
          errors.contactPhone ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.contactPhone && (
        <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="businessName"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Business Name
      </label>
      <input
        id="businessName"
        type="text"
        value={formData.businessName}
        onChange={(e) => updateFormData("businessName", e.target.value)}
        placeholder="Enter business name"
        className={`w-full input-field transition-all ${
          errors.businessName ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.businessName && (
        <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="registrationNumber"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Registration Number
      </label>
      <input
        id="registrationNumber"
        type="text"
        value={formData.registrationNumber}
        onChange={(e) => updateFormData("registrationNumber", e.target.value)}
        placeholder="Enter registration number"
        className={`w-full input-field transition-all ${
          errors.registrationNumber ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.registrationNumber && (
        <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="tinNumber"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        TIN Number
      </label>
      <input
        id="tinNumber"
        type="text"
        value={formData.tinNumber}
        onChange={(e) => updateFormData("tinNumber", e.target.value)}
        placeholder="Enter TIN number"
        className={`w-full input-field transition-all ${
          errors.tinNumber ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.tinNumber && (
        <p className="text-red-500 text-xs mt-1">{errors.tinNumber}</p>
      )}
    </div>
  </div>
);
