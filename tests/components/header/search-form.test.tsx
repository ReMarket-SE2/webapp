import React from 'react';
import { render, screen, fireEvent, act, createEvent } from '@testing-library/react';
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

  it('calls updateOptions on mount with undefined searchTerm', () => {
    renderWithProvider();
    expect(mockUpdateOptions).toHaveBeenCalledWith({
      searchTerm: undefined,
      page: 1,
    });
  });

  it('debounces rapid input changes correctly', async () => {
    renderWithProvider();
    mockUpdateOptions.mockClear();
    const input = screen.getByPlaceholderText(/Type to search/i);
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    expect(mockUpdateOptions).toHaveBeenCalledTimes(1);
    expect(mockUpdateOptions).toHaveBeenCalledWith({
      searchTerm: 'abc',
      page: 1,
    });
  });

  it('does not call updateOptions before debounce delay', () => {
    jest.useFakeTimers();
    renderWithProvider();
    mockUpdateOptions.mockClear();
    const input = screen.getByPlaceholderText(/Type to search/i);
    act(() => {
      fireEvent.change(input, { target: { value: 'hello' } });
      jest.advanceTimersByTime(300);
    });
    expect(mockUpdateOptions).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockUpdateOptions).toHaveBeenCalledWith({
      searchTerm: 'hello',
      page: 1,
    });
    jest.useRealTimers();
  });

  it('prevents default form submission', () => {
    const { container } = renderWithProvider();
    const form = container.querySelector('form');
    const submitEvent = createEvent.submit(form!);
    const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
    fireEvent(form!, submitEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('forwards additional props to form', () => {
    render(<SearchForm data-testid="search-form" className="test-form" />);
    const form = screen.getByTestId('search-form');
    expect(form).toHaveClass('test-form');
  });

  it('updates input value on change', () => {
    renderWithProvider();
    const input = screen.getByPlaceholderText(/Type to search/i);
    fireEvent.change(input, { target: { value: 'foo' } });
    expect((input as HTMLInputElement).value).toBe('foo');
  });

  it('input has correct id for label association', () => {
    renderWithProvider();
    const input = screen.getByPlaceholderText(/Type to search/i);
    expect(input).toHaveAttribute('id', 'search');
  });

  it('associates label with input for accessibility', () => {
    renderWithProvider();
    expect(screen.getByLabelText(/Search/i)).toBeInTheDocument();
  });
}); 