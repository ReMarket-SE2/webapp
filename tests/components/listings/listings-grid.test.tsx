import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ListingsGrid } from "@/components/listings/listings-grid";
import { ListingCard as ActualListingCard } from "@/components/listings/listing-card"; // To get the type for the mock
import { Category } from "@/lib/db/schema/categories";
import { ShortListing } from "@/lib/listings/actions";

/**
 * @jest-environment jsdom
 */


// Mock framer-motion
jest.mock("framer-motion", () => {
  const actualMotion = jest.requireActual("framer-motion");
  return {
    ...actualMotion,
    motion: {
      ...actualMotion.motion,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      div: jest.fn(({ children, variants, initial, animate, transition, ...rest }) => {
        // Pass down variants, initial, animate to allow checking them in tests if needed
        // but render a simple div
        const propsToPass = { ...rest, "data-variants": variants, "data-initial": initial, "data-animate": animate };
        return <div {...propsToPass}>{children}</div>;
      }),
    },
  };
});

// Mock ListingCard
// We need to provide a type for the mocked component's props
type ListingCardProps = React.ComponentProps<typeof ActualListingCard>;

const mockListingCard = jest.fn(({ listing, categories }: ListingCardProps) => (
  <div data-testid="listing-card" data-listing-id={listing.id}>
    <span>{listing.title as string}</span>
    <span>Categories count: {categories?.length ?? 0}</span>
  </div>
));

jest.mock("@/components/listings/listing-card", () => ({
  ListingCard: (props: ListingCardProps) => mockListingCard(props),
}));


const mockCategories: Category[] = [
  { id: 1, name: "Electronics", parentId: null },
  { id: 2, name: "Furniture", parentId: null },
];

// Mock useListingsContext to return categories

jest.mock('@/components/contexts/listings-context', () => ({
  useListingsContext: () => ({ categories: mockCategories }),
}));

interface MockListing {
  id: number;
  title: string;
  // Add other properties if ListingCard mock or component relies on them
  [key: string]: any; // To match the 'any[]' type for listings
}

const mockListingsData = (
  [
    { id: 101, title: "Smartphone X", price: "0", category: "", categoryId: null, photo: "", createdAt: new Date() },
    { id: 102, title: "Comfy Sofa", price: "0", category: "", categoryId: null, photo: "", createdAt: new Date() },
  ] as unknown
) as ShortListing[];

describe("ListingsGrid", () => {
  beforeEach(() => {
    mockListingCard.mockClear();
    (jest.requireMock("framer-motion").motion.div as jest.Mock).mockClear();
  });

  it('should render "No listings found" message when listings array is empty', () => {
    render(<ListingsGrid listings={[]} />);

    expect(screen.getByText("No listings found 🫠")).toBeInTheDocument();
    expect(screen.getByText("Be the first to create a listing!")).toBeInTheDocument();
    expect(screen.queryByTestId("listing-card")).not.toBeInTheDocument();
  });

  it("should render listing cards when listings array is not empty", () => {
    render(<ListingsGrid listings={mockListingsData} />);

    expect(screen.queryByText("No listings found 🫠")).not.toBeInTheDocument();

    const listingCards = screen.getAllByTestId("listing-card");
    expect(listingCards).toHaveLength(mockListingsData.length);

    mockListingsData.forEach((listing) => {
      expect(screen.getByText(listing.title)).toBeInTheDocument();
      // The following line caused the "Found multiple elements" error and is redundant.
      // const cardElement = screen.getByTestId("listing-card").parentElement?.querySelector(`[data-listing-id="${listing.id}"]`);
      // This check is a bit indirect due to mock structure, focusing on title is simpler
      // Or check attributes on the mock directly:
      expect(screen.getByText(listing.title).closest('[data-testid="listing-card"]')).toHaveAttribute('data-listing-id', listing.id.toString());
    });
  });

  it("should pass correct props to each ListingCard", () => {
    render(<ListingsGrid listings={mockListingsData} />);

    expect(mockListingCard).toHaveBeenCalledTimes(mockListingsData.length);

    mockListingsData.forEach((listing, index) => {
      expect(mockListingCard).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({
          listing: listing,
          categories: mockCategories,
        })
      );
    });
  });

  it("should render the grid container and items", () => {
    render(<ListingsGrid listings={mockListingsData} />);

    const motionDivMock = jest.requireMock("framer-motion").motion.div as jest.Mock;

    expect(motionDivMock).toHaveBeenCalledTimes(1 + mockListingsData.length); // 1 container + N items

    // Check container (first call to motion.div)
    const containerCall = motionDivMock.mock.calls.find(call => call[0].className?.includes("grid-cols-1"));
    expect(containerCall).toBeDefined();
    if (!containerCall) return; // Type guard

    // Check item calls (the rest of the calls)
    const itemCalls = motionDivMock.mock.calls.filter(call => !call[0].className); // Items don't have a className prop from ListingsGrid
    expect(itemCalls).toHaveLength(mockListingsData.length);
  });
});