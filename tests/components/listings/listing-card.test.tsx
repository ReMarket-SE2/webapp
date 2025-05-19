import { render, screen } from "@testing-library/react";
import { ListingCard } from "@/components/listings/listing-card";
import { ShortListing } from "@/lib/listings/actions";
import React from 'react';
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

const mockListing: ShortListing = {
  id: 1,
  title: "Test Listing",
  price: "100",
  category: "Test Category",
  categoryId: 1,
  photo: "/test-image.jpg",
  createdAt: new Date(),
  sellerId: 1,
};

// Mock categories for testing getCategoryPath function
const mockCategories = [
  { id: 1, name: "Electronics", parentId: null },
  { id: 2, name: "Computers", parentId: 1 },
  { id: 3, name: "Laptops", parentId: 2 },
  { id: 4, name: "Clothing", parentId: null },
];

describe("ListingCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the listing title, price, and category", () => {
    render(<ListingCard listing={mockListing} />);

    expect(screen.getByText("Test Listing")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.getByText("Test Category")).toBeInTheDocument();
  });

  it("renders a fallback image if no photo is provided", () => {
    const listingWithoutPhoto = { ...mockListing, photo: null };
    render(<ListingCard listing={listingWithoutPhoto} />);

    const image = screen.getByAltText("Test Listing");
    expect(image.getAttribute("src")).toContain("no-image.png");
  });

  it("links to the correct listing page", () => {
    render(<ListingCard listing={mockListing} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/listing/1");
  });

  it("renders the correct image for the listing", () => {
    render(<ListingCard listing={mockListing} />);

    const image = screen.getByAltText("Test Listing");
    expect(image.getAttribute("src")).toContain("test-image.jpg");
  });

  // New tests for getCategoryPath and badge
  it("displays category path in the badge when categories are provided", () => {
    const listingWithCategory = { ...mockListing, categoryId: 3, category: null };
    render(<ListingCard listing={listingWithCategory} categories={mockCategories} />);
    
    // Should show full path Electronics → Computers → Laptops
    expect(screen.getByText("Electronics → Computers → Laptops")).toBeInTheDocument();
  });

  it("displays category name from listing when categoryId doesn't match any provided categories", () => {
    const listingWithInvalidCategory = { ...mockListing, categoryId: 999 };
    render(<ListingCard listing={listingWithInvalidCategory} categories={mockCategories} />);
    
    // Should fall back to the category name from the listing
    expect(screen.getByText("Test Category")).toBeInTheDocument();
  });

  it("falls back to listing.category when no matching categories are found", () => {
    const listingWithoutCategoryId = { ...mockListing, categoryId: null };
    render(<ListingCard listing={listingWithoutCategoryId} categories={mockCategories} />);
    
    expect(screen.getByText("Test Category")).toBeInTheDocument();
  });

  it("displays 'Uncategorized' when no category info is available", () => {
    const listingWithoutCategoryInfo = { 
      ...mockListing, 
      category: null, 
      categoryId: null 
    };
    render(<ListingCard listing={listingWithoutCategoryInfo} categories={mockCategories} />);
    
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it("handles partial category paths correctly", () => {
    const listingWithPartialPath = { ...mockListing, categoryId: 2, category: null };
    render(<ListingCard listing={listingWithPartialPath} categories={mockCategories} />);
    
    // Should show path Electronics → Computers
    expect(screen.getByText("Electronics → Computers")).toBeInTheDocument();
  });

  it("handles empty categories array", () => {
    const listingWithCategory = { ...mockListing, categoryId: 1 };
    render(<ListingCard listing={listingWithCategory} categories={[]} />);
    
    // Should fall back to the category name from the listing
    expect(screen.getByText("Test Category")).toBeInTheDocument();
  });
});