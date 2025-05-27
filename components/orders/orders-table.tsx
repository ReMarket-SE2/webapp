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
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShippingLabel } from "@/components/shipping-label/shipping-label";
import { fetchShippingLabelData } from "@/lib/shipping-label/actions";
import { getSellerByOrderId, getBuyerByOrderId, markOrderAsShipped } from "@/lib/order/actions";
import { addReview, getReviewExistenceByOrderIds } from "@/lib/reviews/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShippingLabelData } from "@/components/shipping-label/shipping-label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Order } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { CreateReviewForm } from "@/components/reviews/create-review";

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
  isSoldTable?: boolean;
}

export default function OrdersTable({
  orders,
  emptyMessage,
  redirectMessage,
  redirectURL,
  isSoldTable = false,
}: OrdersTableProps) {
  const router = useRouter();
  const [isLabelOpen, setIsLabelOpen] = useState(false);
  const [isLabelLoading, setIsLabelLoading] = useState<{ [orderId: number]: boolean }>({});
  const [shippingLabelData, setShippingLabelData] = useState<ShippingLabelData | null>(null);
  const [isShippedLoading, setIsShippedLoading] = useState<{ [orderId: number]: boolean }>({});
  const [isReviewLoading, setIsReviewLoading] = useState<{ [orderId: number]: boolean }>({});
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewsExist, setReviewsExist] = useState<Record<number, boolean>>({});
  const [activeReviewOrderId, setActiveReviewOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (!isSoldTable) {
      const checkReviews = async () => {
        const orderIds = orders.map(order => order.id);
        const reviewsMap = await getReviewExistenceByOrderIds(orderIds);
        setReviewsExist(reviewsMap);
      };
      checkReviews();
    }
  }, [orders, isSoldTable]);
   

  async function handlePrintShippingLabel(order: OrdersTableOrder) {
    setIsLabelLoading(prev => ({ ...prev, [order.id]: true }));
    try {
      const seller = await getSellerByOrderId(order.id);
      const buyer = await getBuyerByOrderId(order.id);

      if (!seller || !buyer || !order) {
        toast.error("Unable to fetch shipping label data.");
        setIsLabelLoading(prev => ({ ...prev, [order.id]: false }));
        return;
      }

      const data = await fetchShippingLabelData(seller, buyer, order);
      setShippingLabelData(data);
      setIsLabelOpen(true);
    } catch (e) {
      console.error("Error fetching shipping label data:", e);
      toast.error("Failed to load shipping label data.");
    }
    setIsLabelLoading(prev => ({ ...prev, [order.id]: false }));
  }

  function handlePrint() {
    window.print();
  }

  async function handleShipped(order: OrdersTableOrder) {
    setIsShippedLoading(prev => ({ ...prev, [order.id]: true }));
    try {
      await markOrderAsShipped(order.id);
      toast.success("Order marked as shipped.");
      router.refresh();
    } catch (e) {
      console.error("Error marking order as shipped:", e);
      toast.error("Failed to mark order as shipped.");
    }
    setIsShippedLoading(prev => ({ ...prev, [order.id]: false }));
  }

  async function handleAddReview(order: OrdersTableOrder) {
    setActiveReviewOrderId(order.id)
    setIsReviewOpen(true)
  }

  async function handleAddReviewSubmit(order: OrdersTableOrder, data: { title: string; description: string; score: number }) {
    setIsReviewLoading(prev => ({ ...prev, [order.id]: true }))
    try {
      const seller = await getSellerByOrderId(order.id)
      if (!seller) {
        toast.error("Unable to find seller for this order.")
        setIsReviewLoading(prev => ({ ...prev, [order.id]: false }))
        return
      }
      const result = await addReview({
        userId: seller.id,
        orderId: order.id,
        title: data.title,
        description: data.description,
        score: data.score,
        createdAt: new Date(),
      })
      if (!result.success) {
        toast.error(result.error || "Failed to submit review.")
        setIsReviewLoading(prev => ({ ...prev, [order.id]: false }))
        return
      }
      setReviewsExist(prev => ({ ...prev, [order.id]: true }));
      setIsReviewOpen(false)
      setActiveReviewOrderId(null)
      toast.success("Review submitted!")
    } catch (e) {
      console.error("Error submitting review:", e)
      toast.error("Failed to submit review.")
    }
    setIsReviewLoading(prev => ({ ...prev, [order.id]: false }))
  }

  if (orders.length === 0)
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
        {orders.map((order) => (
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
                {isSoldTable && order.status !== "Shipped" && (
                  <Button
                    variant="outline"
                    onClick={() => handlePrintShippingLabel(order)}
                    disabled={!!isLabelLoading[order.id]}
                  >
                    {isLabelLoading[order.id] ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Loading...
                      </>
                    ) : (
                      <>Print Shipping Label</>
                    )}
                  </Button>
                )}
                {isSoldTable && (
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
                )}
                {isSoldTable && order.status !== "Shipped" && (
                  <Button
                    variant="outline"
                    onClick={() => handleShipped(order)}
                    disabled={!!isShippedLoading[order.id]}
                  >
                    {isShippedLoading[order.id] ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Marking...
                      </>
                    ) : (
                      <>Mark As Shipped</>
                    )}
                  </Button>
                )}
                {!isSoldTable && order.status == "Shipped" && !reviewsExist[order.id] && (
                  <>
                    <Button variant="outline" onClick={() => handleAddReview(order)} disabled={isReviewLoading[order.id]}>
                      {isReviewLoading[order.id] ? (
                        <><Loader2 className="animate-spin mr-2 h-4 w-4" />Submitting...</>
                      ) : (
                        <>Add Review</>
                      )}
                    </Button>
                    <Dialog open={isReviewOpen && activeReviewOrderId === order.id} onOpenChange={open => { setIsReviewOpen(open); if (!open) setActiveReviewOrderId(null); }}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Review</DialogTitle>
                          <DialogDescription>Share your experience with this order.</DialogDescription>
                        </DialogHeader>
                        <div className="py-2">
                          <CreateReviewForm
                            onSubmit={async (data) => await handleAddReviewSubmit(order, data)}
                            isSubmitting={isReviewLoading[order.id]}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}