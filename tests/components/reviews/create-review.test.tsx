import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CreateReviewForm } from "@/components/reviews/create-review"

describe("CreateReviewForm", () => {
  function setup(props = {}) {
    render(<CreateReviewForm {...props} />)
  }

  it("renders all fields and labels", () => {
    setup()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByText(/score/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /post review/i })).toBeInTheDocument()
  })

  it("shows character count for title and description", () => {
    setup()
    expect(screen.getByText(/0\/120 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/0\/1000 characters/i)).toBeInTheDocument()
  })

  it("updates character count as user types", () => {
    setup()
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "abc" } })
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "xyz" } })
    expect(screen.getByText(/3\/120 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/3\/1000 characters/i)).toBeInTheDocument()
  })

  it("allows selecting a star rating and displays it", () => {
    setup()
    const stars = screen.getAllByRole("button", { name: /rate/i })
    fireEvent.click(stars[2])
    expect(screen.getByText("3/5")).toBeInTheDocument()
  })

  it("shows error if submitting with empty fields", async () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: /post review/i }))
    expect(await screen.findByText(/Share your experience/i)).toBeInTheDocument()
  })

  it("calls onSubmit with valid data and resets form", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    setup({ onSubmit })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Great!" } })
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Awesome experience" } })
    fireEvent.click(screen.getAllByRole("button", { name: /rate/i })[4])
    fireEvent.click(screen.getByRole("button", { name: /post review/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ title: "Great!", score: 5, description: "Awesome experience" }))
    expect(screen.getByLabelText(/title/i)).toHaveValue("")
    expect(screen.getByLabelText(/description/i)).toHaveValue("")
    expect(screen.getByText("No rating")).toBeInTheDocument()
  })

  it("disables fields and button when isSubmitting is true", () => {
    setup({ isSubmitting: true })
    expect(screen.getByLabelText(/title/i)).toBeDisabled()
    expect(screen.getByLabelText(/description/i)).toBeDisabled()
    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled()
  })
})
