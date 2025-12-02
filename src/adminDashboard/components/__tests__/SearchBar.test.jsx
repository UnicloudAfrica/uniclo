import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
    const mockOnSearch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('renders with placeholder', () => {
        render(<SearchBar onSearch={mockOnSearch} placeholder="Search users..." />);

        const input = screen.getByPlaceholderText('Search users...');
        expect(input).toBeInTheDocument();
    });

    test('debounces input correctly', async () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText(/search/i);

        // Type quickly
        fireEvent.change(input, { target: { value: 'test' } });

        // Should not call immediately
        expect(mockOnSearch).not.toHaveBeenCalled();

        // Fast-forward time
        jest.advanceTimersByTime(300);

        // Should call after debounce
        await waitFor(() => {
            expect(mockOnSearch).toHaveBeenCalledWith('test');
        });
    });

    test('clear button works', async () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText(/search/i);

        // Type something
        fireEvent.change(input, { target: { value: 'test query' } });
        jest.advanceTimersByTime(300);

        // Find and click clear button
        const clearButton = screen.getByRole('button', { name: /clear/i });
        fireEvent.click(clearButton);

        // Input should be empty
        expect(input.value).toBe('');

        // Should call onSearch with empty string
        jest.advanceTimersByTime(300);
        await waitFor(() => {
            expect(mockOnSearch).toHaveBeenCalledWith('');
        });
    });

    test('keyboard shortcut (Ctrl+K) works', () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText(/search/i);

        // Trigger Ctrl+K
        fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

        // Input should be focused
        expect(input).toHaveFocus();
    });

    test('loading state displays', () => {
        render(<SearchBar onSearch={mockOnSearch} isLoading={true} />);

        // Should show loading indicator
        const loadingIndicator = screen.getByTestId('search-loading') ||
            screen.getByRole('status');
        expect(loadingIndicator).toBeInTheDocument();
    });

    test('does not call onSearch when value is unchanged', async () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText(/search/i);

        // Type same value twice
        fireEvent.change(input, { target: { value: 'test' } });
        jest.advanceTimersByTime(300);

        await waitFor(() => {
            expect(mockOnSearch).toHaveBeenCalledTimes(1);
        });

        // Type same value again
        fireEvent.change(input, { target: { value: 'test' } });
        jest.advanceTimersByTime(300);

        // Should still only be called once
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });
});
