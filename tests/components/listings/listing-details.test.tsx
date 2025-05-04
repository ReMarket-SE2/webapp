import { render, screen, fireEvent, within } from '@testing-library/react';
import ListingDetails from '@/components/listings/listing-details';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock the Lucide icons
jest.mock('lucide-react', () => ({
  ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Tag: () => <div data-testid="tag-icon" />,
  User: () => <div data-testid="user-icon" />,
  Package: () => <div data-testid="package-icon" />,
  Archive: () => <div data-testid="archive-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
}));

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() })),
}));

describe('ListingDetails', () => {
  const mockListing = {
    id: 1,
    title: 'Test Listing',
    price: '99.99',
    description: 'Test description',
    longDescription: 'Detailed test description',
    categoryId: 1,
    categoryName: 'Electronics',
    status: 'Active' as const,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    photos: ['photo1.jpg', 'photo2.jpg'],
    seller: {
      id: 1,
      username: 'testuser',
      profileImage: null,
      activeListingsCount: 5,
      archivedListingsCount: 2,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the listing title and price', () => {
    render(<ListingDetails listing={mockListing} />);

    expect(screen.getByText('Test Listing')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders the listing status and category', () => {
    render(<ListingDetails listing={mockListing} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('renders the creation date in the correct format', () => {
    render(<ListingDetails listing={mockListing} />);

    expect(screen.getByText('Posted on January 1, 2023')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<ListingDetails listing={mockListing} />);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('does not render description section when description is empty', () => {
    const listingWithoutDescription = { ...mockListing, description: '' };
    render(<ListingDetails listing={listingWithoutDescription} />);

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('shows a success toast when clicking Add to Cart button', () => {
    render(<ListingDetails listing={mockListing} />);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(toast.success).toHaveBeenCalledWith('Added to cart');
  });

  it('shows a success toast when clicking the wishlist button', () => {
    render(<ListingDetails listing={mockListing} />);

    // Find button that contains the heart icon
    const heartIcon = screen.getByTestId('heart-icon');
    const wishlistButton = heartIcon.closest('button');
    fireEvent.click(wishlistButton!);

    expect(toast.success).toHaveBeenCalledWith('Added to wishlist');
  });

  it('renders the seller information card', () => {
    render(<ListingDetails listing={mockListing} />);

    expect(screen.getByText('Seller Information')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Active: 5')).toBeInTheDocument();
    expect(screen.getByText('Archived: 2')).toBeInTheDocument();
  });

  it('renders seller avatar with fallback when no profile image', () => {
    render(<ListingDetails listing={mockListing} />);

    // Find the avatar element by its data-slot attribute
    const avatarElement = document.querySelector('[data-slot="avatar"]');
    expect(avatarElement).toBeInTheDocument();

    // Find the fallback inside the avatar
    const fallbackElement = document.querySelector('[data-slot="avatar-fallback"]');
    expect(fallbackElement).toBeInTheDocument();

    // Check for user icon inside the fallback
    const userIconsInFallback = within(fallbackElement as HTMLElement).getAllByTestId('user-icon');
    expect(userIconsInFallback.length).toBe(1);
  });

  it('renders seller profile buttons', () => {
    render(<ListingDetails listing={mockListing} />);

    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.getByText('See All Listings')).toBeInTheDocument();
  });
}); 