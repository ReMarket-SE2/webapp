"use client"

import React, { createContext, useContext } from "react"
import { useWishlist } from "@/lib/hooks/use-wishlist"

interface WishlistContextValue {
  wishlist: ReturnType<typeof useWishlist>["wishlist"]
  isLoading: boolean
  hasError: boolean
  addToWishlist: (listingId: number) => Promise<void>
  removeFromWishlist: (listingId: number) => Promise<void>
  clearUserWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export function WishlistProvider({ userId, children }: { userId: number | null; children: React.ReactNode }) {
  const { wishlist, isLoading, hasError, addToWishlist, removeFromWishlist, clearUserWishlist } = useWishlist(userId)

  return (
    <WishlistContext.Provider value={{ wishlist, isLoading, hasError, addToWishlist, removeFromWishlist, clearUserWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlistContext() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error("useWishlistContext must be used within a WishlistProvider")
  return context
}