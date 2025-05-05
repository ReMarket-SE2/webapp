import { render, screen } from "@testing-library/react";
import { ListingCard } from "@/components/listings/listing-card";
import { ShortListing } from "@/lib/listings/actions";
import { BrowserRouter as Router } from "react-router-dom";

const mockListing: ShortListing = {
  id: 1,
  title: "Test Listing",
  price: "100",
  category: "Test Category",
  photo: "/test-image.jpg",
  createdAt: new Date(),
};

describe("ListingCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the listing title, price, and category", () => {
    render(
      <Router>
        <ListingCard listing={mockListing} />
      </Router>
    );

    expect(screen.getByText("Test Listing")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.getByText("Test Category")).toBeInTheDocument();
  });

  it("renders a fallback image if no photo is provided", () => {
    const listingWithoutPhoto = { ...mockListing, photo: null };
    render(
      <Router>
        <ListingCard listing={listingWithoutPhoto} />
      </Router>
    );

    const image = screen.getByAltText("Test Listing");
    expect(image.getAttribute("src")).toContain("no-image.png");
  });

  it("links to the correct listing page", () => {
    render(
      <Router>
        <ListingCard listing={mockListing} />
      </Router>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/listing/1");
  });

  it("renders the correct image for the listing", () => {
    render(
      <Router>
        <ListingCard listing={mockListing} />
      </Router>
    );

    const image = screen.getByAltText("Test Listing");
    expect(image.getAttribute("src")).toContain("test-image.jpg");
  });
});