import { render, screen } from "@testing-library/react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/components/ui/sidebar";

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
});
