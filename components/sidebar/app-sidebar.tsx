"use client"

import * as React from "react"
import {
  Carrot,
  Banana,
  ShieldCheck,
  LogIn,
} from "lucide-react"
import Link from "next/link"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { NavWishlist } from "@/components/sidebar/nav-wishlist"
import { useSession } from "next-auth/react"
import { Button } from "../ui/button"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  console.log('session', session);

  const data = {
    user: session?.user ? {
      name: session.user.name ?? "shadcn",
      email: session.user.email ?? "m@example.com",
      avatar: session.user.image ?? "/avatar.png",
    } : null,
    navMain: [
      {
        title: "View Listings",
        url: "/listings",
        icon: Carrot,
        isActive: true,
      },
      {
        title: "Sell your items",
        url: "/create-listing",
        icon: Banana,
        isActive: true,
      },
      {
        title: "Admin",
        url: "/admin",
        icon: ShieldCheck,
        isActive: session?.user?.role === "admin",
      }
    ],
    wishlist: [
      {
        name: "Vintage Record Player",
        url: "#",
        emoji: "🎵",
      },
      {
        name: "Second-hand Mountain Bike",
        url: "#",
        emoji: "🚲",
      },
      {
        name: "Used Gaming Console",
        url: "#",
        emoji: "🎮",
      },
      {
        name: "Refurbished Laptop",
        url: "#",
        emoji: "💻",
      },
      {
        name: "Antique Desk Lamp",
        url: "#",
        emoji: "💡",
      },
      {
        name: "Project Management & Task Tracking",
        url: "#",
        emoji: "📊",
      },
      {
        name: "Family Recipe Collection & Meal Planning",
        url: "#",
        emoji: "🍳",
      },
      {
        name: "Fitness Tracker & Workout Routines",
        url: "#",
        emoji: "💪",
      },
      {
        name: "Book Notes & Reading List",
        url: "#",
        emoji: "📚",
      },
      {
        name: "Sustainable Gardening Tips & Plant Care",
        url: "#",
        emoji: "🌱",
      },
      {
        name: "Language Learning Progress & Resources",
        url: "#",
        emoji: "🗣️",
      },
      {
        name: "Home Renovation Ideas & Budget Tracker",
        url: "#",
        emoji: "🏠",
      },
      {
        name: "Personal Finance & Investment Portfolio",
        url: "#",
        emoji: "💰",
      },
      {
        name: "Movie & TV Show Watchlist with Reviews",
        url: "#",
        emoji: "🎬",
      },
      {
        name: "Daily Habit Tracker & Goal Setting",
        url: "#",
        emoji: "✅",
      },
    ],
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center">
                  <Image src="/logo.png" alt="logo" width={32} height={32} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">ReMarket</span>
                  <span className="truncate text-xs">Your secure marketplace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavWishlist listings={data.wishlist} />
      </SidebarContent>
      <SidebarFooter>
        {session?.user ? (
          <NavUser user={data.user!} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                <Link href="/auth/sign-in" className="flex items-center gap-2">
                  <Button variant="outline" className="w-full">
                    <LogIn className="size-4" />
                    <span>Sign In</span>
                  </Button>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}