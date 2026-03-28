import React from "react";
import {
  LogIn,
  MailCheck,
  LayoutDashboard,
  SidebarOpen,
  ShieldCheck,
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

const AdminGettingStarted: React.FC = () => (
  <DocsPageShell
    title="Getting Started"
    subtitle="Your first steps as a platform administrator -- from signing in to finding your way around the dashboard."
  >
    <DocBreadcrumb
      crumbs={[
        { label: "Docs", href: PREFIX },
        { label: "Getting Started" },
      ]}
    />

    <DocTableOfContents
      items={[
        { id: "sign-in", label: "Sign in to the admin dashboard" },
        { id: "verify-email", label: "Verify your email" },
        { id: "explore-dashboard", label: "Explore the dashboard" },
        { id: "understand-sidebar", label: "Understand the sidebar" },
        { id: "auth-flow", label: "How authentication works" },
      ]}
    />

    <DocCallout type="info" title="Before you begin">
      Make sure you have received your admin credentials from the platform
      owner. You will need an email address and a password to sign in.
    </DocCallout>

    <section id="sign-in">
      <DocStep number={1} icon={LogIn} title="Sign in to the admin dashboard">
        <p>
          Open your browser and go to the admin sign-in page. Think of this page
          as the front door to your command centre -- only people with admin keys
          can get in.
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
          <li>Navigate to <strong>/admin-signin</strong> in your browser.</li>
          <li>Enter your admin email address.</li>
          <li>Enter your password.</li>
          <li>Click the <strong>Sign In</strong> button.</li>
        </ol>
        <DocScreenshot caption="The admin sign-in page with email and password fields." />
      </DocStep>
    </section>

    <section id="verify-email">
      <DocStep number={2} icon={MailCheck} title="Verify your email">
        <p>
          If this is your first time signing in, the platform may ask you to
          verify your email. Check your inbox for a verification link and click
          it. This is like confirming your identity at a security checkpoint.
        </p>
        <DocCallout type="tip" title="Check your spam folder">
          If you do not see the verification email within a minute or two, look
          in your spam or junk folder. Sometimes emails end up there by mistake.
        </DocCallout>
        <DocScreenshot caption="Email verification prompt after first sign-in." />
      </DocStep>
    </section>

    <section id="explore-dashboard">
      <DocStep number={3} icon={LayoutDashboard} title="Explore the dashboard">
        <p>
          Once you are signed in you will land on the admin dashboard home page.
          This is your mission control. You will see summary cards showing
          important numbers like total tenants, active clients, and recent
          activity.
        </p>
        <p className="mt-2">
          Take a moment to look around. Everything you need is accessible from
          the sidebar on the left-hand side of the screen.
        </p>
        <DocScreenshot caption="The admin dashboard home page with summary cards and charts." />
      </DocStep>
    </section>

    <section id="understand-sidebar">
      <DocStep number={4} icon={SidebarOpen} title="Understand the sidebar">
        <p>
          The sidebar is your main menu. It is organised into logical groups so
          you can find things quickly. Here is a quick overview of the main
          sections:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
          <li><strong>Customer Management</strong> -- Tenants, partners, clients, and onboarding.</li>
          <li><strong>Infrastructure</strong> -- Regions, compute, networking, and storage.</li>
          <li><strong>Business</strong> -- Pricing, products, billing, and finance.</li>
          <li><strong>Advanced</strong> -- Disaster recovery, migrations, auto-scaling.</li>
          <li><strong>Support</strong> -- View and respond to support tickets.</li>
          <li><strong>Settings</strong> -- Branding, admin users, and platform config.</li>
        </ul>
        <DocCallout type="tip">
          You can collapse the sidebar by clicking the toggle at the top to give
          yourself more screen space when you need it.
        </DocCallout>
        <DocScreenshot caption="The sidebar navigation with all major sections visible." />
      </DocStep>
    </section>

    <section id="auth-flow">
      <DocStep number={5} icon={ShieldCheck} title="How authentication works">
        <p>
          Here is a simple diagram showing what happens behind the scenes when
          you sign in. You do not need to memorise this -- it is just here to
          help you understand the flow if something goes wrong.
        </p>
        <DocMermaid
          chart={`graph TD
    A[Open admin sign-in page] --> B[Enter email and password]
    B --> C{Credentials valid?}
    C -- Yes --> D{Email verified?}
    C -- No --> E[Show error message]
    D -- Yes --> F[Redirect to dashboard]
    D -- No --> G[Send verification email]
    G --> H[User clicks verification link]
    H --> F`}
          caption="Admin authentication flow"
        />
      </DocStep>
    </section>

    <DocNav
      prev={{ label: "Home", href: PREFIX }}
      next={{ label: "Tenants & Partners", href: `${PREFIX}/tenants` }}
    />
  </DocsPageShell>
);

export default AdminGettingStarted;
