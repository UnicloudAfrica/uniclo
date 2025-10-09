import React from "react";
import { FileText, Download, User, Building, Phone, Mail, MapPin } from "lucide-react";

const QuoteFinalReviewStep = ({ 
  formData, 
  pricingRequests, 
  tenants,
  updateFormData,
  errors = {}
}) => {
  const selectedTenant = tenants?.find(
    (t) => tenants && String(t.id) === String(formData.tenant_id)
  );

  const inputClass = "block w-full rounded-md border-gray-300 focus:border-[#288DD1] focus:ring-[#288DD1] sm:text-sm input-field";

  const DetailRow = ({ label, value, valueClass = "" }) => (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className={`text-sm text-gray-900 text-right ${valueClass}`}>{value || "N/A"}</span>
    </div>
  );

  const calculateTotalItems = () => {
    return pricingRequests.reduce((total, req) => total + (req.number_of_instances || 1), 0);
  };

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Final Review & Invoice Options</h3>
        <p className="text-sm text-gray-500 mt-1">
          Review all details and provide lead information before generating the quote.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quote Summary */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Quote Summary
          </h4>
          <div className="space-y-2">
            <DetailRow label="Subject" value={formData.subject} />
            {selectedTenant && (
              <DetailRow label="Tenant" value={selectedTenant.name} />
            )}
            <DetailRow label="Primary Email" value={formData.email} />
            <DetailRow label="Bill To" value={formData.bill_to_name} />
            {formData.emails && (
              <DetailRow label="CC Emails" value={formData.emails} />
            )}
            <DetailRow label="Total Items" value={calculateTotalItems()} valueClass="font-semibold" />
            
            {/* Discount Information */}
            {formData.apply_total_discount && formData.total_discount_value && (
              <>
                <DetailRow 
                  label="Total Discount Type" 
                  value={formData.total_discount_type === 'percent' ? 'Percentage' : 'Fixed Amount'} 
                />
                <DetailRow 
                  label="Discount Value" 
                  value={`${formData.total_discount_value}${formData.total_discount_type === 'percent' ? '%' : ''}`}
                  valueClass="font-semibold text-green-600"
                />
                {formData.total_discount_label && (
                  <DetailRow label="Discount Label" value={formData.total_discount_label} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Lead Information Collection */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Lead Information
          </h4>
          
          {/* Create Lead Checkbox */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_lead"
                checked={formData.create_lead || false}
                onChange={(e) => updateFormData("create_lead", e.target.checked)}
                className="rounded border-gray-300 text-[#288DD1] focus:ring-[#288DD1]"
              />
              <label htmlFor="create_lead" className="text-sm font-medium text-gray-700">
                Create lead for tracking and follow-up
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This will help track the quote request in the leads system for future follow-ups.
            </p>
          </div>

          {/* Lead Form Fields */}
          {formData.create_lead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    First Name*
                  </label>
                  <input
                    type="text"
                    value={formData.lead_first_name || ""}
                    onChange={(e) => updateFormData("lead_first_name", e.target.value)}
                    className={`${inputClass} ${errors.lead_first_name ? "border-red-500" : ""}`}
                    placeholder="John"
                    required
                  />
                  {errors.lead_first_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.lead_first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name*
                  </label>
                  <input
                    type="text"
                    value={formData.lead_last_name || ""}
                    onChange={(e) => updateFormData("lead_last_name", e.target.value)}
                    className={`${inputClass} ${errors.lead_last_name ? "border-red-500" : ""}`}
                    placeholder="Doe"
                    required
                  />
                  {errors.lead_last_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.lead_last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Contact Email*
                </label>
                <input
                  type="email"
                  value={formData.lead_email || formData.email}
                  onChange={(e) => updateFormData("lead_email", e.target.value)}
                  className={`${inputClass} ${errors.lead_email ? "border-red-500" : ""}`}
                  placeholder="john.doe@company.com"
                  required
                />
                {errors.lead_email && (
                  <p className="text-red-500 text-xs mt-1">{errors.lead_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.lead_phone || ""}
                  onChange={(e) => updateFormData("lead_phone", e.target.value)}
                  className={inputClass}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  Company
                </label>
                <input
                  type="text"
                  value={formData.lead_company || ""}
                  onChange={(e) => updateFormData("lead_company", e.target.value)}
                  className={inputClass}
                  placeholder="Company Name Ltd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Country Code
                </label>
                <input
                  type="text"
                  maxLength="3"
                  value={formData.lead_country || ""}
                  onChange={(e) => updateFormData("lead_country", e.target.value.toUpperCase())}
                  className={inputClass}
                  placeholder="USA"
                />
                <p className="text-xs text-gray-500 mt-1">
                  3-letter country code (e.g., USA, GBR, DEU)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Options */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Invoice Generation Options
        </h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-2">After submission, you will be able to:</h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-green-500" />
                Generate professional PDF quote
              </li>
              <li className="flex items-center">
                <Download className="w-4 h-4 mr-2 text-blue-500" />
                Download invoice immediately
              </li>
              <li className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-purple-500" />
                Email quote to specified recipients
              </li>
              {formData.create_lead && (
                <li className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-orange-500" />
                  Track lead in CRM system
                </li>
              )}
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded border">
            <h5 className="font-medium text-gray-700 mb-2">Quote Details:</h5>
            <div className="space-y-1 text-sm">
              <div>Items: {pricingRequests.length} product configurations</div>
              <div>Total Instances: {calculateTotalItems()}</div>
              <div>Regions: {[...new Set(pricingRequests.map(req => req.region))].length}</div>
              {formData.apply_total_discount && (
                <div className="text-green-600 font-medium">
                  Total Discount: {formData.total_discount_value}
                  {formData.total_discount_type === 'percent' ? '%' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {formData.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-medium text-yellow-800 mb-2">Additional Notes:</h5>
          <p className="text-sm text-yellow-700">{formData.notes}</p>
        </div>
      )}
    </div>
  );
};

export default QuoteFinalReviewStep;