import React from "react";
import { Download, CheckCircle } from "lucide-react";

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm font-medium text-gray-600">{label}:</span>
    <span className="text-sm text-gray-900 text-right">{value || "N/A"}</span>
  </div>
);

const formatCurrency = (amount, currency) => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "NGN",
  }).format(amount / 100); // Assuming amount is in kobo/cents
};

const downloadPdf = (base64String, filename) => {
  const byteCharacters = atob(base64String);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const QuoteBreakdownStep = ({ apiResponse }) => {
  if (!apiResponse || !apiResponse.invoices) {
    return (
      <div className="text-center text-gray-500">
        No quote details to display.
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w">
      <div className="text-">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">
          Quote Created Successfully
        </h3>
        <p className="text-gray-500 mt-2">
          Below is the summary of the generated quote. You can download the PDF
          for your records.
        </p>
      </div>

      {apiResponse.invoices.map((invoice, index) => (
        <div
          key={invoice.invoice_number}
          className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-xl font-semibold text-gray-800">
                {invoice.subject}
              </h4>
              <p className="text-sm text-gray-500">
                Invoice #: {invoice.invoice_number}
              </p>
            </div>
            <button
              onClick={() =>
                downloadPdf(invoice.pdf_base64, invoice.pdf_filename)
              }
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold mb-2">Bill To:</h5>
              <div className="flex flex-wrap items-center gap-x-2">
                <p className="font-medium">{invoice.bill_to.name}</p>
                <p className="text-sm text-gray-500">
                  ({invoice.bill_to.email})
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold mb-2">Dates:</h5>
              <p>
                <strong>Issued:</strong>{" "}
                {new Date(invoice.issued_at).toLocaleDateString()}
              </p>
              <p>
                <strong>Due:</strong>{" "}
                {new Date(invoice.due_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <h5 className="font-semibold mb-2">Line Items:</h5>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {formatCurrency(item.unit_amount, item.currency)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(item.total, item.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <DetailRow
                label="Subtotal"
                value={formatCurrency(
                  invoice.amounts.subtotal,
                  invoice.amounts.currency
                )}
              />
              <DetailRow
                label="Tax"
                value={formatCurrency(
                  invoice.amounts.tax,
                  invoice.amounts.currency
                )}
              />
              <div className="border-t pt-2">
                <DetailRow
                  label="Total"
                  value={formatCurrency(
                    invoice.amounts.total,
                    invoice.amounts.currency
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuoteBreakdownStep;
