---
title: Shield DDoS Protection
subtitle: Manage DDoS protection, WAF, SSL, and DNS for domains across your platform. Shield provides enterprise-grade security that keeps your tenants' web applications safe from attacks.
prev: { label: Infrastructure Agent, href: /admin-dashboard/docs/agent }
next: { label: Products, href: /admin-dashboard/docs/products }
---

:::step{number=1 icon=LayoutDashboard title="Shield Overview Dashboard" navigation="Sidebar > Shield"}
The Shield overview gives you a bird's-eye view of DDoS protection across your entire platform. You can see the total number of protected domains, active threats being mitigated, traffic statistics, and the overall health of your security infrastructure. Think of it as a security command center -- one screen that tells you if everything is calm or if something needs attention.
:::

:::screenshot{caption="Shield overview dashboard with platform-wide statistics"}
:::

:::step{number=2 icon=Globe title="Managing Protected Domains" navigation="Sidebar > Shield > Domains"}
The domains list shows every website and application protected by Shield across all tenants. Each entry displays the domain name, which tenant owns it, the current protection mode, SSL status, and whether traffic is flowing normally. As an admin, you can see and manage domains for any tenant on the platform.
:::

:::screenshot{caption="Protected domains list showing all tenant domains"}
:::

:::step{number=3 icon=Plus title="Adding a New Domain" navigation="Sidebar > Shield > Domains > Add Domain"}
To protect a new domain, click "Add Domain" and provide the domain name, the origin server IP address (where the real website lives), and the port it listens on (usually 80 for HTTP or 443 for HTTPS). Shield acts as a protective shield between visitors and the origin server -- all traffic flows through Shield first, where malicious requests get filtered out before they can reach the actual server.
:::

:::callout{type=info}
After adding a domain, the tenant will need to update their DNS records to point to Shield's servers. Until DNS is updated, traffic will continue going directly to the origin server without protection.
:::

:::step{number=4 icon=ShieldCheck title="Protection Modes" navigation="Sidebar > Shield > Domains > Select Domain > Protection"}
Each domain can run in one of three protection modes. **Standard** mode provides always-on protection suitable for normal conditions. **Enhanced** mode adds stricter filtering and is useful when you notice increased suspicious activity. **Under Attack** mode activates maximum protection with aggressive challenge pages -- use this when a domain is actively being attacked. Think of these like threat levels: green, yellow, and red.
:::

:::callout{type=warning}
Under Attack mode may cause some legitimate visitors to see a brief challenge page before accessing the site. Only enable it during active attacks, and switch back to Standard or Enhanced once the attack subsides.
:::

:::step{number=5 icon=Globe title="DNS Record Management" navigation="Sidebar > Shield > Domains > Select Domain > DNS"}
Shield manages DNS records for each protected domain. You can add, edit, and remove records like A records (pointing to IP addresses), CNAME records (pointing to other domain names), MX records (for email), and TXT records (for verification). When a domain is protected by Shield, its DNS records route traffic through the protection network before forwarding clean traffic to the origin server.
:::

:::screenshot{caption="DNS record management for a protected domain"}
:::

:::step{number=6 icon=Lock title="SSL Certificate Management" navigation="Sidebar > Shield > Domains > Select Domain > SSL"}
Shield handles SSL certificates so your tenants' domains serve traffic over secure HTTPS connections. There are two options: **Auto-provision** lets Shield automatically generate and renew free SSL certificates -- this is the easiest approach and works for most domains. **Custom upload** lets you upload your own certificate files if the tenant has a specific certificate they need to use (like an EV certificate with the company name in the browser bar).
:::

:::callout{type=tip}
Auto-provisioned certificates are recommended for most domains. They renew automatically before expiration, so you never have to worry about expired certificates causing browser warnings for your tenants' visitors.
:::

:::step{number=7 icon=ShieldAlert title="Firewall Rules" navigation="Sidebar > Shield > Domains > Select Domain > Firewall"}
The firewall section gives you fine-grained control over what traffic gets through. **WAF rules** (Web Application Firewall) protect against common web attacks like SQL injection and cross-site scripting. **IP lists** let you whitelist trusted addresses (always allow), blacklist known bad actors (always block), or greylist suspicious IPs (challenge before allowing). **Geo-filtering** lets you block or allow traffic from entire countries -- useful if a domain only serves customers in specific regions.
:::

:::screenshot{caption="Firewall rules and IP access list management"}
:::

:::step{number=8 icon=Map title="Attack Map Visualization" navigation="Sidebar > Shield > Attack Map"}
The attack map provides a real-time geographic visualization of incoming attacks. You can see where malicious traffic originates, which domains are being targeted, and the volume of attack traffic. It is a powerful visual tool for understanding threat patterns and can help you decide whether to enable geo-filtering for specific regions that are sources of repeated attacks.
:::

:::screenshot{caption="Real-time attack map showing geographic threat data"}
:::

:::step{number=9 icon=BarChart3 title="Analytics and Attack History" navigation="Sidebar > Shield > Analytics"}
The analytics section shows detailed traffic data and attack history. You can view total requests, blocked threats, bandwidth usage, and response times over different time periods. The attack history log records every detected attack with details like the attack type (volumetric, application-layer, etc.), duration, peak traffic volume, and how Shield mitigated it. This data is valuable for security reporting and understanding threat trends.
:::

:::screenshot{caption="Shield analytics with traffic and attack data"}
:::

:::step{number=10 icon=Users title="Tenant Usage Monitoring" navigation="Sidebar > Shield > Usage"}
As a platform admin, you can monitor how each tenant uses Shield. This includes the number of protected domains per tenant, total traffic processed, attacks mitigated, and resource consumption. This information helps with capacity planning and identifying tenants that may need upgraded protection tiers or additional support during heavy attack periods.
:::

:::callout{type=tip}
Review tenant usage regularly to ensure no single tenant is consuming a disproportionate share of Shield resources. If a tenant is frequently targeted, consider working with them to optimize their firewall rules and enable geo-filtering to reduce the attack surface.
:::
