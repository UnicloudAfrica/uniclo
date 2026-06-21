import { describe, it, expect } from "vitest";
import { computeMenuPosition } from "../utils";

const viewport = { width: 1200, height: 800 };

describe("computeMenuPosition (row-actions dropdown)", () => {
  it("opens below the trigger when there is room", () => {
    const { top } = computeMenuPosition({ top: 100, bottom: 120, right: 600 }, 3, viewport);
    expect(top).toBe(124); // rect.bottom + 4
  });

  it("flips ABOVE the trigger when the row is near the viewport bottom (so Delete stays visible)", () => {
    // 3 actions → estimated height 128px; row bottom at 760 leaves only 40px below.
    const { top } = computeMenuPosition({ top: 740, bottom: 760, right: 600 }, 3, viewport);
    expect(top).toBe(608); // rect.top - 128 - 4
    expect(top + 128).toBeLessThanOrEqual(viewport.height); // fully on-screen
  });

  it("clamps to the viewport when the menu is taller than the screen", () => {
    const { top } = computeMenuPosition({ top: 400, bottom: 420, right: 600 }, 30, viewport);
    expect(top).toBe(8); // pinned to the top margin, never negative
  });

  it("right-anchors and never runs off the left or right edge", () => {
    expect(computeMenuPosition({ top: 100, bottom: 120, right: 40 }, 2, viewport).left).toBe(8);
    expect(
      computeMenuPosition({ top: 100, bottom: 120, right: 1190 }, 2, viewport).left
    ).toBeLessThanOrEqual(viewport.width - 176 - 8);
  });
});
