import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import rootReducer from '../redux/rootReducer';

// Mock global variables
Object.defineProperty(global, 'navigator', {
  value: {
    language: 'en-US',
    languages: ['en-US'],
    userAgent: 'vitest',
    cookieEnabled: true,
    onLine: true,
    platform: 'test',
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
  },
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    navigator: global.navigator,
    location: {
      href: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      origin: 'http://localhost:3000',
    },
    history: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn(),
      length: 1,
      state: null,
    },
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    document: {
      createElement: vi.fn(),
      getElementById: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    getComputedStyle: vi.fn(() => ({})),
    matchMedia: vi.fn(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock axios and request modules
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    post: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    put: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    delete: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    patch: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    create: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
      post: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
      put: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
      delete: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
      patch: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    })),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

vi.mock('../request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ success: true, result: [] })),
    post: vi.fn(() => Promise.resolve({ success: true, result: {} })),
    put: vi.fn(() => Promise.resolve({ success: true, result: {} })),
    delete: vi.fn(() => Promise.resolve({ success: true, result: {} })),
    summary: vi.fn(() => Promise.resolve({ success: true, result: {} })),
  },
  request: {
    get: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    post: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    put: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    delete: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    patch: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
  },
}));

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

// Mock context providers and hooks
vi.mock('../locale/useLanguage', () => ({
  default: vi.fn(() => vi.fn((key) => key || 'Mocked Translation')),
}));

vi.mock('../settings/useDate', () => ({
  default: vi.fn(() => ({
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm:ss',
    formatDate: vi.fn((date) => new Date(date).toLocaleDateString()),
    formatTime: vi.fn((time) => new Date(time).toLocaleTimeString()),
  })),
}));

vi.mock('../settings/useMoney', () => ({
  default: vi.fn(() => ({
    currencySymbol: '$',
    currencyPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    formatMoney: vi.fn((amount) => `$${Number(amount).toLocaleString()}`),
  })),
}));

// Mock settings module
vi.mock('../settings', () => ({
  useLanguage: () => () => 'en',
  useDate: () => ({ dateFormat: 'DD/MM/YYYY' }),
  useMoney: () => ({
    moneyFormatter: (params) => {
      if (params === undefined || params === null) return '$0';

      if (typeof params === 'object') {
        const amount = params.amount !== undefined ? params.amount : 0;
        const currency_code = params.currency_code || 'USD';

        if (currency_code === 'JPY') {
          return `¥${Math.round(amount).toLocaleString()}`;
        }
        return `$${Math.round(amount).toLocaleString()}`;
      } else {
        return `$${Math.round(params).toLocaleString()}`;
      }
    },
  }),
  defaultSettings: {},
}));

// Mock context providers with proper structure
vi.mock('../context/appContext', () => ({
  useAppContext: () => ({
    state: { collapsed: false },
    appContextAction: {
      navMenu: {
        open: vi.fn(),
        close: vi.fn(),
      },
    },
  }),
  AppContextProvider: ({ children }) => children,
}));

// Mock CRUD context
vi.mock('../context/crud', () => ({
  useCrudContext: () => ({
    state: {
      list: { result: { items: [] } },
      current: {},
      modal: { isOpen: false },
      panel: { isOpen: false },
      readBox: { isOpen: false },
    },
    crudContextAction: {
      panel: { open: vi.fn(), close: vi.fn() },
      readBox: { open: vi.fn(), close: vi.fn() },
      modal: { open: vi.fn(), close: vi.fn() },
    },
  }),
  CrudContextProvider: ({ children }) => children,
}));

// Mock other hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Create a comprehensive initial state for the Redux store
const createDefaultState = () => ({
  auth: {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
    current: { name: 'Test User' },
    isLoggedIn: true,
    token: 'test-token',
    loading: false,
    error: null,
  },
  crud: {
    current: {
      result: null,
    },
    list: {
      result: {
        items: [],
        pagination: {
          current: 1,
          pageSize: 10,
          total: 0,
          showSizeChanger: false,
        },
      },
      isLoading: false,
      isSuccess: false,
    },
    create: {
      result: null,
      current: null,
      isLoading: false,
      isSuccess: false,
    },
    update: {
      result: null,
      current: null,
      isLoading: false,
      isSuccess: false,
    },
    delete: {
      result: null,
      current: null,
      isLoading: false,
      isSuccess: false,
    },
    read: {
      result: null,
      current: null,
      isLoading: false,
      isSuccess: false,
    },
    search: {
      result: {
        items: [],
        pagination: {
          current: 1,
          pageSize: 10,
          total: 0,
        },
      },
      isLoading: false,
      isSuccess: false,
    },
  },
  erp: {
    current: {
      result: null,
    },
    list: {
      result: {
        items: [],
        pagination: {
          current: 1,
          pageSize: 10,
          total: 0,
        },
      },
      isLoading: false,
      isSuccess: false,
    },
    create: {
      result: null,
      current: null,
      isLoading: false,
      isSuccess: false,
    },
    update: {
      result: null,
      current: null,
      isLoading: false,
      isSuccess: false,
    },
    delete: {
      result: null,
      current: null,
      isLoading: false,
      isSuccess: false,
    },
    read: {
      result: null,
      current: null,
      isLoading: false,
      isSuccess: false,
    },
  },
  settings: {
    result: {
      currency_code: 'USD',
      currency_symbol: '$',
      theme: 'light',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'HH:mm:ss',
    },
    loading: false,
    error: null,
  },
  ai: {
    conversations: [],
    currentConversation: null,
    isLoading: false,
    error: null,
  },
});

const createTestStore = (initialState = {}) => {
  const defaultState = createDefaultState();

  // Deep merge function to properly merge nested objects
  const deepMerge = (target, source) => {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  };

  const mergedState = deepMerge(defaultState, initialState);

  return configureStore({
    reducer: rootReducer,
    preloadedState: mergedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
};

const TestProvider = ({ children, initialState = {} }) => {
  const store = createTestStore(initialState);

  return (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );
};

const renderWithProvider = (ui, options = {}) => {
  const { initialState = {}, ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <TestProvider initialState={initialState}>{children}</TestProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Export legacy function name for compatibility
const renderWithProviders = renderWithProvider;

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

export {
  createDefaultState,
  createTestStore,
  renderWithProvider,
  renderWithProviders,
  TestProvider,
};
