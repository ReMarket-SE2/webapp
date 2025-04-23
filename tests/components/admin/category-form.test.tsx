/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { CategoryForm } from "@/components/admin/category-form"
import { createCategory, updateCategory } from "@/lib/categories/actions"
import { toast } from "sonner"

// Mock dependencies
jest.mock("@/lib/categories/actions", () => ({
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
}))

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock Shadcn UI components
jest.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div>
      <select 
        data-testid="category-select" 
        onChange={(e) => onValueChange(e.target.value)} 
        value={value}
      >
        {children}
      </select>
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div role="combobox">{children}</div>,
  SelectValue: (props: any) => <div>{props.placeholder}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children, disabled }: any) => (
    <option value={value} disabled={disabled}>{children}</option>
  ),
}))

describe("CategoryForm", () => {
  const mockCategories = [
    { id: 1, name: "Electronics", parentId: null },
    { id: 2, name: "Books", parentId: null },
    { id: 3, name: "Laptops", parentId: 1 },
  ]
  
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the create form correctly", () => {
    render(<CategoryForm categories={mockCategories} onClose={mockOnClose} />)
    
    expect(screen.getByText("Create New Category")).toBeInTheDocument()
    expect(screen.getByText("Add a new product category to your marketplace")).toBeInTheDocument()
    expect(screen.getByLabelText("Category Name")).toBeInTheDocument()
    expect(screen.getByText("Parent Category (Optional)")).toBeInTheDocument()
  })

  it("renders the edit form correctly with pre-filled values", () => {
    const categoryToEdit = mockCategories[0]
    
    render(
      <CategoryForm 
        categories={mockCategories.filter(c => c.id !== categoryToEdit.id)} 
        categoryToEdit={categoryToEdit} 
        onClose={mockOnClose} 
      />
    )
    
    expect(screen.getByText("Edit Category")).toBeInTheDocument()
    expect(screen.getByText("Update the category information below")).toBeInTheDocument()
    
    const nameInput = screen.getByLabelText("Category Name") as HTMLInputElement
    expect(nameInput.value).toBe(categoryToEdit.name)
  })

  it("validates empty name on submission", async () => {
    render(<CategoryForm categories={mockCategories} onClose={mockOnClose} />);
  
    const nameInput = screen.getByLabelText("Category Name");
    fireEvent.change(nameInput, { target: { value: "" } });
  
    const submitButton = screen.getByText((content) =>
      content.toLowerCase().includes("create category")
    );
    
    fireEvent.click(submitButton);
    
    expect(createCategory).not.toHaveBeenCalled();
  });
  
  it("calls createCategory with correct data on form submission", async () => {
    (createCategory as jest.Mock).mockResolvedValue({})
    
    render(<CategoryForm categories={mockCategories} onClose={mockOnClose} />)
    
    // Fill out form
    const nameInput = screen.getByLabelText("Category Name")
    fireEvent.change(nameInput, { target: { value: "New Category" } })
    
    // Find and click the submit button
    const buttons = screen.getAllByRole("button")
    const submitButton = buttons.find(button => 
      button.textContent?.includes("Create Category")
    )
    
    if (submitButton) {
      fireEvent.click(submitButton)
    }
    
    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith(expect.objectContaining({
        name: "New Category",
      }))
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("New Category"))
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it("calls updateCategory with correct data on form submission", async () => {
    const categoryToEdit = mockCategories[0]
    ;(updateCategory as jest.Mock).mockResolvedValue({})
    
    render(
      <CategoryForm 
        categories={mockCategories.filter(c => c.id !== categoryToEdit.id)} 
        categoryToEdit={categoryToEdit} 
        onClose={mockOnClose} 
      />
    )
    
    // Update name
    const nameInput = screen.getByLabelText("Category Name")
    fireEvent.change(nameInput, { target: { value: "Updated Electronics" } })
    
    // Find and click the submit button
    const buttons = screen.getAllByRole("button")
    const submitButton = buttons.find(button => 
      button.textContent?.includes("Update Category")
    )
    
    if (submitButton) {
      fireEvent.click(submitButton)
    }
    
    await waitFor(() => {
      expect(updateCategory).toHaveBeenCalledWith(
        categoryToEdit.id,
        expect.objectContaining({
          name: "Updated Electronics",
        })
      )
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Updated Electronics"))
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it("shows an error toast if category creation fails", async () => {
    const errorMessage = "A category with this name already exists"
    ;(createCategory as jest.Mock).mockRejectedValue(new Error(errorMessage))
    
    render(<CategoryForm categories={mockCategories} onClose={mockOnClose} />)
    
    // Fill out form
    const nameInput = screen.getByLabelText("Category Name")
    fireEvent.change(nameInput, { target: { value: "New Category" } })
    
    // Find and click the submit button
    const buttons = screen.getAllByRole("button")
    const submitButton = buttons.find(button => 
      button.textContent?.includes("Create Category")
    )
    
    if (submitButton) {
      fireEvent.click(submitButton)
    }
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage))
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  it("closes form when cancel button is clicked", () => {
    render(<CategoryForm categories={mockCategories} onClose={mockOnClose} />)
    
    // Find and click the cancel button
    const buttons = screen.getAllByRole("button")
    const cancelButton = buttons.find(button => 
      button.textContent === "Cancel"
    )
    
    if (cancelButton) {
      fireEvent.click(cancelButton)
    }
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})