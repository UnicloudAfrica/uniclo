/**
 * marketingFieldConfig — single source of truth for the admin "Website Content"
 * CMS module. Mirrors the backend `marketing/{type}` registry using CANONICAL
 * field keys (the landing site reads the alias duplicates of these keys).
 *
 * The 9 content types map 1:1 to the backend `GET/POST /marketing/{type}`
 * endpoints. Each `TypeConfig` drives the generic list page, the create/edit
 * modal, and the table columns — there is no per-type bespoke UI.
 *
 * Pure helpers (`seedForm`, `buildPayload`) are exported at module scope so
 * they can be unit-tested without rendering any React.
 */

// ─── Types ─────────────────────────────────────────────────────────

export type MarketingType =
  | "partners"
  | "blog-posts"
  | "board-members"
  | "careers"
  | "case-studies"
  | "resources"
  | "solutions"
  | "management-members"
  | "settings";

export type FieldKind = "text" | "textarea" | "url" | "number" | "date";

export interface FieldDef {
  /** Canonical payload key (e.g. "logo_url", "published_at"). */
  key: string;
  /** Human label for the form + table header. */
  label: string;
  /** Input rendering + payload coercion strategy. */
  kind: FieldKind;
  /** Required for create/update (client-side guard mirrors backend rules). */
  required?: boolean;
  /** Helper text under the input. */
  helper?: string;
  /** When true, this field gets a column in the list table. */
  inTable?: boolean;
}

export interface TypeConfig {
  type: MarketingType;
  /** Tab + page label. */
  label: string;
  /** Field key used as the row title + client-side search target. */
  titleField: string;
  fields: FieldDef[];
  /** True when the type carries a `sort_order` ordering field. */
  ordered?: boolean;
  /** True for single-row types (site-wide settings). */
  singleton?: boolean;
}

// ─── Config ────────────────────────────────────────────────────────

export const MARKETING_FIELD_CONFIG: Record<MarketingType, TypeConfig> = {
  partners: {
    type: "partners",
    label: "Partners",
    titleField: "name",
    ordered: true,
    fields: [
      { key: "name", label: "Name", kind: "text", required: true, inTable: true },
      { key: "logo_url", label: "Logo URL", kind: "url", inTable: true },
      { key: "sort_order", label: "Sort order", kind: "number", inTable: true },
    ],
  },
  "blog-posts": {
    type: "blog-posts",
    label: "Blog Posts",
    titleField: "title",
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, inTable: true },
      {
        key: "slug",
        label: "Slug",
        kind: "text",
        helper: "auto-generated from title if left blank",
      },
      { key: "tag", label: "Tag", kind: "text", inTable: true },
      { key: "summary", label: "Summary", kind: "textarea" },
      { key: "content", label: "Content", kind: "textarea", helper: "raw HTML body" },
      { key: "cover_url", label: "Cover URL", kind: "url" },
      { key: "read_time", label: "Read time", kind: "text" },
      { key: "published_at", label: "Published at", kind: "date", inTable: true },
      { key: "published_label", label: "Published label", kind: "text" },
    ],
  },
  "board-members": {
    type: "board-members",
    label: "Board Members",
    titleField: "name",
    ordered: true,
    fields: [
      { key: "name", label: "Name", kind: "text", required: true, inTable: true },
      { key: "position", label: "Position", kind: "text", inTable: true },
      { key: "bio", label: "Bio", kind: "textarea", helper: "raw HTML" },
      { key: "photo_url", label: "Photo URL", kind: "url" },
      { key: "sort_order", label: "Sort order", kind: "number", inTable: true },
    ],
  },
  careers: {
    type: "careers",
    label: "Careers",
    titleField: "title",
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, inTable: true },
      { key: "location", label: "Location", kind: "text", inTable: true },
      { key: "pay", label: "Pay", kind: "text" },
      { key: "duration", label: "Duration", kind: "text" },
      { key: "summary", label: "Summary", kind: "textarea" },
      { key: "details", label: "Details", kind: "textarea", helper: "raw HTML" },
      { key: "posted_at", label: "Posted at", kind: "date", inTable: true },
      { key: "posted_label", label: "Posted label", kind: "text" },
    ],
  },
  "case-studies": {
    type: "case-studies",
    label: "Case Studies",
    titleField: "title",
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, inTable: true },
      { key: "tagline", label: "Tagline", kind: "textarea" },
      { key: "content", label: "Content", kind: "textarea", helper: "raw HTML" },
      { key: "cover_url", label: "Cover URL", kind: "url" },
      { key: "read_time", label: "Read time", kind: "text" },
      { key: "published_at", label: "Published at", kind: "date", inTable: true },
      { key: "published_label", label: "Published label", kind: "text" },
    ],
  },
  resources: {
    type: "resources",
    label: "Resources",
    titleField: "title",
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, inTable: true },
      { key: "tagline", label: "Tagline", kind: "textarea" },
      { key: "content", label: "Content", kind: "textarea", helper: "raw HTML" },
      { key: "cover_url", label: "Cover URL", kind: "url" },
      { key: "read_time", label: "Read time", kind: "text" },
      { key: "published_at", label: "Published at", kind: "date", inTable: true },
      { key: "published_label", label: "Published label", kind: "text" },
    ],
  },
  solutions: {
    type: "solutions",
    label: "Solutions",
    titleField: "topic",
    ordered: true,
    fields: [
      { key: "topic", label: "Topic", kind: "text", required: true, inTable: true },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "content", label: "Content", kind: "textarea", helper: "raw HTML" },
      { key: "cover_url", label: "Cover URL", kind: "url" },
      { key: "sort_order", label: "Sort order", kind: "number", inTable: true },
      { key: "read_time", label: "Read time", kind: "text" },
      { key: "published_at", label: "Published at", kind: "date" },
      { key: "published_label", label: "Published label", kind: "text" },
    ],
  },
  "management-members": {
    type: "management-members",
    label: "Management",
    titleField: "name",
    ordered: true,
    fields: [
      { key: "name", label: "Name", kind: "text", required: true, inTable: true },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "bio", label: "Bio", kind: "textarea", helper: "raw HTML" },
      { key: "photo_url", label: "Photo URL", kind: "url" },
      { key: "sort_order", label: "Sort order", kind: "number", inTable: true },
    ],
  },
  settings: {
    type: "settings",
    label: "Site Settings",
    titleField: "email",
    singleton: true,
    fields: [
      { key: "address", label: "Address", kind: "textarea" },
      { key: "email", label: "Email", kind: "text", inTable: true },
      { key: "facebook_url", label: "Facebook URL", kind: "url" },
      { key: "instagram_url", label: "Instagram URL", kind: "url" },
      { key: "linkedin_url", label: "LinkedIn URL", kind: "url" },
      { key: "twitter_url", label: "Twitter URL", kind: "url" },
      { key: "logo_url", label: "Logo URL", kind: "url" },
      { key: "whatsapp", label: "WhatsApp", kind: "text" },
    ],
  },
};

/** Tab order for the page. */
export const MARKETING_TYPES: MarketingType[] = [
  "partners",
  "blog-posts",
  "board-members",
  "careers",
  "case-studies",
  "resources",
  "solutions",
  "management-members",
  "settings",
];

// ─── Pure helpers (unit-tested) ────────────────────────────────────

type AnyRecord = Record<string, unknown>;

/**
 * Seeds a string-keyed form state from an existing record (or blanks for
 * create). Every configured field becomes a string so the controlled inputs
 * never go uncontrolled. `null`/`undefined` values map to "".
 */
export const seedForm = (cfg: TypeConfig, record?: AnyRecord | null): Record<string, string> => {
  const form: Record<string, string> = {};
  for (const field of cfg.fields) {
    const raw = record ? record[field.key] : undefined;
    form[field.key] = raw === undefined || raw === null ? "" : String(raw);
  }
  return form;
};

/**
 * Builds the API payload from form strings. Trims every value; an empty string
 * becomes `null` (so the backend clears the column); `number`-kind fields are
 * coerced to a finite Number or `null`.
 */
export const buildPayload = (cfg: TypeConfig, form: Record<string, string>): AnyRecord => {
  const payload: AnyRecord = {};
  for (const field of cfg.fields) {
    const trimmed = (form[field.key] ?? "").trim();
    if (trimmed === "") {
      payload[field.key] = null;
      continue;
    }
    if (field.kind === "number") {
      const n = Number(trimmed);
      payload[field.key] = Number.isFinite(n) ? n : null;
      continue;
    }
    payload[field.key] = trimmed;
  }
  return payload;
};
