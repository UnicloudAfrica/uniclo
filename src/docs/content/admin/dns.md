---
title: DNS Zones
subtitle: Manage domain names and DNS records for your platform. DNS is the internet's phone book — it translates friendly names like example.com into the IP addresses that computers use.
prev: { label: Load Balancers, href: /admin-dashboard/docs/load-balancers }
next: { label: Replication Policies, href: /admin-dashboard/docs/replication }
---

:::step{number=1 icon=Globe2 title="View All DNS Zones" navigation="Sidebar > Networking > DNS Zones"}
The DNS zones page lists all managed domains on your platform. Each zone represents a domain (like example.com) and contains records that map names to addresses. You can see the zone name, record count, and status.
:::

:::screenshot{caption="Your DNS Zones list"}
:::

:::step{number=2 icon=Plus title="Create a DNS Zone" navigation="Sidebar > Networking > DNS Zones > Create"}
Click create to add a new DNS zone. Enter the domain name and the platform will set up the zone for you. After creation, you will need to update your domain registrar to point to the provided nameservers.
:::

:::step{number=3 icon=FileText title="Manage DNS Records" navigation="Click any DNS zone > Records"}
Click on a zone to manage its records. Common record types include:

- **A records** — point a domain name to an IP address
- **CNAME records** — point a domain name to another domain name (like an alias)

Add, edit, or delete records as needed to route traffic correctly.
:::

:::callout{type=info}
DNS changes can take a few minutes to propagate across the internet. If a new record does not seem to work immediately, wait a few minutes and try again.
:::
