/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CheckoutButton } from "@/components/sidebar/checkout-button";
import { toast } from "sonner";

// Mock dependencies
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader-icon">Loading...</div>,
  ShoppingCart: () => <div data-testid="cart-icon">Cart</div>,
}));

describe("CheckoutButton", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location.assign
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, assign: jest.fn() },
    });
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // Restore window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it("renders correctly initially", () => {
    render(<CheckoutButton />);
    expect(screen.getByRole("button", { name: /checkout/i })).toBeInTheDocument();
    expect(screen.getByTestId("cart-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
  });

  it("shows loading state and calls API on click", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: "https://checkout.stripe.com/test-session" }),
    });

    render(<CheckoutButton />);
    const button = screen.getByRole("button", { name: /checkout/i });
    fireEvent.click(button);

    // Check loading state
    expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    expect(screen.getByText("Redirecting...")).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Wait for API call and redirection
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/checkout", { method: "POST" });
    });
  });

  it("redirects to the returned URL on successful API call", async () => {
    const checkoutUrl = "https://checkout.stripe.com/test-session";
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: checkoutUrl }),
    });

    render(<CheckoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /checkout/i }));

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(checkoutUrl);
    });

    // Check button state after completion (mocked instantly)
    expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /checkout/i })).not.toBeDisabled();
  });

  it("shows error toast if API response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "API Error Message" }),
    });

    render(<CheckoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /checkout/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("API Error Message");
    });

    // Check button state after error
    expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /checkout/i })).not.toBeDisabled();
  });

  it("shows error toast if API response is ok but no URL is returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Success but no URL" }), // Missing url
    });

    render(<CheckoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /checkout/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to create checkout session");
    });
  });

  it("shows error toast if fetch throws an error", async () => {
    const fetchError = new Error("Network Error");
    (global.fetch as jest.Mock).mockRejectedValueOnce(fetchError);

    render(<CheckoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /checkout/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network Error");
    });
    // Check button state after error
    expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /checkout/i })).not.toBeDisabled();
  });

  it("applies custom className", () => {
    const customClass = "my-custom-checkout-class";
    render(<CheckoutButton className={customClass} />);
    const button = screen.getByRole("button", { name: /checkout/i });
    expect(button).toHaveClass(customClass);
    expect(button).toHaveClass("ml-auto"); // Ensure default classes are also present
  });
}); 