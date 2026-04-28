---
title: Shield DDoS Protection
subtitle: Protect your websites and applications from DDoS attacks with enterprise-grade security. Shield automatically detects and mitigates threats so your services stay online.
prev: { label: Infrastructure Agent, href: /client-dashboard/docs/agent }
next: { label: Pricing Calculator, href: /client-dashboard/docs/pricing-calculator }
---

:::step{number=1 icon=ShieldCheck title="Your Protected Domains" navigation="Sidebar > Shield > Domains"}
The Shield page shows all the domains (websites) you have added for protection. Each domain displays whether it is active, what protection level it is using, and whether its SSL certificate is valid. Think of Shield like a bouncer at a club -- it stands at the door, checks everyone coming in, and only lets real visitors through while keeping troublemakers out.
:::

:::screenshot{caption="Your list of protected domains"}
:::

:::step{number=2 icon=Plus title="Adding a Domain for Protection" navigation="Sidebar > Shield > Domains > Add Domain"}
To protect a website, click "Add Domain" and enter your domain name (like mywebsite.com), the IP address of the server where your site is hosted, and the port it runs on (443 for HTTPS is most common). After adding it, Shield will give you simple instructions to update your DNS so traffic flows through the protection network. The whole process takes just a few minutes.
:::

:::callout{type=info}
You will need access to your domain's DNS settings to complete the setup. If you are not sure how to change DNS records, your domain registrar's support team can help. Shield provides the exact records you need to add.
:::

:::step{number=3 icon=ShieldAlert title="Understanding Protection Modes" navigation="Sidebar > Shield > Domains > Select Domain > Protection"}
Your domain can run in three protection modes. **Standard** is the everyday setting that quietly blocks malicious traffic without your visitors noticing. **Enhanced** turns up the sensitivity for times when you suspect something is off. **Under Attack** is the emergency button -- it challenges every visitor with a quick verification to stop attacks in their tracks. You can switch between modes at any time.
:::

:::callout{type=tip}
For most websites, Standard mode is all you need. Shield is smart enough to detect and block the vast majority of attacks automatically. Only switch to Enhanced or Under Attack if you notice your site slowing down or if you are alerted to an ongoing attack.
:::

:::step{number=4 icon=Globe title="Managing DNS Records" navigation="Sidebar > Shield > Domains > Select Domain > DNS"}
The DNS section shows the records that tell the internet how to find your website. When you protect a domain with Shield, your DNS is configured to send visitors through Shield first. You can also manage other records here, like MX records (so your email works correctly) and TXT records (for verifying your domain with other services).
:::

:::screenshot{caption="DNS records for your domain"}
:::

:::step{number=5 icon=Lock title="SSL Certificate Status" navigation="Sidebar > Shield > Domains > Select Domain > SSL"}
SSL certificates are what give your website the padlock icon and "https://" in the browser. Shield automatically provides and renews SSL certificates for your domains, so your visitors always see a secure connection. You do not need to buy or manage certificates yourself -- it is all handled for you. If you prefer to use your own certificate, you can upload it here instead.
:::

:::step{number=6 icon=Filter title="Firewall and IP Rules" navigation="Sidebar > Shield > Domains > Select Domain > Firewall"}
The firewall protects your site from common web attacks automatically. You can also create your own rules: add trusted IP addresses to a whitelist so they are never blocked, add known bad IPs to a blacklist to block them permanently, or use geo-filtering to only allow visitors from specific countries. Most users do not need to change the default settings -- they work well out of the box.
:::

:::screenshot{caption="Firewall settings and IP rules"}
:::

:::callout{type=tip}
If you manage your website from a fixed IP address, consider adding it to the whitelist. This ensures you are never accidentally blocked, even during Under Attack mode.
:::

:::step{number=7 icon=BarChart3 title="Viewing Attack History" navigation="Sidebar > Shield > Analytics"}
The analytics page shows your traffic history and any attacks that Shield has blocked. You can see how many visitors your site received, how many malicious requests were stopped, and details about any attacks -- like when they happened and how long they lasted. It is reassuring to see Shield working behind the scenes, especially after you learn it blocked thousands of bad requests you never even knew about.
:::

:::screenshot{caption="Attack history and traffic analytics"}
:::
