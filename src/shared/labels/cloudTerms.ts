/**
 * Friendly names for cloud resources, plus "explain like I'm 5" descriptions
 * for every product. Customers should never see provider names (Zadara, Nobus,
 * OpenStack) or upstream project names (Heat, Magnum, Cinder, Manila, Barbican,
 * Glance) in the UI.
 *
 * Use these for every page title, button, badge, and tooltip. If you need a
 * label not in this map, add it here — don't hardcode strings in pages.
 */

export interface CloudTerm {
  singular: string;
  plural: string;
  /** One short tagline. Shown under the page heading. */
  description: string;
  /** ELI5 — like talking to a 5-year-old. Shown in info card / tooltip. */
  eli5: string;
  /** Call-to-action button label. */
  cta?: string;
  /** Real-world analogy customers can relate to. */
  analogy?: string;
}

export const CLOUD_TERMS: Record<string, CloudTerm> = {
  blueprint: {
    singular: "Blueprint",
    plural: "Blueprints",
    description: "Define your infrastructure once and deploy it as a single, repeatable unit.",
    eli5:
      "A Blueprint is like a recipe. You write down everything you want — say, three computers, a network, and a database — and we build them all at once. If you mess up, you throw the whole recipe away and the kitchen is clean again.",
    analogy: "Like a Lego instruction booklet — you build the same castle every time without thinking.",
    cta: "New Blueprint",
  },
  cluster: {
    singular: "Kubernetes Cluster",
    plural: "Kubernetes Clusters",
    description: "Run your containerised applications on managed Kubernetes.",
    eli5:
      "A Cluster is a team of computers that work together to run your app. If one gets sick, the others keep going. You tell us how many helpers you need, and we put them in a team for you.",
    analogy: "Like a team of kids carrying a big box together — one drops, the others still hold it.",
    cta: "New Cluster",
  },
  sharedDrive: {
    singular: "Shared Drive",
    plural: "Shared Drives",
    description: "Network drives mountable across multiple machines.",
    eli5:
      "A Shared Drive is a magic folder. Lots of computers can open it at the same time and they all see the same files. If one computer adds a picture, everyone else sees it right away.",
    analogy: "Like the family fridge — everyone can open it and grab what they need.",
    cta: "New Shared Drive",
  },
  secret: {
    singular: "Secret",
    plural: "Secrets",
    description: "Securely store passwords, API keys, and certificates.",
    eli5:
      "A Secret is a locked box. You put a password or a key inside, and only the people you trust can open it. We promise nobody else can peek.",
    analogy: "Like hiding a chocolate bar where only you and your best friend know the spot.",
    cta: "Store Secret",
  },
  backupPlan: {
    singular: "Backup Plan",
    plural: "Backup Plans",
    description: "Schedule automatic backups of your disks and machines.",
    eli5:
      "A Backup Plan takes a picture of your computer's stuff every day (or every hour). If you break something tomorrow, we can put it back the way it was using the picture.",
    analogy: "Like taking a photo of your Lego before bed in case the dog knocks it over.",
    cta: "New Backup Plan",
  },
  bareMetalNode: {
    singular: "Dedicated Server",
    plural: "Dedicated Servers",
    description: "Physical machines, not shared with anyone else.",
    eli5:
      "A Dedicated Server is a whole real computer just for you. No other kids are using it at the same time. It's faster, but you have to take care of all of it.",
    analogy: "Like having your own bedroom instead of sharing one with your siblings.",
    cta: "Allocate Server",
  },
  instance: {
    singular: "Virtual Machine",
    plural: "Virtual Machines",
    description: "Cloud computers you can turn on and off whenever you need them.",
    eli5:
      "A Virtual Machine is a pretend computer that lives in our giant computer room. You can use it like any laptop, but when you don't need it anymore you just throw it away and the room cleans itself.",
    analogy: "Like a hotel room — you check in, use it, check out. Someone else cleans it.",
    cta: "Launch Machine",
  },
  vm: {
    singular: "Virtual Machine",
    plural: "Virtual Machines",
    description: "Cloud computers you can turn on and off whenever you need them.",
    eli5: "A pretend computer that lives in our data centre. Use it like a laptop.",
    cta: "Launch Machine",
  },
  disk: {
    singular: "Disk",
    plural: "Disks",
    description: "Storage you can attach to your machines.",
    eli5:
      "A Disk is a place to keep your computer's stuff. You can plug it into a Virtual Machine, fill it up, and unplug it later if you don't need it.",
    analogy: "Like a USB stick you can plug into different computers.",
    cta: "Create Disk",
  },
  diskImage: {
    singular: "Disk Image",
    plural: "Disk Images",
    description: "Pre-made setups you can use to start a new machine instantly.",
    eli5:
      "A Disk Image is a ready-made computer setup. Pick one (like Ubuntu or Windows) and we copy it onto your new machine in seconds, so you don't have to build it from scratch.",
    analogy: "Like a frozen pizza — already made, just put it in the oven.",
  },
  network: {
    singular: "Private Network",
    plural: "Private Networks",
    description: "A walled-off space where only your machines can talk to each other.",
    eli5:
      "A Private Network is a secret club for your computers. They can chat with each other, but no strangers from the internet can listen in.",
    analogy: "Like a walkie-talkie channel only you and your friends know.",
    cta: "New Private Network",
  },
  subnet: {
    singular: "Subnet",
    plural: "Subnets",
    description: "A smaller section inside a private network.",
    eli5: "A small room inside the secret club where some of your computers hang out.",
  },
  publicIp: {
    singular: "Public IP",
    plural: "Public IPs",
    description: "A public address so the internet can find your machine.",
    eli5:
      "A Public IP is your machine's home address. Without one, no one on the internet can find your computer. With one, anybody can ring the doorbell.",
    analogy: "Like writing your house address so the postman can find you.",
    cta: "Allocate Public IP",
  },
  firewall: {
    singular: "Firewall",
    plural: "Firewalls",
    description: "Rules deciding who's allowed to talk to your machines.",
    eli5:
      "A Firewall is the bouncer at your computer's door. You write down the list of who's allowed in, and the bouncer turns everyone else away.",
    analogy: "Like a bouncer at a party with a guest list.",
    cta: "New Firewall",
  },
  keyPair: {
    singular: "SSH Key",
    plural: "SSH Keys",
    description: "Your private key for logging in to a machine securely.",
    eli5:
      "An SSH Key is a special key that fits the lock on your computer. Without it, you can't get in. We never see the secret part — only you do.",
    analogy: "Like the key to your front door. Don't lose it.",
    cta: "Add SSH Key",
  },
  loadBalancer: {
    singular: "Load Balancer",
    plural: "Load Balancers",
    description: "Spreads traffic across many machines so none of them gets too busy.",
    eli5:
      "A Load Balancer is a traffic cop. When lots of people visit your website, the cop sends some to Computer A, some to Computer B, so no one gets squished.",
    analogy: "Like the lunch lady making sure every table has a chicken nugget, not all on one table.",
    cta: "New Load Balancer",
  },
  region: {
    singular: "Region",
    plural: "Regions",
    description: "A geographic location where your machines live.",
    eli5: "A Region is a city where we keep our giant computer room. Pick the city closest to your customers.",
  },
  workspace: {
    singular: "Workspace",
    plural: "Workspaces",
    description: "A folder for organising your stuff.",
    eli5: "A Workspace is a folder where you keep all the stuff for one project — your machines, networks, disks. Different workspaces don't see each other.",
  },
  migration: {
    singular: "Cloud Migration",
    plural: "Cloud Migrations",
    description: "Move your stuff from one cloud to another.",
    eli5:
      "A Cloud Migration is what happens when we move your computers from the old cloud to the new one. We pack everything up, drive it over, and unpack it on the other side. Your old stuff stays put until we're sure the new stuff works.",
    analogy: "Like moving house — we pack the boxes, but we don't burn the old house down right away.",
  },
  migrationRequest: {
    singular: "Migration Request",
    plural: "Migration Requests",
    description: "Ask our team to move your stuff to a new region.",
    eli5: "Tell us when you'd like us to move your computers, and our team picks a time that works.",
    cta: "Request Migration",
  },
  auditLog: {
    singular: "Activity Log",
    plural: "Activity Log",
    description: "Who did what, when.",
    eli5: "The Activity Log is a diary. It writes down every important thing that happens, so if something breaks we can read back and see why.",
  },
  capacity: {
    singular: "Capacity",
    plural: "Capacity",
    description: "How much room is left in each region.",
    eli5: "How full each of our computer rooms is. Green means lots of room, red means it's getting crowded.",
  },
  usage: {
    singular: "Usage & Cost",
    plural: "Usage & Cost",
    description: "How much you've used and how much it costs.",
    eli5: "A list of everything you used this month, and how much money it added up to. Like the bottom of a shopping receipt.",
  },
  quota: {
    singular: "Quota",
    plural: "Quotas",
    description: "How many of each thing you're allowed to have.",
    eli5: "A Quota is the maximum amount we let you have, so nobody accidentally builds 10,000 computers and gets a giant bill.",
  },
  tag: {
    singular: "Tag",
    plural: "Tags",
    description: "Sticky labels you can put on anything to organise it.",
    eli5: "Tags are stickers. Stick a 'production' sticker on your important computers and a 'test' sticker on your playground ones. Then you can find them easily.",
    analogy: "Like coloured Post-its on your homework folders.",
  },
};

/**
 * Status labels — translates internal status strings into customer-friendly text.
 */
export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  creating: "Creating",
  updating: "Updating",
  deleting: "Deleting",
  active: "Active",
  running: "Running",
  stopped: "Stopped",
  paused: "Paused",
  suspended: "Paused",
  hibernated: "Hibernated",
  failed: "Failed",
  deleted: "Deleted",
  completed: "Completed",
  rolled_back: "Rolled back",
  rolled_back_with_errors: "Rolled back (with errors)",
  rollback_failed: "Rollback failed",
  skipped: "Skipped",
  available: "Available",
  preflight: "Pre-flight checks",
  snapshotting: "Capturing snapshots",
  exporting: "Exporting data",
  importing: "Importing data",
  provisioning: "Provisioning",
  finalising: "Finalising",
  approved: "Approved",
  rejected: "Rejected",
  scheduled: "Scheduled",
  queued: "Queued",
  saving: "Downloading",
  killed: "Failed",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-700",
  creating: "bg-blue-50 text-blue-700",
  updating: "bg-blue-50 text-blue-700",
  deleting: "bg-amber-50 text-amber-700",
  preflight: "bg-amber-50 text-amber-700",
  snapshotting: "bg-blue-50 text-blue-700",
  exporting: "bg-blue-50 text-blue-700",
  importing: "bg-blue-50 text-blue-700",
  provisioning: "bg-blue-50 text-blue-700",
  finalising: "bg-blue-50 text-blue-700",
  active: "bg-emerald-50 text-emerald-700",
  running: "bg-emerald-50 text-emerald-700",
  available: "bg-emerald-50 text-emerald-700",
  approved: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  stopped: "bg-slate-100 text-slate-700",
  paused: "bg-slate-100 text-slate-700",
  suspended: "bg-slate-100 text-slate-700",
  hibernated: "bg-slate-100 text-slate-700",
  failed: "bg-red-50 text-red-700",
  deleted: "bg-slate-100 text-slate-500",
  rejected: "bg-red-50 text-red-700",
  killed: "bg-red-50 text-red-700",
  rolled_back: "bg-slate-100 text-slate-700",
  rolled_back_with_errors: "bg-orange-50 text-orange-700",
  rollback_failed: "bg-red-50 text-red-700",
};

export const friendlyStatus = (status: string | undefined | null): string =>
  STATUS_LABELS[String(status ?? "")] ?? String(status ?? "—");

export const statusColor = (status: string | undefined | null): string =>
  STATUS_COLORS[String(status ?? "")] ?? "bg-slate-100 text-slate-600";
