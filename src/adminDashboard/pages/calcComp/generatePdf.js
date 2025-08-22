import React from "react";
import jsPDF from "jspdf";

const formatPrice = (amount, currencyCode) => {
  if (typeof amount !== "number") {
    amount = parseFloat(amount);
  }
  if (isNaN(amount)) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: "symbol",
  }).format(amount);
};

const GeneratePDF = ({ pricingSummary }) => {
  const generatePDF = () => {
    if (!pricingSummary) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("Cloud Solution Summary", 20, 20);
    doc.setFont("helvetica", "normal");
    let y = 30;
    pricingSummary.lines.forEach((line) => {
      doc.text(
        `${line.name}: ${line.quantity} x ${formatPrice(
          line.unit_local,
          line.currency
        )}`,
        20,
        y
      );
      y += 10;
    });
    y += 10;
    doc.text(
      `Subtotal: ${formatPrice(
        pricingSummary.subtotal,
        pricingSummary.currency
      )}`,
      20,
      y
    );
    y += 10;
    doc.text(
      `Tax: ${formatPrice(pricingSummary.tax, pricingSummary.currency)}`,
      20,
      y
    );
    if (pricingSummary.discount > 0) {
      y += 10;
      doc.text(
        `Discount (10%): -${formatPrice(
          pricingSummary.discount,
          pricingSummary.currency
        )}`,
        20,
        y
      );
    }
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total: ${formatPrice(pricingSummary.total, pricingSummary.currency)}`,
      20,
      y
    );
    doc.save("cloud_solution_summary.pdf");
  };

  return (
    <button
      onClick={generatePDF}
      className="px-4 py-2 rounded-md text-white bg-[#288DD1] hover:bg-[#1976D2]"
    >
      Download PDF
    </button>
  );
};

export default GeneratePDF;
