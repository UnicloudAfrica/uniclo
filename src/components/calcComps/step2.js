import { Smartphone, Mail, User, ChevronRight } from "lucide-react";

export const Step2ContactForm = ({
  personalInfo,
  handleInputChange,
  handleNext,
  handlePrev,
}) => {
  const isFormValid =
    personalInfo.fullName && personalInfo.email && personalInfo.phone;

  // The new 'input-field' class with Tailwind styles
  const inputClass =
    " block w-full rounded-md border-gray-300 shadow-sm focus:border-[#288DD1] focus:ring-[#288DD1] sm:text-sm input-field";

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#121212]">
        A Little Personal Info
      </h3>
      <p className="text-gray-600">
        Before we give you a breakdown of your configuration, we'll need a
        little personal info.
      </p>

      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <div className="w-full">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {/* <User size={20} className="text-gray-400" /> */}
            </div>
            <input
              type="text"
              id="fullName"
              value={personalInfo.fullName}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Your full name"
            />
          </div>
        </div>
        <div className="w-full">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {/* <Mail size={20} className="text-gray-400" /> */}
            </div>
            <input
              type="email"
              id="email"
              value={personalInfo.email}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Phone Number
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {/* <Smartphone size={20} className="text-gray-400" /> */}
          </div>
          <input
            type="tel"
            id="phone"
            value={personalInfo.phone}
            onChange={handleInputChange}
            className={inputClass}
            placeholder="+1 (555) 987-6543"
          />
        </div>
      </div>

      {/* Partner or User Toggles */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Are you a partner or a user?
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="user"
              checked={personalInfo.role === "user"}
              onChange={handleInputChange}
              className="focus:ring-[#288DD1] h-4 w-4 text-[#288DD1] border-gray-300"
            />
            <span className="text-gray-700">User</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="partner"
              checked={personalInfo.role === "partner"}
              onChange={handleInputChange}
              className="focus:ring-[#288DD1] h-4 w-4 text-[#288DD1] border-gray-300"
            />
            <span className="text-gray-700">Partner</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrev}
          className="px-6 py-3 rounded-full text-gray-700 font-medium transition-colors duration-200 bg-gray-200 hover:bg-gray-300"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!isFormValid}
          className={`px-8 py-3 rounded-full text-white font-medium transition-colors duration-200 flex items-center justify-center ${
            isFormValid
              ? "bg-gradient-to-r from-[#288DD1] via-[#3fd0e0] to-[#3FE0C8] hover:bg-[#1976D2] hover:animate-pulse"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          View Breakdown <ChevronRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
