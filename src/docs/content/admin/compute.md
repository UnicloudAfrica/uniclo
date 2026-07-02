---
title: Compute & Instances
subtitle: Instances are the virtual servers running across your platform — each with its own CPU, RAM, operating system, and applications. This guide covers the fleet view, provisioning, and lifecycle management.
prev: { label: Billing & Finance, href: /admin-dashboard/docs/billing }
next: { label: Networking, href: /admin-dashboard/docs/networking }
---

An **instance** is a virtual server — a computer in the cloud that runs its own operating system and workloads. Every instance lives inside a project, in a specific availability zone. As a platform admin you get a single fleet view across every tenant, plus per-project compute management.

:::step{number=1 icon=Server title="See the whole fleet" navigation="Sidebar > Compute & Storage > Instances"}
The **Cube Instances** page is your fleet control tower — real-time visibility into every workload across all regions. The header summarizes the fleet at a glance: **Total**, **Active**, **Idle / Stopped**, **Provisioning**, and **Bandwidth Ready** (instances with a floating IP and dedicated bandwidth attached). Below, each instance is listed with its status, owning project, region, and specs.
:::

:::screenshot{caption="The Cube Instances fleet view with live totals across every region"}
:::

:::callout{type=tip title="What each instance status means"}

- **Running / Active** — powered on and serving workloads.
- **Provisioning** — being built on the cloud right now. It flips to Active only once the server genuinely exists — never before.
- **Idle / Stopped** — created but powered off (it still holds its disk and configuration).

If an instance sits in **Provisioning** far longer than expected, that points to a cloud-side issue (for example a provider authentication or capacity problem), not a UI glitch — check the project's provisioning pipeline for the exact step.
:::

:::step{number=2 icon=Boxes title="Manage instances inside a project" navigation="Project > Compute > Instances"}
Open any project and switch to the **Compute** tab. It splits into **Instances** and **Key Pairs**. The Instances panel ("Virtual Instances") lists the servers in that project and gives you a **Provision Instance** button to add a new one scoped to that project and availability zone.
:::

:::step{number=3 icon=Plus title="Provision a new instance" navigation="Project > Compute > Instances > Provision Instance"}
The provisioning flow walks you through the essentials: the **operating system image**, the **size** (vCPU and RAM), **storage**, **network** (which VPC and subnet it joins), and a **key pair** for SSH access. As an admin you can do this on a customer's behalf — though most instances are launched by tenants or their clients from their own dashboards.
:::

:::callout{type=warning title="Provisioning is shown honestly"}
A new instance reports **Provisioning** while the cloud builds it, and only becomes **Active** once the server actually exists. If a step fails, you see the failure — the instance is never shown as ready when it is not. This means a "stuck" instance is a real signal worth investigating, not noise to ignore.
:::

:::step{number=4 icon=KeyRound title="Key pairs for secure access" navigation="Sidebar > Compute & Storage > Key Pairs"}
Key pairs are the SSH credentials used to log into instances securely. Each pair has a **public key** (kept on the server, like a lock) and a **private key** (kept by the user, like the key). They are managed platform-wide under Key Pairs, and per-project under the Compute tab. The private key is shown only once at creation — store it safely.
:::

:::step{number=5 icon=LayoutTemplate title="Launch faster with templates" navigation="Sidebar > Compute & Storage > Templates"}
Templates are saved server blueprints — OS, size, and configuration bundled together like a recipe. Instead of choosing every setting each time, tenants and clients can launch from a template in a couple of clicks, which keeps deployments consistent.
:::

:::step{number=6 icon=Activity title="Instance details and lifecycle" navigation="Click any instance in the list"}
Opening an instance shows its full picture: resource usage and metrics, console access, attached storage volumes, network configuration, and lifecycle controls — **start**, **stop**, **restart**, and **delete**. This is where you operate a single server day to day.
:::

:::screenshot{caption="An instance's details page: metrics, network, storage, and lifecycle controls"}
:::
