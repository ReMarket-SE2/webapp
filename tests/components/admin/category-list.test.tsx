/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { CategoryList } from "@/components/admin/category-list"

// Mock the Lucide icons
jest.mock("lucide-react", () => ({
  ChevronRight: () => <span data-testid="chevron-right-icon">▶</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">▼</span>,
  Edit: () => <span data-testid="edit-icon">✏️</span>,
  Trash2: () => <span data-testid="trash-icon">🗑️</span>,
}))

describe("CategoryList", () => {
  // Define hierarchical mock categories
  const mockCategoryTree = [
    {
      id: 1,
      name: "Electronics",
      parentId: null,
      children: [
        {
          id: 3,
          name: "Laptops",
          parentId: 1,
          children: [
            {
              id: 5,
              name: "Gaming Laptops",
              parentId: 3,
              children: []
            }
          ]
        },
        {
          id: 4,
          name: "Smartphones",
          parentId: 1,
          children: []
        }
      ]
    },
    {
      id: 2,
      name: "Books",
      parentId: null,
      children: []
    }
  ]

  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders top-level categories correctly", () => {
    render(
      <CategoryList 
        categories={mockCategoryTree}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    
    // Check that all top-level categories are displayed
    expect(screen.getByText("Electronics")).toBeInTheDocument()
    expect(screen.getByText("Books")).toBeInTheDocument()
    
    // Child categories should not be visible initially
    expect(screen.queryByText("Laptops")).not.toBeInTheDocument()
    expect(screen.queryByText("Smartphones")).not.toBeInTheDocument()
    expect(screen.queryByText("Gaming Laptops")).not.toBeInTheDocument()
  })

  it("expands child categories when expand button is clicked", () => {
    render(
      <CategoryList 
        categories={mockCategoryTree}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    
    // Initially child categories are not visible
    expect(screen.queryByText("Laptops")).not.toBeInTheDocument()
    
    // Find the expand button for Electronics
    const chevronIcons = screen.getAllByTestId("chevron-right-icon")
    const electronicsRow = screen.getByText("Electronics").closest("div")
    const electronicsChevron = electronicsRow?.querySelector("[data-testid='chevron-right-icon']")
    
    // Click the expand button if found
    if (electronicsChevron) {
      const button = electronicsChevron.closest("button")
      if (button) {
        fireEvent.click(button)
      }
    } else {
      // Fallback if we can't find the specific button
      fireEvent.click(chevronIcons[0])
    }
    
    // Now the direct children of Electronics should be visible
    expect(screen.getByText("Laptops")).toBeInTheDocument()
    expect(screen.getByText("Smartphones")).toBeInTheDocument()
  })

  it("calls onEdit when edit button is clicked", () => {
    render(
      <CategoryList 
        categories={mockCategoryTree}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    
    // Find all edit icons
    const editIcons = screen.getAllByTestId("edit-icon")
    
    // Get the first edit button (for Electronics)
    const editButton = editIcons[0].closest("button")
    
    if (editButton) {
      fireEvent.click(editButton)
    }
    
    // Check that onEdit was called with the correct category
    expect(mockOnEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockCategoryTree[0].id,
        name: mockCategoryTree[0].name,
      })
    )
  })

  it("calls onDelete when delete button is clicked", () => {
    render(
      <CategoryList 
        categories={mockCategoryTree}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    
    // Find all delete icons
    const deleteIcons = screen.getAllByTestId("trash-icon")
    
    // Get the first delete button (for Electronics)
    const deleteButton = deleteIcons[0].closest("button")
    
    if (deleteButton) {
      fireEvent.click(deleteButton)
    }
    
    // Check that onDelete was called with the correct category
    expect(mockOnDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockCategoryTree[0].id,
        name: mockCategoryTree[0].name,
      })
    )
  })

  it("renders without errors when categories array is empty", () => {
    render(
      <CategoryList 
        categories={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    
    // Component should render without errors
    const container = screen.getByTestId("category-list-container");
    expect(container).toBeInTheDocument()
  })
})