"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Loader2, ShoppingCart } from "lucide-react";

export function CheckoutButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create checkout session');
      window.location.assign(data.url);
    } catch (error) {
      console.error('Checkout error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Checkout failed');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleCheckout}
      disabled={isLoading}
      className={cn("ml-auto h-8", className)}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Redirecting...' : 'Checkout'}
    </Button>
  );
}
