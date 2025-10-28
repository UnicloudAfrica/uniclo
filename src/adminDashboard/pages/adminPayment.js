import React, { useState } from "react";
import {
  Download,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Shield,
} from "lucide-react";
import jsPDF from "jspdf";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import AdminActiveTab from "../components/adminActiveTab";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernButton from "../components/ModernButton";
import { designTokens } from "../../styles/designTokens";

export default function AdminPayment() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const data = [
    {
      id: 1,
      date: "Dec 12, 2024",
      module: "Z2 Compute Instances",
      plan: "Business Tier",
      amount: "₦180,000.00",
      paymentMethod: "Paystack (Visa)",
      status: "Completed",
      receiptId: "RCP-001-2024",
    },
    {
      id: 2,
      date: "Dec 11, 2024",
      module: "Z4 Compute Instances",
      plan: "100GB Tier",
      amount: "₦250,000.00",
      paymentMethod: "Stripe (Mastercard)",
      status: "Completed",
      receiptId: "RCP-002-2024",
    },
    {
      id: 3,
      date: "Dec 10, 2024",
      module: "Z8 Compute Instances",
      plan: "Premium Tier",
      amount: "₦420,000.00",
      paymentMethod: "Flutterwave (Verve)",
      status: "Processing",
      receiptId: "RCP-003-2024",
    },
    {
      id: 4,
      date: "Dec 09, 2024",
      module: "Shared Storage",
      plan: "Business Tier",
      amount: "₦85,000.00",
      paymentMethod: "Paystack (Visa)",
      status: "Failed",
      receiptId: "RCP-004-2024",
    },
    {
      id: 5,
      date: "Dec 08, 2024",
      module: "Database Services",
      plan: "Professional",
      amount: "₦320,000.00",
      paymentMethod: "Stripe (Visa)",
      status: "Completed",
      receiptId: "RCP-005-2024",
    },
  ];

  const totalRevenue = data.reduce((sum, payment) => {
    const amount = parseFloat(payment.amount.replace(/[₦,]/g, ""));
    return sum + (payment.status === "Completed" ? amount : 0);
  }, 0);

  const completedPayments = data.filter((p) => p.status === "Completed").length;
  const processingPayments = data.filter(
    (p) => p.status === "Processing"
  ).length;
  const failedPayments = data.filter((p) => p.status === "Failed").length;

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar
            size={16}
            style={{ color: designTokens.colors.neutral[500] }}
          />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "module",
      header: "Service",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Shield
            size={16}
            style={{ color: designTokens.colors.primary[500] }}
          />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
    },
    {
      key: "amount",
      header: "Amount",
      render: (value) => (
        <div className="flex items-center gap-2">
          <DollarSign
            size={16}
            style={{ color: designTokens.colors.success[500] }}
          />
          <span
            className="font-semibold"
            style={{ color: designTokens.colors.success[700] }}
          >
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      render: (value) => (
        <div className="flex items-center gap-2">
          <CreditCard
            size={16}
            style={{ color: designTokens.colors.neutral[500] }}
          />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => {
        const statusConfig = {
          Completed: {
            bg: designTokens.colors.success[50],
            text: designTokens.colors.success[700],
            border: designTokens.colors.success[200],
          },
          Processing: {
            bg: designTokens.colors.warning[50],
            text: designTokens.colors.warning[700],
            border: designTokens.colors.warning[200],
          },
          Failed: {
            bg: designTokens.colors.error[50],
            text: designTokens.colors.error[700],
            border: designTokens.colors.error[200],
          },
        };
        const config = statusConfig[value] || statusConfig["Processing"];

        return (
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: config.bg,
              color: config.text,
              border: `1px solid ${config.border}`,
            }}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "receiptId",
      header: "Receipt ID",
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText
            size={16}
            style={{ color: designTokens.colors.neutral[500] }}
          />
          <span className="font-mono text-sm">{value}</span>
        </div>
      ),
    },
  ];

  const actions = [
    {
      icon: <Download size={16} />,
      label: "",
      onClick: (item) => downloadReceipt(item, { preventDefault: () => { } }),
    },
  ];

  const generatePDFReceipt = async (item) => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(24);
    doc.setTextColor(40, 141, 209);
    doc.text("UniCloud Africa", 20, 30);
    doc.setFontSize(16);
    doc.setTextColor(85, 85, 85);
    doc.text("Payment Receipt", 20, 45);
    doc.setDrawColor(40, 141, 209);
    doc.setLineWidth(1);
    doc.line(20, 50, 190, 50);
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);

    const details = [
      { label: "Receipt ID:", value: item.receiptId },
      { label: "Date:", value: item.date },
      { label: "Payment Method:", value: item.paymentMethod },
      { label: "Status:", value: item.status },
    ];

    let yPos = 70;
    details.forEach((detail) => {
      doc.setFont("helvetica", "bold");
      doc.text(detail.label, 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(detail.value, 80, yPos);
      yPos += 15;
    });

    yPos += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Service Details", 20, yPos);

    yPos += 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Service", 20, yPos);
    doc.text("Plan", 80, yPos);
    doc.text("Amount", 140, yPos);

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);

    yPos += 15;
    doc.setFont("helvetica", "normal");
    doc.text(item.module, 20, yPos);
    doc.text(item.plan, 80, yPos);
    doc.text(item.amount, 140, yPos);

    yPos += 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);

    yPos += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Total Amount:", 20, yPos);
    doc.setTextColor(40, 141, 209);
    doc.text(item.amount, 140, yPos);

    doc.save(`Receipt-${item.receiptId}.pdf`);
  };

  const downloadReceipt = async (item, event) => {
    event.preventDefault();
    try {
      await generatePDFReceipt(item);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleExportSummary = () => {
    const csvContent = [
      ["Date", "Service", "Plan", "Amount", "Status", "Payment Method", "Receipt"].join(","),
      ...data.map((item) =>
        [item.date, item.module, item.plan, item.amount, item.status, item.paymentMethod, item.receiptId].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "payment-summary.csv";
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const headerActions = (
    <ModernButton
      variant="outline"
      className="flex items-center gap-2"
      onClick={handleExportSummary}
    >
      <Download size={16} />
      Export Summary
    </ModernButton>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <AdminPageShell
        title="Payment Management"
        description="Monitor and manage all payment transactions."
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stats-cards-stagger">
          <ModernStatsCard
            title="Total Revenue"
            value={`₦${totalRevenue.toLocaleString()}`}
            icon={<DollarSign width={20} height={20} />}
            change={15}
            trend="up"
            color="primary"
            description="This month"
            animateOnMount
            staggerDelay={0}
          />
          <ModernStatsCard
            title="Completed Payments"
            value={completedPayments}
            icon={<CreditCard width={20} height={20} />}
            change={8}
            trend="up"
            color="primary"
            description="Successfully processed"
            animateOnMount
            staggerDelay={150}
          />
          <ModernStatsCard
            title="Processing"
            value={processingPayments}
            icon={<TrendingUp width={20} height={20} />}
            color="primary"
            description="Pending transactions"
            animateOnMount
            staggerDelay={300}
          />
          <ModernStatsCard
            title="Failed Payments"
            value={failedPayments}
            icon={<FileText width={20} height={20} />}
            color="primary"
            description="Requires attention"
            animateOnMount
            staggerDelay={450}
          />
        </div>

        <ModernCard>
          <ModernTable
            title="Payment Transactions"
            data={data}
            columns={columns}
            actions={actions}
            searchable
            filterable
            exportable
            sortable
            loading={false}
            emptyMessage="No payment transactions found"
            enableAnimations
          />
        </ModernCard>
      </AdminPageShell>
    </>
  );
}
