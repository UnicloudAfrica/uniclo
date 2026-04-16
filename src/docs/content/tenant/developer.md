---
title: Developer Tools
subtitle: Developer tools give you programmatic access to the platform. Manage API keys, set up webhooks, and monitor your API usage. Think of this section as the control panel for building your own integrations.
prev: { label: Products, href: /dashboard/docs/products }
next: { label: Support, href: /dashboard/docs/support }
---

:::step{number=1 icon=Key title="API Keys" navigation="Sidebar > Developer"}
API keys let your applications talk to the platform on your behalf. Create a key, give it a name so you remember what it is for, and use it in your code to authenticate requests.
:::

:::screenshot{caption="Your API Keys management page"}
:::

:::step{number=2 icon=Webhook title="Webhooks"}
Webhooks send automatic notifications to your own systems when something happens -- like when a server is created, a client signs up, or an invoice is paid. Enter the URL of your endpoint and choose which events to subscribe to.
:::

:::step{number=3 icon=BarChart title="Usage Monitoring"}
Track how many API calls you are making, which endpoints are used most, and whether any requests are failing. This helps you debug integrations and plan for growth.
:::

:::screenshot{caption="Your API usage charts"}
:::

:::callout{type=tip}
Treat API keys like passwords -- never share them publicly or commit them to version control. If a key is compromised, revoke it immediately and create a new one.
:::
