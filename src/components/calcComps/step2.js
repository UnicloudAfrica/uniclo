import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFetchCountries } from "../../hooks/resource";

export const Step2ContactForm = ({
  personalInfo,
  handleInputChange,
  handleNext,
  handlePrev,
}) => {
  const { data: countries, isFetching } = useFetchCountries();
  const isFormValid =
    personalInfo.first_name &&
    personalInfo.last_name &&
    personalInfo.email &&
    personalInfo.phone &&
    personalInfo.lead_type;

  const inputClass =
    "block w-full rounded-md border-gray-300 focus:border-[#288DD1] focus:ring-[#288DD1] sm:text-sm input-field";

  return (
    <div className="space-y-6 font-Outfit">
      <h3 className="text-2xl font-semibold text-[#121212]">
        A Little Personal Info
      </h3>
      <p className="text-gray-600">
        Before we give you a breakdown of your configuration, we'll need a
        little personal info.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-gray-700"
          >
            First Name<span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="text"
              id="first_name"
              value={personalInfo.first_name}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Your first name"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-gray-700"
          >
            Last Name<span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="text"
              id="last_name"
              value={personalInfo.last_name}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Your last name"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address<span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="email"
              id="email"
              value={personalInfo.email}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number<span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="tel"
              id="phone"
              value={personalInfo.phone}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="+1 (555) 987-6543"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="company"
            className="block text-sm font-medium text-gray-700"
          >
            Company
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="text"
              id="company"
              value={personalInfo.company}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Your company name"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="country_iso"
            className="block text-sm font-medium text-gray-700"
          >
            Country
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            {isFetching ? (
              <div className="w-full p-2 text-gray-500">
                Loading countries...
              </div>
            ) : (
              <select
                id="country_iso"
                value={personalInfo.country_iso}
                onChange={handleInputChange}
                className={inputClass}
              >
                <option value="">Select a country</option>
                {countries?.map((country) => (
                  <option key={country.iso2} value={country.iso2}>
                    {country.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Are you a user, partner, or reseller?
          <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="lead_type"
              value="user"
              checked={personalInfo.lead_type === "client"}
              onChange={handleInputChange}
              className="focus:ring-[#288DD1] h-4 w-4 text-[#288DD1] border-gray-300"
            />
            <span className="text-gray-700">User</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="lead_type"
              value="partner"
              checked={personalInfo.lead_type === "partner"}
              onChange={handleInputChange}
              className="focus:ring-[#288DD1] h-4 w-4 text-[#288DD1] border-gray-300"
            />
            <span className="text-gray-700">Partner</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="lead_type"
              value="reseller"
              checked={personalInfo.lead_type === "reseller"}
              onChange={handleInputChange}
              className="focus:ring-[#288DD1] h-4 w-4 text-[#288DD1] border-gray-300"
            />
            <span className="text-gray-700">Reseller</span>
          </label>
        </div>
      </div>

      <div>
        <label
          htmlFor="source"
          className="block text-sm font-medium text-gray-700"
        >
          Source
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            type="text"
            id="source"
            value={personalInfo.source}
            onChange={handleInputChange}
            className={inputClass}
            placeholder="How did you hear about us?"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700"
        >
          Notes
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <textarea
            id="notes"
            value={personalInfo.notes}
            onChange={handleInputChange}
            className={inputClass}
            placeholder="Any additional information"
            rows="4"
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrev}
          className="px-6 py-3 rounded-full text-gray-700 font-medium transition-colors duration-200 bg-gray-200 hover:bg-gray-300"
        >
          <ChevronLeft className="inline-block mr-2 w-4 h-4" />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!isFormValid}
          className={`px-8 py-3 rounded-full text-white font-medium transition-colors duration-200 flex items-center justify-center ${
            isFormValid
              ? "bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8] hover:animate-pulse"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          View Breakdown <ChevronRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Step2ContactForm;
