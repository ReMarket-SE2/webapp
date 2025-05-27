import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import ListingDetails from '@/components/listings/listing-details';
import { toast } from 'sonner';
import { SessionProvider, useSession } from 'next-auth/react';
import { useWishlistContext } from '@/components/contexts/wishlist-provider';
import { ListingStatus } from '@/lib/db/schema/listings';
import { deleteListing } from '@/lib/listings/actions';
import { getReviewStatsByUserId } from '@/lib/reviews/actions';

// Remove the mock implementation that's causing issues
// Instead, we'll mock the necessary dependencies

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
    div: ({ children, variants, ...props }: any) => <div {...props}>{children}</div>,
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
  Star: () => <div data-testid="star-icon" />,
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

jest.mock('@/lib/reviews/actions', () => ({
  getReviewStatsByUserId: jest.fn(() => Promise.resolve({ averageScore: 4.2, totalReviews: 5 })),
}));

// Mock the UI components
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div data-testid="alert-dialog-trigger">{children}</div>,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div data-testid="alert-dialog-title">{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => <button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button data-testid="alert-dialog-cancel">{children}</button>,
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div data-slot="avatar">{children}</div>,
  AvatarFallback: ({ children }: any) => <div data-slot="avatar-fallback">{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} data-slot="avatar-image" />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: any) => (
    <a href={href} className={className} role="link">{children}</a>
  ),
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
    (getReviewStatsByUserId as jest.Mock).mockResolvedValue({ averageScore: 4.2, totalReviews: 5 });
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

  it('renders seller review stats (average score and total reviews)', async () => {
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );
    // Wait for review stats to load
    await waitFor(() => {
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.getByText('(5 reviews)')).toBeInTheDocument();
    });
    // Check that stars are rendered
    const stars = screen.getAllByTestId('star-icon');
    expect(stars.length).toBe(5);
  });

  it('shows "No reviews yet" if seller has no reviews', async () => {
    (getReviewStatsByUserId as jest.Mock).mockResolvedValueOnce({ averageScore: 0, totalReviews: 0 });
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    });
  });

  it('shows "Loading reviews..." while fetching review stats', async () => {
    let resolveStats: (value: any) => void;
    (getReviewStatsByUserId as jest.Mock).mockImplementationOnce(
      () => new Promise(res => { resolveStats = res; })
    );
    render(
      <SessionProvider session={null}>
        <ListingDetails listing={mockListing} />
      </SessionProvider>
    );
    expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
    // Resolve the promise to finish loading
    resolveStats!({ averageScore: 4.2, totalReviews: 5 });
    await waitFor(() => {
      expect(screen.getByText('4.2')).toBeInTheDocument();
    });
  });
});