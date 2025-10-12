import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { designTokens } from '../../styles/designTokens';
import ModernButton from './ModernButton';

const ModernTable = ({
  data = [],
  columns = [],
  title = "",
  searchable = true,
  filterable = true,
  exportable = true,
  sortable = true,
  paginated = true,
  pageSize = 10,
  loading = false,
  onRowClick = null,
  emptyMessage = "No data available",
  actions = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter and search data
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    return data.filter(row =>
      columns.some(column => {
        const value = row[column.key];
        return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, columns, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = () => {
    // Basic CSV export functionality
    const csvContent = [
      columns.map(col => col.header).join(','),
      ...sortedData.map(row => 
        columns.map(col => row[col.key] || '').join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'data'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tableStyles = {
    container: {
      backgroundColor: designTokens.colors.neutral[0],
      borderRadius: designTokens.borderRadius.xl,
      border: `1px solid ${designTokens.colors.neutral[200]}`,
      boxShadow: designTokens.shadows.sm,
      overflow: 'hidden'
    },
    header: {
      padding: '20px 24px',
      borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: designTokens.typography.fontSize.lg[0],
      fontWeight: designTokens.typography.fontWeight.semibold,
      color: designTokens.colors.neutral[900],
      margin: 0
    },
    searchContainer: {
      position: 'relative',
      flex: 1,
      maxWidth: '300px'
    },
    searchInput: {
      width: '100%',
      height: '40px',
      paddingLeft: '40px',
      paddingRight: '16px',
      border: `1px solid ${designTokens.colors.neutral[300]}`,
      borderRadius: designTokens.borderRadius.lg,
      backgroundColor: designTokens.colors.neutral[50],
      fontSize: designTokens.typography.fontSize.sm[0],
      outline: 'none',
      transition: 'all 0.2s ease',
      fontFamily: designTokens.typography.fontFamily.sans.join(', ')
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    thead: {
      backgroundColor: designTokens.colors.neutral[50]
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: designTokens.typography.fontSize.xs[0],
      fontWeight: designTokens.typography.fontWeight.medium,
      color: designTokens.colors.neutral[600],
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
      cursor: sortable ? 'pointer' : 'default'
    },
    td: {
      padding: '16px',
      fontSize: designTokens.typography.fontSize.sm[0],
      color: designTokens.colors.neutral[900],
      borderBottom: `1px solid ${designTokens.colors.neutral[100]}`
    },
    emptyState: {
      padding: '48px 24px',
      textAlign: 'center',
      color: designTokens.colors.neutral[500],
      fontSize: designTokens.typography.fontSize.sm[0]
    },
    pagination: {
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: `1px solid ${designTokens.colors.neutral[200]}`,
      backgroundColor: designTokens.colors.neutral[25]
    },
    loadingOverlay: {
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10
    }
  };

  if (loading) {
    return (
      <div style={{ ...tableStyles.container, position: 'relative', minHeight: '200px' }}>
        <div style={tableStyles.loadingOverlay}>
          <div 
            className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
            style={{ borderColor: designTokens.colors.primary[500] }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div style={tableStyles.container}>
      {/* Header */}
      {(title || searchable || filterable || exportable) && (
        <div style={tableStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            {title && <h3 style={tableStyles.title}>{title}</h3>}
            
            {searchable && (
              <div style={tableStyles.searchContainer}>
                <Search 
                  size={18} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: designTokens.colors.neutral[400]
                  }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={tableStyles.searchInput}
                />
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {filterable && (
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={16} />
                Filter
              </ModernButton>
            )}
            
            {exportable && (
              <ModernButton
                variant="outline" 
                size="sm"
                onClick={handleExport}
              >
                <Download size={16} />
                Export
              </ModernButton>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyles.table}>
          <thead style={tableStyles.thead}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    ...tableStyles.th,
                    position: 'relative'
                  }}
                  onClick={() => handleSort(column.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {column.header}
                    {sortable && sortConfig.key === column.key && (
                      <div>
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th style={tableStyles.th}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  style={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => onRowClick && onRowClick(row)}
                  onMouseEnter={(e) => {
                    e.target.closest('tr').style.backgroundColor = designTokens.colors.neutral[50];
                  }}
                  onMouseLeave={(e) => {
                    e.target.closest('tr').style.backgroundColor = 'transparent';
                  }}
                >
                  {columns.map((column) => (
                    <td key={column.key} style={tableStyles.td}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td style={tableStyles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            style={{
                              padding: '4px 8px',
                              border: 'none',
                              borderRadius: designTokens.borderRadius.md,
                              backgroundColor: 'transparent',
                              color: designTokens.colors.neutral[600],
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = designTokens.colors.neutral[100];
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                            }}
                          >
                            {action.icon && action.icon}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)} 
                  style={tableStyles.emptyState}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div style={tableStyles.pagination}>
          <div style={{ fontSize: designTokens.typography.fontSize.sm[0], color: designTokens.colors.neutral[600] }}>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: designTokens.borderRadius.md,
                backgroundColor: 'transparent',
                color: currentPage === 1 ? designTokens.colors.neutral[400] : designTokens.colors.neutral[600],
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronsLeft size={16} />
            </button>
            
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: designTokens.borderRadius.md,
                backgroundColor: 'transparent',
                color: currentPage === 1 ? designTokens.colors.neutral[400] : designTokens.colors.neutral[600],
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            
            <span style={{ 
              padding: '8px 12px',
              fontSize: designTokens.typography.fontSize.sm[0],
              color: designTokens.colors.neutral[700]
            }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: designTokens.borderRadius.md,
                backgroundColor: 'transparent',
                color: currentPage === totalPages ? designTokens.colors.neutral[400] : designTokens.colors.neutral[600],
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: designTokens.borderRadius.md,
                backgroundColor: 'transparent',
                color: currentPage === totalPages ? designTokens.colors.neutral[400] : designTokens.colors.neutral[600],
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernTable;