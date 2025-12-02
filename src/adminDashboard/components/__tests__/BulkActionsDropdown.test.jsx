import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkActionsDropdown from '../BulkActionsDropdown';

describe('BulkActionsDropdown', () => {
    const mockOnExport = jest.fn();
    const mockOnDuplicate = jest.fn();
    const mockOnArchive = jest.fn();
    const mockOnDelete = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('shows selected count', () => {
        render(
            <BulkActionsDropdown
                selectedCount={5}
                onExport={mockOnExport}
                onDuplicate={mockOnDuplicate}
                onArchive={mockOnArchive}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText(/5 selected/i)).toBeInTheDocument();
    });

    test('renders all actions', () => {
        render(
            <BulkActionsDropdown
                selectedCount={3}
                onExport={mockOnExport}
                onDuplicate={mockOnDuplicate}
                onArchive={mockOnArchive}
                onDelete={mockOnDelete}
            />
        );

        // Open dropdown
        const button = screen.getByRole('button', { name: /bulk actions/i });
        fireEvent.click(button);

        // Should show all actions
        expect(screen.getByText(/export/i)).toBeInTheDocument();
        expect(screen.getByText(/duplicate/i)).toBeInTheDocument();
        expect(screen.getByText(/archive/i)).toBeInTheDocument();
        expect(screen.getByText(/delete/i)).toBeInTheDocument();
    });

    test('triggers correct callback for export', () => {
        render(
            <BulkActionsDropdown
                selectedCount={2}
                onExport={mockOnExport}
                onDuplicate={mockOnDuplicate}
                onArchive={mockOnArchive}
                onDelete={mockOnDelete}
            />
        );

        // Open dropdown
        const button = screen.getByRole('button', { name: /bulk actions/i });
        fireEvent.click(button);

        // Click export
        const exportButton = screen.getByText(/export/i);
        fireEvent.click(exportButton);

        expect(mockOnExport).toHaveBeenCalled();
    });

    test('triggers correct callback for duplicate', () => {
        render(
            <BulkActionsDropdown
                selectedCount={2}
                onExport={mockOnExport}
                onDuplicate={mockOnDuplicate}
                onArchive={mockOnArchive}
                onDelete={mockOnDelete}
            />
        );

        // Open dropdown
        const button = screen.getByRole('button', { name: /bulk actions/i });
        fireEvent.click(button);

        // Click duplicate
        const duplicateButton = screen.getByText(/duplicate/i);
        fireEvent.click(duplicateButton);

        expect(mockOnDuplicate).toHaveBeenCalled();
    });

    test('disabled when no items selected', () => {
        render(
            <BulkActionsDropdown
                selectedCount={0}
                onExport={mockOnExport}
                onDuplicate={mockOnDuplicate}
                onArchive={mockOnArchive}
                onDelete={mockOnDelete}
            />
        );

        const button = screen.getByRole('button', { name: /bulk actions/i });
        expect(button).toBeDisabled();
    });

    test('shows export format submenu', () => {
        render(
            <BulkActionsDropdown
                selectedCount={3}
                onExport={mockOnExport}
                onDuplicate={mockOnDuplicate}
                onArchive={mockOnArchive}
                onDelete={mockOnDelete}
            />
        );

        // Open dropdown
        const button = screen.getByRole('button', { name: /bulk actions/i });
        fireEvent.click(button);

        // Click export to show submenu
        const exportButton = screen.getByText(/export/i);
        fireEvent.click(exportButton);

        // Should show format options
        expect(screen.getByText(/csv/i)).toBeInTheDocument();
        expect(screen.getByText(/excel/i)).toBeInTheDocument();
        expect(screen.getByText(/pdf/i)).toBeInTheDocument();
    });

    test('calls onExport with correct format', () => {
        render(
            <BulkActionsDropdown
                selectedCount={3}
                onExport={mockOnExport}
                onDuplicate={mockOnDuplicate}
                onArchive={mockOnArchive}
                onDelete={mockOnDelete}
            />
        );

        // Open dropdown
        const button = screen.getByRole('button', { name: /bulk actions/i });
        fireEvent.click(button);

        // Click export
        const exportButton = screen.getByText(/export/i);
        fireEvent.click(exportButton);

        // Click CSV
        const csvButton = screen.getByText(/csv/i);
        fireEvent.click(csvButton);

        expect(mockOnExport).toHaveBeenCalledWith('csv');
    });
});
