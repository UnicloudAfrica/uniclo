---
title: Key Pairs
subtitle: Key pairs let you log into your servers securely without typing a password. Think of a key pair like a special lock and key -- only someone with the matching key can open the door.
prev: { label: Instance Templates, href: /dashboard/docs/templates }
next: { label: Security Groups, href: /dashboard/docs/security-groups }
---

:::step{number=1 icon=Key title="View Your Key Pairs" navigation="Sidebar > Infrastructure > Key Pairs"}
The key pairs page lists all SSH keys associated with your account. Each entry shows the key name, fingerprint, and when it was created. These keys are used to securely connect to your servers.
:::

:::screenshot{caption="Your Key Pairs list page"}
:::

:::step{number=2 icon=Plus title="Create a New Key Pair" navigation="Sidebar > Infrastructure > Key Pairs > New"}
Click "New" to generate a fresh key pair. Give it a descriptive name (like "my-laptop" or "deploy-server") and click create. The platform generates a public key and a private key. The private key file downloads to your computer automatically -- save it somewhere safe because you cannot download it again.
:::

:::step{number=3 icon=Upload title="Import an Existing Key"}
Already have an SSH key on your computer? You can import the public half instead of generating a new one. Just paste your public key contents and give it a name.
:::

:::screenshot{caption="Your Import key form"}
:::

:::callout{type=tip}
Never share your private key with anyone. The public key goes on the server, and the private key stays on your computer. If you lose your private key, create a new key pair and update your servers.
:::
