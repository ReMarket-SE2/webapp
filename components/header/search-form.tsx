import { Search } from "lucide-react"
import { useState, useEffect } from "react"

import { Label } from "@/components/ui/label"
import { SidebarInput } from "@/components/ui/sidebar"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { useListingsContext } from "@/components/contexts/listings-context"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm)
  const { updateOptions } = useListingsContext()

  // Update search when debounced value changes
  useEffect(() => {
    // Only update if we have a search term or if we had one before (to clear search)
    if (debouncedSearchTerm || searchTerm === "") {
      updateOptions({
        searchTerm: debouncedSearchTerm || undefined,
        // Reset to first page when searching
        page: 1
      })
    }
  }, [debouncedSearchTerm]) // Remove updateOptions from dependencies

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} {...props}>
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput
          id="search"
          placeholder="Type to search..."
          className="h-9 pl-7"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
      </div>
    </form>
  )
}
