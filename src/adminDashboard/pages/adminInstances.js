import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
  Package,
  Server,
  Globe,
  Activity,
  Zap
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernButton from "../components/ModernButton";
import ModernInput from "../components/ModernInput";
import { designTokens } from "../../styles/designTokens";
import { useFetchPurchasedInstances } from "../../hooks/adminHooks/instancesHook";
import useAuthRedirect from "../../utils/adminAuthRedirect";

export default function AdminInstances() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isLoading } = useAuthRedirect();
  const {
    isFetching: isInstancesFetching,
    data: instancesResponse,
    error,
    refetch,
  } = useFetchPurchasedInstances();

  const instances = instancesResponse?.data || [];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const columns = [
    {
      key: 'id',
      header: 'ID',
    },
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'status',
      header: 'Status',
    },
    {
      key: 'region',
      header: 'Region',
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 
          className="w-12 animate-spin" 
          style={{ color: designTokens.colors.primary[500] }}
        />
      </div>
    );
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Instances
              </h1>
              <p 
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Manage your instances.
              </p>
            </div>
            <ModernButton
              onClick={() => navigate("/admin-dashboard/multi-instance-creation")}
              className="flex items-center gap-2"
            >
              <Plus size={18} />
              Create Instance
            </ModernButton>
          </div>

          <ModernCard>
            <ModernTable
              title="Instances"
              data={instances}
              columns={columns}
              loading={isInstancesFetching}
              emptyMessage="No instances found."
            />
          </ModernCard>

        </div>
      </main>
    </>
  );
}