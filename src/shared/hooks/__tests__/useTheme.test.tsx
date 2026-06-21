import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useTheme, useThemeStore } from "../useTheme";

beforeEach(() => {
  // Reset the shared store + DOM to a known light state before each test.
  useThemeStore.getState().setTheme("light");
});

function Reader({ id }: { id: string }) {
  const { isDark } = useTheme();
  return <span data-testid={id}>{isDark ? "dark" : "light"}</span>;
}

function Toggler() {
  const { toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>toggle</button>;
}

describe("useTheme shared store", () => {
  it("setTheme flips the .dark class + data-theme on <html>", () => {
    useThemeStore.getState().setTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    useThemeStore.getState().setTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("toggleTheme alternates light <-> dark", () => {
    expect(useThemeStore.getState().theme).toBe("light");
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("every consumer shares ONE source and flips together (the flicker fix)", () => {
    render(
      <>
        <Reader id="a" />
        <Reader id="b" />
        <Toggler />
      </>
    );

    // Two independent components, both reading the same store.
    expect(screen.getByTestId("a").textContent).toBe("light");
    expect(screen.getByTestId("b").textContent).toBe("light");

    fireEvent.click(screen.getByText("toggle"));

    // One toggle flips BOTH at once — no per-component desync.
    expect(screen.getByTestId("a").textContent).toBe("dark");
    expect(screen.getByTestId("b").textContent).toBe("dark");
  });
});
