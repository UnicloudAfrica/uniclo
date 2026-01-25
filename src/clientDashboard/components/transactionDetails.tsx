// @ts-nocheck
import { useState } from "react";
import { X, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "./assets/logo.png"; // Replace with your logo path
import useClientTheme from "../../hooks/clientHooks/useClientTheme";
import { hexToRgbArray, resolvePdfLogo } from "../../utils/pdfBranding";

const DetailedTransaction = ({ selectedItem, isModalOpen, closeModal }: any) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const { data: theme } = useClientTheme();
  const companyName = theme?.company?.name || "Your Company";
  const supportEmail = theme?.company?.support_email || theme?.company?.email || "";
  const supportPhone = theme?.company?.support_phone || theme?.company?.phone || "";
  const supportLine = [supportEmail, supportPhone].filter(Boolean).join(" | ");
  const brandLogoSrc = theme?.businessLogoHref || logo;
  const primaryColor = hexToRgbArray(theme?.themeColor, [40, 141, 209]);
  const secondaryColor = hexToRgbArray(theme?.secondaryColor, [102, 102, 102]);
  const textColor = [51, 51, 51];

  const StatusBadge = ({ status }: any) => {
    const baseClass =
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ";
    const statusStyles = {
      successful: "bg-[#00BF6B14] text-[#00BF6B]",
      failed: "bg-[#EB417833] text-[#EB4178]",
      pending: "bg-[#F5A62333] text-[#F5A623]",
    };
    const styleClass = statusStyles[status.toLowerCase()] || "bg-gray-100 text-gray-600";
    return <span className={`${baseClass} ${styleClass}`}>{status}</span>;
  };

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generatePDFReceipt = async () => {
    if (!selectedItem) return;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set default font and colors
      doc.setFont("helvetica", "normal");

      // Add Logo (71px × 54px ≈ 18.78mm × 14.25mm)
      const logoAsset = await resolvePdfLogo(brandLogoSrc, logo);
      if (logoAsset) {
        doc.addImage(logoAsset.dataUrl, logoAsset.format, 20, 10, 18.78, 14.25);
      }

      // Header
      doc.setFontSize(22);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text(companyName, 20, 35);

      doc.setFontSize(14);
      doc.setTextColor(...secondaryColor);
      doc.text("Payment Receipt", 20, 43);

      // Separator Line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, 48, 190, 48);

      // Transaction Details
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      const details = [
        { label: "Transaction ID", value: selectedItem.identifier },
        { label: "Date", value: formatDate(selectedItem.updated_at) },
        { label: "Description", value: selectedItem.description },
        { label: "Payment Method", value: selectedItem.payment_gateway },
        { label: "Status", value: selectedItem.status },
        { label: "Amount", value: `₦${selectedItem.amount.toLocaleString()}` },
      ];

      let yPos = 58;
      details.forEach((detail: any) => {
        doc.setFont("helvetica", "bold");
        doc.text(detail.label, 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(detail.value, 70, yPos);
        yPos += 8;
      });

      // Purchased Items Table
      yPos += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Purchased Items", 20, yPos);

      const tableData = selectedItem.metadata.lines.map((line: any) => [
        line.type,
        line.qty.toString(),
        `₦${parseFloat(line.unit_price_usd).toLocaleString()}`,
        `₦${line.line_amount_usd.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: yPos + 5,
        head: [["Item", "Quantity", "Unit Price", "Total"]],
        body: tableData,
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 10,
          textColor: textColor,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 },
        },
      });

      // Total Amount
      yPos = doc.lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...textColor);
      doc.text("Total Amount:", 20, yPos);
      doc.setTextColor(...primaryColor);
      doc.text(`₦${selectedItem.amount.toLocaleString()}`, 140, yPos);

      // Footer
      yPos += 20;
      doc.setFontSize(9);
      doc.setTextColor(...secondaryColor);
      doc.setFont("helvetica", "normal");
      doc.text("Thank you for your business!", 20, yPos);
      doc.text(companyName, 20, yPos + 10);
      if (supportLine) {
        doc.text(supportLine, 20, yPos + 15);
      }

      // Save PDF
      doc.save(`Receipt-${selectedItem.identifier}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setDownloadError("Failed to generate receipt. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadReceipt = async (event) => {
    event.preventDefault();
    await generatePDFReceipt();
  };

  return (
    <>
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] p-4 font-Outfit">
          <div className="bg-white rounded-[30px] shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#F2F2F2] border-b rounded-t-[30px] border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#575758]">Transaction ID:</span>
                <span className="text-sm text-[#575758]">{selectedItem.identifier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#575758]">Date:</span>
                <span className="text-sm text-[#575758]">
                  {formatDate(selectedItem.updated_at)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#575758]">Description:</span>
                <span className="text-sm text-[#575758]">{selectedItem.description}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#575758]">Amount:</span>
                <span className="text-sm text-[#575758]">
                  ₦{selectedItem.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#575758]">Payment Method:</span>
                <span className="text-sm text-[#575758]">{selectedItem.payment_gateway}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#575758]">Status:</span>
                <StatusBadge status={selectedItem.status} />
              </div>
              <div className="pt-4 border-t border-[#E8E6EA]">
                <span className="text-sm font-medium text-[#575758]">Purchased Items:</span>
                <div className="mt-2 space-y-2">
                  {selectedItem.metadata.lines.map((line, index) => (
                    <div key={index} className="text-sm text-[#575758]">
                      <div className="flex justify-between">
                        <span>{line.type}</span>
                        <span>Qty: {line.qty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit Price: ₦{parseFloat(line.unit_price)?.toLocaleString()}</span>
                        <span>Total: ₦{line.line_amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {downloadError && (
                <div className="text-sm text-red-600 text-center">{downloadError}</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 border-t rounded-b-[24px]">
              <button
                onClick={closeModal}
                className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                disabled={isDownloading}
              >
                Close
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors flex items-center justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDownloading}
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailedTransaction;
