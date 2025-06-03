/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { toast } from "sonner"
import ResendVerificationPage from "@/app/auth/resend-verification/page"

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

// Mock fetch globally
global.fetch = jest.fn()

describe("ResendVerificationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it("renders the form with all elements", () => {
    render(<ResendVerificationPage />)

    expect(screen.getByText("Resend Verification Email")).toBeInTheDocument()
    expect(screen.getByText("Enter your email address to receive a new verification email.")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send Verification Email" })).toBeInTheDocument()
    expect(screen.getByText("Back to Sign In")).toBeInTheDocument()
  })

  it("submits form with valid email", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, message: "Verification email sent successfully" }),
    })

    render(<ResendVerificationPage />)

    const emailInput = screen.getByLabelText("Email")
    const submitButton = screen.getByRole("button", { name: "Send Verification Email" })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" }),
      })
    })
  })

  it("shows success message when email is sent successfully", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, message: "If an account with that email exists and is not verified, a verification email has been sent. Please check your email." }),
    })

    render(<ResendVerificationPage />)

    const emailInput = screen.getByLabelText("Email")
    const submitButton = screen.getByRole("button", { name: "Send Verification Email" })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("If an account with that email exists and is not verified, a verification email has been sent. Please check your email.")
    })

    // Check that email input is cleared
    expect(emailInput).toHaveValue("")
  })

  it("shows success message even for non-existent users (security)", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, message: "If an account with that email exists and is not verified, a verification email has been sent. Please check your email." }),
    })

    render(<ResendVerificationPage />)

    const emailInput = screen.getByLabelText("Email")
    const submitButton = screen.getByRole("button", { name: "Send Verification Email" })

    fireEvent.change(emailInput, { target: { value: "nonexistent@example.com" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("If an account with that email exists and is not verified, a verification email has been sent. Please check your email.")
    })

    // This prevents email enumeration attacks by always showing success
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@example.com" }),
    })
  })

  it("shows error message when API returns error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Internal server error" }),
    })

    render(<ResendVerificationPage />)

    const emailInput = screen.getByLabelText("Email")
    const submitButton = screen.getByRole("button", { name: "Send Verification Email" })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Internal server error")
    })
  })

  it("shows generic error message when API request fails", async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

    render(<ResendVerificationPage />)

    const emailInput = screen.getByLabelText("Email")
    const submitButton = screen.getByRole("button", { name: "Send Verification Email" })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An unexpected error occurred. Please try again later.")
    })
  })

  it("disables submit button while loading", async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<ResendVerificationPage />)

    const emailInput = screen.getByLabelText("Email")
    const submitButton = screen.getByRole("button", { name: "Send Verification Email" })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })

  it("shows loading state in button while submitting", async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<ResendVerificationPage />)

    const emailInput = screen.getByLabelText("Email")
    const submitButton = screen.getByRole("button", { name: "Send Verification Email" })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Sending...")).toBeInTheDocument()
    })
  })

  it("prevents multiple submissions while loading", async () => {
    let resolvePromise: (value: any) => void
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    render(<ResendVerificationPage />)

    const emailInput = screen.getByLabelText("Email")
    const submitButton = screen.getByRole("button", { name: "Send Verification Email" })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    
    // Click multiple times
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)

    // Only one API call should be made
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Resolve the promise to clean up
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })

  it("has correct email input attributes", () => {
    render(<ResendVerificationPage />)

    const emailInput = screen.getByLabelText("Email")
    
    expect(emailInput).toHaveAttribute("type", "email")
    expect(emailInput).toHaveAttribute("placeholder", "m@example.com")
    expect(emailInput).toBeRequired()
  })

  it("displays mail icon", () => {
    render(<ResendVerificationPage />)

    expect(screen.getByTestId("mail-icon")).toBeInTheDocument()
  })
}) 