import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AccessGrantManager from "../AccessGrantManager";
import type {
  AccessGrant,
  ClientOption,
} from "../AccessGrantManager";

/**
 * AccessGrantManager unit tests.
 *
 * Coverage:
 *   - empty client list → form disabled with hint
 *   - identifier prefix validation per resource type
 *   - submit invokes onCreate with the right payload
 *   - submit clears identifier+notes (form reset)
 *   - submit error surfaces via error state, form NOT cleared
 *   - revoke triggers confirm() then onRevoke
 *   - pagination renders + onPageChange wiring
 *   - empty grants list shows the empty state
 *   - initialResourceType + initialIdentifier prefill (deep-link)
 *   - onAfterCreate fires after successful create
 */

function makeClient(id: number, name = `Client ${id}`): ClientOption {
  return { id, display_name: name, email: `c${id}@example.com` };
}

function makeGrant(overrides: Partial<AccessGrant> = {}): AccessGrant {
  return {
    id: 1,
    client_user_id: 100,
    resource_type: "migration",
    identifier: "bmig_aBcDeFgHiJkLmNoPqRsT",
    notes: null,
    granted_at: "2026-04-20T12:00:00Z",
    granted_by: { id: 1, email: "admin@example.com" },
    ...overrides,
  };
}

describe("AccessGrantManager", () => {
  it("disables submit when no clients exist", () => {
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
      />,
    );
    const submit = screen.getByRole("button", { name: /Grant access/i });
    expect(submit).toBeDisabled();
    expect(
      screen.getByText(/No client users exist in this tenant yet/i),
    ).toBeInTheDocument();
  });

  it("rejects identifier with wrong prefix for resource type", async () => {
    const user = userEvent.setup();
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
      />,
    );

    const idInput = screen.getByPlaceholderText(/bmig_/);
    // resource_type defaults to "migration" → expects bmig_ prefix.
    // Type a brpl_ identifier (replication) instead.
    await user.type(idInput, "brpl_aaaaaaaaaaaaaaaaaaaa");

    expect(
      screen.getByText(/Expected prefix "bmig_" for migration/i),
    ).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: /Grant access/i });
    expect(submit).toBeDisabled();
  });

  it("rejects identifier with insufficient length", async () => {
    const user = userEvent.setup();
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
      />,
    );

    const idInput = screen.getByPlaceholderText(/bmig_/);
    await user.type(idInput, "bmig_short");

    expect(
      screen.getByText(/Format must be bmig_<20 alphanumeric chars>/i),
    ).toBeInTheDocument();
  });

  it("calls onCreate with correct payload on valid submit", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[makeClient(100, "Acme Co")]}
        onCreate={onCreate}
        onRevoke={vi.fn()}
      />,
    );

    // Pick client
    // ModernSelect doesn't wire htmlFor; first <select> in the form is
    // the client picker, second is resource type.
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "100");

    // Type valid identifier
    await user.type(
      screen.getByPlaceholderText(/bmig_/),
      "bmig_aBcDeFgHiJkLmNoPqRsT",
    );

    // Submit
    await user.click(screen.getByRole("button", { name: /Grant access/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        client_user_id: 100,
        resource_type: "migration",
        identifier: "bmig_aBcDeFgHiJkLmNoPqRsT",
        notes: undefined,
      });
    });
  });

  it("clears identifier + notes after successful submit", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[makeClient(100)]}
        onCreate={onCreate}
        onRevoke={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getAllByRole("combobox")[0], "100");
    const idInput = screen.getByPlaceholderText(/bmig_/) as HTMLInputElement;
    await user.type(idInput, "bmig_aBcDeFgHiJkLmNoPqRsT");
    await user.click(screen.getByRole("button", { name: /Grant access/i }));

    await waitFor(() => {
      expect(idInput.value).toBe("");
    });
  });

  it("surfaces error from onCreate without clearing the form", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockRejectedValue({
      response: { data: { error_code: "max_object_size_exceeded", message: "Too big" } },
    });
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[makeClient(100)]}
        onCreate={onCreate}
        onRevoke={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getAllByRole("combobox")[0], "100");
    const idInput = screen.getByPlaceholderText(/bmig_/) as HTMLInputElement;
    await user.type(idInput, "bmig_aBcDeFgHiJkLmNoPqRsT");
    await user.click(screen.getByRole("button", { name: /Grant access/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/max_object_size_exceeded/);
    });
    // Form NOT cleared on error so user can edit + retry
    expect(idInput.value).toBe("bmig_aBcDeFgHiJkLmNoPqRsT");
  });

  it("calls onAfterCreate after successful submit", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onAfterCreate = vi.fn();
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[makeClient(100)]}
        onCreate={onCreate}
        onRevoke={vi.fn()}
        onAfterCreate={onAfterCreate}
      />,
    );

    await user.selectOptions(screen.getAllByRole("combobox")[0], "100");
    await user.type(
      screen.getByPlaceholderText(/bmig_/),
      "bmig_aBcDeFgHiJkLmNoPqRsT",
    );
    await user.click(screen.getByRole("button", { name: /Grant access/i }));

    await waitFor(() => {
      expect(onAfterCreate).toHaveBeenCalledTimes(1);
    });
  });

  it("does NOT call onAfterCreate when create fails", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockRejectedValue(new Error("boom"));
    const onAfterCreate = vi.fn();
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[makeClient(100)]}
        onCreate={onCreate}
        onRevoke={vi.fn()}
        onAfterCreate={onAfterCreate}
      />,
    );

    await user.selectOptions(screen.getAllByRole("combobox")[0], "100");
    await user.type(
      screen.getByPlaceholderText(/bmig_/),
      "bmig_aBcDeFgHiJkLmNoPqRsT",
    );
    await user.click(screen.getByRole("button", { name: /Grant access/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(onAfterCreate).not.toHaveBeenCalled();
  });

  it("prefills resource type + identifier from deep-link props", () => {
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        initialResourceType="replication"
        initialIdentifier="brpl_aBcDeFgHiJkLmNoPqRsT"
      />,
    );
    // Identifier input should be prefilled via placeholder change
    const idInput = screen.getByPlaceholderText(/brpl_/) as HTMLInputElement;
    expect(idInput.value).toBe("brpl_aBcDeFgHiJkLmNoPqRsT");
  });

  it("renders empty state when no grants", () => {
    render(
      <AccessGrantManager
        grants={[]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
      />,
    );
    expect(screen.getByText(/No grants issued/i)).toBeInTheDocument();
  });

  it("renders grants table with revoke button per row", () => {
    render(
      <AccessGrantManager
        grants={[makeGrant()]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
      />,
    );
    expect(screen.getByText(/bmig_aBcDeFgHiJkLmNoPqRsT/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Revoke migration bmig_/i })).toBeInTheDocument();
  });

  it("calls onRevoke with grant id when confirm is accepted", async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <AccessGrantManager
        grants={[makeGrant({ id: 42 })]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={onRevoke}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Revoke migration bmig_/i }));

    await waitFor(() => {
      expect(onRevoke).toHaveBeenCalledWith(42);
    });
    confirmSpy.mockRestore();
  });

  it("does NOT call onRevoke when confirm is rejected", async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <AccessGrantManager
        grants={[makeGrant({ id: 42 })]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={onRevoke}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Revoke migration bmig_/i }));

    expect(onRevoke).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("renders pagination footer when total > perPage", () => {
    const onPageChange = vi.fn();
    render(
      <AccessGrantManager
        grants={[makeGrant()]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        pagination={{
          page: 1,
          perPage: 25,
          total: 100,
          onPageChange,
        }}
      />,
    );
    expect(screen.getByText(/Showing 1–25 of 100 grants/)).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 4/)).toBeInTheDocument();
  });

  it("hides pagination footer when total ≤ perPage", () => {
    render(
      <AccessGrantManager
        grants={[makeGrant()]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        pagination={{
          page: 1,
          perPage: 25,
          total: 5,
          onPageChange: vi.fn(),
        }}
      />,
    );
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it("disables Previous on page 1", () => {
    render(
      <AccessGrantManager
        grants={[makeGrant()]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        pagination={{ page: 1, perPage: 25, total: 100, onPageChange: vi.fn() }}
      />,
    );
    expect(screen.getByRole("button", { name: /Go to page 0/i })).toBeDisabled();
  });

  it("disables Next on last page", () => {
    render(
      <AccessGrantManager
        grants={[makeGrant()]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        pagination={{ page: 4, perPage: 25, total: 100, onPageChange: vi.fn() }}
      />,
    );
    expect(screen.getByRole("button", { name: /Go to page 5/i })).toBeDisabled();
  });

  it("calls onPageChange when Next is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <AccessGrantManager
        grants={[makeGrant()]}
        clientOptions={[makeClient(100)]}
        onCreate={vi.fn()}
        onRevoke={vi.fn()}
        pagination={{ page: 2, perPage: 25, total: 100, onPageChange }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Go to page 3/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
