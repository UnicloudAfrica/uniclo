import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FailoverWizard from "../FailoverWizard";
import type { FailoverState } from "../types";

/**
 * G4: Component-level tests for the failover wizard.
 *
 * Coverage focuses on the four behaviours that have real regression
 * risk:
 *
 *   1. step-resume: opening with status=fencing/draining starts at step 2
 *   2. queue-depth gate: proceed-to-promote disabled until queue depth = 0
 *   3. typed-confirm: promote disabled until exact bucket name match
 *   4. error surfacing: rejection from onInitiate keeps wizard at step 1
 *      and renders the error
 *
 * Not covered here (intentionally):
 *   - ModernModal focus trap behaviour — that's the primitive's contract
 *   - StatusPill rendering — covered by primitive tests
 *   - aria semantics — verified visually via JSDoc review
 */

function makeState(overrides: Partial<FailoverState> = {}): FailoverState {
  return {
    status: "active",
    queueDepth: 0,
    targetBucketName: "prod-target-bucket",
    ...overrides,
  };
}

describe("FailoverWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts at step 1 (fence) when replication is active", () => {
    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "active" })}
        onInitiate={vi.fn()}
        onCompleteDrain={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Step 1 · Fence the source/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Fence source bucket/i }),
    ).toBeInTheDocument();
  });

  it("step-resumes: opening with status=fencing starts at step 2 (drain)", () => {
    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "fencing", queueDepth: 12 })}
        onInitiate={vi.fn()}
        onCompleteDrain={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Step 2 · Wait for drain/i)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument(); // queue depth
  });

  it("step-resumes: opening with status=draining also starts at step 2", () => {
    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "draining", queueDepth: 5 })}
        onInitiate={vi.fn()}
        onCompleteDrain={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Step 2 · Wait for drain/i)).toBeInTheDocument();
  });

  it("disables proceed-to-promote when queueDepth > 0", () => {
    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "draining", queueDepth: 3 })}
        onInitiate={vi.fn()}
        onCompleteDrain={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /Waiting \(3 pending\)/i });
    expect(button).toBeDisabled();
  });

  it("enables proceed-to-promote when queueDepth = 0", async () => {
    const user = userEvent.setup();
    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "draining", queueDepth: 0 })}
        onInitiate={vi.fn()}
        onCompleteDrain={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const proceed = screen.getByRole("button", { name: /Proceed to promote/i });
    expect(proceed).toBeEnabled();

    await user.click(proceed);
    expect(screen.getByText(/Step 3 · Promote target/i)).toBeInTheDocument();
  });

  it("typed-confirm: promote disabled until exact bucket name typed", async () => {
    const user = userEvent.setup();
    const onCompleteDrain = vi.fn().mockResolvedValue(undefined);
    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "draining", queueDepth: 0, targetBucketName: "prod-target-bucket" })}
        onInitiate={vi.fn()}
        onCompleteDrain={onCompleteDrain}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    // Advance to step 3
    await user.click(screen.getByRole("button", { name: /Proceed to promote/i }));

    // ModernInput doesn't use htmlFor association; query by placeholder
    // (which equals the target bucket name).
    const input = screen.getByPlaceholderText(/.+/) as HTMLInputElement;
    const promote = screen.getByRole("button", { name: /Promote target/i });

    expect(promote).toBeDisabled();

    // Wrong name — still disabled
    await user.type(input, "prod-target-buckt"); // typo
    expect(promote).toBeDisabled();

    // Clear + type exact match
    await user.clear(input);
    await user.type(input, "prod-target-bucket");
    expect(promote).toBeEnabled();

    await user.click(promote);
    expect(onCompleteDrain).toHaveBeenCalledWith("prod-target-bucket");
  });

  it("typed-confirm is case-sensitive (S3 bucket names are case-sensitive)", async () => {
    const user = userEvent.setup();
    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "draining", queueDepth: 0, targetBucketName: "Prod-Target" })}
        onInitiate={vi.fn()}
        onCompleteDrain={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Proceed to promote/i }));

    // ModernInput doesn't use htmlFor association; query by placeholder
    // (which equals the target bucket name).
    const input = screen.getByPlaceholderText(/.+/) as HTMLInputElement;
    await user.type(input, "prod-target"); // wrong case
    expect(screen.getByRole("button", { name: /Promote target/i })).toBeDisabled();
  });

  it("surfaces error when onInitiate rejects and stays on step 1", async () => {
    const user = userEvent.setup();
    const onInitiate = vi
      .fn()
      .mockRejectedValue({
        response: { data: { error_code: "provider_native_crr_detected", message: "CRR conflict" } },
      });

    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "active" })}
        onInitiate={onInitiate}
        onCompleteDrain={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Fence source bucket/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/provider_native_crr_detected/);
    });
    // Still on step 1
    expect(screen.getByText(/Step 1 · Fence the source/i)).toBeInTheDocument();
  });

  it("calls onStepSuccess after successful fence", async () => {
    const user = userEvent.setup();
    const onInitiate = vi.fn().mockResolvedValue(undefined);
    const onStepSuccess = vi.fn();

    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "active" })}
        onInitiate={onInitiate}
        onCompleteDrain={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
        onStepSuccess={onStepSuccess}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Fence source bucket/i }));

    await waitFor(() => {
      expect(onStepSuccess).toHaveBeenCalledWith({
        step: "fence",
        message: expect.stringContaining("Source fenced"),
      });
    });
  });

  it("calls onCancel when cancel-failover button clicked from step 2", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <FailoverWizard
        isOpen
        state={makeState({ status: "fencing", queueDepth: 5 })}
        onInitiate={vi.fn()}
        onCompleteDrain={vi.fn()}
        onCancel={onCancel}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Cancel failover/i }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("renders nothing visible when isOpen=false", () => {
    render(
      <FailoverWizard
        isOpen={false}
        state={makeState()}
        onInitiate={vi.fn()}
        onCompleteDrain={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Step 1 · Fence the source/i)).not.toBeInTheDocument();
  });
});
