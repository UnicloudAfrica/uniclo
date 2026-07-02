import type { ReactElement, ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Provider-capability gating on the Create button (GAP-217).
 *
 * The container previously showed "Create ACL" gated only on role
 * permissions (`getNetworkAclPermissions`). On an availability zone whose
 * provider doesn't offer Network ACLs, the button still rendered — a
 * capability-blind, fail-open Create surface. The fix threads a
 * `providerSupported` boolean (default true) from the host page and requires
 * it in the Create-button condition.
 *
 * We render with `hierarchy="tenant"` (canCreate = true) so the ONLY variable
 * is `providerSupported`. The overview + modal are stubbed to keep the assert
 * on the header action.
 */

// Barrel re-export used by the container for the overview grid.
vi.mock("..", () => ({
  NetworkAclsOverview: () => <div data-testid="acls-overview" />,
}));
vi.mock("../../modals/CreateNetworkAclModal", () => ({
  default: () => null,
}));

import NetworkAclsContainer, {
  type NetworkAclHooks,
} from "../NetworkAclsContainer";

const noopQuery = () => ({ data: [], isLoading: false, isFetching: false, refetch: vi.fn() });
const noopMutation = () => ({ mutate: vi.fn(), isPending: false });

const hooks = {
  useList: noopQuery,
  useVpcs: noopQuery,
  useCreate: noopMutation,
  useDelete: noopMutation,
} as unknown as NetworkAclHooks;

const passthroughWrapper = ({
  headerActions,
  children,
}: {
  headerActions: ReactNode;
  children: ReactNode;
}): ReactElement => (
  <div>
    <div>{headerActions}</div>
    {children}
  </div>
);

const renderContainer = (providerSupported?: boolean) =>
  render(
    <NetworkAclsContainer
      hierarchy="tenant"
      projectId="p1"
      region="lagos-1"
      hooks={hooks}
      wrapper={passthroughWrapper}
      onManageRules={vi.fn()}
      providerSupported={providerSupported}
    />
  );

describe("NetworkAclsContainer — provider-capability gating", () => {
  it("hides the Create button when the provider does not support Network ACLs", () => {
    renderContainer(false);
    expect(screen.queryByRole("button", { name: /create acl/i })).not.toBeInTheDocument();
  });

  it("shows the Create button when the provider supports Network ACLs", () => {
    renderContainer(true);
    expect(screen.getByRole("button", { name: /create acl/i })).toBeInTheDocument();
  });

  it("defaults to showing the Create button when providerSupported is omitted (fail-open preserved)", () => {
    renderContainer(undefined);
    expect(screen.getByRole("button", { name: /create acl/i })).toBeInTheDocument();
  });
});
