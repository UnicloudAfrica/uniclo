import { ChevronUp, ChevronDown } from "lucide-react";

const ShowMoreButton = ({
  section,
  items,
  filteredCount,
  isExpanded,
  onToggle,
}) => {
  if (!items || filteredCount <= 5) return null;
  const remainingCount = filteredCount - 5;

  return (
    <tr>
      <td
        colSpan="100%"
        className="px-6 py-3 text-center border-t border-gray-200"
      >
        <button
          onClick={() => onToggle(section)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#288DD1] hover:text-[#1976D2] transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show {remainingCount} More
            </>
          )}
        </button>
      </td>
    </tr>
  );
};

export default ShowMoreButton;
