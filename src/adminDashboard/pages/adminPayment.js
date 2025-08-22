import React, { useState } from "react";
import { Settings2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import jsPDF from "jspdf";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";

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

  // Empty data array to show "No data found"
  const data = [];
  /*
  // Original data for reference if needed later
  const data = [
    {
      id: 1,
      date: "May 13, 2025",
      module: "Z2 Compute Instances",
      plan: "Business Tier",
      amount: "₦38M",
      paymentMethod: "Paystack (Visa)",
      status: "Active",
      receiptId: "RCP-001-2025",
    },
    {
      id: 2,
      date: "May 13, 2025",
      module: "Z4 Compute Instances",
      plan: "100GB Tier",
      amount: "₦100,000.00",
      paymentMethod: "Stripe (Mastercard)",
      status: "Inactive",
      receiptId: "RCP-002-2025",
    },
    {
      id: 3,
      date: "May 13, 2025",
      module: "Z8 Compute Instances",
      plan: "Business Tier",
      amount: "₦100,000.00",
      paymentMethod: "Flutterwave (Verve)",
      status: "Inactive",
      receiptId: "RCP-003-2025",
    },
    {
      id: 4,
      date: "May 13, 2025",
      module: "Shared Storage",
      plan: "Business Tier",
      amount: "₦100,000.00",
      paymentMethod: "Stripe",
      status: "Inactive",
      receiptId: "RCP-004-2025",
    },
    {
      id: 5,
      date: "May 13, 2025",
      module: "Z4 Compute Instances",
      plan: "100GB Tier",
      amount: "₦100,000.00",
      paymentMethod: "Flutterwave (Verve)",
      status: "Inactive",
      receiptId: "RCP-005-2025",
    },
    {
      id: 6,
      date: "May 13, 2025",
      module: "Z4 Compute Instances",
      plan: "Business Tier",
      amount: "₦100,000.00",
      paymentMethod: "Flutterwave (Verve)",
      status: "Inactive",
      receiptId: "RCP-006-2025",
    },
    {
      id: 7,
      date: "May 13, 2025",
      module: "Z4 Compute Instances",
      plan: "Business Tier",
      amount: "₦38M",
      paymentMethod: "Flutterwave (Verve)",
      status: "Inactive",
      receiptId: "RCP-007-2025",
    },
    {
      id: 8,
      date: "May 13, 2025",
      module: "Z4 Compute Instances",
      plan: "100GB Tier",
      amount: "₦38M",
      paymentMethod: "Paystack (Visa)",
      status: "Inactive",
      receiptId: "RCP-008-2025",
    },
    {
      id: 9,
      date: "May 13, 2025",
      module: "Z4 Compute Instances",
      plan: "Business Tier",
      amount: "₦38M",
      paymentMethod: "Paystack (Visa)",
      status: "Inactive",
      receiptId: "RCP-009-2025",
    },
    {
      id: 10,
      date: "May 13, 2025",
      module: "Z4 Compute Instances",
      plan: "Business Tier",
      amount: "₦38M",
      paymentMethod: "Paystack (Visa)",
      status: "Inactive",
      receiptId: "RCP-010-2025",
    },
  ];
  */

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const currentData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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

  const StatusBadge = ({ status }) => {
    const isActive = status === "Active";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          isActive
            ? "bg-[#00BF6B14] text-[#00BF6B]"
            : "bg-[#EB417833] text-[#EB4178]"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main className=" absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%]  bg-[#FAFAFA]  min-h-full p-6 md:p-8">
        <div className="flex items-center justify-between ">
          <h2 className="text-base font-medium text-[#1C1C1C]">Payment</h2>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-[12px] mt-6 border border-gray-200">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  MODULE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  PLAN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  AMOUNT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  PAYMENT METHOD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  RECEIPT
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E8E6EA]">
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.module}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => downloadReceipt(item, e)}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No payment data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-6">
          {currentData.length > 0 ? (
            currentData.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E8E6EA] rounded-[8px] p-4 mb-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[#1C1C1C]">
                    {item.module}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#555E67]">Date:</span>
                    <span className="text-[#575758]">{item.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#555E67]">Plan:</span>
                    <span className="text-[#575758]">{item.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#555E67]">Amount:</span>
                    <span className="text-[#575758]">{item.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#555E67]">
                      Payment Method:
                    </span>
                    <span className="text-[#575758]">{item.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E8E6EA]">
                    <span className="font-medium text-[#555E67]">Receipt:</span>
                    <button
                      onClick={(e) => downloadReceipt(item, e)}
                      className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[8px] shadow-sm p-4 text-center text-gray-500">
              No payment data found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {data.length > 0 && ( // Only show pagination if there's data
          <div className="flex items-center justify-center px-4 py-3 mt-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNumber
                          ? "bg-[#288DD1] text-white"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <span className="text-sm text-gray-700">of</span>

              <button
                onClick={() => handlePageChange(totalPages)}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? "bg-[#288DD1] text-white"
                    : "text-gray-700 bg-white border border-[#333333] hover:bg-gray-50"
                }`}
              >
                {totalPages}
              </button>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
