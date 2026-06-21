import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { Home } from "lucide-react";
import NavTwoTier from "../NavTwoTier";
import type { MenuEntry } from "../CollapsibleMenu";

const menuItems: MenuEntry[] = [
  {
    name: "Compute",
    icon: Home,
    isLucide: true,
    children: [
      { name: "Servers", icon: Home, isLucide: true, path: "/admin-dashboard/servers" },
      { name: "Storage", icon: Home, isLucide: true, path: "/admin-dashboard/storage" },
    ],
  },
  {
    name: "Networking",
    icon: Home,
    isLucide: true,
    children: [
      { name: "VPCs", icon: Home, isLucide: true, path: "/admin-dashboard/vpcs" },
      { name: "Subnets", icon: Home, isLucide: true, path: "/admin-dashboard/subnets" },
    ],
  },
  { name: "Support", icon: Home, isLucide: true, path: "/admin-dashboard/support" },
];

describe("NavTwoTier", () => {
  it("lists items from EVERY group at once, not just the active one", () => {
    render(
      <MemoryRouter initialEntries={["/admin-dashboard/servers"]}>
        <NavTwoTier menuItems={menuItems} />
      </MemoryRouter>,
    );

    // Both groups' children are present simultaneously (the fix).
    expect(screen.getByText("Servers")).toBeInTheDocument();
    expect(screen.getByText("Storage")).toBeInTheDocument();
    expect(screen.getByText("VPCs")).toBeInTheDocument();
    expect(screen.getByText("Subnets")).toBeInTheDocument();

    // Each group's header + the ungrouped Quick link.
    expect(screen.getByText("Compute")).toBeInTheDocument();
    expect(screen.getByText("Networking")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });
});
