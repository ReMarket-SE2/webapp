import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role !== "admin") {
    redirect("/not-authorized")
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="space-y-1">
        <div className="h-8 w-48 rounded-md bg-muted/50" />
        <div className="h-4 w-96 rounded-md bg-muted/40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/50" />
        ))}
      </div>

      <div className="rounded-xl bg-muted/50 p-4 space-y-2">
        <div className="h-6 w-40 rounded-md bg-muted/40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-muted/30" />
        ))}
      </div>

      <div className="rounded-xl bg-muted/50 p-4 space-y-2">
        <div className="h-6 w-40 rounded-md bg-muted/40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted/30" />
        ))}
      </div>
    </div>
  )
}
