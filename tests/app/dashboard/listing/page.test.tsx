import React from 'react';
import { render, screen } from '@testing-library/react';
import ListingPage from '@/app/(dashboard)/listing/[id]/page';
import { getListingById } from '@/lib/listings/actions';
import { getCategoryPath } from '@/lib/categories/actions';
import { getServerSession } from 'next-auth/next';

// Mock the Next.js components and hooks
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href} data-testid={`link-to-${href}`}>{children}</a>;
  };
});

// Mock the server actions
jest.mock('@/lib/listings/actions', () => ({
  getListingById: jest.fn(),
}));

jest.mock('@/lib/categories/actions', () => ({
  getCategoryPath: jest.fn(),
}));

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock React's Suspense to render children immediately for testing
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    Suspense: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock child components that aren't being tested
jest.mock('@/components/listings/listing-details', () => ({
  __esModule: true,
  default: () => <div data-testid="listing-details">Mocked Listing Details</div>,
}));

jest.mock('@/components/listings/listing-images-gallery', () => ({
  __esModule: true,
  default: () => <div data-testid="listing-images">Mocked Listing Images</div>,
}));

jest.mock('@/components/listings/detailed-description', () => ({
  __esModule: true,
  DetailedDescription: () => <div data-testid="detailed-description">Mocked Description</div>,
}));

describe('ListingPage', () => {
  const mockListing = {
    id: 123,
    title: 'Test Listing',
    price: 99.99,
    categoryId: 3,
    createdAt: new Date(),
    photos: ['/test.jpg'],
    longDescription: 'This is a long description',
    userId: 1,
  };

  const mockCategoryPath = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Computers' },
    { id: 3, name: 'Laptops' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getListingById as jest.Mock).mockResolvedValue(mockListing);
    (getCategoryPath as jest.Mock).mockResolvedValue(mockCategoryPath);
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: '2' } });
  });

  it('renders breadcrumb navigation with category path', async () => {
    const { rerender } = render(await ListingPage({ params: Promise.resolve({ id: '123' }) }));
    
    // Test basic breadcrumb links
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();
    
    // Test the specific category path breadcrumb links
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Computers')).toBeInTheDocument();
    expect(screen.getByText('Laptops')).toBeInTheDocument();
    
    // Test listing title in breadcrumb
    expect(screen.getByText('Test Listing')).toBeInTheDocument();
  });

  it('renders category links with correct hrefs', async () => {
    render(await ListingPage({ params: Promise.resolve({ id: '123' }) }));
    
    // Check that category links have correct hrefs
    expect(screen.getByTestId('link-to-/listings?category=1')).toBeInTheDocument();
    expect(screen.getByTestId('link-to-/listings?category=2')).toBeInTheDocument();
    expect(screen.getByTestId('link-to-/listings?category=3')).toBeInTheDocument();
  });

  it('renders no category breadcrumbs when listing has no category', async () => {
    const listingWithoutCategory = { ...mockListing, categoryId: null };
    (getListingById as jest.Mock).mockResolvedValue(listingWithoutCategory);
    (getCategoryPath as jest.Mock).mockResolvedValue([]);
    
    render(await ListingPage({ params: Promise.resolve({ id: '123' }) }));
    
    // Basic breadcrumbs should exist
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();
    
    // Category breadcrumbs should not exist
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
    expect(screen.queryByText('Computers')).not.toBeInTheDocument();
    expect(screen.queryByText('Laptops')).not.toBeInTheDocument();
  });
});
