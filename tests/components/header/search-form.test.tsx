import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchForm } from '@/components/header/search-form';
import { ListingsProvider } from '@/components/contexts/listings-context';
import { useSearchParams } from 'next/navigation';

const mockUpdateOptions = jest.fn();

// Mock the listings context – provide a stub provider to avoid DB access
jest.mock('@/components/contexts/listings-context', () => ({
  useListingsContext: () => ({
    updateOptions: mockUpdateOptions,
  }),
  ListingsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

describe('SearchForm', () => {
  const renderWithProvider = () => {
    return render(<SearchForm />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it('renders the search input', () => {
    renderWithProvider();
    expect(screen.getByPlaceholderText(/Type to search/i)).toBeInTheDocument();
  });

  it('updates search options after debounce', async () => {
    renderWithProvider();
    const input = screen.getByPlaceholderText(/Type to search/i);

    fireEvent.change(input, { target: { value: 'test query' } });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    expect(mockUpdateOptions).toHaveBeenCalledWith({
      searchTerm: 'test query',
      page: 1,
    });
  });

  it('clears search when input is emptied', async () => {
    renderWithProvider();
    const input = screen.getByPlaceholderText(/Type to search/i);

    fireEvent.change(input, { target: { value: 'test' } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    fireEvent.change(input, { target: { value: '' } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    expect(mockUpdateOptions).toHaveBeenLastCalledWith({
      searchTerm: undefined,
      page: 1,
    });
  });
}); 