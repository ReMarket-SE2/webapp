import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export function CreateListingButton({ className }: { className?: string }) {
  return <Link href="/create-listing" className="ml-auto">
    <Button variant="outline" className={cn("h-8 cursor-pointer", className)}>
      <Plus />
      Sell your item
    </Button>
  </Link>
}
