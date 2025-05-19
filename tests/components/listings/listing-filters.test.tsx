import { render, screen, fireEvent } from "@testing-library/react";
import { ListingFilters } from "@/components/listings/listing-filters";

// Mock data for testing
const mockCategories = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Computers", parentId: 1 },
  { id: 3, name: "Laptops", parentId: 2 },
  { id: 4, name: "Clothing" },
  { id: 5, name: "Men's", parentId: 4 },
  { id: 6, name: "Women's", parentId: 4 },
];

describe("ListingFilters", () => {
  const mockHandleCategoryChange = jest.fn();
  const mockHandleSortOrderChange = jest.fn();
  const mockHandleSearchChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all filter components", () => {
    render(
      <ListingFilters
        categories={mockCategories}
        currentCategoryId={null}
        currentSortOrder="desc"
        currentSearch=""
        onCategoryChange={mockHandleCategoryChange}
        onSortOrderChange={mockHandleSortOrderChange}
        onSearchChange={mockHandleSearchChange}
      />
    );

    // Search input should be rendered
    expect(screen.getByPlaceholderText("Search listings...")).toBeInTheDocument();
    
    // Sort button should be rendered
    expect(screen.getByText("Newest First")).toBeInTheDocument();
    
    // Root category select should be rendered (at least one dropdown)
    expect(screen.getByText("Select category")).toBeInTheDocument();
  });

  it("displays correct sort order text", () => {
    render(
      <ListingFilters
        categories={mockCategories}
        currentCategoryId={null}
        currentSortOrder="asc"
        currentSearch=""
        onCategoryChange={mockHandleCategoryChange}
        onSortOrderChange={mockHandleSortOrderChange}
        onSearchChange={mockHandleSearchChange}
      />
    );

    expect(screen.getByText("Oldest First")).toBeInTheDocument();
  });

  it("calls onSortOrderChange when sort button is clicked", () => {
    render(
      <ListingFilters
        categories={mockCategories}
        currentCategoryId={null}
        currentSortOrder="desc"
        currentSearch=""
        onCategoryChange={mockHandleCategoryChange}
        onSortOrderChange={mockHandleSortOrderChange}
        onSearchChange={mockHandleSearchChange}
      />
    );

    // Click the sort button
    fireEvent.click(screen.getByText("Newest First"));
    
    // Check if the handler was called
    expect(mockHandleSortOrderChange).toHaveBeenCalledWith("asc");
  });

  it("calls onSearchChange when search input changes", () => {
    render(
      <ListingFilters
        categories={mockCategories}
        currentCategoryId={null}
        currentSortOrder="desc"
        currentSearch=""
        onCategoryChange={mockHandleCategoryChange}
        onSortOrderChange={mockHandleSortOrderChange}
        onSearchChange={mockHandleSearchChange}
      />
    );

    // Change the search input
    fireEvent.change(screen.getByPlaceholderText("Search listings..."), {
      target: { value: "test search" },
    });
    
    // Check if the handler was called
    expect(mockHandleSearchChange).toHaveBeenCalledWith("test search");
  });

  it("renders category path correctly when category is selected", () => {
    render(
      <ListingFilters
        categories={mockCategories}
        currentCategoryId={3} // Laptops (child of Computers, which is child of Electronics)
        currentSortOrder="desc"
        currentSearch=""
        onCategoryChange={mockHandleCategoryChange}
        onSortOrderChange={mockHandleSortOrderChange}
        onSearchChange={mockHandleSearchChange}
      />
    );

    // Should show each level in the category path
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Computers")).toBeInTheDocument();
    expect(screen.getByText("Laptops")).toBeInTheDocument();
    
    // Clear button should be visible
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("calls onCategoryChange with null when clear button is clicked", () => {
    render(
      <ListingFilters
        categories={mockCategories}
        currentCategoryId={3}
        currentSortOrder="desc"
        currentSearch=""
        onCategoryChange={mockHandleCategoryChange}
        onSortOrderChange={mockHandleSortOrderChange}
        onSearchChange={mockHandleSearchChange}
      />
    );

    // Click the clear button
    fireEvent.click(screen.getByText("Clear"));
    
    // Check if the handler was called with null
    expect(mockHandleCategoryChange).toHaveBeenCalledWith(null);
  });
  
  // Test for the category tree building logic
  it("correctly builds and displays the category tree", () => {
    render(
      <ListingFilters
        categories={mockCategories}
        currentCategoryId={null}
        currentSortOrder="desc"
        currentSearch=""
        onCategoryChange={mockHandleCategoryChange}
        onSortOrderChange={mockHandleSortOrderChange}
        onSearchChange={mockHandleSearchChange}
      />
    );
    
    // Open the category dropdown
    fireEvent.click(screen.getByText("Select category"));
    
    // Root level categories should be visible
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Clothing")).toBeInTheDocument();
    
    // But not child categories yet
    const computersElements = screen.queryAllByText("Computers");
    expect(computersElements.length).toBe(0);
  });

  it("handles category selection correctly", async () => {
    const { rerender } = render(
      <ListingFilters
        categories={mockCategories}
        currentCategoryId={null}
        currentSortOrder="desc"
        currentSearch=""
        onCategoryChange={mockHandleCategoryChange}
        onSortOrderChange={mockHandleSortOrderChange}
        onSearchChange={mockHandleSearchChange}
      />
    );

    // Open the category dropdown
    fireEvent.click(screen.getByText("Select category"));
    
    // Select "Electronics"
    fireEvent.click(screen.getByText("Electronics"));
    
    // Check if the handler was called
    expect(mockHandleCategoryChange).toHaveBeenCalledWith(1);

    // Rerender with the new category ID to simulate state update
    rerender(
      <ListingFilters
        categories={mockCategories}
        currentCategoryId={1}
        currentSortOrder="desc"
        currentSearch=""
        onCategoryChange={mockHandleCategoryChange}
        onSortOrderChange={mockHandleSortOrderChange}
        onSearchChange={mockHandleSearchChange}
      />
    );
    
    // Check if "Electronics" is now selected
    expect(screen.getByText("Electronics")).toBeInTheDocument();

    // Now there should be a second dropdown for subcategories
    const allSelectTriggers = screen.getAllByText(/Select category|Electronics/);
    expect(allSelectTriggers.length).toBe(2);
  });
});
