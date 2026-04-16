---
title: Lattice Databases
subtitle: Manage fully managed database instances across your platform. Think of Lattice Databases as hiring a database expert who handles all the maintenance while you focus on your data.
prev: { label: Key Pairs, href: /admin-dashboard/docs/key-pairs }
next: { label: VPCs, href: /admin-dashboard/docs/vpcs }
---

:::step{number=1 icon=Database title="View All Databases" navigation="Sidebar > Infrastructure > Lattice Databases"}
The Lattice Databases page lists every managed database on your platform. You can see the database name, engine type (e.g. PostgreSQL), status, size, and which tenant owns it. This is your central view for all database infrastructure.
:::

:::screenshot{caption="Your Lattice Databases list"}
:::

:::step{number=2 icon=Plus title="Create a Database" navigation="Sidebar > Infrastructure > Lattice Databases > Create"}
Click create to provision a new managed database. Choose the engine (such as PostgreSQL), pick the instance size, set the storage amount, and assign it to a project. The platform handles installation, patching, and backups automatically.
:::

:::step{number=3 icon=Activity title="Monitoring & Details" navigation="Click any database in the list"}
Click on a database to see its full details — connection info, resource usage, storage metrics, and recent activity. You can also start, stop, or restart the database from here.
:::

:::step{number=4 icon=KeyRound title="Credential Rotation" navigation="Database Details > Credential Rotation"}
For active PostgreSQL databases, you can rotate the database credentials. This generates a new password without downtime — the old credentials are phased out safely. Credential rotation is important for maintaining security best practices.
:::

:::callout{type=info}
Credential rotation is only available for PostgreSQL databases that are in an active (running) state. If the database is stopped, start it first before rotating credentials.
:::

:::screenshot{caption="Your database details with credential rotation"}
:::

## Operation History

Every action performed on a database — creation, resize, credential rotation, restart — is recorded in the operation history. You can view past operations, check their status, and if something went wrong, retry or reconcile the operation.

- **Retry** re-runs a failed operation from the beginning.
- **Reconcile** attempts to fix a partially completed operation by finishing the remaining steps.

:::callout{type=tip}
If a database operation shows as failed, check the operation history for details before retrying. Sometimes a transient issue resolves itself, and reconciling is faster than a full retry.
:::
