import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable Pagination component with items per page selector
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.itemsPerPage - Items per page
 * @param {function} props.onPageChange - Callback when page changes
 * @param {function} props.onItemsPerPageChange - Callback when items per page changes
 * @param {string} props.className - Additional CSS classes
 */
const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange,
    onItemsPerPageChange,
    className = '',
}) => {
    const itemsPerPageOptions = [10, 25, 50, 100];

    // Calculate range of items being displayed
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 7;

        if (totalPages <= maxPagesToShow) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages with ellipsis
            if (currentPage <= 4) {
                // Near start
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push('ellipsis-end');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                // Near end
                pages.push(1);
                pages.push('ellipsis-start');
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // Middle
                pages.push(1);
                pages.push('ellipsis-start');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('ellipsis-end');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            onPageChange(page);
        }
    };

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>Show</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {itemsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <span>per page</span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-700">
                Showing <span className="font-semibold">{startItem}</span> to{' '}
                <span className="font-semibold">{endItem}</span> of{' '}
                <span className="font-semibold">{totalItems}</span> results
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-1">
                {/* First page */}
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous page */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                        if (typeof page === 'string' && page.startsWith('ellipsis')) {
                            return (
                                <span
                                    key={`${page}-${index}`}
                                    className="px-3 py-2 text-gray-500"
                                >
                                    ...
                                </span>
                            );
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`min-w-[40px] px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                aria-label={`Page ${page}`}
                                aria-current={currentPage === page ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Next page */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last page */}
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
