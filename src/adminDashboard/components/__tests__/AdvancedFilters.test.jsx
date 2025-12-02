import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdvancedFilters from '../AdvancedFilters';

describe('AdvancedFilters', () => {
    const mockOnApply = jest.fn();
    const mockOnReset = jest.fn();

    const filterConfig = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
            ],
        },
        {
            key: 'role',
            label: 'Role',
            type: 'select',
            options: [
                { value: 'admin', label: 'Admin' },
                { value: 'user', label: 'User' },
            ],
        },
        {
            key: 'dateRange',
            label: 'Date Range',
            type: 'date-range',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders all filter types', () => {
        render(
            <AdvancedFilters
                filters={filterConfig}
                activeFilters={{}}
                onApply={mockOnApply}
                onReset={mockOnReset}
            />
        );

        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Role')).toBeInTheDocument();
        expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    test('updates values on change', () => {
        render(
            <AdvancedFilters
                filters={filterConfig}
                activeFilters={{}}
                onApply={mockOnApply}
                onReset={mockOnReset}
            />
        );

        const statusSelect = screen.getByLabelText('Status');
        fireEvent.change(statusSelect, { target: { value: 'active' } });

        // Value should be updated
        expect(statusSelect.value).toBe('active');
    });

    test('apply button works', () => {
        render(
            <AdvancedFilters
                filters={filterConfig}
                activeFilters={{}}
                onApply={mockOnApply}
                onReset={mockOnReset}
            />
        );

        // Change a filter
        const statusSelect = screen.getByLabelText('Status');
        fireEvent.change(statusSelect, { target: { value: 'active' } });

        // Click apply
        const applyButton = screen.getByRole('button', { name: /apply/i });
        fireEvent.click(applyButton);

        // Should call onApply with filters
        expect(mockOnApply).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'active' })
        );
    });

    test('reset clears all filters', () => {
        render(
            <AdvancedFilters
                filters={filterConfig}
                activeFilters={{ status: 'active', role: 'admin' }}
                onApply={mockOnApply}
                onReset={mockOnReset}
            />
        );

        const resetButton = screen.getByRole('button', { name: /reset/i });
        fireEvent.click(resetButton);

        expect(mockOnReset).toHaveBeenCalled();
    });

    test('shows active filter count', () => {
        render(
            <AdvancedFilters
                filters={filterConfig}
                activeFilters={{ status: 'active', role: 'admin' }}
                onApply={mockOnApply}
                onReset={mockOnReset}
            />
        );

        // Should show badge with count of 2
        const badge = screen.getByText('2');
        expect(badge).toBeInTheDocument();
    });

    test('does not show badge when no active filters', () => {
        render(
            <AdvancedFilters
                filters={filterConfig}
                activeFilters={{}}
                onApply={mockOnApply}
                onReset={mockOnReset}
            />
        );

        // Should not show badge
        const badge = screen.queryByTestId('filter-count-badge');
        expect(badge).not.toBeInTheDocument();
    });
});
