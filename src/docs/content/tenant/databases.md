---
title: Managed Databases
subtitle: Databases store structured data for applications -- like a super-organized spreadsheet that applications can read and write to very quickly. 'Managed' means we handle all the maintenance for you.
prev: { label: Storage, href: /dashboard/docs/storage }
next: { label: Billing & Revenue, href: /dashboard/docs/billing }
---

:::step{number=1 icon=Database title="View Your Databases" navigation="Sidebar > Infrastructure > Lattice Databases"}
See all your managed database instances. Each one shows its name, engine type, status (running, creating, etc.), and size.
:::

:::screenshot{caption="Your Managed Databases list"}
:::

:::step{number=2 icon=Plus title="Create a Database" navigation="Lattice Databases > Create"}
Click "Create" to provision a new database. You will choose the database engine (the type of database), the version, and the size (how much storage and computing power). The wizard guides you through each step.
:::

:::screenshot{caption="Your Create Database wizard"}
:::

:::callout{type=info}
Different database engines are good for different things. If you are not sure which to pick, start with the most popular option -- you can always create another one later.
:::

:::step{number=3 icon=Settings title="Database Configuration" navigation="Click any database for details"}
Click on a database to see its full configuration: connection details (how applications connect to it), backup schedule, and performance metrics.
:::

:::step{number=4 icon=Activity title="Monitoring" navigation="Database Details > Metrics tab"}
Keep an eye on your database's health -- CPU usage, memory, storage space, and connection count. If any metric looks too high, it might be time to upgrade to a larger size.
:::

:::callout{type=tip}
Always keep your connection details secure. Never share database credentials in public places like chat messages or code repositories.
:::

## Database Operations

:::step{number=5 icon=KeyRound title="Rotate Credentials" navigation="Database Details > Settings > Rotate Credentials"}
For security best practice, you should periodically rotate (change) your database credentials. This generates a brand new username and password -- the old ones stop working immediately. Think of it like changing the password on your email.

1. Open the database detail page
2. Go to the Settings tab
3. Click "Rotate Credentials"
4. Confirm the rotation
5. Copy the new credentials and update your applications

The rotation happens in the background. You can watch the progress in the **Operations** section.
:::

:::callout{type=warning title="Important"}
After rotating credentials, you must update all applications that connect to this database with the new credentials. The old username and password will no longer work.
:::

:::step{number=6 icon=ListChecks title="Operation History" navigation="Database Details > Operations"}
Every significant action on your database -- credential rotations, resizes, and other changes -- is tracked as an operation. You can see:

- **Status**: whether it is running, completed, failed, or needs attention
- **What happened**: the type of operation and when it ran
- **Retry**: if an operation failed, you can retry it with one click
- **Reconcile**: if an operation is stuck in an inconsistent state, use reconcile to fix it
  :::

:::callout{type=info title="Current Limitation"}
Database resize is coming soon. The pricing and billing preview is already available, but the actual resize execution is still being built. You will not be charged for a resize that has not been executed.
:::

:::mermaid{caption="Credential rotation flow"}
graph TD
A[Click Rotate Credentials] --> B[New credentials generated & encrypted]
B --> C[Credentials applied to live database]
C --> D{Success?}
D -->|Yes| E[Operation completed -- copy new credentials]
D -->|No - Runtime failed| F[Operation marked failed -- retry available]
D -->|No - Save failed| G[Operation needs reconcile]
:::
