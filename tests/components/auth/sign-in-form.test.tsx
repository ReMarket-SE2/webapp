/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { SignInForm } from "@/components/auth/sign-in-form"
import { signIn, useSession } from "next-auth/react"
import { toast } from "sonner"

jest.mock("next-auth/react")

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),    
  },
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe("SignInForm", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" })
  })

  it("renders the form correctly", () => {
    render(<SignInForm />)

    expect(screen.getByText("Login to your account")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Login with Google" })).toBeInTheDocument()
  })

  it("logs in successfully with valid credentials", async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null, url: "/dashboard" })

    render(<SignInForm />)

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } })
    fireEvent.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
        callbackUrl: "/",
      })
      expect(toast.success).toHaveBeenCalledWith("Successfully logged in!")
    })
  })

  it("shows error on invalid credentials", async () => {
    (signIn as jest.Mock).mockResolvedValue({ error: "Invalid email or password" })

    render(<SignInForm />)

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "wrong@example.com" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpass" } })
    fireEvent.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password")
    })
  })

  it("shows error on signIn throw", async () => {
    (signIn as jest.Mock).mockRejectedValue(new Error("Network error"))

    render(<SignInForm />)

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pass" } })
    fireEvent.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again.")
    })
  })

  it("handles Google login", async () => {
    (signIn as jest.Mock).mockResolvedValue({})

    render(<SignInForm />)

    fireEvent.click(screen.getByRole("button", { name: "Login with Google" }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/" })
    })
  })

  it("shows error if Google login fails", async () => {
    (signIn as jest.Mock).mockImplementation(() => Promise.reject("Google failed"))

    render(<SignInForm />)

    fireEvent.click(screen.getByRole("button", { name: "Login with Google" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to login with Google")
    })
  })
})
