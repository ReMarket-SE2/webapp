import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import { NavWishlist } from "@/components/sidebar/nav-wishlist"
import { useWishlistContext } from "@/components/contexts/wishlist-provider"
import { SidebarProvider } from "@/components/ui/sidebar"

// Mock the wishlist context
jest.mock("@/components/contexts/wishlist-provider", () => ({
  useWishlistContext: jest.fn(),
}))

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockUseWishlistContext = useWishlistContext as jest.MockedFunction<
  typeof useWishlistContext
>

describe("NavWishlist", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWishlistContext.mockReturnValue({
      wishlist: [
        { id: 1, title: "Vintage Record Player" },
        { id: 2, title: "Second-hand Mountain Bike" },
      ],
      isLoading: false,
      hasError: false,
      addToWishlist: jest.fn(),
      removeFromWishlist: jest.fn(),
      clearUserWishlist: jest.fn(),
    })
  })

  it("renders wishlist items correctly", () => {
    render(
      <SidebarProvider>
        <NavWishlist listings={mockUseWishlistContext().wishlist} />
      </SidebarProvider>
    )

    expect(screen.getByText("Vintage Record Player")).toBeInTheDocument()
    expect(screen.getByText("Second-hand Mountain Bike")).toBeInTheDocument()
  })

  it("removes an item when delete is clicked", async () => {
    const { removeFromWishlist } = mockUseWishlistContext()
    render(
      <SidebarProvider>
        <NavWishlist listings={mockUseWishlistContext().wishlist} />
      </SidebarProvider>
    )

    // Open the dropdown for the first item
    const moreButtons = screen.getAllByLabelText("More")
    await userEvent.click(moreButtons[0])

    // Wait for the menu to appear and then query within it
    const menu = await screen.findByRole("menu")
    const deleteButton = await within(menu).findByTestId("delete-button")
    await userEvent.click(deleteButton)

    expect(removeFromWishlist).toHaveBeenCalledWith(1)
  })

  it("copies the listing link to clipboard when Copy Link is clicked", async () => {
    // Mock clipboard
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    })

    const { toast } = require("sonner")

    render(
      <SidebarProvider>
        <NavWishlist listings={mockUseWishlistContext().wishlist} />
      </SidebarProvider>
    )

    // Open the dropdown for the first item
    const moreButtons = screen.getAllByLabelText("More")
    await userEvent.click(moreButtons[0])

    // Wait for the menu to appear and then query within it
    const menu = await screen.findByRole("menu")
    const copyLinkItem = await within(menu).findByText("Copy Link")
    await userEvent.click(copyLinkItem)

    // Expect clipboard.writeText called with the correct URL
    expect(writeTextMock).toHaveBeenCalledWith(
      `${window.location.origin}/listing/1`
    )
    // Expect a success toast
    expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard")
  })

  it("opens the listing in a new tab when Open in New Tab is clicked", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null)

    render(
      <SidebarProvider>
        <NavWishlist listings={mockUseWishlistContext().wishlist} />
      </SidebarProvider>
    )

    // Open the dropdown for the first item
    const moreButtons = screen.getAllByLabelText("More")
    await userEvent.click(moreButtons[0])

    // Wait for the menu to appear and then query within it
    const menu = await screen.findByRole("menu")
    const openItem = await within(menu).findByText("Open in New Tab")
    await userEvent.click(openItem)

    expect(openSpy).toHaveBeenCalledWith("/listing/1", "_blank")
    openSpy.mockRestore()
  })
})
