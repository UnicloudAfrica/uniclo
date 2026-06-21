import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SetupProgressCard from "./SetupProgressCard";

describe("SetupProgressCard", () => {
  describe("failed-during-retry rendering", () => {
    it("renders 'failed' steps as RETRYING (not FAILED) when pipeline is mid-recovery", () => {
      // REGRESSION: 2026-05-10 screenshots showed users a red X +
      // FAILED badge on "Creating cloud workspace..." while a
      // sibling step was already retrying. The step's eventual
      // success was preceded by a 30-second period where the user
      // saw an alarming red X — long enough to convince them the
      // whole thing was broken and close the tab. Per-step FAILED
      // is only honest once the pipeline has terminally given up.
      render(
        <SetupProgressCard
          steps={[
            {
              id: "1",
              label: "Creating cloud workspace...",
              status: "failed",
            },
            {
              id: "2",
              label: "Retrying after transient error...",
              status: "retrying",
            },
            { id: "3", label: "Syncing user access...", status: "pending" },
          ]}
          pipelineActive={true}
        />
      );

      // No FAILED badge for the transiently-failed step.
      expect(screen.queryByText("FAILED")).toBeNull();
      // Two RETRYING badges: the explicit retry step, plus the
      // mid-recovery downgrade of the failed step.
      const retryingBadges = screen.getAllByText("RETRYING");
      expect(retryingBadges.length).toBeGreaterThanOrEqual(2);
    });

    it("renders 'failed' as FAILED when pipeline has terminally given up", () => {
      // The honest-failure case: project.status === "failed", parent
      // passed pipelineActive=false, no active retries. Show the red
      // X + FAILED badge so the user knows to act on it.
      render(
        <SetupProgressCard
          steps={[
            {
              id: "1",
              label: "Creating cloud workspace...",
              status: "failed",
            },
            { id: "2", label: "Syncing user access...", status: "not_started" },
          ]}
          pipelineActive={false}
        />
      );

      expect(screen.getByText("FAILED")).toBeTruthy();
    });

    it("infers pipeline-active from steps when prop is omitted", () => {
      // Standalone usage (storybook, ad-hoc) shouldn't show alarming
      // red Xs just because the parent forgot to wire the prop.
      // Inference: any pending/in_progress/retrying sibling means
      // we're still working on it.
      render(
        <SetupProgressCard
          steps={[
            { id: "1", label: "Workspace", status: "failed" },
            { id: "2", label: "Access", status: "pending" },
          ]}
        />
      );

      expect(screen.queryByText("FAILED")).toBeNull();
    });

    it("treats in_progress as a working state (not unknown)", () => {
      // The status enum was originally typed as
      // "completed | pending | not_started | failed" — backend now
      // also emits "in_progress". Without the widened type the
      // status badge fell into the gray "unknown" branch.
      render(
        <SetupProgressCard
          steps={[
            { id: "1", label: "Workspace", status: "in_progress" },
          ]}
        />
      );

      expect(screen.getByText("IN_PROGRESS")).toBeTruthy();
    });
  });
});
