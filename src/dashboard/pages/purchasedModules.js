import React from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import { Settings2 } from "lucide-react";
import useAuthRedirect from "../../utils/authRedirect";
import { useFetchPurchasedInstances } from "../../hooks/instancesHook";
import { ModernTable } from "../../shared/components";

export default function PurchasedModules() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isLoading } = useAuthRedirect();

  const { data: fetchedInstances = { data: [], meta: {} }, isFetching: isInstancesFetching } =
    useFetchPurchasedInstances();

  const instances = fetchedInstances.data;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const columns = [
    {
      key: "name",
      header: "Instance Name",
      render: (val) => <span className="text-[#575758]">{val || "N/A"}</span>,
    },
    {
      key: "storage_size_gb",
      header: "Disk Size",
      render: (val) => <span className="text-[#575758]">{val ? `${val} GiB` : "N/A"}</span>,
    },
    {
      key: "os_image",
      header: "OS Image",
      render: (_, item) => <span className="text-[#575758]">{item.os_image?.name || "N/A"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (val) => {
        const baseClass =
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize";
        let styleClass = "";
        switch (val) {
          case "Running":
            styleClass = "bg-green-100 text-green-800";
            break;
          case "Stopped":
            styleClass = "bg-red-100 text-red-800";
            break;
          case "spawning":
            styleClass = "bg-blue-100 text-blue-800";
            break;
          case "payment_pending":
            styleClass = "bg-orange-100 text-orange-800";
            break;
          default:
            styleClass = "bg-gray-100 text-gray-600";
        }
        return <span className={`${baseClass} ${styleClass}`}>{val?.replace(/_/g, " ")}</span>;
      },
    },
    {
      key: "created_at",
      header: "Creation Date",
      render: (val) => <span className="text-[#575758]">{formatDate(val)}</span>,
    },
  ];

  const tableData = instances.map((item) => ({ ...item, id: item.id }));

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ActiveTab />
      <main className="dashboard-content-shell p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-medium text-[#1C1C1C]">Purchased Instances History</h2>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        <ModernTable
          data={tableData}
          columns={columns}
          loading={isInstancesFetching}
          searchable={true}
          searchPlaceholder="Search instances..."
          searchKeys={["name", "status"]}
          paginated={true}
          pageSize={10}
          filterable={false}
          exportable={false}
          emptyMessage="No purchased instances found."
        />
      </main>
    </>
  );
}
