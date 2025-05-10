"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Category } from "@/lib/db/schema/categories";
import { useMemo } from "react";

interface CategoryCascadeSelectProps {
  categories: Category[];
}

function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const map: Record<number, CategoryTree> = {};
  categories.forEach(cat => {
    map[cat.id] = { ...cat, children: [] };
  });
  const roots: CategoryTree[] = [];
  categories.forEach(cat => {
    if (cat.parentId && map[cat.parentId]) map[cat.parentId].children.push(map[cat.id]);
    else roots.push(map[cat.id]);
  });
  return roots;
}

interface CategoryTree extends Category {
  children: CategoryTree[];
}

export function CategoryCascadeSelect({ categories }: CategoryCascadeSelectProps) {
  const [selected, setSelected] = useQueryState("category", { history: "push" });
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Find the path to the selected category
  function findPath(tree: CategoryTree[], id?: number): CategoryTree[] {
    if (!id) return [];
    for (const node of tree) {
      if (node.id === id) return [node];
      const childPath = findPath(node.children, id);
      if (childPath.length) return [node, ...childPath];
    }
    return [];
  }

  const selectedId = selected ? Number(selected) : undefined;
  const path = findPath(tree, selectedId);

  // Get options for each level
  function getOptionsAtLevel(tree: CategoryTree[], path: CategoryTree[], level: number): CategoryTree[] {
    if (level === 0) return tree;
    if (path[level - 1]) return path[level - 1].children;
    return [];
  }

  // Render selects for each level
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {[...Array(path.length + 1)].map((_, level) => {
        const options = getOptionsAtLevel(tree, path, level);
        if (!options.length) return null;
        const value = path[level]?.id.toString() ?? "";
        return (
          <Select
            key={level}
            value={value}
            onValueChange={val => setSelected(val || null)}
          >
            <SelectTrigger className="min-w-[160px]">
              {value ? options.find(o => o.id.toString() === value)?.name : "Select category"}
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.id} value={option.id.toString()}>{option.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
      {selected && (
        <button
          type="button"
          className="ml-2 text-xs text-muted-foreground hover:underline"
          onClick={() => setSelected(null)}
        >
          Clear
        </button>
      )}
    </div>
  );
}
