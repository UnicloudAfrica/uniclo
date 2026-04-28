---
title: Shield DDoS Protection
subtitle: Protect your domains with enterprise-grade DDoS mitigation, WAF, and SSL management. Shield keeps your web applications running smoothly even during attacks.
prev: { label: Infrastructure Agent, href: /dashboard/docs/agent }
next: { label: Revenue, href: /dashboard/docs/revenue }
---

:::step{number=1 icon=ShieldCheck title="Your Protected Domains" navigation="Sidebar > Shield > Domains"}
The Shield domains page shows all the websites and applications you have added for protection. Each domain displays its current status, protection mode, SSL certificate status, and traffic summary. Think of Shield as a security guard standing between the internet and your web servers -- it checks every visitor and only lets the legitimate ones through.
:::

:::screenshot{caption="Your list of protected domains"}
:::

:::step{number=2 icon=Plus title="Adding a Domain" navigation="Sidebar > Shield > Domains > Add Domain"}
To protect a new domain, click "Add Domain" and enter the domain name (like example.com), the origin server IP address (the server where your website actually runs), and the port number (usually 443 for HTTPS or 80 for HTTP). After adding the domain, you will need to verify ownership by adding a DNS record provided by Shield.
:::

:::callout{type=info}
Domain verification usually takes just a few minutes. Shield gives you a TXT record to add to your domain's DNS. Once verified, you will update your domain's nameservers or add a CNAME record to route traffic through Shield's protection network.
:::

:::step{number=3 icon=ShieldAlert title="Managing Protection Modes" navigation="Sidebar > Shield > Domains > Select Domain > Protection"}
Each domain has three protection modes you can switch between. **Standard** is the default and handles everyday threats automatically. **Enhanced** adds stricter filtering when you notice unusual traffic patterns. **Under Attack** is the emergency mode -- it presents challenge pages to visitors and applies maximum filtering. Switch between modes based on what your traffic looks like.
:::

:::callout{type=warning}
Under Attack mode adds a brief challenge page that all visitors must pass before reaching your site. This is very effective against attacks but can slow down legitimate visitors. Use it only when you are actively being attacked, and switch back to Standard or Enhanced afterward.
:::

:::step{number=4 icon=Globe title="DNS Setup for Your Domains" navigation="Sidebar > Shield > Domains > Select Domain > DNS"}
The DNS section lets you manage DNS records for your protected domains. After adding a domain, Shield provides you with the DNS records needed to route traffic through the protection network. You can also manage additional records like MX (for email), TXT (for verification services), and CNAME records. Shield keeps your DNS fast and reliable with its global network.
:::

:::screenshot{caption="DNS records for your protected domain"}
:::

:::step{number=5 icon=Lock title="SSL Certificates" navigation="Sidebar > Shield > Domains > Select Domain > SSL"}
Shield can automatically provision and renew SSL certificates for your domains at no extra cost. This means your websites will always have valid HTTPS -- the padlock icon visitors look for in their browser. If you have your own SSL certificate (from a certificate authority you already use), you can upload it instead. Auto-provisioned certificates are the simplest option and work well for most domains.
:::

:::callout{type=tip}
If you use auto-provisioned SSL, Shield handles renewals automatically. You will never get those stressful "certificate expiring" warnings. For custom certificates, make sure to upload the new one before the old one expires.
:::

:::step{number=6 icon=Filter title="Firewall Rules and IP Access Lists" navigation="Sidebar > Shield > Domains > Select Domain > Firewall"}
The firewall gives you control over who can access your domains. **WAF rules** automatically block common web attacks like SQL injection and cross-site scripting -- these are enabled by default and protect your applications without any configuration. **IP access lists** let you whitelist trusted IPs (always allow), blacklist known bad IPs (always block), or greylist suspicious ones (challenge first). **Geo-filtering** lets you restrict access by country if your service only operates in certain regions.
:::

:::screenshot{caption="Firewall rules and IP access list configuration"}
:::

:::step{number=7 icon=BarChart3 title="Attack History and Analytics" navigation="Sidebar > Shield > Analytics"}
The analytics page shows you how Shield is protecting your domains. You can see total traffic, how many threats were blocked, bandwidth usage, and attack history. Each recorded attack shows when it happened, what type it was, how long it lasted, and how Shield handled it. This is useful for understanding your security posture and reporting to your own clients about how their domains are being protected.
:::

:::screenshot{caption="Shield analytics showing traffic and blocked threats"}
:::

:::callout{type=tip}
Check your analytics regularly, especially after enabling a new domain. The first few days will show you the baseline traffic pattern, making it easier to spot anomalies later. If you see a spike in blocked requests, it means Shield is doing its job.
:::
