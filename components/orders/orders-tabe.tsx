'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Link from "next/link";
import { ShippingLabel } from "@/components/shipping-label/shipping-label";
import { fetchShippingLabelData } from "@/lib/shipping-label/actions";
import { getSellerByOrderId, getBuyerByOrderId, markOrderAsShipped } from "@/lib/order/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShippingLabelData } from "@/components/shipping-label/shipping-label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Order } from "@/lib/db/schema";

interface OrdersTableOrderItem {
  id: number;
  listing?: { title?: string; id: number; status?: string };
  quantity: number;
}

interface OrdersTableOrder extends Order {
  orderItems: OrdersTableOrderItem[];
  totalAmount: number;
}

interface OrdersTableProps {
  orders: OrdersTableOrder[];
  emptyMessage: string;
  redirectMessage: string;
  redirectURL: string;
}

export default function OrdersTable({
  orders,
  emptyMessage,
  redirectMessage,
  redirectURL,
}: OrdersTableProps) {
  const [isLabelOpen, setIsLabelOpen] = useState(false);
  const [isLabelLoading, setIsLabelLoading] = useState(false);
  const [shippingLabelData, setShippingLabelData] = useState<ShippingLabelData | null>(null);

  // Use local state for orders to allow UI updates without reload
  const [localOrders, setLocalOrders] = useState<OrdersTableOrder[]>(orders);

  const [isShippedLoading, setIsShippedLoading] = useState(false);

  async function handlePrintShippingLabel(order: OrdersTableOrder) {
    setIsLabelLoading(true);
    try {
      const seller = await getSellerByOrderId(order.id);
      const buyer = await getBuyerByOrderId(order.id);

      if (!seller || !buyer || !order) {
        toast.error("Unable to fetch shipping label data.");
        return;
      }

      const data = await fetchShippingLabelData(seller, buyer, order);
      setShippingLabelData(data);
      setIsLabelOpen(true);
    } catch (e) {
      console.error("Error fetching shipping label data:", e);
      toast.error("Failed to load shipping label data.");
    }
    setIsLabelLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  async function handleShipped(order: OrdersTableOrder) {
    setIsShippedLoading(true);
    try {
      await markOrderAsShipped(order.id);
      // Update local state for the shipped order
      setLocalOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === order.id ? { ...o, status: "Shipped" } : o
        )
      );
      toast.success("Order marked as shipped.");
    } catch (e) {
      console.error("Error marking order as shipped:", e);
      toast.error("Failed to mark order as shipped.");
    }
    setIsShippedLoading(false);
  }

  if (localOrders.length === 0)
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground mb-4">{emptyMessage}</p>
        <Link href={redirectURL} className="text-primary hover:underline">
          {redirectMessage}
        </Link>
      </div>
    );

  return (
    <Table>
      <TableCaption>A list of your recent orders.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Order ID</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total Amount</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {localOrders.map(order => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">
              #{order.id.toString().padStart(6, "0")}
            </TableCell>
            <TableCell>
              {new Date(order.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge
                variant={order.status === "Shipped" ? "default" : "secondary"}
              >
                {order.status}
              </Badge>
            </TableCell>
            <TableCell>
              <ul className="list-disc list-inside text-sm">
                {order.orderItems.map((item: OrdersTableOrderItem) => (
                  <li key={item.id}>
                    {item.listing?.title || "Unknown Listing"} (x{item.quantity})
                  </li>
                ))}
              </ul>
            </TableCell>
            <TableCell>
              ${order.totalAmount.toFixed(2)}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-2">
                {order.status !== "Shipped" && (
                  <Button
                    variant="outline"
                    onClick={() => handlePrintShippingLabel(order)}
                    disabled={isLabelLoading}
                  >
                    {isLabelLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Loading...
                      </>
                    ) : (
                      <>Print Shipping Label</>
                    )}
                  </Button>
                )}
                <Dialog open={isLabelOpen} onOpenChange={setIsLabelOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Shipping Label</DialogTitle>
                      <DialogDescription>
                        Print and attach this label to your package.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center py-2">
                      {shippingLabelData ? (
                        <ShippingLabel data={shippingLabelData} />
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="animate-spin h-4 w-4" />
                          Loading label...
                        </div>
                      )}
                    </div>
                    <DialogFooter className="print:hidden">
                      <Button onClick={handlePrint} variant="secondary">
                        Print
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {order.status !== "Shipped" && (
                  <Button
                    variant="outline"
                    onClick={() => handleShipped(order)}
                    disabled={isShippedLoading}
                  >
                    {isShippedLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Marking...
                      </>
                    ) : (
                      <>Mark As Shipped</>
                    )}
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}