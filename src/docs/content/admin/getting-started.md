---
title: Getting Started
subtitle: Your first steps as a platform administrator -- from signing in to finding your way around the dashboard.
prev: { label: Home, href: /admin-dashboard/docs }
next: { label: Tenants & Partners, href: /admin-dashboard/docs/tenants }
---

:::callout{type=info title="Before you begin"}
Make sure you have received your admin credentials from the platform owner. You will need an email address and a password to sign in.
:::

:::step{number=1 icon=LogIn title="Sign in to the admin dashboard"}
Open your browser and go to the admin sign-in page. Think of this page as the front door to your command centre -- only people with admin keys can get in.

1. Navigate to **/admin-signin** in your browser.
2. Enter your admin email address.
3. Enter your password.
4. Click the **Sign In** button.

:::screenshot{caption="The admin sign-in page with email and password fields."}
:::
:::

:::step{number=2 icon=MailCheck title="Verify your email"}
If this is your first time signing in, the platform may ask you to verify your email. Check your inbox for a verification link and click it. This is like confirming your identity at a security checkpoint.

:::callout{type=tip title="Check your spam folder"}
If you do not see the verification email within a minute or two, look in your spam or junk folder. Sometimes emails end up there by mistake.
:::

:::screenshot{caption="Email verification prompt after first sign-in."}
:::
:::

:::step{number=3 icon=LayoutDashboard title="Explore the dashboard"}
Once you are signed in you will land on the admin dashboard home page. This is your mission control. You will see summary cards showing important numbers like total tenants, active clients, and recent activity.

Take a moment to look around. Everything you need is accessible from the sidebar on the left-hand side of the screen.

:::screenshot{caption="The admin dashboard home page with summary cards and charts."}
:::
:::

:::step{number=4 icon=SidebarOpen title="Understand the sidebar"}
The sidebar is your main menu. It is organised into logical groups so you can find things quickly. Here is a quick overview of the main sections:

- **Customer Management** -- Tenants, partners, clients, and onboarding.
- **Infrastructure** -- Regions, compute, networking, and storage.
- **Business** -- Pricing, products, billing, and finance.
- **Advanced** -- Disaster recovery, migrations, auto-scaling.
- **Support** -- View and respond to support tickets.
- **Settings** -- Branding, admin users, and platform config.

:::callout{type=tip}
You can collapse the sidebar by clicking the toggle at the top to give yourself more screen space when you need it.
:::

:::screenshot{caption="The sidebar navigation with all major sections visible."}
:::
:::

:::step{number=5 icon=ShieldCheck title="How authentication works"}
Here is a simple diagram showing what happens behind the scenes when you sign in. You do not need to memorise this -- it is just here to help you understand the flow if something goes wrong.

:::mermaid{caption="Admin authentication flow"}
graph TD
A[Open admin sign-in page] --> B[Enter email and password]
B --> C{Credentials valid?}
C -- Yes --> D{Email verified?}
C -- No --> E[Show error message]
D -- Yes --> F[Redirect to dashboard]
D -- No --> G[Send verification email]
G --> H[User clicks verification link]
H --> F
:::
:::
