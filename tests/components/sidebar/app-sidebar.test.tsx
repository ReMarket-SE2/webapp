import { render, screen } from "@testing-library/react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/components/ui/sidebar";
jest.mock("@/components/contexts/wishlist-provider", () => ({
  useWishlistContext: jest.fn(),
}));
import { useWishlistContext } from "@/components/contexts/wishlist-provider";
const mockUseWishlistContext = useWishlistContext as jest.MockedFunction<typeof useWishlistContext>;

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseWishlistContext.mockReturnValue({
    wishlist: [
      { id: 1, title: "Vintage Record Player" },
      { id: 2, title: "Second-hand Mountain Bike" },
      { id: 3, title: "Used Gaming Console" },
      { id: 4, title: "Refurbished Laptop" },
    ],
    isLoading: false,
    hasError: false,
    addToWishlist: jest.fn(),
    removeFromWishlist: jest.fn(),
    clearUserWishlist: jest.fn(),
  });
});

describe("AppSidebar", () => {
  const renderWithSession = (session: any) => {
    render(
      <SessionProvider session={session}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </SessionProvider>
    );
  };

  it("renders the Admin button when the user is an admin", () => {
    const adminSession = {
      user: {
        name: "Admin User",
        email: "admin@example.com",
        image: "/admin-avatar.png",
        role: "admin",
      },
    };

    renderWithSession(adminSession);

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("does not render the Admin button when the user is not an admin", () => {
    const userSession = {
      user: {
        name: "Regular User",
        email: "user@example.com",
        image: "/user-avatar.png",
        role: "user",
      },
    };

    renderWithSession(userSession);

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("does not render the Admin button when there is no session", () => {
    renderWithSession(null);

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("renders all navigation items correctly", () => {
    const session = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "/test-avatar.png",
        role: "user",
      },
    };

    renderWithSession(session);

    expect(screen.getByText("View Listings")).toBeInTheDocument();
    expect(screen.getByText("Sell your items")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("renders wishlist items correctly", () => {
    const session = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "/test-avatar.png",
        role: "user",
      },
    };

    renderWithSession(session);

    expect(screen.getByText("Vintage Record Player")).toBeInTheDocument();
    expect(screen.getByText("Second-hand Mountain Bike")).toBeInTheDocument();
    expect(screen.getByText("Used Gaming Console")).toBeInTheDocument();
    expect(screen.getByText("Refurbished Laptop")).toBeInTheDocument();
  });

  it("links each wishlist item to the correct listing page", () => {
    const session = {
      user: {
        name: "Link Tester",
        email: "tester@example.com",
        image: "/tester-avatar.png",
        role: "user",
      },
    };

    renderWithSession(session);

    const recordPlayerLink = screen.getByRole("link", { name: "Vintage Record Player" });
    expect(recordPlayerLink).toHaveAttribute("href", "/listing/1");

    const bikeLink = screen.getByRole("link", { name: "Second-hand Mountain Bike" });
    expect(bikeLink).toHaveAttribute("href", "/listing/2");

    const consoleLink = screen.getByRole("link", { name: "Used Gaming Console" });
    expect(consoleLink).toHaveAttribute("href", "/listing/3");

    const laptopLink = screen.getByRole("link", { name: "Refurbished Laptop" });
    expect(laptopLink).toHaveAttribute("href", "/listing/4");
  });

  it("renders sign in button when there is no session", () => {
    renderWithSession(null);

    const signInButton = screen.getByRole("button", { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton.closest("a")).toHaveAttribute("href", "/auth/sign-in");
  });

  it("renders user profile when session exists", () => {
    const session = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "/test-avatar.png",
        role: "user",
      },
    };

    renderWithSession(session);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });
});
