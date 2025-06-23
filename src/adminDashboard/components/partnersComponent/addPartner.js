import { useState } from "react";
import { X } from "lucide-react";
import { FileInput } from "../../../utils/fileInput";

const CreateAccount = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validate = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return "Invalid email";
    if (!password || password.length < 6)
      return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full input-field"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Temporary Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter Password"
          className="w-full input-field"
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat Password"
          className="w-full input-field"
        />
      </div>
      {validate() && <p className="text-red-500 text-sm">{validate()}</p>}
    </div>
  );
};

const BusinessInfo = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [tinNumber, setTinNumber] = useState("");

  const validate = () => {
    if (
      !firstName ||
      !lastName ||
      !phone ||
      !email ||
      !businessName ||
      !regNumber ||
      !tinNumber
    )
      return "All fields are required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Invalid email";
    if (!/^\d{10}$/.test(phone)) return "Invalid phone number";
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            First Name
          </label>
          <input
            id="first_name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter First Name"
            className="w-full input-field"
          />
        </div>
        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Last Name
          </label>
          <input
            id="last_name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter Last Name"
            className="w-full input-field"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Contact Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone number"
          className="w-full input-field"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full input-field"
        />
      </div>
      <div>
        <label
          htmlFor="business_name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Business Name
        </label>
        <input
          id="business_name"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Enter business Name"
          className="w-full input-field"
        />
      </div>
      <div>
        <label
          htmlFor="reg_number"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Registration Number
        </label>
        <input
          id="reg_number"
          type="text"
          value={regNumber}
          onChange={(e) => setRegNumber(e.target.value)}
          placeholder="Enter Registration Number"
          className="w-full input-field"
        />
      </div>
      <div>
        <label
          htmlFor="tin_number"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Tin Number
        </label>
        <input
          id="tin_number"
          type="text"
          value={tinNumber}
          onChange={(e) => setTinNumber(e.target.value)}
          placeholder="Enter Tin Number"
          className="w-full input-field"
        />
      </div>
      {validate() && <p className="text-red-500 text-sm">{validate()}</p>}
    </div>
  );
};

const BusinessAddress = () => {
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  const validate = () => {
    if (!address || !zipCode || !country || !city || !region)
      return "All fields are required";
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="business_address"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Business Address
        </label>
        <input
          id="business_address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter business Address"
          className="w-full input-field"
        />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="zip_code"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Postal / Zip Code
          </label>
          <input
            id="zip_code"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter Postal / Zip Code"
            className="w-full input-field"
          />
        </div>
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full input-field bg-transparent outline-none"
          >
            <option value="">Select country</option>
            <option value="nigeria">Nigeria</option>
            <option value="ghana">Ghana</option>
            <option value="kenya">Kenya</option>
            <option value="south-africa">South Africa</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            City
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter City"
            className="w-full input-field"
          />
        </div>
        <div>
          <label
            htmlFor="region"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            State/Region/Province
          </label>
          <input
            id="region"
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Enter State/Region/Province"
            className="w-full input-field"
          />
        </div>
      </div>
      {validate() && <p className="text-red-500 text-sm">{validate()}</p>}
    </div>
  );
};

const UploadFiles = () => {
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
  ];

  const validate = () => {
    return null; // Add file validation logic if needed
  };

  return (
    <div className="space-y-5 w-full">
      {documentFields.map(({ id, label, field }) => (
        <FileInput
          key={id}
          id={id}
          label={label}
          field={field}
          accept=".pdf,.jpg,.jpeg,.png"
        />
      ))}
      {validate() && <p className="text-red-500 text-sm">{validate()}</p>}
    </div>
  );
};

const AddPartner = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { component: CreateAccount, label: "Create Account" },
    { component: BusinessInfo, label: "Business Info" },
    { component: BusinessAddress, label: "Business Address" },
    { component: UploadFiles, label: "Upload Document" },
  ];

  const renderStep = () => {
    const StepComponent = steps[currentStep].component;
    return <StepComponent />;
  };

  const handleNext = () => {
    const StepComponent = steps[currentStep].component;
    const stepInstance = <StepComponent />;
    const error = stepInstance.props.children.props.validate();
    if (!error) setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
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
                    onClick={() => setCurrentStep(index)}
                    className={`px-4 py-2 text-sm md:text-base ${
                      currentStep === index
                        ? "border-b-2 border-[#288DD1] text-[#288DD1]"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
              {renderStep()}
            </div>
            <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 -t rounded-b-[24px]">
              <button
                onClick={currentStep > 0 ? handleBack : onClose}
                className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              >
                {currentStep > 0 ? "Back" : "Close"}
              </button>
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
                >
                  Submit
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
