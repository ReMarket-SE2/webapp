/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { toast } from "sonner"
import { signIn, useSession } from "next-auth/react"
import { checkPasswordStrength } from "@/lib/validators/password-strength"

const mockPush = jest.fn()

jest.mock("next-auth/react")
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))
jest.mock("@/lib/validators/password-strength", () => ({
  checkPasswordStrength: jest.fn(),
}))
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

describe("SignUpForm", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" })
    ;(checkPasswordStrength as jest.Mock).mockReturnValue({ isValid: true })
  })

  it("renders all inputs and buttons", () => {
    render(<SignUpForm />)

    expect(screen.getByLabelText("Username")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Login with Google" })).toBeInTheDocument()
  })

  it("shows error if password strength validation fails", async () => {
    (checkPasswordStrength as jest.Mock).mockReturnValue({
      isValid: false,
      error: "Weak password",
    })
  
    render(<SignUpForm />)
  
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } })
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123" } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "123" } })
  
    fireEvent.click(screen.getByRole("button", { name: "Create account" }))
  
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Weak password")
    })
  })
  

  it("shows error if passwords do not match", async () => {
    (checkPasswordStrength as jest.Mock).mockReturnValue({ isValid: true })
  
    render(<SignUpForm />)
  
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "user" } })
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password123!" } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Mismatch123!" } })
  
    fireEvent.click(screen.getByRole("button", { name: "Create account" }))
  
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Passwords do not match")
    })
  })
  

  it("shows success message and redirects to sign-in after successful registration", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          message: "Account created successfully. Please check your email to verify your account." 
        }),
      })
    ) as jest.Mock

    render(<SignUpForm />)

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "newuser" } })
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "StrongPass123!" } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "StrongPass123!" } })
    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/register", expect.anything())
      expect(toast.success).toHaveBeenCalledWith("Account created successfully. Please check your email to verify your account.")
    })

    // Wait for the redirect timeout
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/sign-in")
    }, { timeout: 3000 })
  })

  it("shows error if registration API fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Email already in use" }),
      })
    ) as jest.Mock

    render(<SignUpForm />)

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "testuser" } })
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "used@example.com" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password123!" } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Password123!" } })
    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already in use")
    })
  })

  it("handles Google login", async () => {
    ;(signIn as jest.Mock).mockResolvedValue({})

    render(<SignUpForm />)

    fireEvent.click(screen.getByRole("button", { name: "Login with Google" }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/" })
    })
  })

  it("shows error if Google login fails", async () => {
    ;(signIn as jest.Mock).mockRejectedValue(new Error("Google fail"))

    render(<SignUpForm />)

    fireEvent.click(screen.getByRole("button", { name: "Login with Google" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to login with Google")
    })
  })

  it("clears form fields after successful registration", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          message: "Account created successfully. Please check your email to verify your account." 
        }),
      })
    ) as jest.Mock

    render(<SignUpForm />)

    const usernameInput = screen.getByLabelText("Username")
    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Password")
    const confirmPasswordInput = screen.getByLabelText("Confirm Password")

    fireEvent.change(usernameInput, { target: { value: "newuser" } })
    fireEvent.change(emailInput, { target: { value: "new@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "StrongPass123!" } })
    fireEvent.change(confirmPasswordInput, { target: { value: "StrongPass123!" } })
    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => {
      expect(usernameInput).toHaveValue("")
      expect(emailInput).toHaveValue("")
      expect(passwordInput).toHaveValue("")
      expect(confirmPasswordInput).toHaveValue("")
    })
  })
})
