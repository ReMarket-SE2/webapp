"use client"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SiteHeader } from "@/components/header/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SessionProvider } from "next-auth/react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="[--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
              <AppSidebar />
            <SidebarInset>
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </SessionProvider>

  )
}
