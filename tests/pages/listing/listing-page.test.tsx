import { notFound } from 'next/navigation';
import { render, screen } from '@testing-library/react';
import ListingPage from '@/app/(dashboard)/listing/[id]/page';
import { getListingById } from '@/lib/listings/actions';

// Mock the imported components
jest.mock('@/components/listings/listing-details', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ listing }) => (
    <div data-testid="listing-details">
      <div data-testid="listing-title">{listing.title}</div>
      <div data-testid="listing-price">{listing.price}</div>
    </div>
  )),
}));

jest.mock('@/components/listings/listing-images-gallery', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ images, title }) => (
    <div data-testid="listing-images-gallery">
      <div data-testid="gallery-title">{title}</div>
      <div data-testid="gallery-images-count">{images.length}</div>
    </div>
  )),
}));

jest.mock('@/components/listings/detailed-description', () => ({
  DetailedDescription: jest.fn().mockImplementation(({ longDescription }) => (
    <div data-testid="detailed-description">
      {longDescription}
    </div>
  )),
}));

jest.mock('@/lib/listings/actions', () => ({
  getListingById: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

const mockListing = {
  id: 1,
  title: 'Test Listing',
  price: '99.99',
  description: 'This is a test description',
  longDescription: 'This is a detailed test description',
  categoryName: 'Electronics',
  status: 'Available',
  createdAt: new Date().toISOString(),
  photos: ['photo1.jpg', 'photo2.jpg'],
  seller: {
    id: 1,
    username: 'testuser',
    profileImage: null,
    activeListingsCount: 5,
    archivedListingsCount: 2,
  },
};

describe('ListingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the not found page for NaN id', async () => {
    await ListingPage({ params: Promise.resolve({ id: 'abc' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('renders the not found page when listing is not found', async () => {
    (getListingById as jest.Mock).mockResolvedValue(null);
    await ListingPage({ params: Promise.resolve({ id: '1' }) });
    expect(getListingById).toHaveBeenCalledWith(1);
    expect(notFound).toHaveBeenCalled();
  });

  it('renders the listing page with all components when listing exists', async () => {
    (getListingById as jest.Mock).mockResolvedValue(mockListing);

    const Component = await ListingPage({ params: Promise.resolve({ id: '1' }) });
    const { container } = render(Component);

    expect(getListingById).toHaveBeenCalledWith(1);
    expect(notFound).not.toHaveBeenCalled();

    expect(screen.getByTestId('listing-details')).toBeInTheDocument();
    expect(screen.getByTestId('listing-images-gallery')).toBeInTheDocument();
    expect(screen.getByTestId('detailed-description')).toBeInTheDocument();

    expect(screen.getByTestId('listing-title')).toHaveTextContent('Test Listing');
    expect(screen.getByTestId('gallery-title')).toHaveTextContent('Test Listing');
    expect(screen.getByTestId('gallery-images-count')).toHaveTextContent('2');
  });

  it('renders the listing page without detailed description when longDescription is null', async () => {
    const listingWithoutDescription = { ...mockListing, longDescription: null };
    (getListingById as jest.Mock).mockResolvedValue(listingWithoutDescription);

    const Component = await ListingPage({ params: Promise.resolve({ id: '1' }) });
    const { container } = render(Component);

    expect(getListingById).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('listing-details')).toBeInTheDocument();
    expect(screen.getByTestId('listing-images-gallery')).toBeInTheDocument();
    expect(screen.queryByTestId('detailed-description')).not.toBeInTheDocument();
  });

  it('renders the breadcrumb navigation with correct links', async () => {
    (getListingById as jest.Mock).mockResolvedValue(mockListing);

    const Component = await ListingPage({ params: Promise.resolve({ id: '1' }) });
    const { container } = render(Component);

    const homeLink = screen.getByText('Home');
    const listingsLink = screen.getByText('Listings');

    // Get all breadcrumb items
    const breadcrumbItems = document.querySelectorAll('[data-slot="breadcrumb-item"]');
    expect(breadcrumbItems.length).toBe(3); // Home, Listings, and the current page

    // The last breadcrumb item should be the title
    const lastBreadcrumbItem = breadcrumbItems[breadcrumbItems.length - 1];
    const titleSpan = lastBreadcrumbItem.querySelector('.text-muted-foreground');
    expect(titleSpan).toHaveTextContent('Test Listing');

    expect(homeLink).toBeInTheDocument();
    expect(listingsLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    expect(listingsLink.closest('a')).toHaveAttribute('href', '/listings');
  });
}); 