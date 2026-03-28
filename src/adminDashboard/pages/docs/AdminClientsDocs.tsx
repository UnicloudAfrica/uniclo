import React from "react";
import {
  Users,
  PlusCircle,
  Eye,
  Link2,
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

const AdminClientsDocs: React.FC = () => (
  <DocsPageShell
    title="Clients"
    subtitle="Learn how to view and manage the end-users (clients) across every tenant on the platform."
  >
    <DocBreadcrumb
      crumbs={[
        { label: "Docs", href: PREFIX },
        { label: "Clients" },
      ]}
    />

    <DocTableOfContents
      items={[
        { id: "what-are-clients", label: "What are clients?" },
        { id: "view-clients", label: "View all clients" },
        { id: "create-client", label: "Create a client" },
        { id: "client-details", label: "View client details" },
        { id: "client-tenant", label: "Client-tenant relationship" },
      ]}
    />

    <section id="what-are-clients">
      <DocCallout type="info" title="What are clients?">
        If tenants are franchise owners, then <strong>clients are the customers
        who walk into the shop</strong>. Each client belongs to a specific
        tenant and uses the cloud services that tenant provides. As a platform
        admin, you can see every client across every tenant -- like having a
        bird's-eye view of all the shops at once.
      </DocCallout>
    </section>

    <section id="view-clients">
      <DocStep
        number={1}
        icon={Users}
        title="View all clients"
        navigation="Sidebar > Customer Management > Clients"
      >
        <p>
          The clients page gives you a complete list of every end-user on the
          platform, regardless of which tenant they belong to.
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
          <li>Click <strong>Customer Management</strong> in the sidebar.</li>
          <li>Select <strong>Clients</strong>.</li>
          <li>Use the search bar or filters to narrow down the list by tenant, status, or name.</li>
        </ol>
        <DocCallout type="tip">
          You can filter by tenant to see only the clients that belong to a
          specific organisation. This is handy when troubleshooting an issue for
          a particular tenant.
        </DocCallout>
        <DocScreenshot caption="The clients list showing all end-users across tenants." />
      </DocStep>
    </section>

    <section id="create-client">
      <DocStep
        number={2}
        icon={PlusCircle}
        title="Create a client"
        navigation="Sidebar > Customer Management > Clients > Create"
      >
        <p>
          You can create a client directly from the admin dashboard. This is
          useful when you need to set up an account for someone manually.
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
          <li>On the clients page, click <strong>Create</strong>.</li>
          <li>Choose which tenant this client will belong to.</li>
          <li>Enter the client's name, email, and any other required information.</li>
          <li>Click <strong>Submit</strong> to create the account.</li>
        </ol>
        <DocCallout type="warning">
          Make sure you select the correct tenant. A client can only belong to
          one tenant, and moving them later requires extra steps.
        </DocCallout>
        <DocScreenshot caption="The create client form with tenant selection and user details." />
      </DocStep>
    </section>

    <section id="client-details">
      <DocStep
        number={3}
        icon={Eye}
        title="View client details"
        navigation="Sidebar > Customer Management > Clients > Click a client"
      >
        <p>
          Click on any client row to see their full profile. This includes their
          contact information, the tenant they belong to, their resource usage,
          and billing history.
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
          <li><strong>Profile</strong> -- Name, email, status, and creation date.</li>
          <li><strong>Resources</strong> -- What instances, storage, and networks they are using.</li>
          <li><strong>Billing</strong> -- Payment history and current balance.</li>
        </ul>
        <DocScreenshot caption="Client detail page with profile, resources, and billing tabs." />
      </DocStep>
    </section>

    <section id="client-tenant">
      <DocStep number={4} icon={Link2} title="Understanding the client-tenant relationship">
        <p>
          Every client is linked to exactly one tenant. The tenant manages the
          client day-to-day, but as a platform admin you can step in at any
          time. Here is how the hierarchy works:
        </p>
        <DocMermaid
          chart={`graph TD
    A[Platform Admin -- You] --> B[Tenant A]
    A --> C[Tenant B]
    B --> D[Client 1]
    B --> E[Client 2]
    C --> F[Client 3]
    C --> G[Client 4]
    C --> H[Client 5]`}
          caption="Platform hierarchy: Admin > Tenants > Clients"
        />
        <DocCallout type="info">
          You have visibility over all levels of this hierarchy. Tenants can
          only see their own clients, and clients can only see their own
          resources.
        </DocCallout>
      </DocStep>
    </section>

    <DocNav
      prev={{ label: "Tenants & Partners", href: `${PREFIX}/tenants` }}
      next={{ label: "Regions", href: `${PREFIX}/regions` }}
    />
  </DocsPageShell>
);

export default AdminClientsDocs;
