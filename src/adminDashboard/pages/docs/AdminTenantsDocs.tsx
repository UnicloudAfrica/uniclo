import React from "react";
import {
  Building2,
  PlusCircle,
  Eye,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import DocsPageShell from "@/shared/pages/docs/components/DocsPageShell";
import DocBreadcrumb from "@/shared/pages/docs/components/DocBreadcrumb";
import DocTableOfContents from "@/shared/pages/docs/components/DocTableOfContents";
import DocStep from "@/shared/pages/docs/components/DocStep";
import DocScreenshot from "@/shared/pages/docs/components/DocScreenshot";
import DocCallout from "@/shared/pages/docs/components/DocCallout";
import DocMermaid from "@/shared/pages/docs/components/DocMermaid";
import DocNav from "@/shared/pages/docs/components/DocNav";

const PREFIX = "/admin-dashboard/docs";

const AdminTenantsDocs: React.FC = () => (
  <DocsPageShell
    title="Tenants & Partners"
    subtitle="Learn how to create, review, and manage the organisations (tenants) that use your platform to offer cloud services."
  >
    <DocBreadcrumb
      crumbs={[
        { label: "Docs", href: PREFIX },
        { label: "Tenants & Partners" },
      ]}
    />

    <DocTableOfContents
      items={[
        { id: "what-are-tenants", label: "What are tenants?" },
        { id: "view-partners", label: "View the partners list" },
        { id: "create-tenant", label: "Create a new tenant" },
        { id: "tenant-details", label: "Review tenant details" },
        { id: "onboarding-review", label: "Onboarding review process" },
        { id: "approve-reject", label: "Approve or reject a tenant" },
        { id: "onboarding-flow", label: "Onboarding flow diagram" },
      ]}
    />

    <section id="what-are-tenants">
      <DocCallout type="info" title="What are tenants?">
        Think of tenants as <strong>franchise owners</strong>. You own the big
        brand (the platform), and each tenant runs their own branch of it. They
        sign up, get approved, and then start selling cloud services to their
        own clients using your infrastructure. You can see all of them,
        control who gets in, and help them when they need it.
      </DocCallout>
    </section>

    <section id="view-partners">
      <DocStep
        number={1}
        icon={Building2}
        title="View the partners list"
        navigation="Sidebar > Customer Management > Partners"
      >
        <p>
          The partners list shows every organisation that has signed up (or been
          created by you) on the platform. You will see their name, status, and
          when they joined.
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
          <li>Click <strong>Customer Management</strong> in the sidebar.</li>
          <li>Select <strong>Partners</strong>.</li>
          <li>Browse the table or use the search bar to find a specific tenant.</li>
        </ul>
        <DocScreenshot caption="The partners list table with name, status, and date columns." />
      </DocStep>
    </section>

    <section id="create-tenant">
      <DocStep
        number={2}
        icon={PlusCircle}
        title="Create a new tenant"
        navigation="Sidebar > Customer Management > Partners > Create"
      >
        <p>
          Sometimes you need to create a tenant on their behalf -- for example,
          during a sales demo or when onboarding a large enterprise manually.
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
          <li>On the partners list page, click the <strong>Create</strong> button.</li>
          <li>Fill in the organisation name, contact email, and any other required fields.</li>
          <li>Choose the initial plan or leave it as default.</li>
          <li>Click <strong>Submit</strong>.</li>
        </ol>
        <DocCallout type="tip">
          The new tenant will receive a welcome email with instructions on how
          to set up their own dashboard. You can always edit their details later.
        </DocCallout>
        <DocScreenshot caption="The create tenant form with organisation details." />
      </DocStep>
    </section>

    <section id="tenant-details">
      <DocStep
        number={3}
        icon={Eye}
        title="Review tenant details"
        navigation="Sidebar > Customer Management > Partners > Click a tenant"
      >
        <p>
          Click on any tenant row to open their detail page. Here you can see
          everything about them -- their profile, subscription, clients, usage
          stats, and more.
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
          <li><strong>Overview tab</strong> -- Basic info, status, and contact details.</li>
          <li><strong>Clients tab</strong> -- All the end-users under this tenant.</li>
          <li><strong>Billing tab</strong> -- Payment history and wallet balance.</li>
          <li><strong>Settings tab</strong> -- Tenant-specific configuration.</li>
        </ul>
        <DocScreenshot caption="Tenant detail page showing the overview tab." />
      </DocStep>
    </section>

    <section id="onboarding-review">
      <DocStep
        number={4}
        icon={ClipboardCheck}
        title="Onboarding review process"
        navigation="Sidebar > Customer Management > Onboarding"
      >
        <p>
          When a new tenant signs up on their own, they go through an onboarding
          process. As an admin, you review their application before they can
          start using the platform. Think of it like reviewing a job application.
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
          <li>Go to <strong>Customer Management &gt; Onboarding</strong>.</li>
          <li>You will see a queue of pending applications.</li>
          <li>Click on an application to review the details.</li>
        </ol>
        <DocScreenshot caption="The onboarding review queue with pending applications." />
      </DocStep>
    </section>

    <section id="approve-reject">
      <DocStep number={5} icon={CheckCircle2} title="Approve or reject a tenant">
        <p>
          After reviewing a tenant application, you can approve or reject it.
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
          <li>
            <strong>Approve</strong> -- The tenant gets access to the platform
            and can start setting up their services.
          </li>
          <li>
            <strong>Reject</strong> -- The tenant is notified that their
            application was not accepted. You can include a reason.
          </li>
        </ul>
        <DocCallout type="warning" title="Be careful with rejections">
          Once you reject a tenant, they will need to re-apply. Make sure to
          double-check the details and include a clear reason so they know what
          to fix.
        </DocCallout>
        <DocScreenshot caption="Approve and reject buttons on the tenant review page." />
      </DocStep>
    </section>

    <section id="onboarding-flow">
      <DocStep number={6} icon={XCircle} title="Onboarding flow diagram">
        <p>
          Here is the full journey a tenant goes through from sign-up to being
          active on the platform:
        </p>
        <DocMermaid
          chart={`graph TD
    A[Tenant signs up] --> B[Fills onboarding form]
    B --> C[Application submitted]
    C --> D[Admin reviews application]
    D --> E{Approved?}
    E -- Yes --> F[Tenant gets access]
    F --> G[Tenant sets up dashboard]
    G --> H[Tenant invites clients]
    E -- No --> I[Tenant notified of rejection]
    I --> J[Tenant can re-apply]`}
          caption="Tenant onboarding lifecycle"
        />
      </DocStep>
    </section>

    <DocNav
      prev={{ label: "Getting Started", href: `${PREFIX}/getting-started` }}
      next={{ label: "Clients", href: `${PREFIX}/clients` }}
    />
  </DocsPageShell>
);

export default AdminTenantsDocs;
