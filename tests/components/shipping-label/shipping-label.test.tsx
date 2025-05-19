import { render, screen } from "@testing-library/react";
import { ShippingLabel, ShippingLabelData } from "../../../components/shipping-label/shipping-label";

const mockData: ShippingLabelData = {
  sellerName: "Alice Seller",
  sellerEmail: "alice@example.com",
  buyerName: "Bob Buyer",
  buyerEmail: "bob@example.com",
  shippingAddress: "123 Main St, City, Country",
  barcode: "ABC123456",
};

describe("ShippingLabel", () => {
  it("renders all label fields and barcode", () => {
    render(<ShippingLabel data={mockData} />);
    expect(screen.getByText("Shipping Label")).toBeInTheDocument();
    expect(screen.getByText("From (Seller):")).toBeInTheDocument();
    expect(screen.getByText(mockData.sellerName)).toBeInTheDocument();
    expect(screen.getByText(mockData.sellerEmail)).toBeInTheDocument();
    expect(screen.getByText("To (Buyer):")).toBeInTheDocument();
    expect(screen.getByText(mockData.buyerName)).toBeInTheDocument();
    expect(screen.getByText(mockData.buyerEmail)).toBeInTheDocument();
    expect(screen.getByText("Shipping Address:")).toBeInTheDocument();
    expect(screen.getByText(mockData.shippingAddress)).toBeInTheDocument();
    expect(screen.getByText(mockData.barcode)).toBeInTheDocument();
    expect(screen.getByText(/Please handle with care/)).toBeInTheDocument();
  });
});
