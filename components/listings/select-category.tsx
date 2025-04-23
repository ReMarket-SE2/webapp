'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger
} from "@/components/ui/select";
import { getCategories } from '@/lib/categories/actions';
import { useListingsContext } from '@/components/contexts/listings-context';

interface Category {
  id: number;
  name: string;
}

export function SelectCategory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { updateOptions } = useListingsContext();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryChange = (value: string) => {
    const categoryId = value === 'all' ? null : parseInt(value, 10);
    updateOptions({ categoryId, page: 1 }); // Reset to first page when changing category
  };

  return (
    <Select onValueChange={handleCategoryChange}>
      <SelectTrigger className="w-54 py-0">
        <SelectValue placeholder="Filter by category" />
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
  );
}
