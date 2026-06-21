import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { render, screen } from "@testing-library/react";

// Stub the heavy login page so the catch-all's /sign-in destination renders
// without the app's QueryClient/providers.
vi.mock("../../dashboard/pages/loginV2", () => ({
  default: () => <div data-testid="login-stub" />,
}));

import PublicRoutes from "../PublicRoutes";

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + loc.search}</div>;
}

describe("PublicRoutes redirects", () => {
  it("redirects bare /flow-dashboard to /admin-dashboard/flow-dashboard (preserving query)", () => {
    render(
      <MemoryRouter initialEntries={["/flow-dashboard?tab=servers"]}>
        <LocationDisplay />
        <Routes>
          {PublicRoutes()}
          {/* dummy landing route so the redirect resolves here, not the catch-all */}
          <Route path="/admin-dashboard/flow-dashboard" element={<div />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("loc").textContent).toBe(
      "/admin-dashboard/flow-dashboard?tab=servers"
    );
  });

  it("sends an unknown URL to /sign-in instead of a blank page", () => {
    render(
      <MemoryRouter initialEntries={["/this-route-does-not-exist"]}>
        <LocationDisplay />
        <Routes>{PublicRoutes()}</Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("loc").textContent).toBe("/sign-in");
  });
});
