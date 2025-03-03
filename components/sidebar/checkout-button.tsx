import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ShoppingCart } from "lucide-react";

export function CheckoutButton({ className }: { className?: string }) {
  return <Button variant="outline" className={cn("ml-auto h-8 cursor-pointer", className)}>
    <ShoppingCart />
    Checkout
  </Button>
}
