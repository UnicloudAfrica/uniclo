import { describe, it, expect } from "vitest";
import { adminMenuItems, buildClientMenuItems } from "../sidebarMenus";

type Child = { name?: string; path?: string };
type Group = { name?: string; children?: Child[] };

const deployGroup = (items: unknown[]): Group =>
  items.find((g) => (g as Group)?.name === "Deploy") as Group;

const childPath = (group: Group, name: string): string | undefined =>
  group.children?.find((c) => c.name === name)?.path;

describe("Deploy (SlimDeploy) menu paths", () => {
  it("admin items resolve under /admin-dashboard/flow-dashboard (not top-level — the blank-page bug)", () => {
    const deploy = deployGroup(adminMenuItems);
    expect(deploy).toBeDefined();

    expect(childPath(deploy, "Overview")).toBe("/admin-dashboard/flow-dashboard");
    expect(childPath(deploy, "Servers")).toBe("/admin-dashboard/flow-dashboard?tab=servers");

    // No Deploy child may point at a top-level /flow-dashboard (which has no route).
    for (const c of deploy.children ?? []) {
      expect(c.path?.startsWith("/admin-dashboard/")).toBe(true);
    }
  });

  it("client items stay at /client-dashboard/flow (unaffected by the fix)", () => {
    const deploy = deployGroup(buildClientMenuItems(true));
    expect(childPath(deploy, "Overview")).toBe("/client-dashboard/flow");
  });
});
