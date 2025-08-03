import { HardDrive } from "lucide-react";
import SearchBar from "./SearchBar";
import ShowMoreButton from "./ShowMoreButton";

const BlockStorage = ({
  formData,
  searchTerms,
  showAllItems,
  ebsVolumes,
  isEbsVolumesFetching,
  handleVolumeSelection,
  handleVolumeCapacityChange,
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

  const displayEbsVolumes = getDisplayItems(
    ebsVolumes,
    searchTerms.storage,
    "storage",
    showAllItems.storage
  );
  const filteredEbsCount = filterItems(ebsVolumes, searchTerms.storage).length;
  const selectedVolumesCount = Object.keys(formData.volumes).length;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#121212] flex items-center">
        <HardDrive className="mr-3 text-gray-500" />
        Optional: Add Block Storage
        {selectedVolumesCount > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({selectedVolumesCount} selected)
          </span>
        )}
      </h3>
      <p className="text-gray-600">
        Select one EBS volume and specify its capacity.
      </p>
      {ebsVolumes && ebsVolumes.length > 5 && (
        <SearchBar
          placeholder="Search storage types..."
          value={searchTerms.storage}
          onChange={(term) => updateSearchTerm("storage", term)}
        />
      )}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Select
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price/GB/mo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity (GB)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isEbsVolumesFetching ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  Loading storage options...
                </td>
              </tr>
            ) : (
              <>
                {displayEbsVolumes.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors duration-200 ${
                      formData.volumes[item.id]
                        ? "bg-[#ECF6FE]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!formData.volumes[item.id]}
                        onChange={() => handleVolumeSelection(item.id)}
                        className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${item.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formData.volumes[item.id] && (
                        <input
                          type="number"
                          value={formData.volumes[item.id]}
                          onChange={(e) =>
                            handleVolumeCapacityChange(item.id, e.target.value)
                          }
                          min="1"
                          className="w-20 border border-gray-300 rounded-lg p-2"
                        />
                      )}
                    </td>
                  </tr>
                ))}
                <ShowMoreButton
                  section="storage"
                  items={ebsVolumes}
                  filteredCount={filteredEbsCount}
                  isExpanded={showAllItems.storage}
                  onToggle={toggleShowAll}
                />
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BlockStorage;
