---
title: Instance Templates
subtitle: Manage pre-configured server blueprints that make launching new instances fast and consistent. Think of templates as saved recipes — instead of choosing every ingredient from scratch, you pick a recipe and go.
prev: { label: Projects, href: /admin-dashboard/docs/projects }
next: { label: Key Pairs, href: /admin-dashboard/docs/key-pairs }
---

:::step{number=1 icon=LayoutTemplate title="View All Templates" navigation="Sidebar > Infrastructure > Templates"}
The templates page shows all available server blueprints. Each template includes a pre-selected operating system, CPU and RAM configuration, and network settings. Tenants and clients use these to launch servers quickly without configuring everything manually.
:::

:::screenshot{caption="Your Templates list"}
:::

:::step{number=2 icon=Plus title="Create a Template" navigation="Sidebar > Infrastructure > Templates > Create Template"}
Click create to build a new template. Choose the operating system, set the default CPU and RAM, and configure any startup scripts or default settings. Once saved, this template becomes available for anyone to use when launching new instances.
:::

:::step{number=3 icon=Settings title="Manage Templates" navigation="Sidebar > Infrastructure > Templates"}
You can edit, duplicate, or delete templates from the list. Keeping templates up to date ensures that new instances always launch with the latest configurations and security patches.
:::

:::callout{type=info}
Templates save time and reduce errors. Instead of manually configuring each server, users pick a template and get a consistent setup every time.
:::
