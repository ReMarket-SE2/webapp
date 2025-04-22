import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/listings/empty-state';

describe('EmptyState', () => {
  it('renders empty state message', () => {
    render(<EmptyState />);

    expect(screen.getByText(/no listings found/i)).toBeInTheDocument();
    expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
  });

  it('renders create listing button for admin users', () => {
    render(<EmptyState isAdmin={true} />);

    const createButton = screen.getByRole('link', { name: /create listing/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('href', '/create-listing');
  });

  it('does not render create listing button for non-admin users', () => {
    render(<EmptyState isAdmin={false} />);

    expect(screen.queryByRole('link', { name: /create listing/i })).not.toBeInTheDocument();
  });
}); 