import { render } from "@testing-library/react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import AdminPage from "@/app/(dashboard)/admin/page"

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe("AdminPage", () => {
  it("redirects to /not-authorized if the user is not an admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { role: "user", name: "Test User", email: "test@example.com" },
    })

    await AdminPage()

    expect(redirect).toHaveBeenCalledWith("/not-authorized")
  })

  it("renders the admin page if the user is an admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { role: "admin", name: "Admin User", email: "admin@example.com" },
    })

    const { container } = render(await AdminPage())

    expect(redirect).not.toHaveBeenCalled()
    expect(container).toMatchSnapshot()
  })
})
