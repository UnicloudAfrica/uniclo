---
title: Onboarding
subtitle: Control how new tenants get set up on your platform. Think of it as the new employee orientation process — you decide what steps they need to complete before they can start working.
prev: { label: Storage, href: /admin-dashboard/docs/storage }
next: { label: Advanced Services, href: /admin-dashboard/docs/advanced }
---

:::mermaid{caption="The tenant onboarding review process"}
graph LR
A[Tenant Signs Up] --> B[Completes Onboarding Steps]
B --> C[Submits for Review]
C --> D[Admin Reviews]
D --> E{Approved?}
E -->|Yes| F[Tenant Goes Live]
E -->|No| G[Sent Back for Changes]
G --> B
:::

:::step{number=1 icon=ListChecks title="Onboarding Review" navigation="Sidebar > Onboarding > Onboarding Review"}
This is your review queue. When a new tenant completes their onboarding steps, their submission appears here for your approval. You can see what they have filled in, verify their business details, and either approve them or send them back to make changes.
:::

:::screenshot{caption="Your Onboarding review queue"}
:::

:::callout{type=info}
Review submissions carefully — once approved, the tenant gets full access to create clients and provision infrastructure under their account.
:::

:::step{number=2 icon=Settings title="Onboarding Settings" navigation="Sidebar > Onboarding > Onboarding Settings"}
Configure what the onboarding process looks like. You can customize which steps tenants need to complete, what information they need to provide, and what verification is required. It is like designing the checklist for new employees.
:::

:::screenshot{caption="Your Onboarding settings page"}
:::

:::step{number=3 icon=CheckCircle title="What Tenants See" navigation="This is for your reference"}
When a tenant logs in for the first time, they see a guided onboarding wizard. It walks them through setting up their company profile, branding (logo and colors), and initial configuration. They cannot access the full dashboard until onboarding is complete and you have approved their setup.
:::

:::callout{type=tip}
Keep onboarding steps focused and simple. The faster tenants can get set up, the sooner they start bringing in clients and generating revenue.
:::
