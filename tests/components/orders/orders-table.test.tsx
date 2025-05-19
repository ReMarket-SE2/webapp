import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrdersTable from "@/components/orders/orders-table";
import { ShippingLabelData } from "@/components/shipping-label/shipping-label";

// Mock dependencies
jest.mock("next/link", () => ({ children, ...props }: any) => <a {...props}>{children}</a>);
jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock("@/components/shipping-label/shipping-label", () => ({
  ShippingLabel: ({ data }: { data: ShippingLabelData }) => <div data-testid="shipping-label">{data?.sellerName}</div>
}));
jest.mock("@/lib/shipping-label/actions", () => ({
  fetchShippingLabelData: jest.fn(() => Promise.resolve({
    sellerName: "Seller Name",
    sellerEmail: "seller@example.com",
    buyerName: "Buyer Name",
    buyerEmail: "buyer@example.com",
    shippingAddress: "123 Test St, Test City",
    barcode: "1234567890"
  }))
}));
jest.mock("@/lib/order/actions", () => ({
  getSellerByOrderId: jest.fn(() => Promise.resolve({ id: 1 })),
  getBuyerByOrderId: jest.fn(() => Promise.resolve({ id: 2 })),
  markOrderAsShipped: jest.fn(() => Promise.resolve())
}));

const orders = [
  {
    id: 1,
    createdAt: new Date().toISOString(),
    status: "Pending",
    orderItems: [
      { id: 1, listing: { id: 1, title: "Test Item", status: "Active" }, quantity: 2 }
    ],
    totalAmount: 100,
  }
];

describe("OrdersTable", () => {
  it("renders orders table with orders", () => {
    render(
      <OrdersTable
        orders={orders as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
      />
    );
    expect(screen.getByText(/Order ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Item/i)).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Print Shipping Label/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark As Shipped/i })).toBeInTheDocument();
  });

  it("renders empty state when no orders", () => {
    render(
      <OrdersTable
        orders={[]}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
      />
    );
    expect(screen.getByText("No orders")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
  });

  it("opens shipping label dialog on button click", async () => {
    render(
      <OrdersTable
        orders={orders as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Print Shipping Label/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Shipping Label/i })).toBeInTheDocument());
    expect(screen.getByTestId("shipping-label")).toBeInTheDocument();
  });

  it("calls markOrderAsShipped on Mark As Shipped button click", async () => {
    const { getByRole } = render(
      <OrdersTable
        orders={orders as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
      />
    );
    fireEvent.click(getByRole("button", { name: /Mark As Shipped/i }));
    await waitFor(() => {
      expect(require("@/lib/order/actions").markOrderAsShipped).toHaveBeenCalledWith(1);
    });
  });

  it("disables buttons when loading", async () => {
    render(
      <OrdersTable
        orders={orders as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Print Shipping Label/i }));
    expect(screen.getByRole("button", { name: /Loading.../i })).toBeDisabled();
  });
});
