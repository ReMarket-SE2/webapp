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
  photo: "/test-image.jpg",
  createdAt: new Date(),
  sellerId: 1,
};

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
});