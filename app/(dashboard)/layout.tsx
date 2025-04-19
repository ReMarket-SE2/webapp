"use client"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SiteHeader } from "@/components/header/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SessionProvider } from "next-auth/react"
import { ListingsProvider } from "@/components/contexts/listings-context"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="[--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <ListingsProvider initialOptions={{
            page: 1,
            pageSize: 20,
            sortBy: 'date',
            sortOrder: 'desc',
          }}>
            <SiteHeader />
            <div className="flex flex-1">
              <AppSidebar />
              <SidebarInset>
                {children}
              </SidebarInset>
            </div>
          </ListingsProvider>
        </SidebarProvider>
      </div>
    </SessionProvider>

  )
}
