---
title: Compute & Instances
subtitle: Manage the virtual servers running across your platform. Think of instances as personal computers in the cloud — each one runs its own operating system and applications.
prev: { label: Billing & Finance, href: /admin-dashboard/docs/billing }
next: { label: Networking, href: /admin-dashboard/docs/networking }
---

:::step{number=1 icon=FolderKanban title="Projects" navigation="Sidebar > Infrastructure > Projects"}
Projects are like folders that organize instances together. Each project belongs to a tenant and contains related servers, networks, and storage. You can see all projects across all tenants from the admin view.
:::

:::screenshot{caption="Your Projects list"}
:::

:::step{number=2 icon=Server title="Instances List" navigation="Sidebar > Infrastructure > Cube Instances"}
This page shows every virtual server on your platform. You can see the instance name, status (running, stopped, etc.), which tenant owns it, and resource usage. It is like looking at a control panel showing all the machines in your data center.
:::

:::screenshot{caption="Your Instances list showing all servers"}
:::

:::step{number=3 icon=Plus title="Create an Instance" navigation="Sidebar > Infrastructure > Create Instance"}
As an admin, you can create instances on behalf of tenants. The creation wizard walks you through: selecting a project, choosing an operating system, picking the server size (CPU and RAM), and configuring network settings.
:::

:::callout{type=tip}
Creating instances as an admin is usually for testing or special setups. Most instances are created by tenants or their clients through their own dashboards.
:::

:::step{number=4 icon=LayoutTemplate title="Templates" navigation="Sidebar > Infrastructure > Templates"}
Templates are pre-configured server blueprints — like saving a recipe. Instead of choosing every setting from scratch, a template bundles everything together. Tenants and clients can use these to launch servers quickly.
:::

:::step{number=5 icon=Key title="Key Pairs" navigation="Sidebar > Infrastructure > Key Pairs"}
Key pairs are special security keys used to securely connect to servers via SSH. Think of them like a special key that only fits one lock. Each key pair has a public key (the lock) and a private key (the key itself).
:::

:::step{number=6 icon=Activity title="Instance Details" navigation="Click any instance in the list"}
Click on any instance to see its full details: resource usage, console access, attached storage, network configuration, and lifecycle controls (start, stop, restart, delete).
:::

:::screenshot{caption="Your Instance details page"}
:::
