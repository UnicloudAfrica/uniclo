import React from "react";
import {
  BarChart3,
  Activity,
  MousePointerClick,
  TrendingUp,
  Users,
  Server,
  DollarSign,
} from "lucide-react";
import DocsPageShell from "@/shared/pages/docs/components/DocsPageShell";
import DocBreadcrumb from "@/shared/pages/docs/components/DocBreadcrumb";
import DocTableOfContents from "@/shared/pages/docs/components/DocTableOfContents";
import DocStep from "@/shared/pages/docs/components/DocStep";
import DocScreenshot from "@/shared/pages/docs/components/DocScreenshot";
import DocCallout from "@/shared/pages/docs/components/DocCallout";
import DocNav from "@/shared/pages/docs/components/DocNav";

const PREFIX = "/dashboard/docs";

const TenantDashboardDocs: React.FC = () => (
  <DocsPageShell
    title="Dashboard Overview"
    subtitle="Your dashboard is like the cockpit of your cloud business. Here is what everything means."
  >
    <DocBreadcrumb
      crumbs={[
        { label: "Docs", href: PREFIX },
        { label: "Dashboard Overview" },
      ]}
    />

    <DocTableOfContents
      items={[
        { id: "stats-cards", label: "Stats Cards" },
        { id: "recent-activity", label: "Recent Activity" },
        { id: "quick-actions", label: "Quick Actions" },
      ]}
    />

    <section id="stats-cards" className="mt-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--theme-heading-color, #1f2937)" }}>
        Stats Cards
      </h2>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--theme-text-color, #374151)" }}>
        At the very top of your dashboard you will see a row of cards showing the most
        important numbers. Think of them as your business health at a glance.
      </p>

      <DocStep number={1} icon={Users} title="Total Clients">
        <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-color, #374151)" }}>
          This is how many clients (customers) are currently signed up under your platform.
          It is like counting how many people shop at your store.
        </p>
      </DocStep>

      <DocStep number={2} icon={Server} title="Active Instances">
        <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-color, #374151)" }}>
          The total number of servers (instances) that are currently running across all of
          your clients. More running servers usually means more revenue!
        </p>
      </DocStep>

      <DocStep number={3} icon={DollarSign} title="Monthly Revenue">
        <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-color, #374151)" }}>
          How much money your platform has earned this month from all client usage. This
          updates in real time as clients use resources.
        </p>
      </DocStep>

      <DocStep number={4} icon={TrendingUp} title="Growth Trend">
        <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-color, #374151)" }}>
          A small arrow or percentage showing whether your numbers are going up or down
          compared to last month. Green and pointing up is great!
        </p>
      </DocStep>

      <DocScreenshot caption="The stats cards row at the top of your dashboard" />

      <DocCallout type="tip" title="What if a number looks wrong?">
        Stats update every few minutes. If something looks off, give it a moment and
        refresh the page. If it still seems wrong, reach out to support.
      </DocCallout>
    </section>

    <section id="recent-activity" className="mt-10">
      <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--theme-heading-color, #1f2937)" }}>
        Recent Activity
      </h2>

      <DocStep number={5} icon={Activity} title="Activity Feed">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          Below the stats cards you will find a timeline of recent events. This shows things
          like:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          <li>New clients who signed up</li>
          <li>Servers that were created or deleted</li>
          <li>Invoices that were generated or paid</li>
          <li>Support tickets that were opened</li>
        </ul>
        <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-color, #374151)" }}>
          Think of this as a news feed for your business -- the most recent stuff is at the
          top.
        </p>
      </DocStep>

      <DocScreenshot caption="The recent activity feed shows a timeline of important events" />
    </section>

    <section id="quick-actions" className="mt-10">
      <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--theme-heading-color, #1f2937)" }}>
        Quick Actions
      </h2>

      <DocStep number={6} icon={MousePointerClick} title="Shortcuts to Common Tasks">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          You will also see a set of quick-action buttons that let you jump straight to the
          most common tasks without digging through menus. Typical quick actions include:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          <li><strong>Add Client</strong> -- Open the new client form</li>
          <li><strong>Create Instance</strong> -- Jump straight to the server creation wizard</li>
          <li><strong>View Invoices</strong> -- See your latest billing activity</li>
          <li><strong>Open Support</strong> -- Create a new support ticket</li>
        </ul>
      </DocStep>

      <DocScreenshot caption="Quick action buttons give you one-click access to common tasks" />

      <DocCallout type="info" title="Where to find it">
        Your dashboard is the first page you see after logging in. You can always get back
        to it by clicking the logo in the top-left corner or selecting{" "}
        <strong>Dashboard</strong> from the sidebar.
      </DocCallout>
    </section>

    <DocNav
      prev={{ label: "Getting Started", href: `${PREFIX}/getting-started` }}
      next={{ label: "Clients & Leads", href: `${PREFIX}/clients` }}
    />
  </DocsPageShell>
);

export default TenantDashboardDocs;
