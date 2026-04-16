---
title: Storage & Databases
subtitle: Manage all the data storage on your platform — from file storage to databases to backups. Think of it as managing all the filing cabinets, notebooks, and photo albums in your building.
prev: { label: Networking, href: /admin-dashboard/docs/networking }
next: { label: Onboarding, href: /admin-dashboard/docs/onboarding }
---

:::step{number=1 icon=HardDrive title="Object Storage" navigation="Sidebar > Infrastructure > Silo Storage"}
Object storage is like an infinitely expandable filing cabinet in the cloud. Users create "buckets" (like drawers) and store files in them. You can see all storage accounts across all tenants, check usage, and manage configurations.
:::

:::screenshot{caption="Your Object Storage accounts list"}
:::

:::step{number=2 icon=Database title="Managed Databases" navigation="Sidebar > Infrastructure > Lattice Databases"}
Managed databases are databases where someone else handles all the maintenance — backups, updates, and keeping things running smoothly. You just use the database without worrying about the plumbing. View all databases across tenants, create new ones, and monitor their health.
:::

:::screenshot{caption="Your Managed Databases list"}
:::

:::callout{type=tip}
Managed databases support various engines. When creating one, you will choose the engine type, version, and size that best fits the use case.
:::

## Database Operations

:::step{number=3 icon=KeyRound title="Credential Rotation" navigation="Database Details > Settings > Rotate Credentials"}
For security, database credentials should be rotated periodically. The credential rotation feature lets you generate new usernames and passwords for a managed database without downtime. Think of it like changing the locks on a door -- the old key stops working and a new one takes over.

- Only available for **active PostgreSQL** databases
- Only **one rotation can run at a time** per database
- New credentials are encrypted before touching the live database
- If something goes wrong mid-rotation, the operation moves to a "needs reconcile" state rather than silently drifting
  :::

:::step{number=4 icon=ListChecks title="Operation History" navigation="Database Details > Operations tab"}
Every managed database now tracks its operations -- credential rotations, resizes, and other lifecycle changes. You can see:

- **Status**: running, completed, failed, or needs_reconcile
- **Type**: what kind of operation (e.g. credential rotation)
- **Timeline**: when it started and finished
- **Retry**: re-run a failed operation
- **Reconcile**: fix operations stuck in a "needs reconcile" state
  :::

:::callout{type=warning title="Resize Limitation"}
Managed database resize is not yet end-to-end. The preview and billing logic exists, but the actual runtime resize executor is still being implemented. The platform intentionally blocks resize confirmation until this is complete -- so you cannot accidentally charge for a resize that does not execute.
:::

:::step{number=5 icon=Camera title="Snapshots" navigation="Sidebar > Networking > Snapshots"}
Snapshots are photographs of a server's disk at a specific moment in time. If something goes wrong, you can restore from a snapshot — like using a time machine. View and manage all snapshots across the platform.
:::

:::step{number=6 icon=Image title="Images" navigation="Sidebar > Networking > Images"}
Images are complete blueprints of a server — the operating system, installed software, and configuration. They are used as starting points when creating new instances. Manage the available images and their replication across regions.
:::
