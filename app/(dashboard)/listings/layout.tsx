"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useListingsContext } from "@/components/contexts/listings-context";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  const { updateOptions, options, metadata } = useListingsContext();
  const { open } = useSidebar();

  return (
    <div className="w-full h-full">
      {children}
      <Card className={cn(
        "fixed bottom-4 left-1/2 p-2 flex-row justify-between items-center gap-8 transition-all duration-200",
        open ? "-translate-x-6" : "-translate-x-1/2"
      )}>
        <Button
          onClick={() => updateOptions({ page: Math.max(1, options.page! - 1) })}
          disabled={!metadata.hasPreviousPage}
          variant="outline"
          size="sm"
          className="w-20"
        >
          Previous
        </Button>
        <div className="flex items-center justify-center min-w-[3rem] text-sm font-medium">
          Page {options.page} of {metadata.totalPages}
        </div>
        <Button
          onClick={() => updateOptions({ page: (options.page || 1) + 1 })}
          disabled={!metadata.hasNextPage}
          variant="outline"
          size="sm"
          className="w-20"
        >
          Next
        </Button>
      </Card >
    </div>
  )
}