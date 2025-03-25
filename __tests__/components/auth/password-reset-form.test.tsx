/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { PasswordResetForm } from "@/components/auth/password-reset-form"
import { showToast } from "@/lib/toast"
import { checkPasswordStrength } from "@/lib/validators/password-strength"
import { useRouter } from "next/navigation"

const mockRouterPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockRouterPush })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

jest.mock("@/lib/toast", () => ({
  showToast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

jest.mock("@/lib/validators/password-strength", () => ({
  checkPasswordStrength: jest.fn(),
}))


describe("PasswordResetForm", () => {
  const mockToken = "test-token"
  beforeEach(() => {
    jest.clearAllMocks()
    ;(checkPasswordStrength as jest.Mock).mockReturnValue({ isValid: true })
  })
  

  it("renders the form correctly", () => {
    render(<PasswordResetForm token={mockToken} />)
    expect(screen.getByText("Reset Password")).toBeInTheDocument()
    expect(screen.getByLabelText("New Password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reset password" })).toBeInTheDocument()
  })

  it("shows an error if passwords do not match", async () => {
    render(<PasswordResetForm token={mockToken} />)

    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "Password123!" } })
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "Different123!" } })
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }))

    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalledWith("Passwords do not match")
    })
  })

  it("shows an error if password strength validation fails", async () => {
    (checkPasswordStrength as jest.Mock).mockReturnValue({ isValid: false, error: "Weak password" })
  
    global.fetch = jest.fn()
  
    render(<PasswordResetForm token="test-token" />)
  
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "weak" } })
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "weak" } })
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }))
  
    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalledWith("Weak password")
    })
  })
  
  

  it("submits the form successfully", async () => {
    const mockRouterPush = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush })
  
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock
  
    render(<PasswordResetForm token={mockToken} />)
  
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "Password123!" } })
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "Password123!" } })
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }))
  
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/reset-password", expect.any(Object))
      expect(showToast.success).toHaveBeenCalledWith("Password reset successfully!")
      expect(mockRouterPush).toHaveBeenCalledWith("/auth/sign-in")
    })
  })

  it("shows an error if the API call fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "API error" }),
      })
    ) as jest.Mock

    render(<PasswordResetForm token={mockToken} />)

    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "Password123!" } })
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "Password123!" } })
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }))

    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalledWith("Failed to reset password")
    })
  })
})
