import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import rootReducer from '@/redux/rootReducer';
import DashboardModule from './index';

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
  default: () => (key) => key || 'Mocked Translation'
}));

// Mock the settings hooks
vi.mock('@/settings/useMoney', () => ({
  default: () => ({
    currencySymbol: '$',
    currencyPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    formatMoney: (amount) => `$${Number(amount).toLocaleString()}`
  })
}));

// Test data
const mockStatisticsData = {
  dashboard: {
    total: 125000,
    growth: 12.5,
    count: 450
  },
  clients: {
    total: 85,
    growth: 8.2,
    count: 85
  },
  invoices: {
    total: 45000,
    growth: 15.3,
    count: 125
  },
  payments: {
    total: 38000,
    growth: -3.2,
    count: 98
  },
  quotes: {
    total: 22000,
    growth: 25.1,
    count: 67
  }
};

const mockUseStatisticsHook = (data) => ({
  data,
  isLoading: false,
  error: null,
  refresh: vi.fn()
});

// Create test store
const createTestStore = () => {
  const initialState = {
    auth: {
      user: { id: 'test-user-id' },
      current: { name: 'Test User' },
      isLoggedIn: true,
      token: 'test-token'
    },
    crud: {
      current: { result: null },
      list: { 
        result: { items: [], pagination: { current: 1, pageSize: 10, total: 0 } },
        isLoading: false, 
        isSuccess: false 
      },
      create: { result: null, current: null, isLoading: false, isSuccess: false },
      update: { result: null, current: null, isLoading: false, isSuccess: false },
      delete: { result: null, current: null, isLoading: false, isSuccess: false },
      read: { result: null, current: null, isLoading: false, isSuccess: false },
      search: { result: [], isLoading: false, isSuccess: false }
    },
    erp: {
      current: { result: null },
      list: { result: { items: [] }, isLoading: false },
      create: { result: null, isLoading: false },
      update: { result: null, isLoading: false },
      delete: { result: null, isLoading: false },
      read: { result: null, isLoading: false },
      search: { result: [], isLoading: false }
    },
    settings: {
      result: { currency_code: 'USD', currency_symbol: '$' },
      loading: false
    },
    ai: { conversations: [], currentConversation: null }
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

const renderWithProvider = (ui, options = {}) => {
  const store = createTestStore();
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
  default: () => (key) => key,
}));

// Mock the money hook
vi.mock('@/settings', () => ({
  useMoney: () => ({
    moneyFormatter: (amount) => `$${amount?.toLocaleString() || '0'}`,
  }),
}));

// Mock Redux selectors
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: vi.fn(() => ({
      decimal_sep: '.',
      thousand_sep: ',',
      cent_precision: 2,
      currency_symbol: '$',
    })),
  };
});

// Mock request function
vi.mock('@/../request', () => ({
  request: {
    summary: vi.fn(),
  },
}));

// Mock layout components that might cause issues in jsdom
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    Col: ({ children, ...props }) => (
      <div data-testid="col" {...props}>
        {children}
      </div>
    ),
    Row: ({ children, ...props }) => (
      <div data-testid="row" {...props}>
        {children}
      </div>
    ),
  };
});

describe('DashboardModule', () => {
  beforeEach(() => {
    // Set up default mock returns using the imported mocked hooks
    vi.mocked(useDashboardStats).mockReturnValue(
      mockUseStatisticsHook(mockStatisticsData.dashboard)
    );
    vi.mocked(useClientStats).mockReturnValue(mockUseStatisticsHook(mockStatisticsData.clients));
    vi.mocked(useInvoiceStats).mockReturnValue(mockUseStatisticsHook(mockStatisticsData.invoices));
    vi.mocked(usePaymentStats).mockReturnValue(mockUseStatisticsHook(mockStatisticsData.payments));
    vi.mocked(useQuoteStats).mockReturnValue(mockUseStatisticsHook(mockStatisticsData.quotes));
  });

  it('renders without crashing', () => {
    renderWithProvider(<DashboardModule />);
    expect(screen.getByTestId('row')).toBeInTheDocument();
  });

  it('displays dashboard statistics when data is loaded', async () => {
    renderWithProvider(<DashboardModule />);

    await waitFor(() => {
      // Check if summary cards are rendered with correct data
      expect(screen.getByText('$150,000')).toBeInTheDocument(); // totalRevenue
      expect(screen.getByText('$45,000')).toBeInTheDocument(); // totalProfit
      expect(screen.getByText('245')).toBeInTheDocument(); // totalInvoices
      expect(screen.getByText('180')).toBeInTheDocument(); // totalClients
    });
  });

  it('displays loading state when statistics are loading', () => {
    vi.mocked(useDashboardStats).mockReturnValue(mockUseStatisticsHook(null, true));

    renderWithProvider(<DashboardModule />);

    // Should show loading spinners
    expect(screen.getAllByTestId('loading-spinner')).toHaveLength(4);
  });

  it('displays error state when statistics fail to load', async () => {
    const errorMessage = 'Failed to load statistics';
    vi.mocked(useDashboardStats).mockReturnValue(mockUseStatisticsHook(null, false, errorMessage));

    renderWithProvider(<DashboardModule />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('calls refresh functions when refreshing dashboard', () => {
    const mockRefreshDashboard = vi.fn();
    const mockRefreshClients = vi.fn();

    vi.mocked(useDashboardStats).mockReturnValue({
      ...mockUseStatisticsHook(mockStatisticsData.dashboard),
      refresh: mockRefreshDashboard,
    });
    vi.mocked(useClientStats).mockReturnValue({
      ...mockUseStatisticsHook(mockStatisticsData.clients),
      refresh: mockRefreshClients,
    });

    renderWithProvider(<DashboardModule />);

    // The component should call refresh functions automatically
    expect(mockRefreshDashboard).toHaveBeenCalled();
    expect(mockRefreshClients).toHaveBeenCalled();
  });

  it('uses correct timeframe for statistics', () => {
    renderWithProvider(<DashboardModule />);

    expect(useDashboardStats).toHaveBeenCalledWith({
      timeframe: '30',
      autoRefresh: true,
      refreshInterval: 60000,
    });

    expect(useClientStats).toHaveBeenCalledWith({
      timeframe: '30',
    });
  });

  it('displays growth percentages correctly', async () => {
    renderWithProvider(<DashboardModule />);

    await waitFor(() => {
      expect(screen.getByText('+12.5%')).toBeInTheDocument(); // revenueGrowth
      expect(screen.getByText('+8.3%')).toBeInTheDocument(); // profitGrowth
      expect(screen.getByText('+15.2%')).toBeInTheDocument(); // invoiceGrowth
      expect(screen.getByText('+7.1%')).toBeInTheDocument(); // clientGrowth
    });
  });

  it('handles missing statistics data gracefully', () => {
    vi.mocked(useDashboardStats).mockReturnValue(mockUseStatisticsHook(null, false));

    renderWithProvider(<DashboardModule />);

    // Should not crash and show fallback values
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('formats currency correctly', async () => {
    const customData = {
      ...mockStatisticsData.dashboard,
      totalRevenue: 1234567.89,
      totalProfit: 123456.78,
    };

    vi.mocked(useDashboardStats).mockReturnValue(mockUseStatisticsHook(customData));

    renderWithProvider(<DashboardModule />);

    await waitFor(() => {
      expect(screen.getByText('$1,234,568')).toBeInTheDocument(); // rounded revenue
      expect(screen.getByText('$123,457')).toBeInTheDocument(); // rounded profit
    });
  });

  it('auto-refreshes data at specified interval', () => {
    renderWithProvider(<DashboardModule />);

    expect(useDashboardStats).toHaveBeenCalledWith(
      expect.objectContaining({
        autoRefresh: true,
        refreshInterval: 60000,
      })
    );
  });
});
