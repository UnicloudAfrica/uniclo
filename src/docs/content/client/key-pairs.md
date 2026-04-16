---
title: Key Pairs
subtitle: SSH keys are like special passwords for securely accessing your servers. Instead of typing a password every time, you use a pair of digital keys -- one public (like a lock) and one private (like the key that opens it).
prev: { label: Compute, href: /client-dashboard/docs/compute }
next: { label: Security Groups, href: /client-dashboard/docs/security-groups }
---

:::step{number=1 icon=Key title="What are Key Pairs?" navigation="Sidebar > Infrastructure > Key Pairs"}
A key pair has two parts: a **public key** and a **private key**. The public key goes on your server (like installing a lock on your front door). The private key stays on your computer (like the key in your pocket). When you connect, the two halves match up and you get in -- no password needed.
:::

:::screenshot{caption="Your Key Pairs page"}
:::

:::step{number=2 icon=Plus title="Create a New Key Pair" navigation="Sidebar > Infrastructure > Key Pairs > Create"}
Click "Create" to generate a new key pair. Give it a name you will remember (like "my-laptop-key"). The system will create both keys for you and immediately download the private key file. Save this file somewhere safe on your computer -- you will only get to download it once.
:::

:::screenshot{caption="Creating a new key pair"}
:::

:::callout{type=warning}
Never share your private key with anyone. If you lose it, you will need to create a new key pair. Treat it like your house key -- if someone else gets a copy, they can walk right in.
:::

:::step{number=3 icon=Upload title="Import an Existing Key" navigation="Sidebar > Infrastructure > Key Pairs > Import"}
Already have an SSH key on your computer? You can import it instead of creating a new one. Just paste your public key (the one that ends in `.pub`) and give it a name. This is handy if you use the same key across multiple services.
:::
