const tenantBusinessSteps = [
  {
    id: "business_profile",
    label: "Business Profile",
    description:
      "Tell us about your business so we can tailor the experience to your operations.",
    custom: "businessProfile",
  },
  {
    id: "compliance_documents",
    label: "Compliance & Documents",
    description:
      "Upload your statutory documents. We will review and let you know if anything needs attention.",
    fields: [
      {
        id: "certificate_of_incorporation",
        label: "Certificate of incorporation",
        type: "file",
        required: true,
        fullWidth: false,
      },
      {
        id: "business_utility_bill",
        label: "Business utility bill",
        type: "file",
        required: true,
        fullWidth: false,
      },
      {
        id: "cac_status_report",
        label: "CAC status report",
        type: "file",
        required: true,
        fullWidth: false,
      },
      {
        id: "memorandum",
        label: "Memorandum (MEMART)",
        type: "file",
        fullWidth: false,
      },
    ],
  },
  {
    id: "founders_directors",
    label: "Founders & Directors",
    description:
      "List your key people so our team can align the review and share the right approvals.",
    fields: [
      {
        id: "founders",
        label: "Founders",
        type: "collection",
        required: true,
        itemLabel: "Founder",
        helperText:
          "Add each founder with their role, ownership, and supporting identity documents.",
        fields: [
          { id: "name", label: "Full name", type: "text", required: true },
          { id: "role", label: "Role", type: "text", required: true },
          {
            id: "ownership",
            label: "Ownership %",
            type: "text",
            required: true,
          },
          {
            id: "nationality",
            label: "Nationality",
            type: "text",
            required: true,
          },
          {
            id: "identifier",
            label: "Identifier",
            type: "text",
            helperText: "Internal identifier or code",
          },
          {
            id: "is_board_director",
            label: "Board director?",
            type: "select",
            options: [
              { value: "", label: "Select option" },
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ],
            required: true,
          },
          {
            id: "national_id_type",
            label: "National ID type",
            type: "text",
            required: true,
          },
          {
            id: "national_id_number",
            label: "National ID number",
            type: "text",
            required: true,
          },
          {
            id: "address",
            label: "Residential address",
            type: "textarea",
            required: true,
          },
          {
            id: "utility_bill",
            label: "Utility bill",
            type: "file",
            helperText: "Upload a recent bill showing the founder's name.",
            required: true,
          },
          {
            id: "supporting_id",
            label: "Supporting ID document",
            type: "file",
            helperText:
              "Passport, driver's licence, or any document matching the ID type.",
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "billing",
    label: "Billing & Tax",
    description:
      "Share billing contacts and tax identifiers so invoices land with the right people.",
    fields: [
      {
        id: "billing_contact_name",
        label: "Billing contact name",
        type: "text",
        required: true,
      },
      {
        id: "billing_contact_email",
        label: "Billing contact email",
        type: "text",
        required: true,
      },
      {
        id: "billing_contact_phone",
        label: "Billing contact phone",
        type: "text",
      },
      { id: "tax_id", label: "Tax ID", type: "text" },
      { id: "billing_notes", label: "Billing notes", type: "textarea" },
    ],
  },
  {
    id: "branding",
    label: "Branding & Theme",
    description:
      "Upload your brand assets so the CRM reflects your identity from day one.",
    custom: "brandingTheme",
  },
  {
    id: "domain_settings",
    label: "Domain Settings",
    description:
      "Confirm that your primary domain has the required DNS records. We’ll notify you when verification succeeds.",
    fields: [
      {
        id: "domain",
        label: "Primary domain",
        type: "text",
        required: true,
      },
      {
        id: "dns_verified",
        label: "DNS status",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select status" },
          { value: "pending", label: "Pending verification" },
          { value: "verified", label: "DNS records verified" },
          { value: "action_required", label: "Action required" },
        ],
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
        helperText: "Share any context your team needs when reviewing DNS changes.",
      },
    ],
  },
  {
    id: "partner_region_qualification",
    label: "Partner Region Qualification",
    description:
      "Tell us about the regions you operate and share credentials if you want automated provisioning.",
    custom: "partnerRegion",
  },
];

const clientBusinessSteps = [
  ...["business_profile", "compliance_documents", "founders_directors"].map((stepId) => {
    const template = tenantBusinessSteps.find((step) => step.id === stepId);
    return template ? { ...template, fields: template.fields ? [...template.fields] : template.fields } : null;
  }),
].filter(Boolean);

const internalClientBusinessSteps = clientBusinessSteps.map((step) => ({
  ...step,
  fields: step.fields ? [...step.fields] : step.fields,
}));

const tenantClientIndividualSteps = [
  {
    id: "client_profile",
    label: "Client Profile",
    description:
      "Share your personal details so we can verify and activate your services.",
    fields: [
      {
        id: "first_name",
        label: "First name",
        type: "text",
        required: true,
      },
      {
        id: "last_name",
        label: "Last name",
        type: "text",
        required: true,
      },
      {
        id: "email",
        label: "Contact email",
        type: "text",
        required: true,
      },
      { id: "phone", label: "Contact phone", type: "text" },
      {
        id: "date_of_birth",
        label: "Date of birth",
        type: "date",
        required: true,
      },
      {
        id: "nationality",
        label: "Nationality",
        type: "text",
        required: true,
      },
      {
        id: "residential_address",
        label: "Residential address",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "compliance_documents",
    label: "Compliance & Documents",
    description:
      "Upload any supporting KYC documents gathered so far. We'll request more if needed.",
    fields: [
      {
        id: "kyc_form",
        label: "KYC form",
        type: "file",
        required: true,
      },
      {
        id: "supporting_documents",
        label: "Supporting documents",
        type: "file",
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
      },
    ],
  },
  {
    id: "identity_documents",
    label: "Identity & Proof",
    description:
      "Upload government-issued identification and proof of address so we can complete due diligence.",
    fields: [
      {
        id: "id_type",
        label: "ID type",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select ID type" },
          { value: "passport", label: "Passport" },
          { value: "national_id", label: "National ID" },
          { value: "drivers_licence", label: "Driver's licence" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "id_number",
        label: "ID number",
        type: "text",
        required: true,
      },
      { id: "id_issue_date", label: "Issue date", type: "date" },
      { id: "id_expiry_date", label: "Expiry date", type: "date" },
      {
        id: "id_document",
        label: "Government-issued ID",
        type: "file",
        required: true,
        fullWidth: false,
        helperText: "Upload a clear scan or photo of the selected ID.",
      },
      {
        id: "proof_of_address",
        label: "Proof of address",
        type: "file",
        required: true,
        fullWidth: false,
        helperText: "Utility bill or bank statement dated within the last 3 months.",
      },
    ],
  },
];

export const STEP_CONFIG = {
  tenant: tenantBusinessSteps,
  tenant_business: tenantBusinessSteps,
  tenant_partner_business: tenantBusinessSteps,
  tenant_client_business: clientBusinessSteps,
  client: clientBusinessSteps,
  tenant_client_individual: tenantClientIndividualSteps,
  crm: internalClientBusinessSteps,
  internal_client_business: internalClientBusinessSteps,
};

export const getStepsForTarget = (target) =>
  STEP_CONFIG[target] ?? tenantBusinessSteps;
