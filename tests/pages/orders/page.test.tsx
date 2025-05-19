import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import OrdersPage from "@/app/(dashboard)/orders/page";

// Mock dependencies
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/order/actions", () => ({ getOrdersByUserId: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn(() => { throw new Error("redirected"); }) }));
jest.mock("@/components/orders/orders-table", () => ({ __esModule: true, default: jest.fn(() => <div data-testid="orders-table" />) }));

const mockGetServerSession = require("next-auth/next").getServerSession;
const mockGetOrdersByUserId = require("@/lib/order/actions").getOrdersByUserId;
const mockRedirect = require("next/navigation").redirect;

describe("OrdersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects if not authenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    await expect(OrdersPage()).rejects.toThrow("redirected");
    expect(mockRedirect).toHaveBeenCalledWith("/api/auth/signin?callbackUrl=/dashboard/orders");
  });

  it("renders orders tables for bought and sold orders", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { id: "42" } });
    mockGetOrdersByUserId.mockResolvedValueOnce([ { id: 1 } ]); // boughtOrders
    mockGetOrdersByUserId.mockResolvedValueOnce([ { id: 2 } ]); // soldOrders
    const page = await OrdersPage();
    render(page);
    expect(screen.getByText(/Your Orders/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Bought/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Sold/i })).toBeInTheDocument();
    expect(screen.getByTestId("orders-table")).toBeInTheDocument();
  });
});
