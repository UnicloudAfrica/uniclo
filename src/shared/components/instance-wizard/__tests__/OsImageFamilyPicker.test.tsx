import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Option } from "@/types/InstanceConfiguration";
import OsImageFamilyPicker from "../OsImageFamilyPicker";

const opt = (osDistro: string, osVersion: string): Option =>
  ({
    value: `${osDistro}-${osVersion}`,
    label: `${osDistro} ${osVersion}`,
    raw: { os_distro: osDistro, os_version: osVersion },
  }) as Option;

describe("OsImageFamilyPicker", () => {
  it("renders one tile per distro family", () => {
    render(
      <OsImageFamilyPicker
        options={[opt("ubuntu", "24.04"), opt("ubuntu", "22.04"), opt("debian", "12")]}
        value=""
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /Ubuntu/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Debian/ })).toBeInTheDocument();
  });

  it("selects immediately when a single-version family is clicked", () => {
    const onSelect = vi.fn();
    render(
      <OsImageFamilyPicker
        options={[opt("ubuntu", "24.04"), opt("debian", "12")]}
        value=""
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Debian/ }));

    expect(onSelect).toHaveBeenCalledWith("debian-12", "debian 12");
  });

  it("shows a version dropdown for a multi-version family and selects through it", () => {
    const onSelect = vi.fn();
    render(
      <OsImageFamilyPicker
        options={[opt("ubuntu", "24.04"), opt("ubuntu", "22.04")]}
        value=""
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Ubuntu/ }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "ubuntu-22.04" } });

    expect(onSelect).toHaveBeenCalledWith("ubuntu-22.04", "ubuntu 22.04");
  });

  it("shows the empty message when there are no options", () => {
    render(
      <OsImageFamilyPicker options={[]} value="" onSelect={vi.fn()} emptyMessage="Loading OS images…" />
    );

    expect(screen.getByText("Loading OS images…")).toBeInTheDocument();
  });
});
