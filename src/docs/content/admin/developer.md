---
title: Developer Tools
subtitle: Manage API keys, webhooks, and usage monitoring for platform integrations. Developer tools let you connect external systems and automate workflows through the platform's API.
prev: { label: Onboarding Settings, href: /admin-dashboard/docs/onboarding-settings }
---

:::step{number=1 icon=Key title="API Keys" navigation="Sidebar > Developer"}
The developer page lets you create and manage API keys for programmatic access to the platform. Each key has a name, permissions scope, and expiration date. Use API keys to integrate external tools or build custom automations.
:::

:::screenshot{caption="Your API Keys management page"}
:::

:::step{number=2 icon=Webhook title="Webhooks" navigation="Sidebar > Developer > Webhooks"}
Webhooks notify external systems when events happen on your platform — like when an instance is created, a payment is received, or a ticket is opened. Configure a webhook URL and select which events should trigger notifications.
:::

:::step{number=3 icon=Activity title="Usage Monitoring" navigation="Sidebar > Developer > Usage"}
Track how your API keys are being used — how many requests are made, which endpoints are called most, and whether any errors are occurring. This helps you monitor integrations and spot issues before they become problems.
:::

:::callout{type=info}
Treat API keys like passwords — keep them secret and rotate them regularly. If a key is compromised, revoke it immediately and create a new one.
:::

:::screenshot{caption="Your webhook configuration"}
:::
