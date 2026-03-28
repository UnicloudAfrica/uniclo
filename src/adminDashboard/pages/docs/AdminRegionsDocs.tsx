import React from "react";
import {
  Globe,
  MapPin,
  PlusCircle,
  CheckCircle2,
  Layers,
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

const AdminRegionsDocs: React.FC = () => (
  <DocsPageShell
    title="Regions"
    subtitle="Learn how to set up and manage the geographic regions where your cloud infrastructure lives."
  >
    <DocBreadcrumb
      crumbs={[
        { label: "Docs", href: PREFIX },
        { label: "Regions" },
      ]}
    />

    <DocTableOfContents
      items={[
        { id: "what-are-regions", label: "What are regions?" },
        { id: "view-regions", label: "View the regions list" },
        { id: "create-region", label: "Create a new region" },
        { id: "region-approvals", label: "Manage region approvals" },
        { id: "availability-zones", label: "Configure availability zones" },
      ]}
    />

    <section id="what-are-regions">
      <DocCallout type="info" title="What are regions?">
        Imagine your platform is a company with <strong>offices in different
        cities</strong>. Each office (region) has its own equipment and staff.
        Clients choose which office to use based on where they are located --
        the closer the office, the faster things run. Regions let you spread
        your infrastructure across the world so everyone gets a great experience.
      </DocCallout>
    </section>

    <section id="view-regions">
      <DocStep
        number={1}
        icon={Globe}
        title="View the regions list"
        navigation="Sidebar > Infrastructure > Regions"
      >
        <p>
          The regions page shows every region you have configured on the
          platform. Each row displays the region name, location, status, and how
          many availability zones it contains.
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
          <li>Click <strong>Infrastructure</strong> in the sidebar.</li>
          <li>Select <strong>Regions</strong>.</li>
          <li>Browse the list or search by name or location.</li>
        </ol>
        <DocScreenshot caption="The regions list showing names, locations, and zone counts." />
      </DocStep>
    </section>

    <section id="create-region">
      <DocStep
        number={2}
        icon={PlusCircle}
        title="Create a new region"
        navigation="Sidebar > Infrastructure > Regions > Create"
      >
        <p>
          When you want to expand your platform to a new geographic area, you
          create a new region. This tells the system where new resources can be
          deployed.
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
          <li>Click the <strong>Create</strong> button on the regions page.</li>
          <li>Enter the region name (for example, "US East" or "EU West").</li>
          <li>Provide the geographic location details.</li>
          <li>Configure any provider-specific settings if prompted.</li>
          <li>Click <strong>Submit</strong> to create the region.</li>
        </ol>
        <DocCallout type="tip">
          Use clear, descriptive names for your regions. Your tenants and their
          clients will see these names when choosing where to deploy their
          resources.
        </DocCallout>
        <DocScreenshot caption="The create region form with name and location fields." />
      </DocStep>
    </section>

    <section id="region-approvals">
      <DocStep
        number={3}
        icon={CheckCircle2}
        title="Manage region approvals"
        navigation="Sidebar > Infrastructure > Regions > Pending"
      >
        <p>
          Some regions may require approval before they become active --
          especially if they are added by a tenant or partner. You can review
          and approve pending regions from the same page.
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
          <li>Look for regions with a <strong>Pending</strong> status badge.</li>
          <li>Click on the region to review its details.</li>
          <li>Click <strong>Approve</strong> to activate or <strong>Reject</strong> to decline.</li>
        </ol>
        <DocCallout type="warning">
          Approving a region means tenants can start deploying resources there.
          Make sure the underlying infrastructure is ready before you approve.
        </DocCallout>
        <DocScreenshot caption="A pending region detail page with approve and reject buttons." />
      </DocStep>
    </section>

    <section id="availability-zones">
      <DocStep
        number={4}
        icon={Layers}
        title="Configure availability zones"
        navigation="Sidebar > Infrastructure > Regions > Click region > Zones tab"
      >
        <p>
          Each region can have one or more <strong>availability zones</strong>.
          Think of these as separate rooms inside the same office building. If
          one room has a power outage, the others keep running. This gives your
          clients better reliability.
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
          <li>Open a region's detail page by clicking on it.</li>
          <li>Go to the <strong>Zones</strong> tab.</li>
          <li>Click <strong>Add Zone</strong> to create a new availability zone.</li>
          <li>Give the zone a name and configure its settings.</li>
          <li>Click <strong>Save</strong>.</li>
        </ol>
        <DocMermaid
          chart={`graph TD
    A[Platform] --> B[Region: US East]
    A --> C[Region: EU West]
    B --> D[Zone A]
    B --> E[Zone B]
    C --> F[Zone A]
    C --> G[Zone B]
    C --> H[Zone C]`}
          caption="Regions contain one or more availability zones"
        />
        <DocScreenshot caption="Availability zones tab inside a region detail page." />
      </DocStep>
    </section>

    <DocNav
      prev={{ label: "Clients", href: `${PREFIX}/clients` }}
      next={{ label: "Onboarding", href: `${PREFIX}/onboarding` }}
    />
  </DocsPageShell>
);

export default AdminRegionsDocs;
