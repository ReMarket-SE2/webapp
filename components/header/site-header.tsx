"use client"

import { SidebarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { CreateListingButton } from "@/components/header/create-listing-button"
import { ListingFilters } from "@/components/listings/listing-filters"
import { useListingsContext } from "@/components/contexts/listings-context"

export function SiteHeader() {
	const { toggleSidebar } = useSidebar()
	const { options, updateOptions, categories } = useListingsContext()

	return (
		<header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
			<div className="flex h-(--header-height) w-full items-center gap-2 px-4">
				<Button
					className="h-8 w-8"
					variant="ghost"
					size="icon"
					onClick={toggleSidebar}
				>
					<SidebarIcon />
				</Button>
				<Separator orientation="vertical" className="mr-2 h-4" />
				<ListingFilters
					categories={categories}
					currentCategoryId={options.categoryId ?? null}
					currentSortOrder={options.sortOrder ?? "desc"}
					currentSearch={options.searchTerm ?? ""}
					onCategoryChange={(categoryId) => updateOptions({ categoryId: categoryId ?? undefined, page: 1 })}
					onSortOrderChange={(sortOrder) => updateOptions({ sortOrder, page: 1 })}
					onSearchChange={(search) => updateOptions({ searchTerm: search, page: 1 })}
				/>
				<CreateListingButton className="h-8" />
			</div>
		</header>
	)
}
