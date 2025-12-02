import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination', () => {
    const mockOnPageChange = jest.fn();
    const mockOnItemsPerPageChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders correct page numbers', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={mockOnPageChange}
                itemsPerPage={10}
                onItemsPerPageChange={mockOnItemsPerPageChange}
            />
        );

        // Should show page numbers 1-5
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('disables prev button on first page', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={mockOnPageChange}
                itemsPerPage={10}
                onItemsPerPageChange={mockOnItemsPerPageChange}
            />
        );

        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).toBeDisabled();
    });

    test('disables next button on last page', () => {
        render(
            <Pagination
                currentPage={5}
                totalPages={5}
                onPageChange={mockOnPageChange}
                itemsPerPage={10}
                onItemsPerPageChange={mockOnItemsPerPageChange}
            />
        );

        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).toBeDisabled();
    });

    test('shows ellipsis for many pages', () => {
        render(
            <Pagination
                currentPage={5}
                totalPages={20}
                onPageChange={mockOnPageChange}
                itemsPerPage={10}
                onItemsPerPageChange={mockOnItemsPerPageChange}
            />
        );

        // Should show ellipsis
        const ellipsis = screen.getAllByText('...');
        expect(ellipsis.length).toBeGreaterThan(0);
    });

    test('items per page selector works', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={mockOnPageChange}
                itemsPerPage={10}
                onItemsPerPageChange={mockOnItemsPerPageChange}
            />
        );

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '25' } });

        expect(mockOnItemsPerPageChange).toHaveBeenCalledWith(25);
    });

    test('clicking page number calls onPageChange', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={mockOnPageChange}
                itemsPerPage={10}
                onItemsPerPageChange={mockOnItemsPerPageChange}
            />
        );

        const page3Button = screen.getByText('3');
        fireEvent.click(page3Button);

        expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    test('next button increments page', () => {
        render(
            <Pagination
                currentPage={2}
                totalPages={5}
                onPageChange={mockOnPageChange}
                itemsPerPage={10}
                onItemsPerPageChange={mockOnItemsPerPageChange}
            />
        );

        const nextButton = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextButton);

        expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    test('prev button decrements page', () => {
        render(
            <Pagination
                currentPage={3}
                totalPages={5}
                onPageChange={mockOnPageChange}
                itemsPerPage={10}
                onItemsPerPageChange={mockOnItemsPerPageChange}
            />
        );

        const prevButton = screen.getByRole('button', { name: /previous/i });
        fireEvent.click(prevButton);

        expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });
});
