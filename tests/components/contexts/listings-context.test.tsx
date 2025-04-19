import { render, screen, act, waitFor } from '@testing-library/react';
import { ListingsProvider, useListingsContext } from '@/components/contexts/listings-context';
import { getAllListings } from '@/lib/listings/actions';
import { useListings } from '@/lib/hooks/use-listings';

// Mock the getAllListings function
jest.mock('@/lib/listings/actions', () => ({
  getAllListings: jest.fn(),
}));

const mockListings = [
  {
    id: '1',
    title: 'Test Listing 1',
    price: 100,
    description: 'Test description 1',
    createdAt: new Date().toISOString(),
    photos: [{ url: 'test1.jpg' }],
    category: 'electronics',
  },
  {
    id: '2',
    title: 'Test Listing 2',
    price: 200,
    description: 'Test description 2',
    createdAt: new Date().toISOString(),
    photos: [{ url: 'test2.jpg' }],
    category: 'furniture',
  },
];

// Test component that uses the context
function TestComponent() {
  const { listings, loading, options, metadata, updateOptions } = useListingsContext();
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="listings-count">{listings.length}</div>
      <div data-testid="current-page">{options.page}</div>
      <div data-testid="total-pages">{metadata.totalPages}</div>
      <button onClick={() => updateOptions({ page: 2 })} data-testid="next-page">
        Next Page
      </button>
    </div>
  );
}

describe('ListingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllListings as jest.Mock).mockResolvedValue({
      listings: mockListings,
      totalCount: 40,
    });
  });

  it('provides listings data and loading state', async () => {
    render(
      <ListingsProvider>
        <TestComponent />
      </ListingsProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('listings-count')).toHaveTextContent('2');
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    expect(screen.getByTestId('total-pages')).toHaveTextContent('2');
  });

  it('updates options and refetches data', async () => {
    render(
      <ListingsProvider>
        <TestComponent />
      </ListingsProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Click next page
    act(() => {
      screen.getByTestId('next-page').click();
    });

    // Should be loading again
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // Wait for new data
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(getAllListings).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useListingsContext must be used within a ListingsProvider');

    consoleSpy.mockRestore();
  });

  it('handles API errors gracefully', async () => {
    (getAllListings as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <ListingsProvider>
        <TestComponent />
      </ListingsProvider>
    );

    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('listings-count')).toHaveTextContent('0');
  });

  it('initializes with custom options', async () => {
    const initialOptions = {
      page: 2,
      pageSize: 10,
      sortBy: 'price' as const,
      sortOrder: 'desc' as const,
    };

    render(
      <ListingsProvider initialOptions={initialOptions}>
        <TestComponent />
      </ListingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(getAllListings).toHaveBeenCalledWith(expect.objectContaining(initialOptions));
  });
}); 