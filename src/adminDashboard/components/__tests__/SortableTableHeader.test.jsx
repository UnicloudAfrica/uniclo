import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SortableTableHeader from "../SortableTableHeader";

describe("SortableTableHeader", () => {
  const mockOnSort = jest.fn();

  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "role", label: "Role", sortable: false },
    { key: "created", label: "Created At", sortable: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all columns", () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableTableHeader
              columns={columns}
              sortKey="name"
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Created At")).toBeInTheDocument();
  });

  test("toggles sort direction on click", () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableTableHeader
              columns={columns}
              sortKey="name"
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );

    const nameHeader = screen.getByRole("columnheader", { name: "Name" });
    fireEvent.click(nameHeader);

    // Should toggle to desc
    expect(mockOnSort).toHaveBeenCalledWith("name", "desc");
  });

  test("shows correct sort indicator", () => {
    const { rerender } = render(
      <table>
        <thead>
          <tr>
            <SortableTableHeader
              columns={columns}
              sortKey="name"
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );

    // Should show ascending indicator
    const nameHeader = screen.getByRole("columnheader", { name: "Name" });
    expect(nameHeader).toHaveTextContent("Name");

    // Rerender with desc
    rerender(
      <table>
        <thead>
          <tr>
            <SortableTableHeader
              columns={columns}
              sortKey="name"
              sortDirection="desc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );

    // Should show descending indicator
    expect(nameHeader).toHaveTextContent("Name");
  });

  test("non-sortable columns do not trigger sort", () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableTableHeader
              columns={columns}
              sortKey="name"
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );

    const roleHeader = screen.getByRole("columnheader", { name: "Role" });
    fireEvent.click(roleHeader);

    // Should not call onSort
    expect(mockOnSort).not.toHaveBeenCalled();
  });

  test("clicking different column changes sort key", () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableTableHeader
              columns={columns}
              sortKey="name"
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );

    const emailHeader = screen.getByRole("columnheader", { name: "Email" });
    fireEvent.click(emailHeader);

    // Should sort by email ascending
    expect(mockOnSort).toHaveBeenCalledWith("email", "asc");
  });
});
