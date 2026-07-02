---
title: Projects
subtitle: Projects are the top-level workspaces that group a customer's infrastructure — instances, networks, storage, and databases — inside a single availability zone. This guide walks creating one and reading its provisioning state.
prev: { label: Leads Management, href: /admin-dashboard/docs/leads }
next: { label: Instance Templates, href: /admin-dashboard/docs/templates }
---

A **project** is a self-contained workspace pinned to a single availability zone. Every instance, VPC, volume, and database a customer runs lives inside one. As a platform admin you can see every project across every tenant, create new ones on a customer's behalf, and watch their infrastructure provision in real time.

:::step{number=1 icon=FolderKanban title="Review every project on the platform" navigation="Sidebar > Compute & Storage > Projects"}
The Projects list is your control tower. Four summary cards across the top — **Total Projects**, **Active Projects**, **Provisioning**, and **Total Instances** — give you an at-a-glance health read. Below them, every project is listed with its **name**, short **identifier**, **status**, **region**, **availability zone**, and **creation date**.

Use **Search** to jump to a project by name or identifier, **Filters** to narrow by status or availability zone, and **Refresh** or **Sync All Statuses** to pull the latest provisioning state from the cloud.
:::

:::screenshot{caption="The Projects list: summary cards on top, every tenant's projects below"}
:::

:::callout{type=tip title="What each status means"}

- **Active** — fully provisioned and ready for workloads.
- **Provisioning** — infrastructure is being built right now.
- **Failed** — a provisioning step hit an error; the project is _not_ usable, and the pipeline shows exactly where it stopped.
- **Pending** — created but not yet started provisioning (for example, no availability zone assigned).

These statuses are honest: a project only reads **Active** once its networking actually exists. A failure is never hidden behind a green badge.
:::

:::step{number=2 icon=Plus title="Start a new project" navigation="Projects > Add Project"}
Click **Add Project** to open the workspace builder. Give the project a recognizable **name** (for example, `prod-lagos-web`) and an optional **description** so teammates understand its intent. The **Live summary** panel on the right updates as you fill the form, so you always see exactly what you are about to create before you commit.
:::

:::step{number=3 icon=Globe title="Choose region, type, and availability zone" navigation="Create Project > Region & Topology"}
Pick the **Default region** for the project's workloads, then choose a **Project type**:

- **VPC** — a standard network workspace (the common choice).
- **DVS** — a dedicated virtual segment for isolated networking.

Finally, select the **Availability Zone** the project's resources will physically live in. The Live summary reflects each choice instantly, including the resolved availability zone.
:::

:::step{number=4 icon=Network title="Pick a network preset" navigation="Create Project > Network preset"}
The network preset decides the VPC, subnets, and security rules the project starts with:

- **Standard** (recommended) — a public network with a public subnet, an internet gateway, and SSH / HTTP / HTTPS access. Best for web-facing workloads.
- **Private** — an internal-only network with a private subnet, no internet gateway, and internal traffic only. Best for back-office or data workloads.

You can also defer this and **choose the network during instance creation** instead, which keeps the project lightweight until its first workload.
:::

:::screenshot{caption="The Create Project builder with the Live summary reflecting region, availability zone, and network preset"}
:::

:::step{number=5 icon=Rocket title="Launch and watch the Infrastructure Pipeline" navigation="Create Project > Create Project"}
Click **Create Project** to launch. The project opens straight into its **Infrastructure Pipeline** — a live, step-by-step view of provisioning with an overall **% READY** bar. The pipeline runs in order:

1. Preparing the provisioning environment
2. Creating the cloud workspace
3. Syncing user access
4. Enabling the project for VPC
5. Assigning the edge network
6. Provisioning core networking
7. Detecting the VPC and subnets
8. Finalizing the project

Each step shows **Completed**, **In progress**, **Not started**, or **Failed**, with a timestamp so you can see exactly how provisioning unfolded.
:::

:::screenshot{caption="The Infrastructure Pipeline provisioning a new project, step by step"}
:::

:::callout{type=warning title="If provisioning fails, the pipeline tells you the truth"}
If a step errors, the pipeline stops there: that step is marked **Failed** with the time it happened, and every step after it reads **Blocked by an earlier failure** — never a misleading "completed." The project stays **Failed** rather than flipping to a green, empty shell, so you always know the infrastructure genuinely exists before anyone tries to use it. Provisioning automatically retries transient cloud errors several times before giving up.
:::

:::step{number=6 icon=LayoutDashboard title="Open a project to manage its resources" navigation="Click any project in the list"}
Opening a project reveals everything inside it — its instances, VPCs and subnets, storage volumes and buckets, databases, and activity. This is where day-to-day management happens, grouped neatly under one project so nothing gets lost across tenants.
:::

:::callout{type=tip title="One project per environment"}
Encourage customers to keep separate projects for **development**, **staging**, and **production**. It keeps resources organized, makes access control cleaner, and keeps billing easy to read per environment.
:::
