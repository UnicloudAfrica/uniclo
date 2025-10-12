import React, { useState } from "react";
import { Download, CreditCard, Calendar, DollarSign, TrendingUp, FileText, Shield } from "lucide-react";
import jsPDF from "jspdf";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernButton from "../components/ModernButton";
import { designTokens } from "../../styles/designTokens";

export default function AdminPayment() {
  // State to control mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Sample payment data
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
    }
  ];

  // Calculate payment statistics
  const totalRevenue = data.reduce((sum, payment) => {
    const amount = parseFloat(payment.amount.replace(/[₦,]/g, ''));
    return sum + (payment.status === 'Completed' ? amount : 0);
  }, 0);

  const completedPayments = data.filter(p => p.status === 'Completed').length;
  const processingPayments = data.filter(p => p.status === 'Processing').length;
  const failedPayments = data.filter(p => p.status === 'Failed').length;

  // Define columns for ModernTable
  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: designTokens.colors.neutral[500] }} />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'module',
      header: 'Service',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'plan',
      header: 'Plan'
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => (
        <div className="flex items-center gap-2">
          <DollarSign size={16} style={{ color: designTokens.colors.success[500] }} />
          <span className="font-semibold" style={{ color: designTokens.colors.success[700] }}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      render: (value) => (
        <div className="flex items-center gap-2">
          <CreditCard size={16} style={{ color: designTokens.colors.neutral[500] }} />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const statusConfig = {
          'Completed': {
            bg: designTokens.colors.success[50],
            text: designTokens.colors.success[700],
            border: designTokens.colors.success[200]
          },
          'Processing': {
            bg: designTokens.colors.warning[50],
            text: designTokens.colors.warning[700],
            border: designTokens.colors.warning[200]
          },
          'Failed': {
            bg: designTokens.colors.error[50],
            text: designTokens.colors.error[700],
            border: designTokens.colors.error[200]
          }
        };
        const config = statusConfig[value] || statusConfig['Processing'];
        
        return (
          <span 
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: config.bg,
              color: config.text,
              border: `1px solid ${config.border}`
            }}
          >
            {value}
          </span>
        );
      }
    },
    {
      key: 'receiptId',
      header: 'Receipt ID',
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: designTokens.colors.neutral[500] }} />
          <span className="font-mono text-sm">{value}</span>
        </div>
      )
    }
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Download size={16} />,
      label: '',
      onClick: (item) => downloadReceipt(item, { preventDefault: () => {} })
    }
  ];

  const generatePDFReceipt = async (item) => {
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");

    // Header - Company Name
    doc.setFontSize(24);
    doc.setTextColor(40, 141, 209); // #288DD1
    doc.text("UniCloud Africa", 20, 30);

    // Receipt Title
    doc.setFontSize(16);
    doc.setTextColor(85, 85, 85);
    doc.text("Payment Receipt", 20, 45);

    // Line separator
    doc.setDrawColor(40, 141, 209);
    doc.setLineWidth(1);
    doc.line(20, 50, 190, 50);

    // Receipt Details
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

    // Service Details Header
    yPos += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Service Details", 20, yPos);

    // Service table
    yPos += 20;
    doc.setFontSize(12);

    // Table headers
    doc.setFont("helvetica", "bold");
    doc.text("Service", 20, yPos);
    doc.text("Plan", 80, yPos);
    doc.text("Amount", 140, yPos);

    // Table line
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);

    // Table data
    yPos += 15;
    doc.setFont("helvetica", "normal");
    doc.text(item.module, 20, yPos);
    doc.text(item.plan, 80, yPos);
    doc.text(item.amount, 140, yPos);

    // Total section
    yPos += 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);

    yPos += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Total Amount:", 20, yPos);
    doc.setTextColor(40, 141, 209);
    doc.text(item.amount, 140, yPos);

    // Footer
    yPos += 40;
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business!", 20, yPos);

    yPos += 15;
    doc.text("UniCloud Africa - Cloud Computing Solutions", 20, yPos);
    doc.text("support@unicloudafrica.com | +234-xxx-xxx-xxxx", 20, yPos + 10);

    // Save the PDF
    doc.save(`Receipt-${item.receiptId}.pdf`);
  };

  const downloadReceipt = async (item, event) => {
    event.preventDefault();
    try {
      await generatePDFReceipt(item);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Fallback to simple alert
      //   alert("PDF generation temporarily unavailable. Please try again later.");
    }
  };

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
                Payment Management
              </h1>
              <p 
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Monitor and manage all payment transactions
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Revenue"
              value={`₦${totalRevenue.toLocaleString()}`}
              icon={<DollarSign size={24} />}
              change={15}
              trend="up"
              color="success"
              description="This month"
            />
            <ModernStatsCard
              title="Completed Payments"
              value={completedPayments}
              icon={<CreditCard size={24} />}
              change={8}
              trend="up"
              color="primary"
              description="Successfully processed"
            />
            <ModernStatsCard
              title="Processing"
              value={processingPayments}
              icon={<TrendingUp size={24} />}
              color="warning"
              description="Pending transactions"
            />
            <ModernStatsCard
              title="Failed Payments"
              value={failedPayments}
              icon={<FileText size={24} />}
              color="error"
              description="Requires attention"
            />
          </div>

          {/* Payment Transactions Table */}
          <ModernCard>
            <ModernTable
              title="Payment Transactions"
              data={data}
              columns={columns}
              actions={actions}
              searchable={true}
              filterable={true}
              exportable={true}
              sortable={true}
              loading={false}
              emptyMessage="No payment transactions found"
            />
          </ModernCard>
        </div>
      </main>
    </>
  );
}
