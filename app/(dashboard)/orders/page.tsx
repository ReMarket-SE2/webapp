import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getOrdersByUserId } from "@/lib/order/actions";
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
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/orders");
  }

  const userId = parseInt(session.user.id as string, 10);
  const orders = await getOrdersByUserId(userId);

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/listings" className="text-primary hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <Table>
          <TableCaption>A list of your recent orders.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id.toString().padStart(6, '0')}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={order.status === "Shipped" ? "default" : "secondary"}
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ul className="list-disc list-inside text-sm">
                    {order.orderItems.map(item => (
                      <li key={item.id}>
                        {item.listing?.title || "Unknown Listing"} (x{item.quantity})
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="text-right">
                  ${order.totalAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 