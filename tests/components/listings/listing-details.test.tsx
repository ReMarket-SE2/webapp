import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import ListingDetails from '@/components/listings/listing-details';
import { toast } from 'sonner';
import { SessionProvider, useSession } from 'next-auth/react';
import { useWishlistContext } from '@/components/contexts/wishlist-provider';
import { ListingStatus } from '@/lib/db/schema/listings';
import { deleteListing } from '@/lib/listings/actions';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
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

// Mock Next.js router from next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: any) => children,
  useSession: jest.fn(),
}));

jest.mock("@/components/contexts/wishlist-provider", () => ({
  useWishlistContext: jest.fn(),
}));

jest.mock('@/lib/listings/actions', () => ({
  deleteListing: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseWishlistContext = useWishlistContext as jest.MockedFunction<typeof useWishlistContext>;

describe('ListingDetails', () => {
  const mockListing = {
    id: 1,
    title: 'Test Listing',
    price: '99.99',
    description: 'Test description',
    longDescription: 'Detailed test description',
    categoryName: 'Electronics',
    categoryId: 101,
    status: 'Active' as ListingStatus,
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
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
    mockUseWishlistContext.mockReturnValue({
      wishlist: [],
      isLoading: false,
      hasError: false,
      addToWishlist: jest.fn(),
      removeFromWishlist: jest.fn(),
      clearUserWishlist: jest.fn(),
    });
  });

  it('renders the listing title and price', () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );

    expect(screen.getByText('Test Listing')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders the listing status and category', () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );

    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Active';
    })).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('renders the creation date in the correct format', () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );

    expect(screen.getByText('Posted on January 1, 2023')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('does not render description section when description is empty', () => {
    const listingWithoutDescription = { ...mockListing, description: '' };
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={listingWithoutDescription} />
      </SessionProvider>
    );

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('shows a success toast when clicking Add to Cart button', () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(toast.success).toHaveBeenCalledWith('Added to cart');
  });

  it('shows a info toast when clicking the wishlist button when not logged in', () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );
    const heartIcon = screen.getByTestId('heart-icon');
    const wishlistButton = heartIcon.closest('button');
    fireEvent.click(wishlistButton!);
    expect(toast.info).toHaveBeenCalledWith('You need to be logged in to manage your wishlist.');
  });

  it('shows a success toast when clicking the wishlist button', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', name: 'Test User' }, expires: '' },
      status: 'authenticated',
      update: jest.fn(),
    });
    mockUseWishlistContext.mockReturnValue({
      wishlist: [],
      isLoading: false,
      hasError: false,
      addToWishlist: async () => {
        toast.success('Added to wishlist');
        return Promise.resolve();
      },
      removeFromWishlist: jest.fn(),
      clearUserWishlist: jest.fn(),
    });

    render(
      <SessionProvider session={{ user: { id: '1', name: 'Test User' }, expires: '' }}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );

    const heartIcon = screen.getByTestId('heart-icon');
    const wishlistButton = heartIcon.closest('button')!;
    fireEvent.click(wishlistButton);

    expect(toast.success).toHaveBeenCalledWith('Added to wishlist');
  });

  it('renders the seller information card', () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );

    expect(screen.getByText('Seller Information')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Active: 5')).toBeInTheDocument();
    expect(screen.getByText('Archived: 2')).toBeInTheDocument();
  });

  it('renders seller avatar with fallback when no profile image', () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );

    const avatarElement = document.querySelector('[data-slot="avatar"]');
    expect(avatarElement).toBeInTheDocument();

    const fallbackElement = document.querySelector('[data-slot="avatar-fallback"]');
    expect(fallbackElement).toBeInTheDocument();

    const userIconsInFallback = within(fallbackElement as HTMLElement).getAllByTestId('user-icon');
    expect(userIconsInFallback.length).toBe(1);
  });

  it('renders seller profile buttons', () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );

    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.getByText('See All Listings')).toBeInTheDocument();
  });

  it('renders edit and delete buttons for owner', () => {
    // Setup authenticated owner session
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', name: 'Owner' }, expires: '' },
      status: 'authenticated',
      update: jest.fn(),
    });
    render(
      <SessionProvider session={{ user: { id: '1', name: 'Owner' }, expires: '' }}>
        <ListingDetails listing={mockListing} sessionUserId={1} />
      </SessionProvider>
    );
    const editLink = screen.getByRole('link', { name: 'Edit' });
    expect(editLink).toHaveAttribute('href', '/listing/1/edit');
    const deleteTriggers = screen.getAllByText('Delete');
    expect(deleteTriggers[0]).toBeInTheDocument();
  });

  it('handles delete flow for owner', async () => {
    const mockDelete = deleteListing as jest.MockedFunction<typeof deleteListing>;
    mockDelete.mockResolvedValueOnce({ success: true });
    const mockPush = jest.fn();
    const { useRouter } = require('next/navigation');
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    // Render as owner
    render(
      <SessionProvider session={{ user: { id: '1', name: 'Owner' }, expires: '' }}>
        <ListingDetails listing={mockListing} sessionUserId={1} />
      </SessionProvider>
    );
    // Open delete dialog
    const deleteTriggers = screen.getAllByText('Delete');
    fireEvent.click(deleteTriggers[0]);
    // Confirm dialog appears
    await screen.findByText('Delete Listing?');
    // Click confirm delete
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[1]);
    await waitFor(() => {
      expect(deleteListing).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith('Listing deleted');
      expect(mockPush).toHaveBeenCalledWith('/listings');
    });
  });
});