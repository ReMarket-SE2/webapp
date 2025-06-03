import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrdersTable from "@/components/orders/orders-table";
import { ShippingLabelData } from "@/components/shipping-label/shipping-label";

// Mock dependencies
let getReviewExistenceByOrderIdsMock = jest.fn((orderIds: number[]) => {
  // By default, return false for all orderIds
  const result: Record<number, boolean> = {};
  for (const id of orderIds) result[id] = false;
  return Promise.resolve(result);
});
let addReviewMock = jest.fn();

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
jest.mock("@/lib/reviews/actions", () => {
  return {
    getReviewExistenceByOrderIds: (orderIds: number[]) => getReviewExistenceByOrderIdsMock(orderIds),
    addReview: (...args: any[]) => addReviewMock(...args),
  };
});

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
  beforeEach(() => {
    getReviewExistenceByOrderIdsMock.mockReset();
    addReviewMock.mockReset();
    // Default: always return all order ids as false
    getReviewExistenceByOrderIdsMock.mockImplementation((orderIds: number[]) => {
      const result: Record<number, boolean> = {};
      if (Array.isArray(orderIds)) {
        for (const id of orderIds) result[id] = false;
      }
      return Promise.resolve(result);
    });
  });

  it("renders orders table with orders", () => {
    render(
      <OrdersTable
        orders={orders as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
        isSoldTable={true}
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
        isSoldTable={true}
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
        isSoldTable={true}
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
        isSoldTable={true}
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
        isSoldTable={true}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Print Shipping Label/i }));
    expect(screen.getByRole("button", { name: /Loading.../i })).toBeDisabled();
  });

  it("does not render shipping label and shipped actions for bought table", () => {
    render(
      <OrdersTable
        orders={orders as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
        isSoldTable={false}
      />
    );
    expect(screen.queryByRole("button", { name: /Print Shipping Label/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Mark As Shipped/i })).toBeNull();
  });

  it("shows Add Review button for shipped bought orders with no review", async () => {
    const shippedOrder = [{
      id: 2,
      createdAt: new Date().toISOString(),
      status: "Shipped",
      orderItems: [
        { id: 2, listing: { id: 2, title: "Shipped Item", status: "Active" }, quantity: 1 }
      ],
      totalAmount: 50,
    }];
    // Patch: always return all order ids as false
    getReviewExistenceByOrderIdsMock.mockResolvedValueOnce(
      Object.fromEntries(shippedOrder.map(o => [o.id, false]))
    );
    render(
      <OrdersTable
        orders={shippedOrder as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
        isSoldTable={false}
      />
    );
    await waitFor(() => expect(screen.getByRole("button", { name: /Add Review/i })).toBeInTheDocument());
  });

  it("opens Add Review dialog on button click", async () => {
    const shippedOrder = [{
      id: 3,
      createdAt: new Date().toISOString(),
      status: "Shipped",
      orderItems: [
        { id: 3, listing: { id: 3, title: "Review Item", status: "Active" }, quantity: 1 }
      ],
      totalAmount: 75,
    }];
    getReviewExistenceByOrderIdsMock.mockResolvedValueOnce(
      Object.fromEntries(shippedOrder.map(o => [o.id, false]))
    );
    render(
      <OrdersTable
        orders={shippedOrder as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
        isSoldTable={false}
      />
    );
    await waitFor(() => expect(screen.getByRole("button", { name: /Add Review/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Add Review/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Add Review/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Share your experience/i })).toBeInTheDocument();
  });

  it("submits review form and disables button while submitting", async () => {
    const shippedOrder = [{
      id: 4,
      createdAt: new Date().toISOString(),
      status: "Shipped",
      orderItems: [
        { id: 4, listing: { id: 4, title: "Review Submit Item", status: "Active" }, quantity: 1 }
      ],
      totalAmount: 80,
    }];
    getReviewExistenceByOrderIdsMock.mockResolvedValueOnce(
      Object.fromEntries(shippedOrder.map(o => [o.id, false]))
    );
    require("@/lib/order/actions").getSellerByOrderId.mockResolvedValue({ id: 10 });
    addReviewMock.mockResolvedValue({ success: true });
    render(
      <OrdersTable
        orders={shippedOrder as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
        isSoldTable={false}
      />
    );
    await waitFor(() => expect(screen.getByRole("button", { name: /Add Review/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Add Review/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Add Review/i })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "Great!" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Awesome experience." } });
    fireEvent.click(screen.getAllByRole("button", { name: /Rate 5 stars?/i })[0]);
    const submitBtn = screen.getByRole("button", { name: /Post Review/i });
    fireEvent.click(submitBtn);
    expect(submitBtn).toBeDisabled();
    await waitFor(() => expect(addReviewMock).toHaveBeenCalled());
  });

  it("closes dialog and hides Add Review after submit", async () => {
    const shippedOrder = [{
      id: 5,
      createdAt: new Date().toISOString(),
      status: "Shipped",
      orderItems: [
        { id: 5, listing: { id: 5, title: "Review Hide Item", status: "Active" }, quantity: 1 }
      ],
      totalAmount: 90,
    }];
    let reviewExists = false;
    getReviewExistenceByOrderIdsMock.mockResolvedValueOnce(
      Object.fromEntries(shippedOrder.map(o => [o.id, false]))
    );
    require("@/lib/order/actions").getSellerByOrderId.mockResolvedValue({ id: 11 });
    addReviewMock.mockImplementation(() => { reviewExists = true; return Promise.resolve({ success: true }); });
    render(
      <OrdersTable
        orders={shippedOrder as any}
        emptyMessage="No orders"
        redirectMessage="Go"
        redirectURL="/"
        isSoldTable={false}
      />
    );
    await waitFor(() => expect(screen.getByRole("button", { name: /Add Review/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Add Review/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Add Review/i })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "Nice" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Very good." } });
    fireEvent.click(screen.getAllByRole("button", { name: /Rate 5 stars?/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Post Review/i }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: /Add Review/i })).toBeNull());
    expect(screen.queryByRole("button", { name: /Add Review/i })).toBeNull();
  });
});
