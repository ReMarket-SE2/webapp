"use client"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SiteHeader } from "@/components/header/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SessionProvider } from "next-auth/react"
import { ListingsProvider } from "@/components/contexts/listings-context"
import { WishlistProvider } from "@/components/contexts/wishlist-provider"
import { useSession } from "next-auth/react"
import React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InnerLayout>{children}</InnerLayout>
    </SessionProvider>
  )
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <React.Suspense fallback={<div>Loading listings context...</div>}>
          <ListingsProvider initialOptions={{
            page: 1,
            pageSize: 16,
            sortBy: 'date',
            sortOrder: 'desc',
          }}>
            <WishlistProvider userId={userId}>
              <SiteHeader />
              <div className="flex flex-1">
                <AppSidebar />
                <SidebarInset>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    {children}
                  </React.Suspense>
                </SidebarInset>
              </div>
            </WishlistProvider>
          </ListingsProvider>
        </React.Suspense>
      </SidebarProvider>
    </div>
  )
}
