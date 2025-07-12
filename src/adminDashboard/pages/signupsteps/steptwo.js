export const PersonalInfoStep = ({ formData, updateFormData, errors }) => (
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
  </div>
);
