const StepNavigation = ({
  steps,
  currentStep,
  setCurrentStep,
  validateStep,
}) => {
  return (
    <div className="flex justify-between mb-4 border-b font-Outfit">
      {steps.map((step, index) => (
        <button
          key={index}
          onClick={() => {
            if (index <= currentStep || validateStep()) {
              setCurrentStep(index);
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
  );
};

export default StepNavigation;
