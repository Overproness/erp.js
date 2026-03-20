import { configureStore } from '@/reduxjs/toolkit';
import { render, screen } from '@/testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import rootReducer from '@/redux/rootReducer';
import DashboardModule from './index';

// Simple mock data
const mockStats = {
  data: {
    total: 25000,
    growth: 15.5,
    count: 150,
  },
  isLoading: false,
  error: null,
  refresh: vi.fn(),
};

// Mock the statistics hooks
vi.mock('@/hooks/useStatistics', () => ({
  useClientStats: vi.fn(),
  useDashboardStats: vi.fn(),
  useInvoiceStats: vi.fn(),
  usePaymentStats: vi.fn(),
  useQuoteStats: vi.fn(),
}));

// Mock the language hook
vi.mock('@/locale/useLanguage', () => ({
  default: () => (key) => key || 'Mocked Translation',
}));

// Mock the settings hooks
vi.mock('@/settings/useMoney', () => ({
  default: () => ({
    currencySymbol: '$',
    currencyPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    formatMoney: (amount) => `$${Number(amount).toLocaleString()}`,
  }),
}));

// Create a minimal Redux store
const createTestStore = () => {
  const initialState = {
    auth: {
      user: { id: 'test-user-id' },
      current: { name: 'Test User' },
      isLoggedIn: true,
      token: 'test-token',
    },
    crud: {
      current: { result: null },
      list: {
        result: { items: [], pagination: { current: 1, pageSize: 10, total: 0 } },
        isLoading: false,
        isSuccess: false,
      },
      create: { result: null, current: null, isLoading: false, isSuccess: false },
      update: { result: null, current: null, isLoading: false, isSuccess: false },
      delete: { result: null, current: null, isLoading: false, isSuccess: false },
      read: { result: null, current: null, isLoading: false, isSuccess: false },
      search: { result: [], isLoading: false, isSuccess: false },
    },
    erp: {
      current: { result: null },
      list: { result: { items: [] }, isLoading: false },
      create: { result: null, isLoading: false },
      update: { result: null, isLoading: false },
      delete: { result: null, isLoading: false },
      read: { result: null, isLoading: false },
      search: { result: [], isLoading: false },
    },
    settings: {
      result: { currency_code: 'USD', currency_symbol: '$' },
      loading: false,
    },
    ai: { conversations: [], currentConversation: null },
  };

  return configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
};

const TestWrapper = ({ children }) => {
  const store = createTestStore();
  return (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );
};

describe('DashboardModule - Simple Tests', () => {
  // Import the mocked hooks after they're mocked
  let useClientStats, useDashboardStats, useInvoiceStats, usePaymentStats, useQuoteStats;

  beforeEach(async () => {
    // Dynamically import the mocked hooks
    const statsModule = await import('@/hooks/useStatistics');
    useClientStats = statsModule.useClientStats;
    useDashboardStats = statsModule.useDashboardStats;
    useInvoiceStats = statsModule.useInvoiceStats;
    usePaymentStats = statsModule.usePaymentStats;
    useQuoteStats = statsModule.useQuoteStats;

    // Set up default mock returns
    useClientStats.mockReturnValue(mockStats);
    useDashboardStats.mockReturnValue(mockStats);
    useInvoiceStats.mockReturnValue(mockStats);
    usePaymentStats.mockReturnValue(mockStats);
    useQuoteStats.mockReturnValue(mockStats);
  });

  it('renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <DashboardModule />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('displays dashboard title', () => {
    render(
      <TestWrapper>
        <DashboardModule />
      </TestWrapper>
    );

    // Check if dashboard title exists
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    render(
      <TestWrapper>
        <DashboardModule />
      </TestWrapper>
    );

    // Check for summary cards container
    const summaryCards = screen.getAllByTestId(/summary-card/i);
    expect(summaryCards.length).toBeGreaterThan(0);
  });
});
