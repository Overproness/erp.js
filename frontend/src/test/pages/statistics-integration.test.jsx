import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Document from '../../pages/Document/index';
import PaymentMode from '../../pages/PaymentMode/index';
import Taxes from '../../pages/Taxes/index';
import WorkflowBuilder from '../../pages/WorkflowBuilder/index';

// Mock the statistics hooks
vi.mock('../../hooks/useStatistics', () => ({
  useDocumentStats: vi.fn(),
  usePaymentModeStats: vi.fn(),
  useTaxStats: vi.fn(),
  useWorkflowStats: vi.fn(),
}));

// Mock other dependencies
vi.mock('../../locale/useLanguage', () => ({
  default: () => (key) => key,
}));

vi.mock('../../components/Workflow/WorkflowCanvas', () => ({
  default: () => <div data-testid="workflow-canvas">Workflow Canvas</div>,
}));

vi.mock('../../components/Workflow/WorkflowSidebar', () => ({
  default: () => <div data-testid="workflow-sidebar">Workflow Sidebar</div>,
}));

vi.mock('../../pages/CrudModule/CrudModule', () => ({
  default: () => <div data-testid="crud-module">CRUD Module</div>,
}));

vi.mock('../../forms/PaymentModeForm', () => ({
  default: () => <div data-testid="payment-mode-form">Payment Mode Form</div>,
}));

vi.mock('../../forms/TaxForm', () => ({
  default: () => <div data-testid="tax-form">Tax Form</div>,
}));

// Mock Redux store
const createMockStore = () =>
  configureStore({
    reducer: {
      erp: (
        state = { list: { items: [], loading: false }, create: { loading: false, success: false } }
      ) => state,
    },
  });

const renderWithProviders = (component) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
};

describe('Statistics Pages Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Document Page', () => {
    it('should display loading state for document statistics', async () => {
      const { useDocumentStats } = await import('../../hooks/useStatistics');

      useDocumentStats.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      renderWithProviders(<Document />);

      expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
    });

    it('should display document statistics when loaded', async () => {
      const { useDocumentStats } = await import('../../hooks/useStatistics');

      const mockStats = {
        totalDocuments: 150,
        newThisMonth: 25,
        totalSize: 2048000000, // 2GB
        byType: [
          { type: 'PDF', count: 75 },
          { type: 'Word', count: 45 },
          { type: 'Excel', count: 30 },
        ],
      };

      useDocumentStats.mockReturnValue({
        data: mockStats,
        loading: false,
        error: null,
      });

      renderWithProviders(<Document />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total Documents
        expect(screen.getByText('25')).toBeInTheDocument(); // Recent Uploads
        expect(screen.getByText('2.0 GB')).toBeInTheDocument(); // Total Size (calculated)
        expect(screen.getByText('3')).toBeInTheDocument(); // Categories (byType length)
      });
    });

    it('should display error state for document statistics', async () => {
      const { useDocumentStats } = await import('../../hooks/useStatistics');

      useDocumentStats.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to load document statistics',
      });

      renderWithProviders(<Document />);

      expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
      expect(screen.getByText('Failed to load document statistics')).toBeInTheDocument();
    });
  });

  describe('Payment Mode Page', () => {
    it('should display payment mode statistics when loaded', async () => {
      const { usePaymentModeStats } = await import('../../hooks/useStatistics');

      const mockStats = {
        totalPaymentModes: 12,
        activePaymentModes: 8,
        defaultPaymentModes: 3,
        newThisMonth: 2,
      };

      usePaymentModeStats.mockReturnValue({
        data: mockStats,
        loading: false,
        error: null,
      });

      renderWithProviders(<PaymentMode />);

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument(); // Total Methods
        expect(screen.getByText('8')).toBeInTheDocument(); // Active
        expect(screen.getByText('3')).toBeInTheDocument(); // Default
        expect(screen.getByText('2')).toBeInTheDocument(); // Recent
      });
    });

    it('should display loading state for payment mode statistics', async () => {
      const { usePaymentModeStats } = await import('../../hooks/useStatistics');

      usePaymentModeStats.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      renderWithProviders(<PaymentMode />);

      expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
    });
  });

  describe('Tax Page', () => {
    it('should display tax statistics when loaded', async () => {
      const { useTaxStats } = await import('../../hooks/useStatistics');

      const mockStats = {
        totalTaxes: 8,
        activeTaxes: 6,
        defaultTaxes: 1,
        averageRate: 15.5,
      };

      useTaxStats.mockReturnValue({
        data: mockStats,
        loading: false,
        error: null,
      });

      renderWithProviders(<Taxes />);

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument(); // Total Taxes
        expect(screen.getByText('6')).toBeInTheDocument(); // Active
        expect(screen.getByText('1')).toBeInTheDocument(); // Default
        expect(screen.getByText('15.5%')).toBeInTheDocument(); // Average Rate
      });
    });
  });

  describe('Workflow Builder Page', () => {
    it('should display workflow statistics when loaded', async () => {
      const { useWorkflowStats } = await import('../../hooks/useStatistics');

      const mockStats = {
        totalWorkflows: 15,
        activeWorkflows: 8,
        completedTasks: 142,
        averageExecutionTime: '2.5m',
      };

      useWorkflowStats.mockReturnValue({
        data: mockStats,
        loading: false,
        error: null,
      });

      renderWithProviders(<WorkflowBuilder />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Total Workflows
        expect(screen.getByText('8')).toBeInTheDocument(); // Active
        expect(screen.getByText('142')).toBeInTheDocument(); // Completed Tasks
        expect(screen.getByText('2.5m')).toBeInTheDocument(); // Avg Time
      });
    });
  });

  describe('Statistics Auto-refresh', () => {
    it('should call statistics hooks with auto-refresh configuration', async () => {
      const { useDocumentStats } = await import('../../hooks/useStatistics');

      useDocumentStats.mockReturnValue({
        data: { totalDocuments: 100 },
        loading: false,
        error: null,
      });

      renderWithProviders(<Document />);

      expect(useDocumentStats).toHaveBeenCalledWith({
        timeframe: '30',
        autoRefresh: true,
        refreshInterval: 300000, // 5 minutes
      });
    });
  });

  describe('Zero State Handling', () => {
    it('should handle zero values in statistics gracefully', async () => {
      const { useDocumentStats } = await import('../../hooks/useStatistics');

      const mockStats = {
        totalDocuments: 0,
        newThisMonth: 0,
        totalSize: 0,
        byType: [],
      };

      useDocumentStats.mockReturnValue({
        data: mockStats,
        loading: false,
        error: null,
      });

      renderWithProviders(<Document />);

      await waitFor(() => {
        // Should display zeros instead of crashing
        const zeroValues = screen.getAllByText('0');
        expect(zeroValues.length).toBeGreaterThan(0);
      });
    });
  });
});
