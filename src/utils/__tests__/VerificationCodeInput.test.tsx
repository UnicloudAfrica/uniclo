import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import VerificationCodeInput from "../VerificationCodeInput";

/**
 * VerificationCodeInput — pinned behaviour for the OTP / 2FA UI.
 *
 * Two regressions are pinned here:
 *
 *   1. When the parent clears the `code` prop back to all-empty (e.g.
 *      after a verification error), focus must return to the FIRST
 *      input. The original bug: auto-advance during the first typing
 *      left focus on input #6, and when the parent cleared the digits
 *      the cursor stayed at #6 — so retyping started from the last
 *      slot.
 *
 *   2. Typing 6 digits fires `onComplete(joinedCode)` exactly once
 *      per unique value (the "last completed value" memo prevents
 *      re-firing if the same code is presented again).
 */

vi.mock("../../hooks/authHooks", () => ({
  useResendOTP: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("VerificationCodeInput — focus reset on empty", () => {
  it("focuses the first input when the parent resets `code` back to all-empty", async () => {
    const Wrapper = ({ code }: { code: string[] }) => (
      <VerificationCodeInput length={6} code={code} onCodeChange={() => {}} />
    );

    const { rerender, container } = renderWithClient(
      <Wrapper code={["1", "2", "3", "4", "5", "6"]} />,
    );

    // Type-driven scenario: parent clears code to empty (simulating
    // post-error reset triggered by onError handler).
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper code={["", "", "", "", "", ""]} />
      </QueryClientProvider>,
    );

    const inputs = container.querySelectorAll("input");
    expect(inputs).toHaveLength(6);
    // First input must be the focused element after the reset.
    expect(document.activeElement).toBe(inputs[0]);
  });

  it("does NOT steal focus on initial mount when code starts empty", () => {
    // Edge case: the component should only chase focus on the
    // empty TRANSITION, not on every empty render. Otherwise the
    // first input gets focused on every parent re-render that
    // happens while code is empty, which would trap the cursor
    // there even if the user has tabbed away.
    const { container } = renderWithClient(
      <VerificationCodeInput length={6} code={["", "", "", "", "", ""]} onCodeChange={() => {}} />,
    );
    const inputs = container.querySelectorAll("input");
    // No focus action expected — initial mount, code was always empty.
    expect(document.activeElement).not.toBe(inputs[0]);
  });
});

describe("VerificationCodeInput — onComplete", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("fires onComplete with the joined 6-digit string when the parent supplies a complete code", () => {
    const onComplete = vi.fn();
    const Wrapper = ({ code }: { code: string[] }) => (
      <VerificationCodeInput
        length={6}
        code={code}
        onCodeChange={() => {}}
        onComplete={onComplete}
      />
    );

    const { rerender } = renderWithClient(<Wrapper code={["", "", "", "", "", ""]} />);

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper code={["1", "2", "3", "4", "5", "6"]} />
      </QueryClientProvider>,
    );

    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("does NOT re-fire onComplete when the same complete code is presented again", () => {
    // Prevents double-submits when a parent re-renders with the
    // same complete code value.
    const onComplete = vi.fn();
    const Wrapper = ({ code }: { code: string[] }) => (
      <VerificationCodeInput
        length={6}
        code={code}
        onCodeChange={() => {}}
        onComplete={onComplete}
      />
    );

    const { rerender } = renderWithClient(<Wrapper code={["", "", "", "", "", ""]} />);

    const complete = ["1", "2", "3", "4", "5", "6"];
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper code={complete} />
      </QueryClientProvider>,
    );
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper code={complete} />
      </QueryClientProvider>,
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("VerificationCodeInput — typing advances focus", () => {
  it("auto-advances focus to the next input on digit entry", () => {
    const { container } = renderWithClient(
      <VerificationCodeInput length={6} onCodeChange={() => {}} />,
    );
    const inputs = container.querySelectorAll("input") as NodeListOf<HTMLInputElement>;

    inputs[0].focus();
    fireEvent.change(inputs[0], { target: { value: "1" } });
    expect(document.activeElement).toBe(inputs[1]);
  });
});
