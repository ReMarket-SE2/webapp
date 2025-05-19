"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
}

interface CategoryTree extends Category {
  children: CategoryTree[];
}

function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const map: Record<number, CategoryTree> = {};
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  const roots: CategoryTree[] = [];
  categories.forEach((cat) => {
    if (cat.parentId && map[cat.parentId])
      map[cat.parentId].children.push(map[cat.id]);
    else roots.push(map[cat.id]);
  });
  return roots;
}

interface ListingFiltersProps {
  categories: { id: number; name: string; parentId?: number | null }[];
  currentCategoryId: number | null;
  currentSortOrder: "asc" | "desc";
  currentSearch?: string;
  onCategoryChange: (categoryId: number | null) => void;
  onSortOrderChange: (sortOrder: "asc" | "desc") => void;
  onSearchChange?: (search: string) => void;
}

export function ListingFilters({
  categories,
  currentCategoryId,
  currentSortOrder,
  currentSearch = "",
  onCategoryChange,
  onSortOrderChange,
  onSearchChange,
}: ListingFiltersProps) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Find the path to the selected category
  function findPath(tree: CategoryTree[], id?: number | null): CategoryTree[] {
    if (!id) return [];
    for (const node of tree) {
      if (node.id === id) return [node];
      const childPath = findPath(node.children, id);
      if (childPath.length) return [node, ...childPath];
    }
    return [];
  }

  // Get options for each level
  function getOptionsAtLevel(
    tree: CategoryTree[],
    path: CategoryTree[],
    level: number
  ): CategoryTree[] {
    if (level === 0) return tree;
    if (path[level - 1]) return path[level - 1].children;
    return [];
  }

  const selectedId = typeof currentCategoryId === "number" ? currentCategoryId : undefined;
  const path = findPath(tree, selectedId);

  const handleCascadeChange = (val: string | null) => {
    onCategoryChange(val ? parseInt(val, 10) : null);
  };

  const handleSortOrderChange = (e: React.MouseEvent) => {
    e.preventDefault();
    onSortOrderChange(currentSortOrder === "desc" ? "asc" : "desc");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 w-full">
      <Input
        type="search"
        placeholder="Search listings..."
        value={currentSearch}
        onChange={handleSearchChange}
        className="w-full sm:w-64"
      />
      {/* Cascade Category Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        {[...Array(path.length + 1)].map((_, level) => {
          const options = getOptionsAtLevel(tree, path, level);
          if (!options.length) return null;
          const value = path[level]?.id.toString() ?? "";
          return (
            <Select
              key={level}
              value={value}
              onValueChange={handleCascadeChange}
            >
              <SelectTrigger className="min-w-[160px]">
                {value
                  ? options.find((o) => o.id.toString() === value)?.name
                  : "Select category"}
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
        {selectedId && (
          <button
            type="button"
            className="ml-2 text-xs text-muted-foreground hover:underline"
            onClick={() => handleCascadeChange(null)}
          >
            Clear
          </button>
        )}
      </div>
      {/* Sort Order */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSortOrderChange}
      >
        <ArrowUpDown className="h-4 w-4 mr-2" />
        {currentSortOrder === "desc" ? "Newest First" : "Oldest First"}
      </Button>
    </div>
  );
}