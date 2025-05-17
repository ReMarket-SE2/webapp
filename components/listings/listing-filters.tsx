"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ListingFiltersProps {
  categories: { id: number; name: string }[];
  currentCategoryId: number | null;
  currentSortOrder: 'asc' | 'desc';
  onCategoryChange: (categoryId: number | null) => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
}

export function ListingFilters({ 
  categories, 
  currentCategoryId, 
  currentSortOrder,
  onCategoryChange,
  onSortOrderChange
}: ListingFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategoryId?.toString() || 'all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(currentSortOrder);

  useEffect(() => {
    setSelectedCategory(currentCategoryId?.toString() || 'all');
    setSortOrder(currentSortOrder);
  }, [currentCategoryId, currentSortOrder]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onCategoryChange(value === 'all' ? null : parseInt(value));
  };

  const handleSortOrderChange = (e: React.MouseEvent) => {
    e.preventDefault();
    const newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newSortOrder);
    onSortOrderChange(newSortOrder);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Category Filter */}
      <Select
        value={selectedCategory}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort Order */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSortOrderChange}
      >
        <ArrowUpDown className="h-4 w-4 mr-2" />
        {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
      </Button>
    </div>
  );
} 