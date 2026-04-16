---
title: DNS Zones
subtitle: DNS turns human-friendly domain names (like example.com) into IP addresses that computers understand. Think of it as the phone book of the internet -- it translates names into numbers.
prev: { label: Load Balancers, href: /dashboard/docs/load-balancers }
next: { label: Migrations, href: /dashboard/docs/migrations }
---

:::step{number=1 icon=Globe title="View Your DNS Zones" navigation="Sidebar > Networking > DNS Zones"}
The DNS zones page lists all the domains you manage. Each zone represents one domain (like example.com) and contains the records that tell the internet where to find your services.
:::

:::screenshot{caption="Your DNS Zones list page"}
:::

:::step{number=2 icon=Plus title="Create a DNS Zone" navigation="Sidebar > Networking > DNS Zones > New"}
Click "New" and enter your domain name to create a zone. Once created, you will be given nameserver addresses. Point your domain registrar to these nameservers so the platform can manage your DNS.
:::

:::step{number=3 icon=FileText title="Manage DNS Records"}
Inside each zone, you add records that map names to addresses:

- **A Record** -- Points a domain to an IPv4 address
- **AAAA Record** -- Points a domain to an IPv6 address
- **CNAME Record** -- Points a domain to another domain name
- **MX Record** -- Tells email where to go
- **TXT Record** -- Stores text data, often used for verification
  :::

:::screenshot{caption="Your DNS records editor"}
:::

:::callout{type=tip}
DNS changes can take a few minutes to spread across the internet. If your new record does not seem to work right away, give it some time before troubleshooting.
:::
