import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockStatisticsData,
  mockUseStatisticsHook,
  renderWithProviders,
} from '../../test/utils.jsx';
import TasksPage from './index';

// Create mock function reference
const mockUseTaskStats = vi.fn();

// Mock the useTaskStats module
vi.mock('../../hooks/useStatistics', () => ({
  useTaskStats: () => mockUseTaskStats(),
}));

// Mock the language hook
vi.mock('../../locale/useLanguage', () => ({
  default: () => (key) => key,
}));

describe('TasksPage', () => {
  beforeEach(() => {
    // Set up default mock return
    mockUseTaskStats.mockReturnValue(mockUseStatisticsHook(mockStatisticsData.tasks));
  });

  it('renders without crashing', () => {
    renderWithProviders(<TasksPage />);
    expect(screen.getByText('Task Statistics')).toBeInTheDocument();
  });

  it('displays task statistics when data is loaded', async () => {
    renderWithProviders(<TasksPage />);

    await waitFor(() => {
      // Check if task statistics are displayed
      expect(screen.getByText('450')).toBeInTheDocument(); // total tasks
      expect(screen.getByText('280')).toBeInTheDocument(); // completed tasks
      expect(screen.getByText('120')).toBeInTheDocument(); // in progress tasks
      expect(screen.getByText('50')).toBeInTheDocument(); // pending tasks
      expect(screen.getByText('25')).toBeInTheDocument(); // overdue tasks
    });
  });

  it('displays loading state when statistics are loading', () => {
    mockUseTaskStats.mockReturnValue(mockUseStatisticsHook(null, true));

    renderWithProviders(<TasksPage />);

    // Should show loading spinners
    expect(screen.getAllByTestId('loading-spinner')).toHaveLength(5);
  });

  it('displays error state when statistics fail to load', async () => {
    const errorMessage = 'Failed to load task statistics';
    mockUseTaskStats.mockReturnValue(mockUseStatisticsHook(null, false, errorMessage));

    renderWithProviders(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays completion rate correctly', async () => {
    renderWithProviders(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText('62.2%')).toBeInTheDocument(); // completion rate
    });
  });

  it('calculates task status percentages correctly', async () => {
    renderWithProviders(<TasksPage />);

    await waitFor(() => {
      // Completed percentage: 280/450 = 62.2%
      expect(screen.getByText('62.2%')).toBeInTheDocument();
      // In Progress percentage: 120/450 = 26.7%
      expect(screen.getByText('26.7%')).toBeInTheDocument();
      // Pending percentage: 50/450 = 11.1%
      expect(screen.getByText('11.1%')).toBeInTheDocument();
      // Overdue percentage: 25/450 = 5.6%
      expect(screen.getByText('5.6%')).toBeInTheDocument();
    });
  });

  it('handles missing statistics data gracefully', () => {
    mockUseTaskStats.mockReturnValue(mockUseStatisticsHook(null, false));

    renderWithProviders(<TasksPage />);

    // Should not crash and show fallback values
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('uses correct timeframe for statistics', () => {
    renderWithProviders(<TasksPage />);

    expect(mockUseTaskStats).toHaveBeenCalledWith({
      timeframe: '30',
    });
  });

  it('displays task status breakdown correctly', async () => {
    renderWithProviders(<TasksPage />);

    await waitFor(() => {
      // Check status breakdown
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
      expect(screen.getByText('In Progress Tasks')).toBeInTheDocument();
      expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
      expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
    });
  });

  it('shows productivity metrics correctly', async () => {
    renderWithProviders(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('62.2%')).toBeInTheDocument();
    });
  });
});
