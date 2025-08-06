import { Cloud } from "lucide-react";
import SearchBar from "./SearchBar";
import ShowMoreButton from "./ShowMoreButton";
import { CheckCircle } from "lucide-react";

const Networking = ({
  formData,
  searchTerms,
  showAllItems,
  floatingIps,
  bandwidths,
  crossConnects,
  isFloatingIpsFetching,
  isBandwidthsFetching,
  isCrossConnectsFetching,
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

  const getDisplayItems = (items, searchTerm, section, showAll) => {
    const filtered = filterItems(items, searchTerm);
    return showAll || filtered.length <= 5 ? filtered : filtered.slice(0, 5);
  };

  const displayFloatingIps = getDisplayItems(
    floatingIps,
    searchTerms.floatingIp,
    "floatingIp",
    showAllItems.floatingIp
  );
  const filteredFloatingIpCount = filterItems(
    floatingIps,
    searchTerms.floatingIp
  ).length;

  const displayBandwidths = getDisplayItems(
    bandwidths,
    searchTerms.bandwidth,
    "bandwidth",
    showAllItems.bandwidth
  );
  const filteredBandwidthCount = filterItems(
    bandwidths,
    searchTerms.bandwidth
  ).length;

  const displayCrossConnects = getDisplayItems(
    crossConnects,
    searchTerms.crossConnect,
    "crossConnect",
    showAllItems.crossConnect
  );
  const filteredCrossConnectCount = filterItems(
    crossConnects,
    searchTerms.crossConnect
  ).length;

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
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#121212] flex items-center">
        <Cloud className="mr-3 text-gray-500" />
        Optional: Configure Networking
      </h3>
      <p className="text-gray-600">
        Select IP and bandwidth options, and a cross connect if needed.
      </p>
      <div className="space-y-4">
        <label className="block text-lg font-medium text-[#121212]">
          Floating IPs
          {floatingIps && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredFloatingIpCount} available)
            </span>
          )}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="floating_ip_count"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Number of IPs
            </label>
            <input
              id="floating_ip_count"
              type="number"
              value={formData.floating_ip_count}
              onChange={(e) =>
                handleInputChange(
                  "floating_ip_count",
                  parseInt(e.target.value, 10)
                )
              }
              min="0"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
        </div>
        {floatingIps && floatingIps.length > 5 && (
          <SearchBar
            placeholder="Search floating IPs..."
            value={searchTerms.floatingIp}
            onChange={(term) => updateSearchTerm("floatingIp", term)}
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
                  Price/mo
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Select</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isFloatingIpsFetching ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading floating IP options...
                  </td>
                </tr>
              ) : (
                <>
                  {displayFloatingIps.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors duration-200 ${
                        formData.floating_ip_id === item.id
                          ? "bg-[#ECF6FE]"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelect("floating_ip_id", item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(item.local_price, item.local_currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formData.floating_ip_id === item.id ? (
                          <CheckCircle className="text-[#288DD1] w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                  <ShowMoreButton
                    section="floatingIp"
                    items={floatingIps}
                    filteredCount={filteredFloatingIpCount}
                    isExpanded={showAllItems.floatingIp}
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
          Bandwidth
          {bandwidths && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredBandwidthCount} available)
            </span>
          )}
        </label>
        {bandwidths && bandwidths.length > 5 && (
          <SearchBar
            placeholder="Search bandwidth options..."
            value={searchTerms.bandwidth}
            onChange={(term) => updateSearchTerm("bandwidth", term)}
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
                  Price
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Select</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isBandwidthsFetching ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading bandwidth options...
                  </td>
                </tr>
              ) : (
                <>
                  {displayBandwidths.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors duration-200 ${
                        formData.bandwidth_id === item.id
                          ? "bg-[#ECF6FE]"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelect("bandwidth_id", item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(item.local_price, item.local_currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formData.bandwidth_id === item.id ? (
                          <CheckCircle className="text-[#288DD1] w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                  <ShowMoreButton
                    section="bandwidth"
                    items={bandwidths}
                    filteredCount={filteredBandwidthCount}
                    isExpanded={showAllItems.bandwidth}
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
          Cross Connect
          {crossConnects && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredCrossConnectCount} available)
            </span>
          )}
        </label>
        {crossConnects && crossConnects.length > 5 && (
          <SearchBar
            placeholder="Search cross connect options..."
            value={searchTerms.crossConnect}
            onChange={(term) => updateSearchTerm("crossConnect", term)}
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
                  Price/mo
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Select</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isCrossConnectsFetching ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading cross connect options...
                  </td>
                </tr>
              ) : (
                <>
                  {displayCrossConnects.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors duration-200 ${
                        formData.cross_connect_id === item.id
                          ? "bg-[#ECF6FE]"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelect("cross_connect_id", item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(item.local_price, item.local_currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formData.cross_connect_id === item.id ? (
                          <CheckCircle className="text-[#288DD1] w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                  <ShowMoreButton
                    section="crossConnect"
                    items={crossConnects}
                    filteredCount={filteredCrossConnectCount}
                    isExpanded={showAllItems.crossConnect}
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

export default Networking;
