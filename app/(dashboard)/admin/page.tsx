import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CategoryManagement } from "@/components/admin/category-management"
import { getCategories } from "@/lib/categories/actions"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role !== "admin") {
    redirect("/not-authorized")
  }
  
  // Fetch all categories for the admin page
  const categories = await getCategories();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your marketplace listings, users, and settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-primary/10 p-6 text-center">
          <div className="text-2xl font-bold">{categories.length}</div>
          <div className="text-muted-foreground text-sm">Categories</div>
        </div>
        <div className="rounded-xl bg-primary/10 p-6 text-center">
          <div className="text-2xl font-bold">--</div>
          <div className="text-muted-foreground text-sm">Listings</div>
        </div>
        <div className="rounded-xl bg-primary/10 p-6 text-center">
          <div className="text-2xl font-bold">--</div>
          <div className="text-muted-foreground text-sm">Users</div>
        </div>
        <div className="rounded-xl bg-primary/10 p-6 text-center">
          <div className="text-2xl font-bold">--</div>
          <div className="text-muted-foreground text-sm">Orders</div>
        </div>
      </div>

      <div>
        <CategoryManagement categories={categories} />
      </div>

      <div className="rounded-xl bg-muted/50 p-4 space-y-2">
        <h2 className="text-xl font-bold">Recent Activity</h2>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-md bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  )
}
