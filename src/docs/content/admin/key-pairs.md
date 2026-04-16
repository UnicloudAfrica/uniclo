---
title: Key Pairs
subtitle: Manage SSH keys for secure server access. Key pairs are like special locks and keys — the public key goes on the server (the lock) and the private key stays with you (the key that opens it).
prev: { label: Instance Templates, href: /admin-dashboard/docs/templates }
next: { label: Lattice Databases, href: /admin-dashboard/docs/databases }
---

:::step{number=1 icon=Key title="View All Key Pairs" navigation="Sidebar > Infrastructure > Key Pairs"}
The key pairs page lists all SSH keys across your platform. You can see the key name, which tenant or project it belongs to, and when it was created. These keys are used to securely connect to instances via SSH instead of using passwords.
:::

:::screenshot{caption="Your Key Pairs list"}
:::

:::step{number=2 icon=Plus title="Create a Key Pair" navigation="Sidebar > Infrastructure > Key Pairs > Create Key Pair"}
Click create to generate a new key pair. The platform creates a public and private key. The public key is stored on the platform, and the private key is downloaded to your computer. Keep the private key safe — if you lose it, you cannot recover it.
:::

:::step{number=3 icon=Upload title="Import an Existing Key" navigation="Sidebar > Infrastructure > Key Pairs > Import"}
Already have an SSH key? You can import your existing public key instead of generating a new one. Just paste in the public key content and give it a name.
:::

:::callout{type=warning}
Never share your private key with anyone. If a private key is compromised, delete the key pair immediately and create a new one. The private key is only shown once at creation time.
:::
