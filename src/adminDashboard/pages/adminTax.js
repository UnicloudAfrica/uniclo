import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernButton from "../components/ModernButton";
import { 
  Loader2, 
  Pencil, 
  PlusCircle, 
  Calculator,
  Globe,
  Percent,
  Settings
} from "lucide-react";
import ToastUtils from "../../utils/toastUtil";
import { designTokens } from "../../styles/designTokens";
import AddTaxTypeModal from "./taxComponents/addTax";
import EditTaxTypeModal from "./taxComponents/editTax";
import { useFetchTaxConfigurations } from "../../hooks/adminHooks/taxConfigurationHooks";

export default function AdminTax() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: taxConfigurations, isFetching: isTaxFetching } =
    useFetchTaxConfigurations();

  const [isAddTaxTypeModalOpen, setIsAddTaxTypeModalOpen] = useState(false);
  const [isEditTaxTypeModalOpen, setIsEditTaxTypeModalOpen] = useState(false); // Renamed state for new modal
  // const [isDeleteTaxRateModalOpen, setIsDeleteTaxRateModalOpen] = useState(false); // No longer needed

  const [selectedTaxType, setSelectedTaxType] = useState(null);
  // const [selectedCountryRate, setSelectedCountryRate] = useState(null); // No longer needed for direct modal opening

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleAddTaxType = () => {
    setIsAddTaxTypeModalOpen(true);
  };

  // New handler for editing a Tax Type (opens the new EditTaxTypeModal)
  const handleEditTaxType = (taxType) => {
    setSelectedTaxType(taxType);
    setIsEditTaxTypeModalOpen(true);
  };

  // handleDeleteTaxRate is no longer directly used by the main table
  // as rate deletion is handled within EditTaxTypeModal.
  // If you still need a separate delete modal for individual rates, you'd re-add this.
  // const handleDeleteTaxRate = (taxType, countryRate) => {
  //   setSelectedTaxType(taxType);
  //   setSelectedCountryRate(countryRate);
  //   setIsDeleteTaxRateModalOpen(true);
  // };

  const formatRate = (rate) => {
    if (rate === null || rate === undefined) return "N/A";
    return `${(parseFloat(rate) * 100).toFixed(2)}%`;
  };

  // Calculate tax statistics
  const taxStats = {
    totalTaxTypes: taxConfigurations?.length || 0,
    totalCountryRates: taxConfigurations?.reduce((sum, taxType) => 
      sum + (taxType.country_rates?.length || 0), 0
    ) || 0,
    averageRate: taxConfigurations?.length > 0 ? (
      taxConfigurations.reduce((sum, taxType) => {
        const rates = taxType.country_rates || [];
        const typeAvg = rates.length > 0 ? 
          rates.reduce((rateSum, rate) => rateSum + (parseFloat(rate.rate) || 0), 0) / rates.length : 0;
        return sum + typeAvg;
      }, 0) / taxConfigurations.length
    ) : 0,
    countriesWithTax: [...new Set(
      taxConfigurations?.flatMap(taxType => 
        (taxType.country_rates || []).map(rate => rate.country?.name).filter(Boolean)
      ) || []
    )].length
  };

  // Prepare data for ModernTable
  const tableData = [];
  taxConfigurations?.forEach(taxType => {
    if (taxType.country_rates && taxType.country_rates.length > 0) {
      taxType.country_rates.forEach(rate => {
        tableData.push({
          id: `${taxType.id}-${rate.id}`,
          taxType: taxType.name || 'N/A',
          country: rate.country?.name || 'N/A',
          rate: rate.rate,
          formattedRate: formatRate(rate.rate),
          taxTypeId: taxType.id,
          taxTypeObj: taxType
        });
      });
    } else {
      tableData.push({
        id: taxType.id,
        taxType: taxType.name || 'N/A',
        country: 'No rates configured',
        rate: null,
        formattedRate: 'N/A',
        taxTypeId: taxType.id,
        taxTypeObj: taxType
      });
    }
  });

  // Define columns for ModernTable
  const columns = [
    {
      key: 'taxType',
      header: 'Tax Type',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calculator size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'country',
      header: 'Country',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Globe size={16} style={{ color: designTokens.colors.info[500] }} />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'formattedRate',
      header: 'Rate',
      render: (value, item) => (
        <div className="flex items-center gap-1">
          <Percent size={14} style={{ color: designTokens.colors.success[500] }} />
          <span 
            className="font-medium px-2 py-1 rounded-full text-xs"
            style={{
              backgroundColor: item.rate > 0 ? designTokens.colors.success[50] : designTokens.colors.neutral[50],
              color: item.rate > 0 ? designTokens.colors.success[700] : designTokens.colors.neutral[500]
            }}
          >
            {value}
          </span>
        </div>
      )
    }
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Pencil size={16} />,
      label: 'Edit Tax Type',
      onClick: (item) => handleEditTaxType(item.taxTypeObj)
    }
  ];

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main 
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Tax Configuration
              </h1>
              <p 
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Manage tax types and rates for different countries
              </p>
            </div>
            <ModernButton
              onClick={handleAddTaxType}
              className="flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Add Tax Type
            </ModernButton>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Tax Types"
              value={taxStats.totalTaxTypes}
              icon={<Calculator size={24} />}
              color="primary"
              description="Different tax categories"
            />
            <ModernStatsCard
              title="Country Rates"
              value={taxStats.totalCountryRates}
              icon={<Globe size={24} />}
              color="info"
              description="Total configured rates"
            />
            <ModernStatsCard
              title="Average Rate"
              value={`${(taxStats.averageRate * 100).toFixed(1)}%`}
              icon={<Percent size={24} />}
              color="success"
              description="Across all countries"
            />
            <ModernStatsCard
              title="Countries"
              value={taxStats.countriesWithTax}
              icon={<Settings size={24} />}
              color="warning"
              description="With tax configured"
            />
          </div>

          {/* Tax Configuration Table */}
          {isTaxFetching ? (
            <ModernCard className="flex items-center justify-center min-h-[200px]">
              <Loader2 
                className="w-8 h-8 animate-spin" 
                style={{ color: designTokens.colors.primary[500] }}
              />
              <p 
                className="ml-2" 
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Loading tax configurations...
              </p>
            </ModernCard>
          ) : (
            <ModernCard>
              <ModernTable
                title={`Tax Configurations (${taxStats.totalTaxTypes} tax types)`}
                data={tableData}
                columns={columns}
                actions={actions}
                searchable={true}
                filterable={true}
                exportable={true}
                sortable={true}
                loading={isTaxFetching}
                emptyMessage="No tax configurations found. Add your first tax type to get started."
              />
            </ModernCard>
          )}
        </div>
      </main>

      <AddTaxTypeModal
        isOpen={isAddTaxTypeModalOpen}
        onClose={() => setIsAddTaxTypeModalOpen(false)}
      />
      <EditTaxTypeModal
        isOpen={isEditTaxTypeModalOpen}
        onClose={() => setIsEditTaxTypeModalOpen(false)}
        taxType={selectedTaxType}
      />
      {/* DeleteTaxRateModal is no longer directly used */}
      {/* <DeleteTaxRateModal
        isOpen={isDeleteTaxRateModalOpen}
        onClose={() => setIsDeleteTaxRateModalOpen(false)}
        taxType={selectedTaxType}
        countryRate={selectedCountryRate}
      /> */}
    </>
  );
}
