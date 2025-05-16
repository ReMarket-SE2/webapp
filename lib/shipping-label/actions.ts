import {ShippingLabelData} from "@/components/shipping-label/shipping-label";
import { User } from '@/lib/db/schema';
import { Order } from '@/lib/db/schema';

export async function fetchShippingLabelData(seller: User, buyer: User, order: Order): Promise<ShippingLabelData> {
    await new Promise(res => setTimeout(res, 800));
    // Example: fetch order, buyer, seller, shipping address from backend
    return {
      sellerName: seller ? seller.username : "Seller Name",
      sellerEmail: seller ? seller.email : " Seller Email",
      buyerName: buyer ? buyer.username : "Buyer Name",
      buyerEmail: buyer ? buyer.email : "Buyer Email",
      shippingAddress: order.shippingAddress || "123 Main St, City, Country",
      barcode: `#${order.id.toString().padStart(10, "0")}`,
    };
  }
