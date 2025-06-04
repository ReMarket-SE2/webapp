/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import VerifyEmailPage from "@/app/auth/verify-email/[token]/page"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useParams: () => ({ token: "valid-token" }),
  useRouter: () => ({ push: mockPush }),
}))

// Mock fetch globally
global.fetch = jest.fn()

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it("renders loading state initially", () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<VerifyEmailPage />)

    expect(screen.getByText("Verifying your email...")).toBeInTheDocument()
    expect(screen.getByText("Please wait while we verify your email address.")).toBeInTheDocument()
  })

  it("shows success state when verification succeeds", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, message: "Email verified successfully" }),
    })

    render(<VerifyEmailPage />)

    await waitFor(() => {
      expect(screen.getByText("Email Verified!")).toBeInTheDocument()
      expect(screen.getByText("Your email has been successfully verified.")).toBeInTheDocument()
      expect(screen.getByText("Continue to Sign In")).toBeInTheDocument()
    })

    // Verify API was called with correct token
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "valid-token" }),
    })
  })

  it("shows error state when verification fails", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid or expired token" }),
    })

    render(<VerifyEmailPage />)

    await waitFor(() => {
      expect(screen.getByText("Verification Failed")).toBeInTheDocument()
      expect(screen.getByText("Invalid or expired token")).toBeInTheDocument()
      expect(screen.getByText("Request New Verification Email")).toBeInTheDocument()
    })
  })

  it("shows error state when API request fails", async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

    render(<VerifyEmailPage />)

    await waitFor(() => {
      expect(screen.getByText("Verification Failed")).toBeInTheDocument()
      expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument()
    })
  })

  it("navigates to sign-in when continue button is clicked", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, message: "Email verified successfully" }),
    })

    render(<VerifyEmailPage />)

    await waitFor(() => {
      expect(screen.getByText("Continue to Sign In")).toBeInTheDocument()
    })

    const continueButton = screen.getByText("Continue to Sign In")
    continueButton.click()

    expect(mockPush).toHaveBeenCalledWith("/auth/sign-in")
  })

  it("navigates to resend verification when request new email button is clicked", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid or expired token" }),
    })

    render(<VerifyEmailPage />)

    await waitFor(() => {
      expect(screen.getByText("Request New Verification Email")).toBeInTheDocument()
    })

    const requestButton = screen.getByText("Request New Verification Email")
    requestButton.click()

    expect(mockPush).toHaveBeenCalledWith("/auth/resend-verification")
  })

  it("displays success icon when verification succeeds", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    render(<VerifyEmailPage />)

    await waitFor(() => {
      expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument()
    })
  })

  it("displays error icon when verification fails", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Error" }),
    })

    render(<VerifyEmailPage />)

    await waitFor(() => {
      expect(screen.getByTestId("x-circle-icon")).toBeInTheDocument()
    })
  })
}) 