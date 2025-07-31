export const Step3Breakdown = ({
  selectedOptions,
  personalInfo,
  handlePrev,
}) => {
  const calculateTotal = () => {
    let total = 0;
    if (selectedOptions.instance) total += selectedOptions.instance.price * 730; // Assuming 730 hours in a month
    if (selectedOptions.storage)
      total += selectedOptions.storage.price * selectedOptions.storage.capacity;
    if (selectedOptions.bandwidth)
      total += selectedOptions.bandwidth.price * 1000; // Assuming 1000 GB transfer for a simple estimate
    if (selectedOptions.osImage) total += selectedOptions.osImage.price * 730;
    return total.toFixed(2);
  };

  const totalCost = calculateTotal();

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#121212]">
        Your Cloud Solution Breakdown
      </h3>
      <p className="text-gray-600">
        Here is a detailed summary of your configured resources and the
        estimated monthly cost.
      </p>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-4">
        <div>
          <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
            Configuration Summary
          </h4>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Compute Instance:</span>
            <span className="text-gray-600">
              {selectedOptions.instance.name}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Storage:</span>
            <span className="text-gray-600">
              {selectedOptions.storage.name}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Bandwidth:</span>
            <span className="text-gray-600">
              {selectedOptions.bandwidth.name}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Operating System:</span>
            <span className="text-gray-600">
              {selectedOptions.osImage.name}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-xl font-semibold text-[#121212] border-b pb-2 mb-2">
            Personal Information
          </h4>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Full Name:</span>
            <span className="text-gray-600">{personalInfo.fullName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Email:</span>
            <span className="text-gray-600">{personalInfo.email}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-gray-700">Role:</span>
            <span className="text-gray-600">{personalInfo.role}</span>
          </div>
        </div>

        <div className="border-t pt-4 text-center">
          <p className="text-2xl font-bold text-[#121212]">
            Estimated Monthly Cost
          </p>
          <p className="text-5xl font-extrabold text-[#288DD1] mt-2">
            ${totalCost}
          </p>
        </div>
      </div>

      <div className="flex justify-start mt-8">
        <button
          onClick={handlePrev}
          className="px-6 py-3 rounded-full text-gray-700 font-medium transition-colors duration-200 bg-gray-200 hover:bg-gray-300"
        >
          Previous
        </button>
      </div>
    </div>
  );
};
