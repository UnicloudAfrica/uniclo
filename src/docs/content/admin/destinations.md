---
title: Destinations
subtitle: Configure where your backups and replicated data are stored. Destinations are the target locations for your disaster recovery data — like choosing which warehouse to send your backup copies to.
prev: { label: Migrations, href: /admin-dashboard/docs/migrations }
next: { label: Infrastructure Agent, href: /admin-dashboard/docs/agent }
---

:::step{number=1 icon=MapPin title="View All Destinations" navigation="Sidebar > Disaster Recovery > Destinations"}
The destinations page lists all configured backup and replication targets. Each destination defines a storage location where backup data is sent. You can see the name, type, region, and connection status.
:::

:::screenshot{caption="Your Destinations list"}
:::

:::step{number=2 icon=Plus title="Add a Destination" navigation="Sidebar > Disaster Recovery > Destinations > Create"}
Click create to add a new destination. Choose the destination type, enter the connection details, and test the connection. Once verified, this destination becomes available for use in replication policies and backup configurations.
:::

:::step{number=3 icon=CheckCircle title="Test Connection" navigation="Click any destination > Test"}
Always test the connection after creating or editing a destination. A successful test confirms that the platform can reach the storage location and write data to it.
:::

:::callout{type=info}
Keep your destination credentials up to date. If credentials expire, backups and replication will fail silently until the connection is restored.
:::
