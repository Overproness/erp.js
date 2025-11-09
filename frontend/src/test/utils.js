import { render } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock Redux store
const createMockStore = (initialState = {}) => ({
  getState: () => initialState,
  subscribe: vi.fn(),
  dispatch: vi.fn(),
});

// Custom render function that includes providers
export const renderWithProviders = (
  ui,
  { preloadedState = {}, store = createMockStore(preloadedState), ...renderOptions } = {}
) => {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ConfigProvider>{children}</ConfigProvider>
        </BrowserRouter>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Mock data generators
export const mockStatisticsData = {
  dashboard: {
    totalRevenue: 150000,
    totalProfit: 45000,
    totalInvoices: 245,
    totalClients: 180,
    revenueGrowth: 12.5,
    profitGrowth: 8.3,
    invoiceGrowth: 15.2,
    clientGrowth: 7.1,
  },
  invoices: {
    total: 245,
    paid: 180,
    pending: 45,
    overdue: 20,
    totalAmount: 125000,
    averageAmount: 510.2,
    growth: 15.2,
  },
  quotes: {
    total: 320,
    accepted: 190,
    pending: 90,
    rejected: 40,
    totalAmount: 180000,
    averageAmount: 562.5,
    conversionRate: 59.4,
  },
  payments: {
    total: 180,
    completed: 165,
    pending: 10,
    failed: 5,
    totalAmount: 98000,
    averageAmount: 544.44,
    growth: 10.5,
  },
  clients: {
    total: 180,
    active: 145,
    inactive: 35,
    new: 12,
    growth: 7.1,
    retention: 85.2,
  },
  tasks: {
    total: 450,
    completed: 280,
    inProgress: 120,
    pending: 50,
    overdue: 25,
    completionRate: 62.2,
  },
};

// Mock API responses
export const mockSuccessResponse = (data) => ({
  success: true,
  result: data,
  message: 'Success',
});

export const mockErrorResponse = (message = 'Error occurred') => ({
  success: false,
  result: null,
  message,
});

// Mock statistics hooks
export const mockUseStatisticsHook = (data, loading = false, error = null) => ({
  data,
  loading,
  error,
  refresh: vi.fn(),
});
