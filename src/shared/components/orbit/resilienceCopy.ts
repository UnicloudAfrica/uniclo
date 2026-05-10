/**
 * Resilience copy registry — friendly title + subtitle + emoji + technical
 * note for every Orbit menu page.
 *
 * One source of truth so:
 *   - Copy edits land in one place, not 30 page wrappers
 *   - Plain-English voice stays consistent across roles
 *   - The eyebrow / illustration / call-to-action are pre-paired with each
 *     topic's tone (Ransomware = serious + reassuring; Migrations = active
 *     + encouraging; DR Drills = practice-mode warm-up)
 *
 * Each topic ID matches the URL slug pattern used in sidebarMenus.ts
 * (or the page wrapper's filename root) so adding a new page is just:
 *   1. Add an entry here
 *   2. Render `<ResilienceHero topic="x" />` at the top of the page
 */

export type ResilienceTopic =
  | "migrations"
  | "batch-migrations"
  | "migration-calculator"
  | "bucket-endpoints"
  | "bucket-migrations"
  | "bucket-replications"
  | "client-access-grants"
  | "replication-policies"
  | "database-replication"
  | "dr-drills"
  | "serverless-dr"
  | "ransomware"
  | "hypervisor";

export interface ResilienceCopyEntry {
  /** Plain-English headline. ≤ 7 words, sentence case. */
  title: string;
  /** 1-2 sentence friendly explanation. No jargon. */
  subtitle: string;
  /** Optional technical anchor for tenants who know the lingo. */
  technicalNote?: string;
  /** Emoji shown as illustration in the hero. */
  emoji: string;
  /** Eyebrow label above the title. Defaults to "Orbit · {Topic Title}". */
  eyebrow?: string;
  /**
   * Optional reassurance line for sensitive topics (ransomware, drills,
   * destructive actions). Shown as a subtle pill below the subtitle.
   */
  reassurance?: string;
}

/**
 * Default copy for every Orbit topic. Override per-page if a role needs
 * its own variant (e.g., admin sees "across all tenants", tenant sees
 * "across all your clients").
 */
export const RESILIENCE_COPY: Record<ResilienceTopic, ResilienceCopyEntry> = {
  migrations: {
    title: "Move your servers to the cloud",
    subtitle:
      "Each migration moves one server from where it lives now to a region you pick. Watch progress, pause if you need, retry if something hiccups — you stay in control.",
    technicalNote:
      "Workload migrations — block-level replication + cutover orchestration via Orbit.",
    emoji: "🚚",
  },
  "batch-migrations": {
    title: "Move many servers at once",
    subtitle:
      "Bundle a stack of servers into one batch — same target, same schedule. Perfect for moving an entire app, an office, or a project all at once.",
    technicalNote:
      "Coordinated multi-VM migrations with shared cutover windows + per-VM revalidation.",
    emoji: "📦",
  },
  "migration-calculator": {
    title: "What will it cost to move?",
    subtitle:
      "Sketch out your migration in plain numbers and we'll tell you the price before you commit a single byte. No surprises.",
    technicalNote:
      "Live pricing from the Orbit catalogue — flat per-VM, no per-GB charges.",
    emoji: "🧮",
    reassurance: "Just an estimate — nothing here charges you.",
  },
  "bucket-endpoints": {
    title: "Connect your storage buckets",
    subtitle:
      "Tell us about a storage bucket — S3, GCS, Azure Blob, anything S3-compatible — and we'll get it ready for migrations and replication.",
    technicalNote:
      "Bucket endpoints register source / target object stores with their access policies.",
    emoji: "🪣",
  },
  "bucket-migrations": {
    title: "Move all the files in a bucket",
    subtitle:
      "A one-time copy of every object from one bucket to another. Pause whenever, resume whenever, and see exactly what didn't make it across.",
    technicalNote:
      "Object-level migrations with manifest tracking + retry-on-failure for individual keys.",
    emoji: "📂",
  },
  "bucket-replications": {
    title: "Keep two buckets in sync forever",
    subtitle:
      "Continuous mirroring — every change to the source bucket lands in the target within seconds. Pause it, fail it over, see exactly what's lagging.",
    technicalNote:
      "Active-passive bucket replication with health metrics + change-feed streaming.",
    emoji: "🔁",
  },
  "client-access-grants": {
    title: "Share a bucket safely with a client",
    subtitle:
      "Hand a client read-only access to one specific bucket — without giving them the keys to anything else in your account.",
    technicalNote:
      "Per-client bucket visibility scopes — admin-curated, audit-logged, scoped via X-Acf-Client-Id.",
    emoji: "🔐",
    reassurance: "Grants are read-only by default; no client can change your data.",
  },
  "replication-policies": {
    title: "The rules that keep your data safe",
    subtitle:
      "Decide which workloads get replicated where, how often, and what counts as 'good enough.' Apply one policy to many servers at once.",
    technicalNote:
      "Replication policies define source/target pairs, RPO targets, transfer methods, and conflict-resolution strategies.",
    emoji: "🛡️",
  },
  "database-replication": {
    title: "Keep your databases in sync",
    subtitle:
      "Continuous replication for PostgreSQL, MySQL, and MongoDB. We handle the change-data-capture under the hood — you just see 'in sync.'",
    technicalNote:
      "Database-native replication groups with CDC initialisation, preflight checks, and per-target validation history.",
    emoji: "🗄️",
  },
  "dr-drills": {
    title: "Practice for a bad day",
    subtitle:
      "Run the failover end-to-end on a schedule you set. We make sure your recovery actually works — long before you need it.",
    technicalNote:
      "Scheduled DR drills with isolation-zone provisioning, full failover simulation, and post-drill verification.",
    emoji: "🚨",
    reassurance: "Drills run in an isolated zone. Your real workloads stay untouched.",
  },
  "serverless-dr": {
    title: "Always-ready, only-pays-on-use",
    subtitle:
      "Your backup server stays asleep — only the data stays awake. When disaster strikes, the server boots up in seconds and takes over.",
    technicalNote:
      "Serverless DR keeps the data in sync without running compute; the standby boots on failover trigger.",
    emoji: "💤",
    reassurance: "You only pay for storage in normal times — compute charges only kick in during a real failover.",
  },
  ransomware: {
    title: "Catch threats before they spread",
    subtitle:
      "We watch your backups for the patterns ransomware leaves behind. If something looks wrong, we tell you fast and help you recover from a clean snapshot.",
    technicalNote:
      "Continuous scanning with anomaly detection on backup deltas; recovery via labeled clean restore points.",
    emoji: "🛡️",
    reassurance: "Detection is read-only — we never touch your live workloads, only the backup metadata.",
  },
  hypervisor: {
    title: "Talk to your virtual machine hosts",
    subtitle:
      "Connect your VMware, Hyper-V, or KVM hosts so we can see and move the VMs running on them — including live migration with changed-block tracking.",
    technicalNote:
      "Hypervisor endpoints + VM enumeration + CBT enable/disable + live migration progress tracking.",
    emoji: "🖥️",
  },
};

/**
 * Per-role override for selected topics. Keys collapse to the default
 * entry when not present.
 */
export const RESILIENCE_COPY_BY_ROLE: Partial<
  Record<"admin" | "tenant" | "client", Partial<Record<ResilienceTopic, Partial<ResilienceCopyEntry>>>>
> = {
  admin: {
    migrations: {
      subtitle:
        "Watch every migration across every tenant. Step in if something needs a hand, or just keep an eye on the fleet.",
    },
    "batch-migrations": {
      subtitle:
        "Bundles of servers moving together — across every tenant. Spot a stuck batch and unstick it from here.",
    },
    "dr-drills": {
      subtitle:
        "DR drills running for every tenant. Spot the ones overdue, see who passed last time, set platform-wide schedules.",
    },
    ransomware: {
      subtitle:
        "Ransomware scans across every tenant's backup chain. Investigate alerts, mark false positives, escalate the real ones.",
    },
  },
  tenant: {
    migrations: {
      subtitle:
        "Move your servers to the cloud — yours or your clients'. We handle the heavy lifting; you stay in control.",
    },
    "client-access-grants": {
      subtitle:
        "Hand each of your clients read-only access to just the buckets they should see. Nothing more, nothing less.",
    },
  },
  client: {
    migrations: {
      subtitle:
        "Watch your servers move into the cloud. Open one to see exactly where it is in the journey.",
    },
    "dr-drills": {
      subtitle:
        "See the practice runs your provider has set up for your servers. Each drill makes sure recovery will work when you need it.",
    },
  },
};

/**
 * Resolve the copy entry for a topic + optional role, with role-specific
 * overrides merged on top of the default.
 */
export function getResilienceCopy(
  topic: ResilienceTopic,
  role?: "admin" | "tenant" | "client",
): ResilienceCopyEntry {
  const base = RESILIENCE_COPY[topic];
  if (!role) return base;
  const overrides = RESILIENCE_COPY_BY_ROLE[role]?.[topic];
  return overrides ? { ...base, ...overrides } : base;
}
