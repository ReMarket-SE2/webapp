/**
 * @jest-environment node
 */

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import AdminPage from "@/app/(dashboard)/admin/page"
import { getCategories } from "@/lib/categories/actions"
import { getAllUsersForAdmin } from "@/lib/users/actions"

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

// Mock the user actions
jest.mock("@/lib/users/actions", () => ({
  getAllUsersForAdmin: jest.fn(() => ({ users: [], totalUsers: 0 })),
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
    
    const mockUsers = [
      { 
        id: 1, 
        username: "user1", 
        email: "user1@example.com", 
        role: "user", 
        status: "active",
        passwordHash: "hashed_password",
        profileImageId: null,
        bio: null,
        password_reset_token: null,
        password_reset_expires: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
    (getCategories as jest.Mock).mockResolvedValueOnce(mockCategories);
    (getAllUsersForAdmin as jest.Mock).mockResolvedValueOnce({ users: mockUsers, totalUsers: mockUsers.length });

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
    
    const mockUsers = [
      { 
        id: 1, 
        username: "user1", 
        email: "user1@example.com", 
        role: "user", 
        status: "active",
        passwordHash: "hashed_password",
        profileImageId: null,
        bio: null,
        password_reset_token: null,
        password_reset_expires: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 2, 
        username: "admin1", 
        email: "admin@example.com", 
        role: "admin", 
        status: "active",
        passwordHash: "hashed_password",
        profileImageId: null,
        bio: null,
        password_reset_token: null,
        password_reset_expires: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
    (getCategories as jest.Mock).mockResolvedValueOnce(mockCategories);
    (getAllUsersForAdmin as jest.Mock).mockResolvedValueOnce({ users: mockUsers, totalUsers: mockUsers.length });

    await AdminPage()

    expect(redirect).not.toHaveBeenCalled()
  })
})