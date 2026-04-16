---
title: Managed Databases
subtitle: A database is like a super-organized notebook that your applications use to store and retrieve information very quickly. 'Managed' means we take care of all the maintenance -- backups, updates, and keeping it running -- so you can focus on building your application.
prev: { label: Storage, href: /client-dashboard/docs/storage }
next: { label: Billing, href: /client-dashboard/docs/billing }
---

:::step{number=1 icon=Database title="View Your Databases" navigation="Sidebar > Infrastructure > Lattice Databases"}
See all your database instances. Each one shows its name, what type it is, whether it is running, and its size. Green means it is healthy and running.
:::

:::screenshot{caption="Your Managed Databases list"}
:::

:::step{number=2 icon=Plus title="Create a Database" navigation="Lattice Databases > Create"}
The creation wizard asks a few simple questions: what type of database you need, how big it should be, and where it should live (which region). Do not worry about picking the "wrong" type -- if you are unsure, the default option is a great starting point.
:::

:::screenshot{caption="Your Create Database form"}
:::

:::callout{type=tip}
Start with the smallest size that meets your needs. You can always upgrade later if your application grows. Upgrading is easy -- downsizing is harder.
:::

:::step{number=3 icon=Link title="Connect Your Application" navigation="Database Details > Connection Info"}
After creating a database, you will get connection details -- a hostname, port, username, and password. Your application uses these to talk to the database. It is like getting the address and key to a storage unit.
:::

:::callout{type=warning}
Keep your database credentials secret! Never put them in public code repositories or share them in chat messages. Treat them like your bank PIN.
:::

:::step{number=4 icon=Activity title="Monitor Health" navigation="Database Details > Monitoring"}
Keep an eye on your database's health metrics -- storage space, CPU usage, and number of connections. If you see metrics consistently high, it might be time to upgrade.
:::

## Managing Your Database

:::step{number=5 icon=KeyRound title="Rotate Credentials" navigation="Database Details > Settings > Rotate Credentials"}
Just like changing your passwords regularly keeps your email safe, rotating your database credentials keeps your data safe. When you rotate credentials:

1. Go to your database's detail page
2. Open the **Settings** tab
3. Click **Rotate Credentials**
4. New credentials are generated automatically
5. Copy the new credentials and update your application

It is like getting a new key to your storage unit -- the old key stops working and you use the new one from now on.
:::

:::callout{type=warning title="Update your apps!"}
After rotating credentials, make sure to update every application that connects to this database. The old credentials will stop working immediately. If you forget to update an app, it will lose access until you give it the new credentials.
:::

:::step{number=6 icon=ListChecks title="Operation History" navigation="Database Details > Operations"}
Every important change to your database is tracked. You can see what happened, when, and whether it succeeded. If something went wrong, you have two options:

- **Retry** -- try the operation again (available for failed operations)
- **Reconcile** -- fix an operation that partially completed (rare, but the system will tell you when it is needed)

Think of it like a delivery tracking page -- you can see every step and what to do if something gets stuck.
:::

:::callout{type=info title="Coming Soon: Database Resize"}
Soon you will be able to resize your database (more storage, more power) directly from the dashboard. The pricing calculator already shows resize costs, but the actual resize feature is still being completed. You will never be charged for a resize until it is fully executed.
:::

:::mermaid{caption="Credential rotation -- what happens when you click Rotate"}
graph TD
A[You click Rotate Credentials] --> B[New credentials are created safely]
B --> C[Applied to your database]
C --> D{Did it work?}
D -->|Yes| E[Done! Copy your new credentials]
D -->|No| F[Operation shows as failed -- click Retry]
:::
