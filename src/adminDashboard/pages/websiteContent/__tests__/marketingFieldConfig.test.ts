import { describe, it, expect } from "vitest";
import {
  MARKETING_FIELD_CONFIG,
  MARKETING_TYPES,
  buildPayload,
  seedForm,
  type MarketingType,
} from "../marketingFieldConfig";

describe("marketingFieldConfig registry", () => {
  it("has a config for every MarketingType", () => {
    for (const type of MARKETING_TYPES) {
      const cfg = MARKETING_FIELD_CONFIG[type];
      expect(cfg).toBeDefined();
      expect(cfg.type).toBe(type);
      expect(cfg.fields.length).toBeGreaterThan(0);
    }
  });

  it("covers exactly the 9 expected types with no extras", () => {
    expect(MARKETING_TYPES).toHaveLength(9);
    expect(new Set(MARKETING_TYPES).size).toBe(9);
    expect(Object.keys(MARKETING_FIELD_CONFIG).sort()).toEqual([...MARKETING_TYPES].sort());
  });

  it("every titleField exists among that type's fields", () => {
    for (const type of MARKETING_TYPES) {
      const cfg = MARKETING_FIELD_CONFIG[type];
      const keys = cfg.fields.map((f) => f.key);
      expect(keys).toContain(cfg.titleField);
    }
  });

  it("flags a required title field on every non-singleton type", () => {
    // Non-singleton types each require their title field; the singleton
    // `settings` type has no required field by design.
    for (const type of MARKETING_TYPES) {
      const cfg = MARKETING_FIELD_CONFIG[type];
      const required = cfg.fields.filter((f) => f.required);
      if (cfg.singleton) {
        expect(required).toHaveLength(0);
        continue;
      }
      expect(required.length).toBeGreaterThanOrEqual(1);
      // The titleField is the required one.
      expect(cfg.fields.find((f) => f.key === cfg.titleField)?.required).toBe(true);
      // Every required flag points at a real configured field.
      for (const field of required) {
        expect(cfg.fields.map((f) => f.key)).toContain(field.key);
      }
    }
  });

  it("does not leak the internal source_id seed key into any config", () => {
    for (const type of MARKETING_TYPES) {
      expect(MARKETING_FIELD_CONFIG[type].fields.map((f) => f.key)).not.toContain("source_id");
    }
  });
});

describe("buildPayload", () => {
  const partners = MARKETING_FIELD_CONFIG.partners;

  it("trims values and converts empty strings to null", () => {
    const payload = buildPayload(partners, {
      name: "  Acme  ",
      logo_url: "",
      sort_order: "",
    });
    expect(payload.name).toBe("Acme");
    expect(payload.logo_url).toBeNull();
    expect(payload.sort_order).toBeNull();
  });

  it("coerces number-kind fields to a finite Number", () => {
    const payload = buildPayload(partners, {
      name: "Acme",
      logo_url: "https://x/y.png",
      sort_order: " 5 ",
    });
    expect(payload.sort_order).toBe(5);
    expect(typeof payload.sort_order).toBe("number");
  });

  it("maps a non-numeric number-kind value to null", () => {
    const payload = buildPayload(partners, {
      name: "Acme",
      logo_url: "",
      sort_order: "abc",
    });
    expect(payload.sort_order).toBeNull();
  });

  it("produces a payload key for every configured field", () => {
    const payload = buildPayload(partners, {});
    expect(Object.keys(payload).sort()).toEqual(partners.fields.map((f) => f.key).sort());
  });
});

describe("seedForm", () => {
  const blog = MARKETING_FIELD_CONFIG["blog-posts"];

  it("seeds blank strings for every field when no record is provided", () => {
    const form = seedForm(blog);
    for (const field of blog.fields) {
      expect(form[field.key]).toBe("");
    }
  });

  it("round-trips a record into string-valued form fields", () => {
    const record = {
      id: 7,
      title: "Launch Day",
      slug: "launch-day",
      tag: "news",
      published_at: "2026-06-01",
      summary: null,
    };
    const form = seedForm(blog, record);
    expect(form.title).toBe("Launch Day");
    expect(form.slug).toBe("launch-day");
    expect(form.tag).toBe("news");
    expect(form.published_at).toBe("2026-06-01");
    // null becomes ""
    expect(form.summary).toBe("");
    // unconfigured keys (id) are not seeded
    expect(form.id).toBeUndefined();
  });

  it("stringifies numeric record values", () => {
    const partners = MARKETING_FIELD_CONFIG.partners;
    const form = seedForm(partners, { name: "Acme", sort_order: 3 });
    expect(form.sort_order).toBe("3");
    expect(typeof form.sort_order).toBe("string");
  });
});

describe("seedForm + buildPayload symmetry", () => {
  it("an unedited seeded form rebuilds the original non-empty values", () => {
    const type: MarketingType = "board-members";
    const cfg = MARKETING_FIELD_CONFIG[type];
    const record = { id: 1, name: "Jane", position: "Chair", sort_order: 2 };
    const payload = buildPayload(cfg, seedForm(cfg, record));
    expect(payload.name).toBe("Jane");
    expect(payload.position).toBe("Chair");
    expect(payload.sort_order).toBe(2);
    // bio + photo_url were absent → null
    expect(payload.bio).toBeNull();
    expect(payload.photo_url).toBeNull();
  });
});
