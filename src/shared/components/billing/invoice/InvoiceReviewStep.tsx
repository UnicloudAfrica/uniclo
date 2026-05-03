/**
 * InvoiceReviewStep — Composite step that merges the read-only summary
 * (line items + totals + active discount) with the final-review panel
 * (assignment summary + optional lead capture).
 *
 * Replaces the prior two-step "Summary → Review" flow with a single
 * checkout-style screen so admins see everything before submitting.
 *
 * Both child components are still exported individually because they
 * are reused outside this wizard (multi-quote pages, tenant-side
 * pricing calculator). Keep them as building blocks; this wrapper
 * just composes.
 */
import React from "react";
import { FileText, Receipt } from "lucide-react";
import InvoiceSummaryStep from "./InvoiceSummaryStep";
import InvoiceFinalReviewStep from "./InvoiceFinalReviewStep";
import {
  AssignmentDetails,
  InvoiceFormData,
  ObjectStorageRequest,
  PricingRequest,
  QuoteInvoiceIntent,
  UpdateInvoiceFormData,
} from "../types";

interface InvoiceReviewStepProps {
  formData: InvoiceFormData;
  errors: Record<string, string | null>;
  updateFormData: UpdateInvoiceFormData;
  pricingRequests: PricingRequest[];
  objectStorageRequests: ObjectStorageRequest[];
  tenants: unknown;
  assignmentDetails: AssignmentDetails;
  mode?: "admin" | "tenant" | "client";
}

const InvoiceReviewStep: React.FC<InvoiceReviewStepProps> = ({
  formData,
  errors,
  updateFormData,
  pricingRequests,
  objectStorageRequests,
  tenants,
  assignmentDetails,
  mode = "admin",
}) => {
  const intent: QuoteInvoiceIntent = formData.intent ?? "invoice";
  const setIntent = (next: QuoteInvoiceIntent) => updateFormData("intent", next);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Review &amp; Submit</h3>
        <p className="text-sm text-slate-500">
          Verify all line items, totals, and recipient details before submitting the invoice.
        </p>
      </div>

      {/* Save-as toggle: Quote vs Invoice. The wizard's primary CTA reads
          the chosen value and posts it as `intent` to the multi-quotes
          endpoint — quotes persist with `status="quote"` and don't burn
          an invoice number. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">Save as</h4>
        <p className="mt-0.5 text-xs text-slate-500">
          Quotes can be reviewed by the customer and converted to an invoice
          later. Invoices are immediately payable.
        </p>
        <div
          className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
          role="radiogroup"
          aria-label="Save as quote or invoice"
        >
          <button
            type="button"
            role="radio"
            aria-checked={intent === "invoice"}
            onClick={() => setIntent("invoice")}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
              intent === "invoice"
                ? "border-primary-500 bg-primary-50/60 ring-1 ring-primary-500"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <Receipt className="mt-0.5 h-5 w-5 text-primary-600" />
            <div>
              <div className="text-sm font-medium text-slate-900">
                Generate Invoice
              </div>
              <div className="text-xs text-slate-500">
                Issue a payable invoice (default).
              </div>
            </div>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={intent === "quote"}
            onClick={() => setIntent("quote")}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
              intent === "quote"
                ? "border-primary-500 bg-primary-50/60 ring-1 ring-primary-500"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <FileText className="mt-0.5 h-5 w-5 text-primary-600" />
            <div>
              <div className="text-sm font-medium text-slate-900">
                Save as Quote
              </div>
              <div className="text-xs text-slate-500">
                Send a quote first; convert to invoice when accepted.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Top: Line items + totals + active discount */}
      <InvoiceSummaryStep
        pricingRequests={pricingRequests}
        objectStorageRequests={objectStorageRequests}
        formData={formData}
      />

      {/* Bottom: Assignment recap + optional lead-capture */}
      <InvoiceFinalReviewStep
        formData={formData}
        pricingRequests={pricingRequests}
        objectStorageRequests={objectStorageRequests}
        tenants={tenants}
        updateFormData={updateFormData}
        errors={errors}
        assignmentDetails={assignmentDetails}
        mode={mode}
      />
    </div>
  );
};

export default InvoiceReviewStep;
