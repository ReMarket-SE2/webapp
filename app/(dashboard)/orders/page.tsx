import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getOrdersByUserId } from "@/lib/order/actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import OrdersTable from "@/components/orders/orders-table";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id)
    redirect("/api/auth/signin?callbackUrl=/dashboard/orders");

  const userId = parseInt(session.user.id as string, 10);
  const boughtOrders = await getOrdersByUserId(userId, { bought: true });
  const soldOrders = await getOrdersByUserId(userId, { sold: true });

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
      <Tabs defaultValue="bought" className="w-full">
        <TabsList>
          <TabsTrigger value="bought">Bought</TabsTrigger>
          <TabsTrigger value="sold">Sold</TabsTrigger>
        </TabsList>
        <TabsContent value="bought">
          <OrdersTable
            orders={boughtOrders}
            emptyMessage="You haven't placed any orders yet."
            redirectMessage="Browse Listings"
            redirectURL="/listings"
            isSoldTable={false}
          />
        </TabsContent>
        <TabsContent value="sold">
          <OrdersTable
            orders={soldOrders}
            emptyMessage="You haven't sold any items yet."
            redirectMessage="Sell Items"
            redirectURL="/create-listing"
            isSoldTable={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}