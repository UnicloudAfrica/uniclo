import React from "react";
import {
  UserPlus,
  MailCheck,
  ClipboardList,
  Palette,
  PartyPopper,
} from "lucide-react";
import DocsPageShell from "@/shared/pages/docs/components/DocsPageShell";
import DocBreadcrumb from "@/shared/pages/docs/components/DocBreadcrumb";
import DocTableOfContents from "@/shared/pages/docs/components/DocTableOfContents";
import DocStep from "@/shared/pages/docs/components/DocStep";
import DocScreenshot from "@/shared/pages/docs/components/DocScreenshot";
import DocCallout from "@/shared/pages/docs/components/DocCallout";
import DocMermaid from "@/shared/pages/docs/components/DocMermaid";
import DocNav from "@/shared/pages/docs/components/DocNav";

const PREFIX = "/dashboard/docs";

const TenantGettingStarted: React.FC = () => (
  <DocsPageShell
    title="Getting Started"
    subtitle="From zero to running your own cloud business in just a few steps. Let's walk through it together!"
  >
    <DocBreadcrumb
      crumbs={[
        { label: "Docs", href: PREFIX },
        { label: "Getting Started" },
      ]}
    />

    <DocTableOfContents
      items={[
        { id: "overview", label: "How It Works" },
        { id: "register", label: "Step 1: Register Your Account" },
        { id: "verify", label: "Step 2: Verify Your Email" },
        { id: "onboarding", label: "Step 3: Complete Onboarding" },
        { id: "branding", label: "Step 4: Set Up Your Branding" },
        { id: "go-live", label: "Step 5: Go Live!" },
      ]}
    />

    <section id="overview" className="mt-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--theme-heading-color, #1f2937)" }}>
        How It Works
      </h2>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--theme-text-color, #374151)" }}>
        Think of UniCloud as the engine behind your own cloud company. You sign up, add your
        logo and brand colors, and then you can start selling cloud services (servers, storage,
        networking, and more) to your clients -- all under your own brand. Here is the journey
        at a glance:
      </p>

      <DocMermaid
        chart={`graph LR
    A[Register] --> B[Verify Email]
    B --> C[Onboarding Wizard]
    C --> D[Set Up Branding]
    D --> E[Go Live!]
    style A fill:#e0f2fe,stroke:#0284c7
    style B fill:#e0f2fe,stroke:#0284c7
    style C fill:#e0f2fe,stroke:#0284c7
    style D fill:#e0f2fe,stroke:#0284c7
    style E fill:#dcfce7,stroke:#16a34a`}
        caption="Your journey from sign-up to selling cloud services"
      />
    </section>

    <section id="register" className="mt-10">
      <DocStep number={1} icon={UserPlus} title="Register Your Account">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          Head to the registration page and fill in your details -- your name, email address,
          company name, and a password. This takes about two minutes.
        </p>
        <DocCallout type="tip" title="Pick a strong password">
          Use at least 12 characters mixing letters, numbers, and symbols. You will thank
          yourself later!
        </DocCallout>
        <DocScreenshot caption="The registration form -- fill in your details and click Sign Up" />
      </DocStep>
    </section>

    <section id="verify" className="mt-6">
      <DocStep number={2} icon={MailCheck} title="Verify Your Email">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          After signing up, check your inbox for a verification email. Click the link inside
          to confirm your address. If you do not see it within a few minutes, check your spam
          folder.
        </p>
        <DocCallout type="info" title="Didn't get the email?">
          Click the "Resend verification" link on the login page. Make sure you check your
          spam or junk folder first.
        </DocCallout>
      </DocStep>
    </section>

    <section id="onboarding" className="mt-6">
      <DocStep number={3} icon={ClipboardList} title="Complete the Onboarding Wizard">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          Once your email is verified, you will be greeted by the onboarding wizard. This
          short questionnaire helps us set up your workspace. You will be asked about:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          <li>Your company details (name, website, industry)</li>
          <li>The types of services you want to offer</li>
          <li>Your preferred region (where your servers will live)</li>
          <li>Your estimated number of clients</li>
        </ul>
        <DocScreenshot caption="The onboarding wizard walks you through a few simple questions" />
        <DocCallout type="tip" title="Don't worry about getting it perfect">
          You can change all of these settings later from the Settings page. Just pick what
          feels right for now.
        </DocCallout>
      </DocStep>
    </section>

    <section id="branding" className="mt-6">
      <DocStep number={4} icon={Palette} title="Set Up Your Branding">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          This is the fun part! Make the platform look like yours:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          <li><strong>Logo</strong> -- Upload your company logo (PNG or SVG works best)</li>
          <li><strong>Brand color</strong> -- Pick your primary color and the platform adjusts buttons, links, and accents to match</li>
          <li><strong>Favicon</strong> -- The tiny icon that shows in browser tabs</li>
          <li><strong>Company name</strong> -- Displayed in the header and emails</li>
        </ul>
        <DocScreenshot caption="Upload your logo and pick your brand color in the Branding settings" />
        <DocCallout type="info">
          <strong>Where to find it:</strong> Sidebar &rarr; Settings &rarr; Branding
        </DocCallout>
      </DocStep>
    </section>

    <section id="go-live" className="mt-6">
      <DocStep number={5} icon={PartyPopper} title="Go Live!">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          That's it -- you are ready to start selling! From here you can:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 mb-3" style={{ color: "var(--theme-text-color, #374151)" }}>
          <li>Add your first client</li>
          <li>Create a project and launch a server</li>
          <li>Set your pricing and start billing</li>
          <li>Invite team members to help manage things</li>
        </ul>
        <DocCallout type="tip" title="Explore the dashboard">
          Head to the Dashboard Overview guide next to learn what all the numbers and charts
          mean.
        </DocCallout>
      </DocStep>
    </section>

    <DocNav
      prev={{ label: "Home", href: PREFIX }}
      next={{ label: "Dashboard Overview", href: `${PREFIX}/dashboard` }}
    />
  </DocsPageShell>
);

export default TenantGettingStarted;
