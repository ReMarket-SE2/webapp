import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

export function CreateListingButton({ className }: { className?: string }) {
  return <Button variant="outline" className={cn("ml-auto h-8 cursor-pointer", className)}>
    <Plus />
    Sell your item
  </Button>
}
