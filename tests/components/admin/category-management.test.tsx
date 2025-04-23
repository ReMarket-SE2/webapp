/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { CategoryManagement } from "@/components/admin/category-management"
import { CategoryList } from "@/components/admin/category-list"
import { CategoryForm } from "@/components/admin/category-form"
import { deleteCategory } from "@/lib/categories/actions"
import { toast } from "sonner"

// Mock dependencies
jest.mock("@/components/admin/category-list", () => ({
  CategoryList: jest.fn(() => <div data-testid="mock-category-list" />),
}))

jest.mock("@/components/admin/category-form", () => ({
  CategoryForm: jest.fn(() => <div data-testid="mock-category-form" />),
}))

jest.mock("@/lib/categories/actions", () => ({
  deleteCategory: jest.fn(),
}))

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock AlertDialog component since it uses Radix UI primitives
jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode, open: boolean }) => open ? <div>{children}</div> : null,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogAction: (props: any) => <button onClick={props.onClick} data-testid="delete-button">{props.children}</button>,
}))

describe("CategoryManagement", () => {
  const mockCategories = [
    { id: 1, name: "Electronics", parentId: null },
    { id: 2, name: "Books", parentId: null },
    { id: 3, name: "Laptops", parentId: 1 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders correctly with categories", () => {
    render(<CategoryManagement categories={mockCategories} />)
    
    expect(screen.getByText("Category Management")).toBeInTheDocument()
    expect(screen.getByText("Create, edit, and delete product categories")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add category/i })).toBeInTheDocument()
    expect(CategoryList).toHaveBeenCalledTimes(1)
  })

  it("renders empty state when no categories are provided", () => {
    render(<CategoryManagement categories={[]} />)
    
    expect(screen.getByText("No categories have been created yet")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /create your first category/i })).toBeInTheDocument()
  })

  it("opens CategoryForm when Add Category button is clicked", async () => {
    render(<CategoryManagement categories={mockCategories} />)
    
    const addButton = screen.getByRole("button", { name: /add category/i })
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(CategoryForm).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: mockCategories,
          onClose: expect.any(Function),
        }),
        undefined
      )
    })
  })

  it("opens CategoryForm for editing when edit is triggered", async () => {
    render(<CategoryManagement categories={mockCategories} />)
    
    // Simulate the onEdit callback from CategoryList
    const { calls } = (CategoryList as jest.Mock).mock
    const onEdit = calls[0][0].onEdit
    
    onEdit(mockCategories[0])
    
    await waitFor(() => {
      expect(CategoryForm).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: mockCategories.filter(c => c.id !== mockCategories[0].id),
          categoryToEdit: mockCategories[0],
          onClose: expect.any(Function),
        }),
        undefined
      )
    })
  })

  it("calls deleteCategory function when delete is confirmed", async () => {
    (deleteCategory as jest.Mock).mockResolvedValue({})
    
    render(<CategoryManagement categories={mockCategories} />)
    
    // Simulate the onDelete callback from CategoryList
    const { calls } = (CategoryList as jest.Mock).mock
    const onDelete = calls[0][0].onDelete
    
    onDelete(mockCategories[0])
    
    // Find and click the delete button in the alert dialog
    const deleteButton = await screen.findByTestId("delete-button")
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(deleteCategory).toHaveBeenCalledWith(mockCategories[0].id)
      expect(toast.success).toHaveBeenCalledWith(`Category "${mockCategories[0].name}" deleted successfully`)
    })
  })

  it("shows error toast if delete fails", async () => {
    const errorMessage: string = "Cannot delete a category with subcategories";
    (deleteCategory as jest.Mock).mockRejectedValue(new Error(errorMessage))
    
    render(<CategoryManagement categories={mockCategories} />)
    
    // Simulate the onDelete callback from CategoryList
    const { calls } = (CategoryList as jest.Mock).mock
    const onDelete = calls[0][0].onDelete
    
    onDelete(mockCategories[0])
    
    // Find and click the delete button in the alert dialog
    const deleteButton = await screen.findByTestId("delete-button")
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(deleteCategory).toHaveBeenCalledWith(mockCategories[0].id)
      expect(toast.error).toHaveBeenCalledWith(`Failed to delete category: ${errorMessage}`)
    })
  })
})