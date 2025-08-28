import { Cpu } from "lucide-react";
import SearchBar from "./SearchBar";
import ShowMoreButton from "./ShowMoreButton";
import { CheckCircle } from "lucide-react";

const CoreConfiguration = ({
  src,
  formData,
  searchTerms,
  showAllItems,
  computerInstances,
  osImages,
  isComputerInstancesFetching,
  isOsImagesFetching,
  handleInputChange,
  handleSelect,
  updateSearchTerm,
  toggleShowAll,
}) => {
  const filterItems = (items, searchTerm) => {
    if (!items) return [];
    if (!searchTerm) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  const formatPrice = (price, currency) => {
    if (typeof price !== "number") {
      price = parseFloat(price);
    }
    if (isNaN(price)) {
      return "N/A";
    }

    let currencySymbol = "";
    if (currency === "USD") {
      currencySymbol = "$";
    } else if (currency === "NGN") {
      currencySymbol = "₦";
    } else {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        currencyDisplay: "symbol",
      }).format(price);
    }

    const formattedPrice = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

    return `${currencySymbol}${formattedPrice}`;
  };

  const getDisplayItems = (items, searchTerm, section, showAll) => {
    const filtered = filterItems(items, searchTerm);
    return showAll || filtered.length <= 5 ? filtered : filtered.slice(0, 5);
  };

  const displayComputeInstances = getDisplayItems(
    computerInstances,
    searchTerms.compute,
    "compute",
    showAllItems.compute
  );
  const filteredComputeCount = filterItems(
    computerInstances,
    searchTerms.compute
  ).length;

  const displayOsImages = getDisplayItems(
    osImages,
    searchTerms.os,
    "os",
    showAllItems.os
  );
  const filteredOsCount = filterItems(osImages, searchTerms.os).length;

  return (
    <div className="space-y-6">
      {src === "landing" && (
        <div className="flex justify-start mb-4">
          <label htmlFor="currency" className="sr-only">
            Select Currency
          </label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => handleInputChange("currency", e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full max-w-[120px] text-sm font-medium text-gray-700"
          >
            <option value="USD">USD</option>
            <option value="Nigeria">NGN</option>
          </select>
        </div>
      )}
      <h3 className="text-2xl font-semibold text-[#121212] flex items-center">
        <Cpu className="mr-3 text-gray-500" />
        Core Configuration
      </h3>
      <p className="text-gray-600">
        Select a compute flavor and operating system.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="months"
            className="block text-lg font-medium text-[#121212] mb-2"
          >
            Runtime Months<span className="text-red-500">*</span>
          </label>
          <input
            id="months"
            type="number"
            value={formData.months}
            onChange={(e) =>
              handleInputChange("months", parseInt(e.target.value, 10))
            }
            min="1"
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
        <div>
          <label
            htmlFor="number_of_instances"
            className="block text-lg font-medium text-[#121212] mb-2"
          >
            Number of Instances<span className="text-red-500">*</span>
          </label>
          <input
            id="number_of_instances"
            type="number"
            value={formData.number_of_instances}
            onChange={(e) =>
              handleInputChange(
                "number_of_instances",
                parseInt(e.target.value, 10)
              )
            }
            min="1"
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
      </div>
      <div className="space-y-4">
        <label className="block text-lg font-medium text-[#121212]">
          Compute Flavor<span className="text-red-500">*</span>
          {computerInstances && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredComputeCount} available)
            </span>
          )}
        </label>
        {computerInstances && computerInstances.length > 5 && (
          <SearchBar
            placeholder="Search compute flavors..."
            value={searchTerms.compute}
            onChange={(term) => updateSearchTerm("compute", term)}
            className="mb-4"
          />
        )}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  vCPUs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Memory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/hr
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Select</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isComputerInstancesFetching ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading compute flavors...
                  </td>
                </tr>
              ) : (
                <>
                  {displayComputeInstances.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors duration-200 ${
                        formData.compute_instance_id === item.id
                          ? "bg-[#ECF6FE]"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelect("compute_instance_id", item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.vcpus}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.memory} GiB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(item.local_price, item.local_currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formData.compute_instance_id === item.id ? (
                          <CheckCircle className="text-[#288DD1] w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                  <ShowMoreButton
                    section="compute"
                    items={computerInstances}
                    filteredCount={filteredComputeCount}
                    isExpanded={showAllItems.compute}
                    onToggle={toggleShowAll}
                  />
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-4">
        <label className="block text-lg font-medium text-[#121212]">
          Operating System<span className="text-red-500">*</span>
          {osImages && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredOsCount} available)
            </span>
          )}
        </label>
        {osImages && osImages.length > 5 && (
          <SearchBar
            placeholder="Search operating systems..."
            value={searchTerms.os}
            onChange={(term) => updateSearchTerm("os", term)}
            className="mb-4"
          />
        )}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Select</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isOsImagesFetching ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading operating systems...
                  </td>
                </tr>
              ) : (
                <>
                  {displayOsImages.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors duration-200 ${
                        formData.os_image_id === item.id
                          ? "bg-[#ECF6FE]"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelect("os_image_id", item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <img
                            src="https://placehold.co/40x40/000000/ffffff?text=U"
                            alt={item.name}
                            className="w-6 h-6 mr-3 rounded-full"
                          />
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(item.local_price, item.local_currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formData.os_image_id === item.id ? (
                          <CheckCircle className="text-[#288DD1] w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                  <ShowMoreButton
                    section="os"
                    items={osImages}
                    filteredCount={filteredOsCount}
                    isExpanded={showAllItems.os}
                    onToggle={toggleShowAll}
                  />
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoreConfiguration;
