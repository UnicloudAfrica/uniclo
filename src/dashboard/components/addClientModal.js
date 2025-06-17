import { X } from "lucide-react";
import { useState } from "react";
import { FileInput } from "../../utils/fileInput";

const AddClientModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("Business");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const filesStep = () => {
    // Different document requirements based on client type
    const businessDocumentFields = [
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

    const individualDocumentFields = [
      {
        id: "meansOfIdentification",
        label: "Means of Identification",
        field: "meansOfIdentification",
      },
    ];

    const documentFields =
      activeTab === "Business"
        ? businessDocumentFields
        : individualDocumentFields;

    return (
      <>
        <div className="space-y-5 w-full">
          {documentFields.map(({ id, label, field }) => (
            <FileInput
              key={id}
              id={id}
              label={label}
              field={field}
              selectedFile={formData[field]}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          ))}
        </div>
      </>
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      // Handle form submission here
      console.log("Form submitted:", formData);
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({});
    onClose();
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] w-full max-w-[650px] mx-4">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
              <h2 className="text-lg font-semibold text-[#575758]">
                Add client {currentStep === 2 && "- Upload Documents"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
              {currentStep === 1 && (
                <>
                  {/* Tab Buttons */}
                  <div className="flex bg-[#FAFAFA] border border-[#ECEDF0] rounded-[50px] p-3 w-[320px] mb-8">
                    <button
                      onClick={() => setActiveTab("Business")}
                      className={`flex-1 py-2 px-4 rounded-[30px] text-sm font-normal transition-colors ${
                        activeTab === "Business"
                          ? "bg-[#288DD1] text-white shadow-sm font-semibold"
                          : "text-[#676767] hover:text-gray-800 font-normal"
                      }`}
                    >
                      Business
                    </button>
                    <button
                      onClick={() => setActiveTab("Individual")}
                      className={`flex-1 py-2 px-4 rounded-[30px] text-sm font-normal transition-colors ${
                        activeTab === "Individual"
                          ? "bg-[#288DD1] text-white shadow-sm font-semibold"
                          : "text-[#676767] hover:text-gray-800 font-normal"
                      }`}
                    >
                      Individual
                    </button>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contactPersonFirstName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Contact First Name
                        </label>
                        <input
                          id="contactPersonFirstName"
                          type="text"
                          placeholder="Enter first name"
                          className="w-full input-field transition-all border-gray-300"
                          value={formData.contactPersonFirstName || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contactPersonLastName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Contact Last Name
                        </label>
                        <input
                          id="contactPersonLastName"
                          type="text"
                          placeholder="Enter last name"
                          className="w-full input-field transition-all border-gray-300"
                          value={formData.contactPersonLastName || ""}
                          onChange={handleInputChange}
                        />
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
                        placeholder="Enter phone number"
                        className="w-full input-field transition-all"
                        value={formData.contactPhone || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    {activeTab === "Business" && (
                      <>
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
                            placeholder="Enter business name"
                            className="w-full input-field transition-all"
                            value={formData.businessName || ""}
                            onChange={handleInputChange}
                          />
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
                            placeholder="Enter registration number"
                            className="w-full input-field transition-all"
                            value={formData.registrationNumber || ""}
                            onChange={handleInputChange}
                          />
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
                            placeholder="Enter TIN number"
                            className="w-full input-field transition-all"
                            value={formData.tinNumber || ""}
                            onChange={handleInputChange}
                          />
                        </div>
                      </>
                    )}

                    {activeTab === "Individual" && (
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          className="w-full input-field transition-all"
                          value={formData.email || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <div className="w-full">
                  <div className="mb-6 text-center">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      Upload Required Documents
                    </h3>
                    <p className="text-sm text-gray-600">
                      {activeTab === "Business"
                        ? "Please upload the following business documents:"
                        : "Please upload your means of identification:"}
                    </p>
                  </div>
                  {filesStep()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t rounded-b-[24px]">
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                {currentStep === 2 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  >
                    Back
                  </button>
                )}
              </div>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  currentStep === 1 &&
                  (!formData.contactPersonFirstName ||
                    !formData.contactPersonLastName ||
                    !formData.contactPhone ||
                    (activeTab === "Business" &&
                      (!formData.businessName ||
                        !formData.registrationNumber ||
                        !formData.tinNumber)) ||
                    (activeTab === "Individual" && !formData.email))
                }
              >
                {currentStep === 1 ? "Next" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddClientModal;
