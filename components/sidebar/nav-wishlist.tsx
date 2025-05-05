"use client"

import {
  ArrowUpRight,
  MoreHorizontal,
  Link as LinkIcon,
  Trash2,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { CheckoutButton } from "./checkout-button"
import { WishlistItem } from "@/lib/hooks/use-wishlist"
import { useCallback } from "react"
import { toast } from "sonner"
import { useWishlistContext } from "@/components/contexts/wishlist-provider"

export function NavWishlist({
  listings,
}: {
  listings: WishlistItem[]
}) {
  const { isMobile } = useSidebar()
  const { removeFromWishlist } = useWishlistContext()

  const handleCopyLink = useCallback((listingId: number) => {
    const link = `${window.location.origin}/listing/${listingId}`
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Link copied to clipboard")
    }).catch(() => {
      toast.error("Failed to copy link")
    })
  }, [])

  const handleOpenNewTab = useCallback((listingId: number) => {
    window.open(`/listing/${listingId}`, "_blank")
  }, [])

  const handleDelete = useCallback((listingId: number) => {
    removeFromWishlist(listingId)
  }, [removeFromWishlist])

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Your Wishlist</SidebarGroupLabel>
      <SidebarMenu>
        {listings.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <Link href={`/listing/${item.id}`} title={item.title}>
                <span className="truncate max-w-[12rem] block overflow-hidden">
                  {item.title}
                </span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover aria-label="More">
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onClick={() => handleCopyLink(item.id)}>
                  <LinkIcon className="text-muted-foreground" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenNewTab(item.id)}>
                  <ArrowUpRight className="text-muted-foreground" />
                  <span>Open in New Tab</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="delete-button" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem className="mt-4 mx-auto">
          <CheckoutButton />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
