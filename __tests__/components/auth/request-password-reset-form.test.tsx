/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { RequestPasswordResetForm } from "@/components/auth/request-password-reset-form"
import { showToast } from "@/lib/toast"

jest.mock("@/lib/toast", () => ({
  showToast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

describe("RequestPasswordResetForm", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the form correctly", () => {
    render(<RequestPasswordResetForm />)

    expect(screen.getByText("Forgot Password")).toBeInTheDocument()
    expect(
      screen.getByText(/we will send you a link to reset your password/i)
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Send reset link" })
    ).toBeInTheDocument()
  })

  it("shows a success toast on valid request", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock

    render(<RequestPasswordResetForm />)

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/forgot-password",
        expect.objectContaining({
          method: "POST",
        })
      )
      expect(showToast.success).toHaveBeenCalledWith(
        "If an account exists with this email, you will receive a password reset link"
      )
    })
  })

  it("shows an error toast on API failure", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
      })
    ) as jest.Mock

    render(<RequestPasswordResetForm />)

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }))

    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalledWith(
        "Failed to send reset email"
      )
    })
  })

  it("disables input and button while loading", async () => {
    let resolveFetch: () => void
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = () => resolve({ ok: true, json: () => ({}) })
        })
    ) as jest.Mock

    render(<RequestPasswordResetForm />)

    const input = screen.getByLabelText("Email")
    const button = screen.getByRole("button", { name: "Send reset link" })

    fireEvent.change(input, {
      target: { value: "test@example.com" },
    })
    fireEvent.click(button)

    expect(input).toBeDisabled()
    await waitFor(() => {
      expect(button).toBeDisabled()
    })

    resolveFetch!()
  })
})
