import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, mockStatisticsData, mockUseStatisticsHook } from '@/test/utils.jsx'
import InvoicePage from './index'

// Create mock function reference
const mockUseInvoiceStats = vi.fn();

// Mock the useInvoiceStats module
vi.mock('@/hooks/useStatistics', () => ({
  useInvoiceStats: () => mockUseInvoiceStats(),
}));

// Mock the language hook
vi.mock('@/locale/useLanguage', () => ({
  default: () => (key) => key,
}))

// Mock the money hook
vi.mock('@/settings', () => ({
  useMoney: () => ({
    moneyFormatter: (amount) => `$${amount?.toLocaleString() || '0'}`,
  }),
}))

// Mock Redux selectors
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useSelector: vi.fn(() => ({
      decimal_sep: '.',
      thousand_sep: ',',
      cent_precision: 2,
      currency_symbol: '$',
    })),
  }
})

describe('InvoicePage', () => {
  beforeEach(() => {
    // Set up default mock return
    mockUseInvoiceStats.mockReturnValue(
      mockUseStatisticsHook(mockStatisticsData.invoices)
    )
  })

  it('renders without crashing', () => {
    renderWithProviders(<InvoicePage />)
    expect(screen.getByText('Invoice Statistics')).toBeInTheDocument()
  })

  it('displays invoice statistics when data is loaded', async () => {
    renderWithProviders(<InvoicePage />)

    await waitFor(() => {
      // Check if invoice statistics are displayed
      expect(screen.getByText('245')).toBeInTheDocument() // total invoices
      expect(screen.getByText('180')).toBeInTheDocument() // paid invoices
      expect(screen.getByText('45')).toBeInTheDocument()  // pending invoices
      expect(screen.getByText('20')).toBeInTheDocument()  // overdue invoices
      expect(screen.getByText('$125,000')).toBeInTheDocument() // total amount
    })
  })

  it('displays loading state when statistics are loading', () => {
    mockUseInvoiceStats.mockReturnValue(
      mockUseStatisticsHook(null, true)
    )

    renderWithProviders(<InvoicePage />)

    // Should show loading spinners
    expect(screen.getAllByTestId('loading-spinner')).toHaveLength(5)
  })

  it('displays error state when statistics fail to load', async () => {
    const errorMessage = 'Failed to load invoice statistics'
    mockUseInvoiceStats.mockReturnValue(
      mockUseStatisticsHook(null, false, errorMessage)
    )

    renderWithProviders(<InvoicePage />)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('displays growth percentage correctly', async () => {
    renderWithProviders(<InvoicePage />)

    await waitFor(() => {
      expect(screen.getByText('+15.2%')).toBeInTheDocument() // invoice growth
    })
  })

  it('calculates and displays average amount correctly', async () => {
    renderWithProviders(<InvoicePage />)

    await waitFor(() => {
      expect(screen.getByText('$510')).toBeInTheDocument() // average amount
    })
  })

  it('handles missing statistics data gracefully', () => {
    mockUseInvoiceStats.mockReturnValue(
      mockUseStatisticsHook(null, false)
    )

    renderWithProviders(<InvoicePage />)

    // Should not crash and show fallback values
    expect(screen.getByText('$0')).toBeInTheDocument()
  })

  it('uses correct timeframe for statistics', () => {
    renderWithProviders(<InvoicePage />)

    expect(mockUseInvoiceStats).toHaveBeenCalledWith({
      timeframe: '30',
    })
  })

  it('displays invoice status breakdown correctly', async () => {
    renderWithProviders(<InvoicePage />)

    await waitFor(() => {
      // Check status breakdown
      expect(screen.getByText('Total Invoices')).toBeInTheDocument()
      expect(screen.getByText('Paid Invoices')).toBeInTheDocument()
      expect(screen.getByText('Pending Invoices')).toBeInTheDocument()
      expect(screen.getByText('Overdue Invoices')).toBeInTheDocument()
    })
  })

  it('formats currency values correctly', async () => {
    const customData = {
      ...mockStatisticsData.invoices,
      totalAmount: 1234567.89,
      averageAmount: 567.234,
    }

    mockUseInvoiceStats.mockReturnValue(
      mockUseStatisticsHook(customData)
    )

    renderWithProviders(<InvoicePage />)

    await waitFor(() => {
      expect(screen.getByText('$1,234,568')).toBeInTheDocument() // rounded total
      expect(screen.getByText('$567')).toBeInTheDocument()       // rounded average
    })
  })

  it('calculates percentages correctly for status breakdown', async () => {
    renderWithProviders(<InvoicePage />)

    await waitFor(() => {
      // Paid percentage: 180/245 = 73.5%
      expect(screen.getByText('73.5%')).toBeInTheDocument()
      // Pending percentage: 45/245 = 18.4%
      expect(screen.getByText('18.4%')).toBeInTheDocument()
      // Overdue percentage: 20/245 = 8.2%
      expect(screen.getByText('8.2%')).toBeInTheDocument()
    })
  })
})
