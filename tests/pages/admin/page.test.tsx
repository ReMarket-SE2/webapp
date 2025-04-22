/**
 * @jest-environment node
 */

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import AdminPage from "@/app/(dashboard)/admin/page"
import { getCategories } from "@/lib/categories/actions"

// Mock necessary Next.js modules
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}))

// Mock the getCategories function
jest.mock("@/lib/categories/actions", () => ({
  getCategories: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe("AdminPage", () => {
  it("redirects to /not-authorized if the user is not an admin", async () => {
    const mockSession = {
      user: { role: "user", name: "Test User", email: "test@example.com" },
    };
    const mockCategories: {
        id: number;
        name: string;
        parentId: null;
    }[] = [];
    
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
    (getCategories as jest.Mock).mockResolvedValueOnce(mockCategories);

    await AdminPage()

    expect(redirect).toHaveBeenCalledWith("/not-authorized")
  })

  it("renders the admin page if the user is an admin", async () => {
    const mockSession = {
      user: { role: "admin", name: "Admin User", email: "admin@example.com" },
    };
    const mockCategories = [
      { id: 1, name: "Category 1", parentId: null },
      { id: 2, name: "Category 2", parentId: null },
    ];
    
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
    (getCategories as jest.Mock).mockResolvedValueOnce(mockCategories);

    await AdminPage()

    expect(redirect).not.toHaveBeenCalled()
  })
})