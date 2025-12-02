import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectRow from '../ProjectRow';

// Mock TableActionButtons to simplify testing
jest.mock('../TableActionButtons', () => ({ actions }) => (
    <div data-testid="action-buttons">
        {actions.map((action, index) => (
            <button key={index} onClick={action.onClick}>
                {action.label}
            </button>
        ))}
    </div>
));

describe('ProjectRow', () => {
    const mockProject = {
        identifier: 'PROJ-123',
        name: 'Test Project',
        description: 'A test project',
        status: 'active',
        type: 'VPC',
        region: 'us-east-1',
        provider: 'aws',
        created_at: '2023-01-01T00:00:00Z',
        resources_count: { instances: 5 }
    };

    const mockHandlers = {
        onSelect: jest.fn(),
        onView: jest.fn(),
        onArchive: jest.fn(),
        onActivate: jest.fn(),
        onDelete: jest.fn()
    };

    it('renders project details correctly', () => {
        render(
            <table>
                <tbody>
                    <ProjectRow project={mockProject} {...mockHandlers} />
                </tbody>
            </table>
        );

        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('PROJ-123')).toBeInTheDocument();
        expect(screen.getByText('A test project')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('VPC')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Resources count
        expect(screen.getByText('us-east-1')).toBeInTheDocument();
        expect(screen.getByText('aws')).toBeInTheDocument();
    });

    it('handles selection', () => {
        render(
            <table>
                <tbody>
                    <ProjectRow project={mockProject} isSelected={false} {...mockHandlers} />
                </tbody>
            </table>
        );

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(mockHandlers.onSelect).toHaveBeenCalledWith('PROJ-123');
    });

    it('shows correct actions for active project', () => {
        render(
            <table>
                <tbody>
                    <ProjectRow project={mockProject} {...mockHandlers} />
                </tbody>
            </table>
        );

        expect(screen.getByText('Archive Project')).toBeInTheDocument();
        expect(screen.queryByText('Activate Project')).not.toBeInTheDocument();
    });

    it('shows correct actions for inactive project', () => {
        const inactiveProject = { ...mockProject, status: 'inactive' };
        render(
            <table>
                <tbody>
                    <ProjectRow project={inactiveProject} {...mockHandlers} />
                </tbody>
            </table>
        );

        expect(screen.getByText('Activate Project')).toBeInTheDocument();
        expect(screen.queryByText('Archive Project')).not.toBeInTheDocument();
    });

    it('calls action handlers', () => {
        render(
            <table>
                <tbody>
                    <ProjectRow project={mockProject} {...mockHandlers} />
                </tbody>
            </table>
        );

        fireEvent.click(screen.getByText('View Details'));
        expect(mockHandlers.onView).toHaveBeenCalledWith(mockProject);

        fireEvent.click(screen.getByText('Archive Project'));
        expect(mockHandlers.onArchive).toHaveBeenCalledWith(mockProject);

        fireEvent.click(screen.getByText('Delete Project'));
        expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockProject);
    });
});
