import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
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
  Settings,
} from "lucide-react";
import ToastUtils from "../../utils/toastUtil";
import { designTokens } from "../../styles/designTokens";
import AddTaxTypeModal from "./taxComponents/addTax";
import EditTaxTypeModal from "./taxComponents/editTax";
import { useFetchTaxConfigurations } from "../../hooks/adminHooks/taxConfigurationHooks";

export default function AdminTax() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    data: taxConfigurations = [],
    isFetching: isTaxFetching,
    refetch,
  } = useFetchTaxConfigurations();

  const [isAddTaxTypeModalOpen, setIsAddTaxTypeModalOpen] = useState(false);
  const [isEditTaxTypeModalOpen, setIsEditTaxTypeModalOpen] = useState(false);
  const [selectedTaxType, setSelectedTaxType] = useState(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleAddTaxType = () => setIsAddTaxTypeModalOpen(true);
  const handleEditTaxType = (taxType) => {
    setSelectedTaxType(taxType);
    setIsEditTaxTypeModalOpen(true);
  };

  const formatRate = (rate) => {
    if (rate === null || rate === undefined) return "N/A";
    return `${(parseFloat(rate) * 100).toFixed(2)}%`;
  };

  const taxStats = {
    totalTaxTypes: taxConfigurations?.length || 0,
    totalCountryRates:
      taxConfigurations?.reduce(
        (sum, taxType) => sum + (taxType.country_rates?.length || 0),
        0
      ) || 0,
    averageRate:
      taxConfigurations?.length > 0
        ? (
            taxConfigurations.reduce((sum, taxType) => {
              const rates = taxType.country_rates || [];
              const typeAvg =
                rates.length > 0
                  ? rates.reduce(
                      (rateSum, rate) => rateSum + (parseFloat(rate.rate) || 0),
                      0
                    ) / rates.length
                  : 0;
              return sum + typeAvg;
            }, 0) / taxConfigurations.length
          ).toFixed(2)
        : 0,
    countriesWithTax: [
      ...new Set(
        taxConfigurations?.flatMap((taxType) =>
          (taxType.country_rates || [])
            .map((rate) => rate.country?.name)
            .filter(Boolean)
        ) || []
      ),
    ].length,
  };

  const tableData = [];
  taxConfigurations?.forEach((taxType) => {
    if (taxType.country_rates && taxType.country_rates.length > 0) {
      taxType.country_rates.forEach((rate) => {
        tableData.push({
          id: `${taxType.id}-${rate.id}`,
          taxType: taxType.name || "N/A",
          country: rate.country?.name || "N/A",
          rate: rate.rate,
          formattedRate: formatRate(rate.rate),
          taxTypeId: taxType.id,
          taxTypeObj: taxType,
        });
      });
    } else {
      tableData.push({
        id: taxType.id,
        taxType: taxType.name || "N/A",
        country: "No rates configured",
        rate: null,
        formattedRate: "N/A",
        taxTypeId: taxType.id,
        taxTypeObj: taxType,
      });
    }
  });

  const columns = [
    {
      key: "taxType",
      header: "Tax Type",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calculator size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "country",
      header: "Country",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Globe size={16} style={{ color: designTokens.colors.info[500] }} />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "formattedRate",
      header: "Rate",
      render: (value, item) => (
        <div className="flex items-center gap-1">
          <Percent size={14} style={{ color: designTokens.colors.success[500] }} />
          <span
            className="px-2 py-1 text-xs font-medium"
            style={{
              borderRadius: 9999,
              backgroundColor:
                item.rate > 0 ? designTokens.colors.success[50] : designTokens.colors.neutral[50],
              color:
                item.rate > 0 ? designTokens.colors.success[700] : designTokens.colors.neutral[500],
            }}
          >
            {value}
          </span>
        </div>
      ),
    },
  ];

  const actions = [
    {
      icon: <Pencil size={16} />,
      label: "Edit Tax Type",
      onClick: (item) => handleEditTaxType(item.taxTypeObj),
    },
  ];

  const headerActions = (
    <ModernButton className="flex items-center gap-2" onClick={handleAddTaxType}>
      <PlusCircle size={18} />
      Add Tax Type
    </ModernButton>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Tax Configuration"
        description="Manage tax types and rates for different countries."
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ModernStatsCard
            title="Tax Types"
            value={taxStats.totalTaxTypes}
            icon={<Calculator size={24} />}
            color="primary"
            description="Configured tax categories"
          />
          <ModernStatsCard
            title="Country Rates"
            value={taxStats.totalCountryRates}
            icon={<Globe size={24} />}
            color="success"
            description="Regional tax overrides"
          />
          <ModernStatsCard
            title="Average Rate"
            value={`${taxStats.averageRate}%`}
            icon={<Percent size={24} />}
            color="warning"
            description="Across all markets"
          />
          <ModernStatsCard
            title="Markets Covered"
            value={taxStats.countriesWithTax}
            icon={<Settings size={24} />}
            color="info"
            description="Countries with configured taxes"
          />
        </div>

        <ModernCard>
          {isTaxFetching && tableData.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-gray-500">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: designTokens.colors.primary[500] }}
              />
              <span>Loading tax configurations…</span>
            </div>
          ) : (
            <ModernTable
              title="Tax Rates"
              data={tableData}
              columns={columns}
              actions={actions}
              searchable
              filterable
              exportable
              sortable
              loading={isTaxFetching}
              emptyMessage="No tax configurations found"
            />
          )}
        </ModernCard>
      </AdminPageShell>

      {isAddTaxTypeModalOpen && (
        <AddTaxTypeModal
          isOpen={isAddTaxTypeModalOpen}
          onClose={() => setIsAddTaxTypeModalOpen(false)}
          onSuccess={() => {
            ToastUtils.success("Tax type added successfully");
            refetch();
          }}
        />
      )}

      {isEditTaxTypeModalOpen && selectedTaxType && (
        <EditTaxTypeModal
          isOpen={isEditTaxTypeModalOpen}
          onClose={() => {
            setIsEditTaxTypeModalOpen(false);
            setSelectedTaxType(null);
          }}
          taxType={selectedTaxType}
          refetch={refetch}
        />
      )}
    </>
  );
}
